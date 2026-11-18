package com.stockpile.model;

public record SupplierProduct(
    Long id,
    Long productId,
    String name,
    String sku,
    String category,
    int quantity,
    int currentQuantity,
    long purchasePricePaise,
    long sellingPricePaise,
    int minStockLevel,
    int targetStockLevel,
    Long supplierId,
    String supplierName
) {}
