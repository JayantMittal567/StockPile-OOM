package com.stockpile.model;

import java.util.List;

public record ProfitLossReport(
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
    double grossMarginPercentage,
    long inventoryLossPaise,
    long operatingExpensesPaise,
    long totalOperatingExpensesPaise,
    long operatingResultPaise,
    double netMarginPercentage,
    List<FinancialMetricBreakdown> breakdown
) {}
