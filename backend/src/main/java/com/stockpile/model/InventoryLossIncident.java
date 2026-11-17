package com.stockpile.model;

public record InventoryLossIncident(
    Long movementId,
    Long productId,
    String productName,
    String sku,
    int unitsLost,
    long unitCostPaise,
    long totalLossPaise,
    String reason,
    String createdAt
) {}
