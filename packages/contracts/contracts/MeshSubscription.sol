// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MeshSubscription
 * @notice Manages mesh internet hotspot registration, subscriber payments,
 *         renewals, cancellations, and operator earnings on HederaNet.
 */
contract MeshSubscription is ReentrancyGuard, Ownable, Pausable {
    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    struct Hotspot {
        uint256 id;
        address payable operator;
        string name;
        int256 lat;          // scaled by 1e6
        int256 lng;          // scaled by 1e6
        uint256 bandwidth;   // Mbps
        uint256 pricePerHour; // in wei
        bool isActive;
        uint256 totalEarnings;
    }

    struct Subscription {
        uint256 id;
        uint256 hotspotId;
        address subscriber;
        uint256 startTime;
        uint256 endTime;
        uint256 pricePaid;
        bool isCancelled;
    }

    struct Review {
        address reviewer;
        uint256 hotspotId;
        uint8 rating; // 1-5
        string comment;
        uint256 timestamp;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    uint256 public nextHotspotId;
    uint256 public nextSubscriptionId;
    uint256 public platformFeeBps = 200; // 2%
    uint256 public accumulatedFees;

    mapping(uint256 => Hotspot) public hotspots;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public operatorHotspots;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(uint256 => Review[]) public hotspotReviews;
    mapping(address => uint256) public pendingWithdrawals;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event HotspotRegistered(uint256 indexed hotspotId, address indexed operator, string name);
    event Subscribed(uint256 indexed subscriptionId, uint256 indexed hotspotId, address indexed subscriber, uint256 endTime);
    event SubscriptionRenewed(uint256 indexed subscriptionId, uint256 newEndTime);
    event SubscriptionCancelled(uint256 indexed subscriptionId, uint256 refundAmount);
    event ReviewSubmitted(uint256 indexed hotspotId, address indexed reviewer, uint8 rating);
    event EarningsWithdrawn(address indexed operator, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // -------------------------------------------------------------------------
    // Operator functions
    // -------------------------------------------------------------------------

    /**
     * @notice Registers a new mesh hotspot.
     * @return hotspotId The new hotspot's ID.
     */
    function registerHotspot(
        string calldata name,
        int256 lat,
        int256 lng,
        uint256 bandwidth,
        uint256 pricePerHour
    ) external whenNotPaused returns (uint256 hotspotId) {
        require(bytes(name).length > 0, "MeshSubscription: name required");
        require(pricePerHour > 0, "MeshSubscription: price must be > 0");
        require(bandwidth > 0, "MeshSubscription: bandwidth must be > 0");

        hotspotId = nextHotspotId++;
        hotspots[hotspotId] = Hotspot({
            id: hotspotId,
            operator: payable(msg.sender),
            name: name,
            lat: lat,
            lng: lng,
            bandwidth: bandwidth,
            pricePerHour: pricePerHour,
            isActive: true,
            totalEarnings: 0
        });
        operatorHotspots[msg.sender].push(hotspotId);

        emit HotspotRegistered(hotspotId, msg.sender, name);
    }

    /**
     * @notice Withdraws operator earnings from the contract.
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "MeshSubscription: nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit EarningsWithdrawn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // Subscriber functions
    // -------------------------------------------------------------------------

    /**
     * @notice Subscribes to a hotspot for a given number of hours.
     * @param hotspotId The hotspot to subscribe to.
     * @param hours     Duration in hours.
     * @return subscriptionId The new subscription ID.
     */
    function subscribe(
        uint256 hotspotId,
        uint256 hours
    ) external payable whenNotPaused nonReentrant returns (uint256 subscriptionId) {
        Hotspot storage hotspot = hotspots[hotspotId];
        require(hotspot.isActive, "MeshSubscription: hotspot not active");
        require(hours > 0, "MeshSubscription: hours must be > 0");

        uint256 totalPrice = hotspot.pricePerHour * hours;
        require(msg.value >= totalPrice, "MeshSubscription: insufficient payment");

        // Refund overpayment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        uint256 fee = (totalPrice * platformFeeBps) / 10_000;
        uint256 operatorEarnings = totalPrice - fee;
        accumulatedFees += fee;
        hotspot.totalEarnings += operatorEarnings;
        pendingWithdrawals[hotspot.operator] += operatorEarnings;

        subscriptionId = nextSubscriptionId++;
        uint256 endTime = block.timestamp + (hours * 1 hours);
        subscriptions[subscriptionId] = Subscription({
            id: subscriptionId,
            hotspotId: hotspotId,
            subscriber: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            pricePaid: totalPrice,
            isCancelled: false
        });
        userSubscriptions[msg.sender].push(subscriptionId);

        emit Subscribed(subscriptionId, hotspotId, msg.sender, endTime);
    }

    /**
     * @notice Renews an existing subscription by extending its end time.
     * @param subscriptionId The subscription to renew.
     * @param additionalHours Hours to add.
     */
    function renewSubscription(
        uint256 subscriptionId,
        uint256 additionalHours
    ) external payable nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber == msg.sender, "MeshSubscription: not subscriber");
        require(!sub.isCancelled, "MeshSubscription: subscription cancelled");

        Hotspot storage hotspot = hotspots[sub.hotspotId];
        require(hotspot.isActive, "MeshSubscription: hotspot not active");

        uint256 totalPrice = hotspot.pricePerHour * additionalHours;
        require(msg.value >= totalPrice, "MeshSubscription: insufficient payment");

        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        uint256 fee = (totalPrice * platformFeeBps) / 10_000;
        uint256 operatorEarnings = totalPrice - fee;
        accumulatedFees += fee;
        hotspot.totalEarnings += operatorEarnings;
        pendingWithdrawals[hotspot.operator] += operatorEarnings;

        // Extend from current end or now, whichever is later
        uint256 base = sub.endTime > block.timestamp ? sub.endTime : block.timestamp;
        sub.endTime = base + (additionalHours * 1 hours);
        sub.pricePaid += totalPrice;

        emit SubscriptionRenewed(subscriptionId, sub.endTime);
    }

    /**
     * @notice Cancels a subscription and issues a pro-rated refund.
     */
    function cancelSubscription(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber == msg.sender, "MeshSubscription: not subscriber");
        require(!sub.isCancelled, "MeshSubscription: already cancelled");

        sub.isCancelled = true;

        // Pro-rated refund for remaining time
        uint256 refund = 0;
        if (sub.endTime > block.timestamp) {
            uint256 remainingTime = sub.endTime - block.timestamp;
            uint256 totalTime = sub.endTime - sub.startTime;
            refund = (sub.pricePaid * remainingTime) / totalTime;
        }

        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }

        emit SubscriptionCancelled(subscriptionId, refund);
    }

    /**
     * @notice Submits a review for a hotspot. Subscriber must have an active/past subscription.
     */
    function submitReview(
        uint256 hotspotId,
        uint8 rating,
        string calldata comment
    ) external {
        require(rating >= 1 && rating <= 5, "MeshSubscription: rating 1-5");
        // Verify caller has subscribed to this hotspot
        bool hasSubscribed = false;
        uint256[] storage subs = userSubscriptions[msg.sender];
        for (uint256 i = 0; i < subs.length; i++) {
            if (subscriptions[subs[i]].hotspotId == hotspotId) {
                hasSubscribed = true;
                break;
            }
        }
        require(hasSubscribed, "MeshSubscription: must be subscriber");

        hotspotReviews[hotspotId].push(Review({
            reviewer: msg.sender,
            hotspotId: hotspotId,
            rating: rating,
            comment: comment,
            timestamp: block.timestamp
        }));

        emit ReviewSubmitted(hotspotId, msg.sender, rating);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Returns hotspot IDs whose coordinates are within a bounding box.
    function getHotspotsByArea(
        int256 latMin,
        int256 latMax,
        int256 lngMin,
        int256 lngMax
    ) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextHotspotId; i++) {
            Hotspot storage h = hotspots[i];
            if (
                h.isActive &&
                h.lat >= latMin && h.lat <= latMax &&
                h.lng >= lngMin && h.lng <= lngMax
            ) {
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < nextHotspotId; i++) {
            Hotspot storage h = hotspots[i];
            if (
                h.isActive &&
                h.lat >= latMin && h.lat <= latMax &&
                h.lng >= lngMin && h.lng <= lngMax
            ) {
                result[idx++] = i;
            }
        }
        return result;
    }

    function getOperatorHotspots(address operator) external view returns (uint256[] memory) {
        return operatorHotspots[operator];
    }

    function getHotspotReviews(uint256 hotspotId) external view returns (Review[] memory) {
        return hotspotReviews[hotspotId];
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
