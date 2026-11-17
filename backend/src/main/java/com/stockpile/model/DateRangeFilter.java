package com.stockpile.model;

import java.time.LocalDate;

// --- Financial Reports Records ---
public record DateRangeFilter(
    String periodType,
    LocalDate from,
    LocalDate to,
    String startUtc,
    String endUtc
) {}
