package com.stockpile.model;

public record ProductSalesIntelligence(
    Long productId,
    String productName,
    String sku,
    String category,
    int currentQuantity,
    int lowStockLevel,
    int preferredStockLevel,
    int unitsSoldLast30Days,
    int unitsSoldPrevious30Days,
    double averageDailySalesLast30Days,
    String lastSoldAt,
    Integer daysSinceLastSale,
    String salesActivity,
    String salesTrend,
    int recommendedRestockQuantity,
    String recommendation
) {}
