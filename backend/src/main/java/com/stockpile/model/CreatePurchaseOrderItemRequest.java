package com.stockpile.model;

public record CreatePurchaseOrderItemRequest(
    Long productId,
    Integer quantity,
    Long unitCostPaise
) {}
