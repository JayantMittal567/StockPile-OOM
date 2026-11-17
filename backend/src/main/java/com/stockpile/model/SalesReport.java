package com.stockpile.model;

import java.util.List;

public record SalesReport(
    ReportMetadata metadata,
    String periodType,
    String from,
    String to,
    String generatedAt,
    String currency,
    int completedSalesCount,
    int unitsSold,
    long grossSalesPaise,
    long discountsPaise,
    long netRevenuePaise,
    long cogsPaise,
    long grossProfitPaise,
    long averageOrderValuePaise,
    List<PaymentMethodSummary> paymentMethods,
    List<TopSellingProduct> topSellingProducts,
    List<FinancialMetricBreakdown> trend,
    List<SaleSummary> sales
) {}
