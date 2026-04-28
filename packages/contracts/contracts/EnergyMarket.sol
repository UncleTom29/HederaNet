// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EnergyMarket
 * @notice Peer-to-peer energy trading contract for the HederaNet DePIN platform.
 *         Solar microgrid operators list surplus energy; buyers purchase and confirm delivery.
 * @dev Uses ReentrancyGuard on all value-transferring functions.
 */
contract EnergyMarket is ReentrancyGuard, Ownable, Pausable {
    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    struct EnergyListing {
        uint256 id;
        address payable seller;
        uint256 energyKwh;       // in Wh (milli-precision)
        uint256 pricePerKwh;     // in wei
        uint256 availableFrom;   // unix timestamp
        uint256 availableTo;     // unix timestamp
        bool isActive;
    }

    struct TradeRecord {
        uint256 id;
        uint256 listingId;
        address payable buyer;
        address payable seller;
        uint256 energyKwh;
        uint256 totalPrice;
        TradeStatus status;
        string disputeReason;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    enum TradeStatus {
        Pending,
        DeliveryConfirmed,
        Disputed,
        Resolved,
        Cancelled
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 public nextListingId;
    uint256 public nextTradeId;
    uint256 public platformFeeBps = 250; // 2.5%
    uint256 public accumulatedFees;

    mapping(uint256 => EnergyListing) public listings;
    mapping(uint256 => TradeRecord) public trades;
    mapping(address => uint256[]) public sellerListings;
    mapping(address => uint256[]) public buyerTrades;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event EnergyListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 energyKwh,
        uint256 pricePerKwh,
        uint256 availableFrom,
        uint256 availableTo
    );
    event EnergyPurchased(
        uint256 indexed tradeId,
        uint256 indexed listingId,
        address indexed buyer,
        uint256 energyKwh,
        uint256 totalPrice
    );
    event DeliveryConfirmed(uint256 indexed tradeId, address indexed buyer);
    event DisputeRaised(uint256 indexed tradeId, address indexed raiser, string reason);
    event DisputeResolved(uint256 indexed tradeId, bool buyerRefunded);
    event ListingUpdated(uint256 indexed listingId, bool isActive);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // -------------------------------------------------------------------------
    // Seller functions
    // -------------------------------------------------------------------------

    /**
     * @notice Lists surplus energy for sale.
     * @param energyKwh    Amount of energy available (in Wh).
     * @param pricePerKwh  Price per kWh in wei.
     * @param availableFrom Unix timestamp when energy becomes available.
     * @param availableTo   Unix timestamp when availability expires.
     * @return listingId The ID of the new listing.
     */
    function listEnergy(
        uint256 energyKwh,
        uint256 pricePerKwh,
        uint256 availableFrom,
        uint256 availableTo
    ) external whenNotPaused returns (uint256 listingId) {
        require(energyKwh > 0, "EnergyMarket: energy must be > 0");
        require(pricePerKwh > 0, "EnergyMarket: price must be > 0");
        require(availableFrom < availableTo, "EnergyMarket: invalid time window");

        listingId = nextListingId++;
        listings[listingId] = EnergyListing({
            id: listingId,
            seller: payable(msg.sender),
            energyKwh: energyKwh,
            pricePerKwh: pricePerKwh,
            availableFrom: availableFrom,
            availableTo: availableTo,
            isActive: true
        });
        sellerListings[msg.sender].push(listingId);

        emit EnergyListed(listingId, msg.sender, energyKwh, pricePerKwh, availableFrom, availableTo);
    }

    /**
     * @notice Updates listing active status. Only the seller can call this.
     */
    function updateListing(uint256 listingId, bool isActive) external {
        EnergyListing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "EnergyMarket: not seller");
        listing.isActive = isActive;
        emit ListingUpdated(listingId, isActive);
    }

    // -------------------------------------------------------------------------
    // Buyer functions
    // -------------------------------------------------------------------------

    /**
     * @notice Purchases energy from an active listing. Payment is held in escrow.
     * @param listingId  The listing to purchase from.
     * @param energyKwh  Amount of energy to purchase.
     * @return tradeId   The ID of the new trade.
     */
    function purchaseEnergy(
        uint256 listingId,
        uint256 energyKwh
    ) external payable whenNotPaused nonReentrant returns (uint256 tradeId) {
        EnergyListing storage listing = listings[listingId];
        require(listing.isActive, "EnergyMarket: listing not active");
        require(listing.seller != msg.sender, "EnergyMarket: cannot buy own listing");
        require(energyKwh > 0 && energyKwh <= listing.energyKwh, "EnergyMarket: invalid energy amount");
        require(block.timestamp >= listing.availableFrom, "EnergyMarket: not yet available");
        require(block.timestamp <= listing.availableTo, "EnergyMarket: listing expired");

        uint256 totalPrice = energyKwh * listing.pricePerKwh;
        require(msg.value >= totalPrice, "EnergyMarket: insufficient payment");

        // Refund overpayment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // Reduce available energy
        listing.energyKwh -= energyKwh;
        if (listing.energyKwh == 0) {
            listing.isActive = false;
        }

        tradeId = nextTradeId++;
        trades[tradeId] = TradeRecord({
            id: tradeId,
            listingId: listingId,
            buyer: payable(msg.sender),
            seller: listing.seller,
            energyKwh: energyKwh,
            totalPrice: totalPrice,
            status: TradeStatus.Pending,
            disputeReason: "",
            createdAt: block.timestamp,
            resolvedAt: 0
        });
        buyerTrades[msg.sender].push(tradeId);

        emit EnergyPurchased(tradeId, listingId, msg.sender, energyKwh, totalPrice);
    }

    /**
     * @notice Buyer confirms energy delivery; funds are released to seller.
     */
    function confirmDelivery(uint256 tradeId) external nonReentrant {
        TradeRecord storage trade = trades[tradeId];
        require(trade.buyer == msg.sender, "EnergyMarket: not buyer");
        require(trade.status == TradeStatus.Pending, "EnergyMarket: invalid status");

        trade.status = TradeStatus.DeliveryConfirmed;
        trade.resolvedAt = block.timestamp;

        uint256 fee = (trade.totalPrice * platformFeeBps) / 10_000;
        uint256 sellerAmount = trade.totalPrice - fee;
        accumulatedFees += fee;

        trade.seller.transfer(sellerAmount);
        emit DeliveryConfirmed(tradeId, msg.sender);
    }

    /**
     * @notice Raises a dispute for a pending trade.
     */
    function disputeTrade(uint256 tradeId, string calldata reason) external {
        TradeRecord storage trade = trades[tradeId];
        require(trade.buyer == msg.sender || trade.seller == msg.sender, "EnergyMarket: not party");
        require(trade.status == TradeStatus.Pending, "EnergyMarket: invalid status");

        trade.status = TradeStatus.Disputed;
        trade.disputeReason = reason;
        emit DisputeRaised(tradeId, msg.sender, reason);
    }

    /**
     * @notice Owner resolves a disputed trade.
     * @param buyerRefunded If true, buyer receives refund; otherwise seller receives payment.
     */
    function resolveDispute(uint256 tradeId, bool buyerRefunded) external onlyOwner nonReentrant {
        TradeRecord storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Disputed, "EnergyMarket: not disputed");

        trade.status = TradeStatus.Resolved;
        trade.resolvedAt = block.timestamp;

        if (buyerRefunded) {
            trade.buyer.transfer(trade.totalPrice);
        } else {
            uint256 fee = (trade.totalPrice * platformFeeBps) / 10_000;
            uint256 sellerAmount = trade.totalPrice - fee;
            accumulatedFees += fee;
            trade.seller.transfer(sellerAmount);
        }

        emit DisputeResolved(tradeId, buyerRefunded);
    }

    // -------------------------------------------------------------------------
    // Admin functions
    // -------------------------------------------------------------------------

    /// @notice Withdraws accumulated platform fees to the owner.
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
    }

    /// @notice Updates the platform fee in basis points (max 10%).
    function setPlatformFeeBps(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1_000, "EnergyMarket: fee too high");
        platformFeeBps = feeBps;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    function getBuyerTrades(address buyer) external view returns (uint256[] memory) {
        return buyerTrades[buyer];
    }
}
