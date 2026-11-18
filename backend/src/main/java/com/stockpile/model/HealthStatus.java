package com.stockpile.model;

// --- Domain Records ---
public record HealthStatus(
    String status,
    String database,
    String databaseType,
    int totalProducts,
    int totalMovements,
    String timestamp
) {}
