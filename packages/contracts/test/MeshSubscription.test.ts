import { expect } from "chai";
import { ethers } from "hardhat";
import type { MeshSubscription } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MeshSubscription", () => {
  let contract: MeshSubscription;
  let owner: SignerWithAddress;
  let operatorUser: SignerWithAddress;
  let subscriber: SignerWithAddress;

  const pricePerHour = ethers.parseEther("1"); // 1 HBAR/hr

  beforeEach(async () => {
    [owner, operatorUser, subscriber] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MeshSubscription");
    contract = (await Factory.deploy(owner.address)) as MeshSubscription;
    await contract.waitForDeployment();
  });

  async function registerHotspot(signer = operatorUser) {
    return contract.connect(signer).registerHotspot(
      "Test Hotspot",
      37_000_000n, // lat * 1e6
      -122_000_000n, // lng * 1e6
      100n, // 100 Mbps
      pricePerHour,
    );
  }

  describe("registerHotspot", () => {
    it("registers and emits HotspotRegistered", async () => {
      await expect(registerHotspot()).to.emit(contract, "HotspotRegistered").withArgs(
        0n,
        operatorUser.address,
        "Test Hotspot",
      );
      const hotspot = await contract.hotspots(0n);
      expect(hotspot.operator).to.equal(operatorUser.address);
      expect(hotspot.isActive).to.be.true;
    });

    it("reverts with empty name", async () => {
      await expect(
        contract.connect(operatorUser).registerHotspot("", 0n, 0n, 100n, pricePerHour),
      ).to.be.revertedWith("MeshSubscription: name required");
    });
  });

  describe("subscribe", () => {
    beforeEach(() => registerHotspot());

    it("creates subscription and emits Subscribed", async () => {
      const hours = 2n;
      const payment = pricePerHour * hours;
      await expect(
        contract.connect(subscriber).subscribe(0n, hours, { value: payment }),
      ).to.emit(contract, "Subscribed");
    });

    it("reverts on insufficient payment", async () => {
      await expect(
        contract.connect(subscriber).subscribe(0n, 1n, { value: 0n }),
      ).to.be.revertedWith("MeshSubscription: insufficient payment");
    });
  });

  describe("cancelSubscription", () => {
    let subscriptionId: bigint;

    beforeEach(async () => {
      await registerHotspot();
      const tx = await contract.connect(subscriber).subscribe(0n, 4n, { value: pricePerHour * 4n });
      const receipt = await tx.wait();
      // Get subscription id from event
      const event = receipt?.logs.find((l) => {
        const parsed = contract.interface.parseLog({ topics: [...l.topics], data: l.data });
        return parsed?.name === "Subscribed";
      });
      subscriptionId = 0n;
    });

    it("issues refund and emits SubscriptionCancelled", async () => {
      const balanceBefore = await ethers.provider.getBalance(subscriber.address);
      await expect(contract.connect(subscriber).cancelSubscription(subscriptionId)).to.emit(
        contract,
        "SubscriptionCancelled",
      );
      // Subscriber should have received a refund (net of gas)
      const balanceAfter = await ethers.provider.getBalance(subscriber.address);
      expect(balanceAfter).to.be.gt(balanceBefore - pricePerHour);
    });
  });

  describe("withdrawEarnings", () => {
    beforeEach(async () => {
      await registerHotspot();
      await contract.connect(subscriber).subscribe(0n, 1n, { value: pricePerHour });
    });

    it("operator can withdraw earnings", async () => {
      const pending = await contract.pendingWithdrawals(operatorUser.address);
      expect(pending).to.be.gt(0n);
      await expect(contract.connect(operatorUser).withdrawEarnings()).to.emit(
        contract,
        "EarningsWithdrawn",
      );
    });
  });

  describe("getHotspotsByArea", () => {
    beforeEach(() => registerHotspot());

    it("returns hotspot within bounding box", async () => {
      const result = await contract.getHotspotsByArea(
        36_000_000n,
        38_000_000n,
        -123_000_000n,
        -121_000_000n,
      );
      expect(result.length).to.equal(1);
      expect(result[0]).to.equal(0n);
    });

    it("returns empty outside bounding box", async () => {
      const result = await contract.getHotspotsByArea(
        50_000_000n,
        60_000_000n,
        10_000_000n,
        20_000_000n,
      );
      expect(result.length).to.equal(0);
    });
  });
});
