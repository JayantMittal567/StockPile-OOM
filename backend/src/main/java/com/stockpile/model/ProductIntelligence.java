package com.stockpile.model;

public record ProductIntelligence(
    Long productId,
    String productName,
    String sku,
    String category,
    int currentQuantity,
    int minStockLevel,
    int targetStockLevel,
    double averageDailySales,
    int leadTimeDays,
    double reorderPoint,
    int reorderQuantity,
    int surplusQuantity,
    String status,
    String recommendation
) {}
