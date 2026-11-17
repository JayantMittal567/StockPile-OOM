package com.stockpile.model;

public record SurplusSaleTransaction(
    Long saleId,
    Long saleItemId,
    int quantity,
    long unitSellingPricePaise,
    long unitPurchasePricePaise,
    long lineTotalPaise,
    long lineCostPaise,
    String paymentMethod,
    String status,
    String createdAt
) {
    public long getGrossProfitPaise() {
        return lineTotalPaise - lineCostPaise;
    }
}
