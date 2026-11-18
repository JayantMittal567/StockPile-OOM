package com.stockpile.model;

public record UpdateSurplusListingRequest(
    Long discountedPricePaise,
    Integer quantity,
    String reason,
    String notes
) {
    // OO: Polymorphism (compile-time overloading) — same constructor naam, alag parameter list; call site pe compiler decide karta hai kaunsa version chalega.
    public UpdateSurplusListingRequest(Long discountedPricePaise, String reason, String notes) {
        this(discountedPricePaise, null, reason, notes);
    }
}
