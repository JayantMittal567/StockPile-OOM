package com.stockpile.model;

public record ReceivePurchaseOrderItemRequest(
    Long purchaseOrderItemId,
    Integer quantity
) {}
