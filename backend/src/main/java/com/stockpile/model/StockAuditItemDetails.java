package com.stockpile.model;

public record StockAuditItemDetails(
    Long id,
    Long itemId,
    Long auditId,
    Long productId,
    String productNameSnapshot,
    String skuSnapshot,
    int systemQuantity,
    Integer countedQuantity,
    Integer variance,
    String countStatus,
    String itemNotes
) {}
