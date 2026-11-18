package com.stockpile.exception;

public class StockAuditNotFoundException extends RuntimeException {
    public StockAuditNotFoundException(String message) {
        super(message);
    }
}
