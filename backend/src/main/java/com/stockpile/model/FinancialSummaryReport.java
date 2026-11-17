package com.stockpile.model;

import java.util.List;

public record FinancialSummaryReport(
    ReportMetadata metadata,
    String periodType,
    String from,
    String to,
    String generatedAt,
    String currency,
    long grossSalesPaise,
    long discountsPaise,
    long netRevenuePaise,
    long cogsPaise,
    long grossProfitPaise,
    long inventoryLossPaise,
    long operatingExpensesPaise,
    long operatingResultPaise,
    long totalPurchasesPaise,
    int purchaseOrdersCount,
    int completedSalesCount,
    int unitsSold,
    List<FinancialMetricBreakdown> breakdown,
    List<SaleSummary> transactions
) {}
