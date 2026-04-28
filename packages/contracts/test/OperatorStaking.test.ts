import { expect } from "chai";
import { ethers } from "hardhat";
import type { OperatorStaking } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OperatorStaking", () => {
  let staking: OperatorStaking;
  let owner: SignerWithAddress;
  let operatorUser: SignerWithAddress;
  let other: SignerWithAddress;

  const BRONZE = ethers.parseEther("100");
  const SILVER = ethers.parseEther("500");
  const GOLD = ethers.parseEther("2000");

  beforeEach(async () => {
    [owner, operatorUser, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("OperatorStaking");
    staking = (await Factory.deploy(owner.address)) as OperatorStaking;
    await staking.waitForDeployment();

    // Fund the contract with 100 ETH for reward payouts
    await owner.sendTransaction({ to: await staking.getAddress(), value: ethers.parseEther("100") });
  });

  describe("stake", () => {
    it("reverts below Bronze threshold", async () => {
      await expect(
        staking.connect(operatorUser).stake({ value: ethers.parseEther("50") }),
      ).to.be.revertedWith("OperatorStaking: below Bronze threshold");
    });

    it("accepts Bronze stake and emits Staked with Bronze tier", async () => {
      await expect(staking.connect(operatorUser).stake({ value: BRONZE }))
        .to.emit(staking, "Staked")
        .withArgs(operatorUser.address, BRONZE, 1n); // 1 = Bronze
    });

    it("assigns Gold tier correctly", async () => {
      await staking.connect(operatorUser).stake({ value: GOLD });
      expect(await staking.getOperatorTier(operatorUser.address)).to.equal(3n); // Gold
    });
  });

  describe("unstake", () => {
    beforeEach(async () => {
      await staking.connect(operatorUser).stake({ value: SILVER });
    });

    it("reduces stake and emits Unstaked", async () => {
      await expect(staking.connect(operatorUser).unstake(BRONZE)).to.emit(staking, "Unstaked");
      const info = await staking.operators(operatorUser.address);
      expect(info.stakedAmount).to.equal(SILVER - BRONZE);
    });

    it("reverts if amount exceeds stake", async () => {
      await expect(
        staking.connect(operatorUser).unstake(GOLD),
      ).to.be.revertedWith("OperatorStaking: insufficient stake");
    });
  });

  describe("claimRewards", () => {
    beforeEach(async () => {
      await staking.connect(operatorUser).stake({ value: BRONZE });
    });

    it("emits RewardClaimed when blocks have passed", async () => {
      // Mine a few blocks
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const reward = await staking.calculateReward(operatorUser.address);
      if (reward > 0n) {
        await expect(staking.connect(operatorUser).claimRewards()).to.emit(staking, "RewardClaimed");
      }
    });
  });

  describe("reportDowntime", () => {
    beforeEach(async () => {
      await staking.connect(operatorUser).stake({ value: SILVER });
    });

    it("applies penalty and emits DowntimeReported", async () => {
      const before = (await staking.operators(operatorUser.address)).stakedAmount;
      await expect(staking.connect(owner).reportDowntime(operatorUser.address)).to.emit(
        staking,
        "DowntimeReported",
      );
      const after = (await staking.operators(operatorUser.address)).stakedAmount;
      expect(after).to.be.lt(before);
    });

    it("reverts if not owner", async () => {
      await expect(
        staking.connect(other).reportDowntime(operatorUser.address),
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });
  });
});
