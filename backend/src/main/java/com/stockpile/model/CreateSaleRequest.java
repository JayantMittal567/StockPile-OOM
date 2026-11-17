package com.stockpile.model;

import java.math.BigDecimal;
import java.util.List;

public record CreateSaleRequest(
    List<SaleItemRequest> items,
    Long discountPaise,
    BigDecimal discountPercent,
    String paymentMethod
) {
    // OO: Open/Closed Principle (OCP) — naye convenience constructors se extension kiya, purane callers ka code chhede bina; existing behaviour band, extension khula.
    public CreateSaleRequest(List<SaleItemRequest> items, Long discountPaise, String paymentMethod) {
        this(items, discountPaise, null, paymentMethod);
    }

    public CreateSaleRequest(List<SaleItemRequest> items, BigDecimal discountPercent, String paymentMethod) {
        this(items, null, discountPercent, paymentMethod);
    }

    public CreateSaleRequest(List<SaleItemRequest> items, Double discountPercent, String paymentMethod) {
        this(items, null, discountPercent != null ? BigDecimal.valueOf(discountPercent) : null, paymentMethod);
    }

    public CreateSaleRequest(List<SaleItemRequest> items, Integer discountPercent, String paymentMethod) {
        this(items, null, discountPercent != null ? BigDecimal.valueOf(discountPercent) : null, paymentMethod);
    }

    public CreateSaleRequest(List<SaleItemRequest> items, String paymentMethod) {
        this(items, null, null, paymentMethod);
    }
}
