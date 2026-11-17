package com.stockpile.model;

public record ExpenseRecord(
    Long id,
    String category,
    long amountPaise,
    String description,
    String createdAt
) {}
