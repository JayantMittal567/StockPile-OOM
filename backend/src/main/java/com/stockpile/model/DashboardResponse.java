package com.stockpile.model;

import java.util.List;

// OO: Aggregation — response breakdowns ko collect karta hai (has-a); ye parts alag se bhi ban sakte hain, weak ownership.
public record DashboardResponse(
    int totalProducts,
    int totalQuantity,
    long inventoryValuePaise,
    int lowStockCount,
    int outOfStockCount,
    DashboardSummary summary,
    List<CategoryBreakdown> categoryBreakdown,
    List<RecentMovement> recentMovements,
    LiveBusinessState liveState,
    PeriodActivity periodActivity
) {
    public DashboardResponse(
        int totalProducts,
        int totalQuantity,
        long inventoryValuePaise,
        int lowStockCount,
        int outOfStockCount,
        DashboardSummary summary,
        List<CategoryBreakdown> categoryBreakdown,
        List<RecentMovement> recentMovements
    ) {
        this(totalProducts, totalQuantity, inventoryValuePaise, lowStockCount, outOfStockCount, summary, categoryBreakdown, recentMovements, null, null);
    }
}
