package com.stockpile.model;

public record PurchaseOrderItemDetails(
    Long id,
    Long purchaseOrderId,
    Long productId,
    String productNameSnapshot,
    String skuSnapshot,
    int quantityOrdered,
    int quantityReceived,
    int remainingQuantity,
    long unitCostPaise,
    long lineTotalPaise
) {}
