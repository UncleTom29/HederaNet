// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OperatorStaking
 * @notice Operators stake HBAR to earn tier upgrades and rewards on HederaNet.
 *
 * Tiers:
 *   Bronze  — 100  HBAR  minimum
 *   Silver  — 500  HBAR  minimum
 *   Gold    — 2000 HBAR  minimum
 *
 * Rewards accrue per block based on staked amount and tier multiplier.
 */
contract OperatorStaking is ReentrancyGuard, Ownable, Pausable {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant BRONZE_THRESHOLD = 100 ether;   // 100 HBAR (scaled as ether for EVM)
    uint256 public constant SILVER_THRESHOLD = 500 ether;   // 500 HBAR
    uint256 public constant GOLD_THRESHOLD   = 2_000 ether; // 2000 HBAR

    uint256 public constant BRONZE_MULTIPLIER = 100; // 1.0x (basis)
    uint256 public constant SILVER_MULTIPLIER = 150; // 1.5x
    uint256 public constant GOLD_MULTIPLIER   = 250; // 2.5x

    /// @dev Base reward rate: wei per block per ether staked
    uint256 public baseRewardRate = 1e12;

    // -------------------------------------------------------------------------
    // Structs / Enums
    // -------------------------------------------------------------------------

    enum Tier { None, Bronze, Silver, Gold }

    struct OperatorInfo {
        uint256 stakedAmount;
        uint256 rewardDebt;        // for reward accounting
        uint256 lastRewardBlock;
        uint256 totalRewardsClaimed;
        uint256 downtimeCount;
        bool isRegistered;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    mapping(address => OperatorInfo) public operators;
    uint256 public totalStaked;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Staked(address indexed operator, uint256 amount, Tier newTier);
    event Unstaked(address indexed operator, uint256 amount, Tier newTier);
    event RewardClaimed(address indexed operator, uint256 amount);
    event DowntimeReported(address indexed operator, address indexed reporter, uint256 penalty);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // -------------------------------------------------------------------------
    // Staking
    // -------------------------------------------------------------------------

    /**
     * @notice Stakes HBAR to register or upgrade as an operator.
     */
    function stake() external payable whenNotPaused nonReentrant {
        require(msg.value >= BRONZE_THRESHOLD, "OperatorStaking: below Bronze threshold");

        OperatorInfo storage op = operators[msg.sender];

        // Settle pending rewards before updating stake
        if (op.isRegistered && op.stakedAmount > 0) {
            uint256 pending = calculateReward(msg.sender);
            op.rewardDebt += pending;
        }

        op.stakedAmount += msg.value;
        op.lastRewardBlock = block.number;
        op.isRegistered = true;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value, getOperatorTier(msg.sender));
    }

    /**
     * @notice Unstakes a portion or all of staked HBAR.
     * @param amount Amount to unstake in wei.
     */
    function unstake(uint256 amount) external nonReentrant {
        OperatorInfo storage op = operators[msg.sender];
        require(op.isRegistered, "OperatorStaking: not registered");
        require(op.stakedAmount >= amount, "OperatorStaking: insufficient stake");

        // Settle pending rewards
        uint256 pending = calculateReward(msg.sender);
        op.rewardDebt += pending;
        op.lastRewardBlock = block.number;

        op.stakedAmount -= amount;
        totalStaked -= amount;

        payable(msg.sender).transfer(amount);
        emit Unstaked(msg.sender, amount, getOperatorTier(msg.sender));
    }

    /**
     * @notice Claims all pending staking rewards.
     */
    function claimRewards() external nonReentrant {
        OperatorInfo storage op = operators[msg.sender];
        require(op.isRegistered, "OperatorStaking: not registered");

        uint256 reward = calculateReward(msg.sender) + op.rewardDebt;
        require(reward > 0, "OperatorStaking: no rewards");
        require(address(this).balance >= reward, "OperatorStaking: insufficient contract balance");

        op.rewardDebt = 0;
        op.lastRewardBlock = block.number;
        op.totalRewardsClaimed += reward;

        payable(msg.sender).transfer(reward);
        emit RewardClaimed(msg.sender, reward);
    }

    // -------------------------------------------------------------------------
    // Downtime reporting
    // -------------------------------------------------------------------------

    /**
     * @notice Reports an operator for downtime. Owner-only.
     *         Applies a penalty of 1% of staked amount.
     */
    function reportDowntime(address operator) external onlyOwner {
        OperatorInfo storage op = operators[operator];
        require(op.isRegistered, "OperatorStaking: not registered");

        op.downtimeCount++;
        uint256 penalty = op.stakedAmount / 100; // 1%
        op.stakedAmount -= penalty;
        totalStaked -= penalty;
        accumulatedPenalties += penalty;

        emit DowntimeReported(operator, msg.sender, penalty);
    }

    uint256 public accumulatedPenalties;

    function withdrawPenalties() external onlyOwner nonReentrant {
        uint256 amount = accumulatedPenalties;
        accumulatedPenalties = 0;
        payable(owner()).transfer(amount);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /**
     * @notice Returns the tier of an operator based on their staked amount.
     */
    function getOperatorTier(address operator) public view returns (Tier) {
        uint256 staked = operators[operator].stakedAmount;
        if (staked >= GOLD_THRESHOLD)   return Tier.Gold;
        if (staked >= SILVER_THRESHOLD) return Tier.Silver;
        if (staked >= BRONZE_THRESHOLD) return Tier.Bronze;
        return Tier.None;
    }

    /**
     * @notice Calculates accrued (unsettled) rewards for an operator.
     */
    function calculateReward(address operator) public view returns (uint256) {
        OperatorInfo storage op = operators[operator];
        if (!op.isRegistered || op.stakedAmount == 0) return 0;

        uint256 blocks = block.number - op.lastRewardBlock;
        uint256 multiplier = _tierMultiplier(getOperatorTier(operator));
        return (op.stakedAmount * baseRewardRate * blocks * multiplier) / (1e18 * 100);
    }

    function _tierMultiplier(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.Gold)   return GOLD_MULTIPLIER;
        if (tier == Tier.Silver) return SILVER_MULTIPLIER;
        return BRONZE_MULTIPLIER;
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    function setBaseRewardRate(uint256 rate) external onlyOwner {
        baseRewardRate = rate;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @dev Allow contract to receive HBAR for reward pool funding
    receive() external payable {}
}
