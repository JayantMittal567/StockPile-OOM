package com.stockpile.model;

public record SaleSummary(
    Long id,
    Long saleId,
    long subtotalPaise,
    long discountPaise,
    Integer discountPercentBasisPoints,
    Double discountPercent,
    long totalPaise,
    long totalCostPaise,
    long grossProfitPaise,
    String paymentMethod,
    String status,
    String createdAt,
    String cancelledAt,
    int itemCount,
    int totalQuantity
) {
    public SaleSummary(
        Long id,
        Long saleId,
        long subtotalPaise,
        long discountPaise,
        long totalPaise,
        long totalCostPaise,
        long grossProfitPaise,
        String paymentMethod,
        String status,
        String createdAt,
        String cancelledAt,
        int itemCount,
        int totalQuantity
    ) {
        this(id, saleId, subtotalPaise, discountPaise, null, null, totalPaise, totalCostPaise, grossProfitPaise, paymentMethod, status, createdAt, cancelledAt, itemCount, totalQuantity);
    }
}
