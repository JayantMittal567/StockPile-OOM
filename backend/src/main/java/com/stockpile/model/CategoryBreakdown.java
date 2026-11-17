package com.stockpile.model;

public record CategoryBreakdown(
    String category,
    int productCount,
    int totalQuantity
) {}
