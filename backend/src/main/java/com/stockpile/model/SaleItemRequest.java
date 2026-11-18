package com.stockpile.model;

public record SaleItemRequest(
    Long productId,
    Integer quantity,
    Long unitSellingPricePaise
) {
    public SaleItemRequest(Long productId, Integer quantity) {
        this(productId, quantity, null);
    }
}
