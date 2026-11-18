package com.stockpile.model;

public record DashboardSummary(
    int totalProducts,
    int totalQuantity,
    long inventoryValuePaise,
    int lowStockCount,
    int outOfStockCount,
    int activeSurplusListings,
    int pendingPurchaseOrders,
    int openStockAudits
) {
    public DashboardSummary(int totalProducts, int totalQuantity, long inventoryValuePaise, int lowStockCount, int outOfStockCount) {
        this(totalProducts, totalQuantity, inventoryValuePaise, lowStockCount, outOfStockCount, 0, 0, 0);
    }
}
