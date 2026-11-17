package com.stockpile.model;

import java.util.List;

public record InventoryLossReport(
    ReportMetadata metadata,
    String periodType,
    String from,
    String to,
    String generatedAt,
    String currency,
    long totalLossPaise,
    int totalUnitsLost,
    int incidentCount,
    List<FinancialMetricBreakdown> breakdown,
    List<InventoryLossIncident> incidents
) {}
