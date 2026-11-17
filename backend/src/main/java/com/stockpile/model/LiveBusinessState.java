package com.stockpile.model;

public record LiveBusinessState(
    int totalProducts,
    int totalQuantity,
    long inventoryValuePaise,
    int lowStockCount,
    int outOfStockCount,
    int activeSurplusListings,
    int pendingPurchaseOrders,
    int openStockAudits
) {}
