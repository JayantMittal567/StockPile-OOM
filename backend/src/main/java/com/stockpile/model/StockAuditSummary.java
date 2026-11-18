package com.stockpile.model;

public record StockAuditSummary(
    Long id,
    Long auditId,
    String status,
    String notes,
    String createdAt,
    String completedAt,
    String cancelledAt,
    String cancellationReason,
    int totalProducts,
    int productsCounted,
    int productsWithDiscrepancies
) {}
