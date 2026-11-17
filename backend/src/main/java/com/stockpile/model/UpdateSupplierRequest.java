package com.stockpile.model;

public record UpdateSupplierRequest(
    String name,
    String contactPerson,
    String phone,
    String email,
    String address,
    String notes
) {}
