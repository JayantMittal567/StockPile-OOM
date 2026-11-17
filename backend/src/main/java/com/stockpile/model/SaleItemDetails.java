package com.stockpile.model;

// OO: Association — item product ko reference karta hai (uses-a); product sale ke bina bhi independently exist karta hai.
public record SaleItemDetails(
    Long id,
    Long saleId,
    Long productId,
    String productNameSnapshot,
    String skuSnapshot,
    int quantity,
    long unitSellingPricePaise,
    long unitPurchasePricePaise,
    long lineTotalPaise,
    long lineCostPaise,
    Long surplusListingId,
    Boolean belowCost
) {
    public SaleItemDetails(
        Long id,
        Long saleId,
        Long productId,
        String productNameSnapshot,
        String skuSnapshot,
        int quantity,
        long unitSellingPricePaise,
        long unitPurchasePricePaise,
        long lineTotalPaise,
        long lineCostPaise,
        Long surplusListingId
    ) {
        this(id, saleId, productId, productNameSnapshot, skuSnapshot, quantity, unitSellingPricePaise, unitPurchasePricePaise, lineTotalPaise, lineCostPaise, surplusListingId, unitSellingPricePaise < unitPurchasePricePaise);
    }

    public SaleItemDetails(
        Long id,
        Long saleId,
        Long productId,
        String productNameSnapshot,
        String skuSnapshot,
        int quantity,
        long unitSellingPricePaise,
        long unitPurchasePricePaise,
        long lineTotalPaise,
        long lineCostPaise
    ) {
        this(id, saleId, productId, productNameSnapshot, skuSnapshot, quantity, unitSellingPricePaise, unitPurchasePricePaise, lineTotalPaise, lineCostPaise, null, unitSellingPricePaise < unitPurchasePricePaise);
    }
}
