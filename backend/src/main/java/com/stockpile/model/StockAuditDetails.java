package com.stockpile.model;

import java.util.List;

public record StockAuditDetails(
    Long id,
    Long auditId,
    String status,
    String notes,
    String createdAt,
    String completedAt,
    String cancelledAt,
    String cancellationReason,
    int totalProducts,
    int countedProducts,
    int discrepancyCount,
    List<StockAuditItemDetails> items
) {}
