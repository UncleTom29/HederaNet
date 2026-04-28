import { expect } from "chai";
import { ethers } from "hardhat";
import type { HederaNetOracle } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HederaNetOracle", () => {
  let oracle: HederaNetOracle;
  let owner: SignerWithAddress;
  let node1: SignerWithAddress;
  let node2: SignerWithAddress;
  let node3: SignerWithAddress;
  let outsider: SignerWithAddress;

  const ReadingType = { ENERGY_DELIVERY: 0, NETWORK_UPTIME: 1, COMPUTE_JOB: 2 };
  const targetId = ethers.keccak256(ethers.toUtf8Bytes("hotspot-001"));
  const dataHash = ethers.keccak256(ethers.toUtf8Bytes("raw-sensor-payload"));

  beforeEach(async () => {
    [owner, node1, node2, node3, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("HederaNetOracle");
    oracle = (await Factory.deploy(owner.address)) as HederaNetOracle;
    await oracle.waitForDeployment();

    // Register 3 oracle nodes
    await oracle.connect(owner).registerOracleNode(node1.address);
    await oracle.connect(owner).registerOracleNode(node2.address);
    await oracle.connect(owner).registerOracleNode(node3.address);
  });

  describe("registerOracleNode", () => {
    it("registers nodes and emits OracleNodeRegistered", async () => {
      const [, , , , newNode] = await ethers.getSigners();
      await expect(oracle.connect(owner).registerOracleNode(newNode.address)).to.emit(
        oracle,
        "OracleNodeRegistered",
      );
    });

    it("reverts if not owner", async () => {
      await expect(
        oracle.connect(outsider).registerOracleNode(outsider.address),
      ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("reverts if already registered", async () => {
      await expect(
        oracle.connect(owner).registerOracleNode(node1.address),
      ).to.be.revertedWith("HederaNetOracle: already registered");
    });
  });

  describe("submitReading + confirmReading", () => {
    it("finalizes after 3 confirmations", async () => {
      // Node1 submits (1 auto-confirmation)
      await oracle.connect(node1).submitReading(
        ReadingType.ENERGY_DELIVERY,
        1_000_000n,
        "kWh",
        targetId,
        dataHash,
      );

      // Node2 confirms
      await oracle.connect(node2).confirmReading(0n, targetId);

      // Node3 confirms — should finalize
      await expect(oracle.connect(node3).confirmReading(0n, targetId)).to.emit(
        oracle,
        "ReadingFinalized",
      );

      const latest = await oracle.getLatestReading(ReadingType.ENERGY_DELIVERY, targetId);
      expect(latest.isFinalized).to.be.true;
      expect(latest.value).to.equal(1_000_000n);
    });

    it("reverts submission from non-oracle address", async () => {
      await expect(
        oracle.connect(outsider).submitReading(
          ReadingType.NETWORK_UPTIME,
          99_000_000n,
          "%",
          targetId,
          dataHash,
        ),
      ).to.be.revertedWith("HederaNetOracle: not an active oracle node");
    });

    it("prevents double confirmation", async () => {
      await oracle.connect(node1).submitReading(
        ReadingType.COMPUTE_JOB,
        500n,
        "CU",
        targetId,
        dataHash,
      );
      await expect(
        oracle.connect(node1).confirmReading(0n, targetId),
      ).to.be.revertedWith("HederaNetOracle: already confirmed");
    });
  });

  describe("slashOracleNode", () => {
    it("deactivates node after 3 slashes", async () => {
      for (let i = 0; i < 3; i++) {
        await oracle.connect(owner).slashOracleNode(node1.address);
      }
      const nodeInfo = await oracle.oracleNodes(node1.address);
      expect(nodeInfo.isActive).to.be.false;
    });

    it("emits OracleNodeSlashed", async () => {
      await expect(oracle.connect(owner).slashOracleNode(node1.address)).to.emit(
        oracle,
        "OracleNodeSlashed",
      );
    });
  });
});
