package com.stockpile.model;

public record CreateSaleItemRequest(
    Long productId,
    Integer quantity,
    Long unitSellingPricePaise
) {
    public CreateSaleItemRequest(Long productId, Integer quantity) {
        this(productId, quantity, null);
    }
    public SaleItemRequest toSaleItemRequest() {
        return new SaleItemRequest(productId, quantity, unitSellingPricePaise);
    }
}
