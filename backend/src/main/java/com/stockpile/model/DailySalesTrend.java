package com.stockpile.model;

public record DailySalesTrend(
    String saleDate,
    long totalPaise,
    int orderCount
) {}
