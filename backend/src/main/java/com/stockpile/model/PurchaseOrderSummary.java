package com.stockpile.model;

public record PurchaseOrderSummary(
    Long id,
    Long orderId,
    Long supplierId,
    String supplierName,
    String status,
    long totalAmountPaise,
    String notes,
    String createdAt,
    String updatedAt,
    String placedAt,
    String receivedAt,
    String cancelledAt,
    int itemCount,
    int totalQuantityOrdered,
    int totalQuantityReceived
) {}
