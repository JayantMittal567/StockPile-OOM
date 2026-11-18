package com.stockpile.model;

public record CreateMovementRequest(
    Long productId,
    String movementType,
    Integer quantity,
    String reason
) {}
