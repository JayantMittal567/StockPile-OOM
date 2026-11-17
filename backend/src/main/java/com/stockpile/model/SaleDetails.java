package com.stockpile.model;

import java.util.List;

// OO: Composition — SaleItemDetails sale ka apna hissa hai; sale khatam to items bhi khatam (strong owns-a, shared lifecycle).
public record SaleDetails(
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
    List<SaleItemDetails> items,
    Boolean hasBelowCostItem
) {
    public SaleDetails(
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
        List<SaleItemDetails> items
    ) {
        this(
            id,
            saleId,
            subtotalPaise,
            discountPaise,
            null,
            null,
            totalPaise,
            totalCostPaise,
            grossProfitPaise,
            paymentMethod,
            status,
            createdAt,
            cancelledAt,
            items,
            items != null && items.stream().anyMatch(i -> Boolean.TRUE.equals(i.belowCost()))
        );
    }

    public SaleDetails(
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
        List<SaleItemDetails> items
    ) {
        this(
            id,
            saleId,
            subtotalPaise,
            discountPaise,
            discountPercentBasisPoints,
            discountPercent,
            totalPaise,
            totalCostPaise,
            grossProfitPaise,
            paymentMethod,
            status,
            createdAt,
            cancelledAt,
            items,
            items != null && items.stream().anyMatch(i -> Boolean.TRUE.equals(i.belowCost()))
        );
    }
}
