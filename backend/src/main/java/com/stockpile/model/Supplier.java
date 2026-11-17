package com.stockpile.model;

public record Supplier(
    Long id,
    String name,
    String contactPerson,
    String phone,
    String email,
    String address,
    String notes,
    String createdAt,
    String updatedAt
) {}
