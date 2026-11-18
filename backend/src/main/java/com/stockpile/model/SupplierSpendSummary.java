package com.stockpile.model;

public record SupplierSpendSummary(
    Long supplierId,
    String supplierName,
    int orderCount,
    long totalSpendPaise
) {}
