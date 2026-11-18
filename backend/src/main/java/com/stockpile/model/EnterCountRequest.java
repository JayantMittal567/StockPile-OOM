package com.stockpile.model;

public record EnterCountRequest(
    Integer countedQuantity,
    String notes
) {}
