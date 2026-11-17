package com.stockpile.model;

// OO: Class, Object & Attributes — Product ek class hai; har DB row iska object; record components uske attributes (state) hain.
public record Product(
    // OO: Encapsulation — components private final hain; bahar wale sirf accessor methods se value padh sakte hain, direct chhed-chhad nahi.
    Long id,
    String name,
    String sku,
    String category,
    long purchasePricePaise,
    long sellingPricePaise,
    int quantity,
    int minStockLevel,
    int targetStockLevel,
    double averageDailySales,
    int leadTimeDays,
    String createdAt,
    String updatedAt,
    Long supplierId,
    String supplierName
) {
    public Product(
        Long id,
        String name,
        String sku,
        String category,
        long purchasePricePaise,
        long sellingPricePaise,
        int quantity,
        int minStockLevel,
        int targetStockLevel,
        double averageDailySales,
        int leadTimeDays,
        String createdAt,
        String updatedAt
    ) {
        this(id, name, sku, category, purchasePricePaise, sellingPricePaise, quantity, minStockLevel, targetStockLevel, averageDailySales, leadTimeDays, createdAt, updatedAt, null, null);
    }
}
