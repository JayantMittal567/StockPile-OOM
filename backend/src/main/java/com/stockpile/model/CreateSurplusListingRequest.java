package com.stockpile.model;

public record CreateSurplusListingRequest(
    Long productId,
    Integer quantity,
    Long discountedPricePaise,
    String reason,
    String notes
) {
    // OO: Constructor — object bante hi state initialize hoti hai; chhota constructor optional fields ki default value bhar deta hai.
    public CreateSurplusListingRequest(Long productId, Integer quantity, Long discountedPricePaise, String reason) {
        this(productId, quantity, discountedPricePaise, reason, null);
    }
}
