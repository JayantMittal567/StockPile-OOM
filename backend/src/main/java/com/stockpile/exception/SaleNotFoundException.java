package com.stockpile.exception;

public class SaleNotFoundException extends RuntimeException {
    public SaleNotFoundException(String message) {
        super(message);
    }
}
