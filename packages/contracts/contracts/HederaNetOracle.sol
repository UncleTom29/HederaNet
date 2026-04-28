// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HederaNetOracle
 * @notice IoT oracle with 3-of-5 multi-sig confirmation for DePIN sensor data.
 *
 * Reading types:
 *   ENERGY_DELIVERY  — confirms kWh delivered by solar node
 *   NETWORK_UPTIME   — confirms % uptime for mesh hotspot
 *   COMPUTE_JOB      — confirms edge compute job completion
 */
contract HederaNetOracle is Ownable, Pausable {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant REQUIRED_CONFIRMATIONS = 3;
    uint256 public constant MAX_ORACLE_NODES = 5;

    // -------------------------------------------------------------------------
    // Enums / Structs
    // -------------------------------------------------------------------------

    enum ReadingType { ENERGY_DELIVERY, NETWORK_UPTIME, COMPUTE_JOB }

    struct OracleReading {
        uint256 id;
        ReadingType readingType;
        uint256 value;           // scaled by 1e6 for precision
        string unit;
        address submitter;
        address[] confirmations;
        bool isFinalized;
        uint256 timestamp;
        bytes32 dataHash;        // hash of raw sensor payload
    }

    struct OracleNode {
        address addr;
        bool isActive;
        uint256 totalSubmissions;
        uint256 slashCount;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    mapping(address => OracleNode) public oracleNodes;
    address[] public oracleNodeList;

    mapping(uint256 => OracleReading) public readings;
    uint256 public nextReadingId;

    // readingId => confirmer => bool
    mapping(uint256 => mapping(address => bool)) public hasConfirmed;

    // Tracks the latest finalized reading per type per target
    mapping(ReadingType => mapping(bytes32 => uint256)) public latestReadingId;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event OracleNodeRegistered(address indexed node);
    event OracleNodeSlashed(address indexed node, uint256 slashCount);
    event ReadingSubmitted(uint256 indexed readingId, ReadingType readingType, address indexed submitter);
    event ReadingConfirmed(uint256 indexed readingId, address indexed confirmer, uint256 confirmationCount);
    event ReadingFinalized(uint256 indexed readingId, ReadingType readingType, uint256 value);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // -------------------------------------------------------------------------
    // Node management
    // -------------------------------------------------------------------------

    /**
     * @notice Registers a new oracle node. Owner only.
     */
    function registerOracleNode(address node) external onlyOwner {
        require(oracleNodeList.length < MAX_ORACLE_NODES, "HederaNetOracle: max nodes reached");
        require(!oracleNodes[node].isActive, "HederaNetOracle: already registered");

        oracleNodes[node] = OracleNode({
            addr: node,
            isActive: true,
            totalSubmissions: 0,
            slashCount: 0
        });
        oracleNodeList.push(node);

        emit OracleNodeRegistered(node);
    }

    /**
     * @notice Slashes a misbehaving oracle node (removes active status after 3 strikes).
     */
    function slashOracleNode(address node) external onlyOwner {
        OracleNode storage oracle = oracleNodes[node];
        require(oracle.isActive, "HederaNetOracle: node not active");

        oracle.slashCount++;
        if (oracle.slashCount >= 3) {
            oracle.isActive = false;
        }

        emit OracleNodeSlashed(node, oracle.slashCount);
    }

    // -------------------------------------------------------------------------
    // Reading lifecycle
    // -------------------------------------------------------------------------

    /**
     * @notice Active oracle node submits a new IoT reading.
     * @param readingType  The type of reading.
     * @param value        Sensor value (scaled by 1e6).
     * @param unit         Human-readable unit string (e.g., "kWh", "%", "CU").
     * @param targetId     Identifies the hotspot / device (hashed for on-chain storage).
     * @param dataHash     Keccak256 of the raw sensor payload for auditability.
     * @return readingId   The new reading ID.
     */
    function submitReading(
        ReadingType readingType,
        uint256 value,
        string calldata unit,
        bytes32 targetId,
        bytes32 dataHash
    ) external whenNotPaused returns (uint256 readingId) {
        OracleNode storage oracle = oracleNodes[msg.sender];
        require(oracle.isActive, "HederaNetOracle: not an active oracle node");

        readingId = nextReadingId++;
        OracleReading storage reading = readings[readingId];
        reading.id = readingId;
        reading.readingType = readingType;
        reading.value = value;
        reading.unit = unit;
        reading.submitter = msg.sender;
        reading.isFinalized = false;
        reading.timestamp = block.timestamp;
        reading.dataHash = dataHash;

        // Submitter auto-confirms
        reading.confirmations.push(msg.sender);
        hasConfirmed[readingId][msg.sender] = true;

        oracle.totalSubmissions++;

        emit ReadingSubmitted(readingId, readingType, msg.sender);

        // Check if threshold already met (submitter = 1 confirmation, unlikely but safe)
        if (reading.confirmations.length >= REQUIRED_CONFIRMATIONS) {
            _finalizeReading(readingId, targetId);
        }
    }

    /**
     * @notice Another oracle node confirms an existing reading.
     * @param readingId The ID of the reading to confirm.
     * @param targetId  Must match the original targetId for finalization tracking.
     */
    function confirmReading(uint256 readingId, bytes32 targetId) external whenNotPaused {
        OracleNode storage oracle = oracleNodes[msg.sender];
        require(oracle.isActive, "HederaNetOracle: not an active oracle node");

        OracleReading storage reading = readings[readingId];
        require(!reading.isFinalized, "HederaNetOracle: already finalized");
        require(!hasConfirmed[readingId][msg.sender], "HederaNetOracle: already confirmed");

        reading.confirmations.push(msg.sender);
        hasConfirmed[readingId][msg.sender] = true;

        emit ReadingConfirmed(readingId, msg.sender, reading.confirmations.length);

        if (reading.confirmations.length >= REQUIRED_CONFIRMATIONS) {
            _finalizeReading(readingId, targetId);
        }
    }

    function _finalizeReading(uint256 readingId, bytes32 targetId) internal {
        OracleReading storage reading = readings[readingId];
        reading.isFinalized = true;
        latestReadingId[reading.readingType][targetId] = readingId;

        emit ReadingFinalized(readingId, reading.readingType, reading.value);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /**
     * @notice Returns the latest finalized reading for a given type and target.
     */
    function getLatestReading(
        ReadingType readingType,
        bytes32 targetId
    ) external view returns (OracleReading memory) {
        uint256 rid = latestReadingId[readingType][targetId];
        return readings[rid];
    }

    function getConfirmations(uint256 readingId) external view returns (address[] memory) {
        return readings[readingId].confirmations;
    }

    function getActiveNodes() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < oracleNodeList.length; i++) {
            if (oracleNodes[oracleNodeList[i]].isActive) activeCount++;
        }
        address[] memory active = new address[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < oracleNodeList.length; i++) {
            if (oracleNodes[oracleNodeList[i]].isActive) {
                active[idx++] = oracleNodeList[i];
            }
        }
        return active;
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
