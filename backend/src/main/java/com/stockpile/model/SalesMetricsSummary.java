package com.stockpile.model;

public record SalesMetricsSummary(
    long salesTodayPaise,
    int salesTodayCount,
    long salesMonthPaise,
    int salesMonthCount,
    long totalSalesPaise,
    long totalCostPaise,
    long totalProfitPaise,
    int totalSalesCount
) {}
