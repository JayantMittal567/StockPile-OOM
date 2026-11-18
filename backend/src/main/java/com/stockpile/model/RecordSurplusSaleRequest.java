package com.stockpile.model;

public record RecordSurplusSaleRequest(
    int quantity,
    String paymentMethod
) {
    public RecordSurplusSaleRequest(int quantity) {
        this(quantity, "CASH");
    }
}
