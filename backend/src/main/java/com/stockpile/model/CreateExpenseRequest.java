package com.stockpile.model;

public record CreateExpenseRequest(
    String category,
    Long amountPaise,
    String description,
    String date
) {
    public CreateExpenseRequest(String category, Long amountPaise, String description) {
        this(category, amountPaise, description, null);
    }
}
