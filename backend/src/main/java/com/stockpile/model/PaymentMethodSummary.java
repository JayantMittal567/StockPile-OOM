package com.stockpile.model;

public record PaymentMethodSummary(
    String paymentMethod,
    int orderCount,
    long totalPaise
) {}
