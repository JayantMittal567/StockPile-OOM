package com.stockpile.model;

public record PeriodActivity(
    String period,
    String from,
    String to,
    long salesPaise,
    long grossProfitPaise,
    int unitsSold,
    long expensesPaise,
    long inventoryLossPaise,
    int discrepanciesCount,
    int completedSalesCount
) {}
