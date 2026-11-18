package com.stockpile.model;

public record StockAuditMetricsSummary(
    int openAudits,
    int pendingDiscrepancies,
    long inventoryLossTodayPaise,
    int completedAuditsThisMonth
) {}
