package com.stockpile.model;

public record CreateSupplierRequest(
    String name,
    String contactPerson,
    String phone,
    String email,
    String address,
    String notes
) {}
