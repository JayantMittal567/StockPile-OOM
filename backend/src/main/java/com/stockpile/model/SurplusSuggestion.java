package com.stockpile.model;

// --- Surplus Stock Management Records & Exceptions ---
public record SurplusSuggestion(
    Long productId,
    String productName,
    String sku,
    String category,
    int currentQuantity,
    int reservedQuantity,
    int availableQuantity,
    Integer preferredStockLevel,
    int suggestedSurplusQuantity,
    long sellingPricePaise,
    long purchasePricePaise,
    int unitsSoldLast30Days,
    String lastSoldAt,
    String salesActivity,
    String recommendationReason
) {}
