package com.stockpile.model;

public record ReportMetadata(
    String periodType,
    String from,
    String to,
    String generatedAt,
    String currency
) {}
