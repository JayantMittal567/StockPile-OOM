package com.stockpile.model;

public record TopSellingProduct(
    Long productId,
    String productName,
    String sku,
    String category,
    int unitsSold,
    long totalRevenuePaise,
    long totalCostPaise,
    long grossProfitPaise
) {}
