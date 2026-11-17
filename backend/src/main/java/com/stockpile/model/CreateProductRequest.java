package com.stockpile.model;

public record CreateProductRequest(
    String name,
    String sku,
    String category,
    Long purchasePricePaise,
    Long sellingPricePaise,
    Integer quantity,
    Integer minStockLevel,
    Integer targetStockLevel,
    Double averageDailySales,
    Integer leadTimeDays,
    Long supplierId
) {
    public CreateProductRequest(
        String name,
        String sku,
        String category,
        Long purchasePricePaise,
        Long sellingPricePaise,
        Integer quantity,
        Integer minStockLevel,
        Integer targetStockLevel,
        Double averageDailySales,
        Integer leadTimeDays
    ) {
        this(name, sku, category, purchasePricePaise, sellingPricePaise, quantity, minStockLevel, targetStockLevel, averageDailySales, leadTimeDays, null);
    }
}
