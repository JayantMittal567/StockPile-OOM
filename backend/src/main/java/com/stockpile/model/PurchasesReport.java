package com.stockpile.model;

import java.util.List;
import java.util.Map;

public record PurchasesReport(
    ReportMetadata metadata,
    String periodType,
    String from,
    String to,
    String generatedAt,
    String currency,
    int totalOrdersCount,
    long totalSpendPaise,
    int totalUnitsOrdered,
    int totalUnitsReceived,
    Map<String, Integer> countByStatus,
    Map<String, Long> spendByStatus,
    List<SupplierSpendSummary> supplierBreakdown,
    List<PurchaseOrderSummary> orders
) {}
