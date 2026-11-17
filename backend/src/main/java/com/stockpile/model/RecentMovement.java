package com.stockpile.model;

public record RecentMovement(
    Long movementId,
    Long productId,
    String productName,
    String movementType,
    int quantity,
    int previousQuantity,
    int newQuantity,
    String reason,
    String createdAt
) {}
