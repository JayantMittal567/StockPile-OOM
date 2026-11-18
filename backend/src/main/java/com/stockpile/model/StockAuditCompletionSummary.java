package com.stockpile.model;

import java.util.List;

public record StockAuditCompletionSummary(
    Long id,
    Long auditId,
    String status,
    String notes,
    String createdAt,
    String completedAt,
    int totalProducts,
    int countedProducts,
    int discrepancyCount,
    int adjustedProducts,
    int unchangedProducts,
    String message,
    List<StockAuditItemDetails> items
) {}
