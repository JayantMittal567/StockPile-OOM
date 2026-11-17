package com.stockpile.model;

public record SurplusSummary(
    int totalListings,
    int activeListings,
    int partiallySoldListings,
    int fullySoldListings,
    int cancelledListings,
    int totalUnitsListed,
    int totalUnitsSold,
    int totalUnitsRemaining,
    long totalSurplusSalesRevenuePaise,
    long totalSurplusCostPaise,
    long totalSurplusGrossProfitPaise
) {
    public long getTotalSurplusRevenuePaise() {
        return totalSurplusSalesRevenuePaise;
    }

    public long totalSurplusRevenuePaise() {
        return totalSurplusSalesRevenuePaise;
    }

    public int getActiveListingsCount() {
        return activeListings;
    }
}
