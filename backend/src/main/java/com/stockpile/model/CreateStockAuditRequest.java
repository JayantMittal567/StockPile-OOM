package com.stockpile.model;

import java.util.List;

// --- Stock Auditing Records and Exceptions ---
public record CreateStockAuditRequest(
    List<Long> productIds,
    String notes
) {}
