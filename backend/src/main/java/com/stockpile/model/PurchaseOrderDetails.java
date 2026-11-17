package com.stockpile.model;

import java.util.List;

public record PurchaseOrderDetails(
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
    String cancellationReason,
    List<PurchaseOrderItemDetails> items
) {}
