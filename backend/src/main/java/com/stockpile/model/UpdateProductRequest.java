package com.stockpile.model;

public record UpdateProductRequest(
    String name,
    String sku,
    String category,
    Long purchasePricePaise,
    Long sellingPricePaise,
    Integer minStockLevel,
    Integer targetStockLevel,
    Double averageDailySales,
    Integer leadTimeDays
) {}
