package com.stockpile.model;

import java.util.List;

public record SalesIntelligenceSummary(
    int totalProducts,
    List<ProductSalesIntelligence> fastSellingProducts,
    int slowMovingProducts,
    int potentialDeadStockProducts,
    int noSalesHistoryProducts,
    int outOfStockProducts,
    int productsNeedingRestock
) {}
