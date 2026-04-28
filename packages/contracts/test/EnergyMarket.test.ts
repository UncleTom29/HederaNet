import { expect } from "chai";
import { ethers } from "hardhat";
import type { EnergyMarket } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EnergyMarket", () => {
  let market: EnergyMarket;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let other: SignerWithAddress;

  const ONE_HOUR = 3600;
  const energyKwh = 100n;
  const pricePerKwh = ethers.parseEther("0.01");

  beforeEach(async () => {
    [owner, seller, buyer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EnergyMarket");
    market = (await Factory.deploy(owner.address)) as EnergyMarket;
    await market.waitForDeployment();
  });

  async function listEnergy(overrides: Partial<{
    from: SignerWithAddress;
    energyKwh: bigint;
    pricePerKwh: bigint;
    from_: number;
    to_: number;
  }> = {}) {
    const now = Math.floor(Date.now() / 1000);
    return market
      .connect(overrides.from ?? seller)
      .listEnergy(
        overrides.energyKwh ?? energyKwh,
        overrides.pricePerKwh ?? pricePerKwh,
        overrides.from_ ?? now - 60,
        overrides.to_ ?? now + ONE_HOUR * 24,
      );
  }

  describe("listEnergy", () => {
    it("emits EnergyListed and stores listing", async () => {
      const tx = await listEnergy();
      await expect(tx).to.emit(market, "EnergyListed").withArgs(
        0n,
        seller.address,
        energyKwh,
        pricePerKwh,
        expect.anything(),
        expect.anything(),
      );
      const listing = await market.listings(0n);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.energyKwh).to.equal(energyKwh);
      expect(listing.isActive).to.be.true;
    });

    it("reverts when energy is zero", async () => {
      await expect(listEnergy({ energyKwh: 0n })).to.be.revertedWith(
        "EnergyMarket: energy must be > 0",
      );
    });

    it("reverts when price is zero", async () => {
      await expect(listEnergy({ pricePerKwh: 0n })).to.be.revertedWith(
        "EnergyMarket: price must be > 0",
      );
    });
  });

  describe("purchaseEnergy", () => {
    beforeEach(() => listEnergy());

    it("creates trade and emits EnergyPurchased", async () => {
      const totalPrice = energyKwh * pricePerKwh;
      const tx = await market
        .connect(buyer)
        .purchaseEnergy(0n, 50n, { value: 50n * pricePerKwh });
      await expect(tx).to.emit(market, "EnergyPurchased");

      const trade = await market.trades(0n);
      expect(trade.buyer).to.equal(buyer.address);
      expect(trade.energyKwh).to.equal(50n);
    });

    it("reverts if buyer is seller", async () => {
      await expect(
        market.connect(seller).purchaseEnergy(0n, 10n, { value: 10n * pricePerKwh }),
      ).to.be.revertedWith("EnergyMarket: cannot buy own listing");
    });

    it("reverts if payment insufficient", async () => {
      await expect(
        market.connect(buyer).purchaseEnergy(0n, 10n, { value: 0n }),
      ).to.be.revertedWith("EnergyMarket: insufficient payment");
    });
  });

  describe("confirmDelivery", () => {
    beforeEach(async () => {
      await listEnergy();
      await market.connect(buyer).purchaseEnergy(0n, 50n, { value: 50n * pricePerKwh });
    });

    it("releases funds to seller and emits DeliveryConfirmed", async () => {
      const sellerBefore = await ethers.provider.getBalance(seller.address);
      await expect(market.connect(buyer).confirmDelivery(0n)).to.emit(
        market,
        "DeliveryConfirmed",
      );
      const sellerAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerAfter).to.be.gt(sellerBefore);
    });

    it("reverts if not buyer", async () => {
      await expect(market.connect(other).confirmDelivery(0n)).to.be.revertedWith(
        "EnergyMarket: not buyer",
      );
    });
  });

  describe("disputeTrade / resolveDispute", () => {
    beforeEach(async () => {
      await listEnergy();
      await market.connect(buyer).purchaseEnergy(0n, 50n, { value: 50n * pricePerKwh });
    });

    it("raises a dispute", async () => {
      await expect(market.connect(buyer).disputeTrade(0n, "No delivery")).to.emit(
        market,
        "DisputeRaised",
      );
    });

    it("resolves with buyer refund", async () => {
      await market.connect(buyer).disputeTrade(0n, "No delivery");
      const buyerBefore = await ethers.provider.getBalance(buyer.address);
      await market.connect(owner).resolveDispute(0n, true);
      const buyerAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerAfter).to.be.gt(buyerBefore);
    });
  });

  describe("platform fees", () => {
    it("owner can withdraw platform fees after confirmed delivery", async () => {
      await listEnergy();
      await market.connect(buyer).purchaseEnergy(0n, 50n, { value: 50n * pricePerKwh });
      await market.connect(buyer).confirmDelivery(0n);

      const fee = await market.accumulatedFees();
      expect(fee).to.be.gt(0n);

      await expect(market.connect(owner).withdrawPlatformFees()).to.not.be.reverted;
      expect(await market.accumulatedFees()).to.equal(0n);
    });
  });
});
