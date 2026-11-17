package com.stockpile.exception;

public class SaleConflictException extends RuntimeException {
    public SaleConflictException(String message) {
        super(message);
    }
}
