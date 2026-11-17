package com.stockpile.model;

import java.util.List;

public record SurplusListingDetails(
    Long id,
    Long productId,
    String productName,
    String sku,
    String category,
    int quantityListed,
    int quantitySold,
    int quantityRemaining,
    long regularUnitPricePaise,
    long discountedUnitPricePaise,
    double discountPercentage,
    long unitCostPaiseSnapshot,
    long recoveredRevenuePaise,
    long grossProfitPaise,
    String status,
    String reason,
    String notes,
    String createdAt,
    String updatedAt,
    String cancelledAt,
    List<SurplusSaleTransaction> sales
) {
    public SurplusListingDetails withSales(List<SurplusSaleTransaction> newSales) {
        return new SurplusListingDetails(
            id, productId, productName, sku, category, quantityListed, quantitySold, quantityRemaining,
            regularUnitPricePaise, discountedUnitPricePaise, discountPercentage, unitCostPaiseSnapshot,
            recoveredRevenuePaise, grossProfitPaise, status, reason, notes, createdAt, updatedAt, cancelledAt,
            newSales != null ? newSales : List.of()
        );
    }

    public long getDiscountedSellingPricePaise() {
        return discountedUnitPricePaise;
    }

    public long getOriginalSellingPricePaise() {
        return regularUnitPricePaise;
    }

    public long getTotalRealizedRevenuePaise() {
        return recoveredRevenuePaise;
    }

    public long getTotalRealizedGrossProfitPaise() {
        return grossProfitPaise;
    }

    public long getOriginalPurchasePricePaise() {
        return unitCostPaiseSnapshot;
    }

    // OO: Methods — object ka behaviour; attributes se derive karke result deta hai, caller ko calculation nahi karni padti.
    public long getTotalPotentialRevenuePaise() {
        return (long) quantityListed * discountedUnitPricePaise;
    }
}
