package com.stockpile.model;

public record FinancialMetricBreakdown(
    String period,
    long grossSalesPaise,
    long discountsPaise,
    long netRevenuePaise,
    long cogsPaise,
    long grossProfitPaise,
    long inventoryLossPaise,
    long operatingExpensesPaise,
    long operatingResultPaise,
    int salesCount,
    int unitsSold
) {}
