package com.stockpile.exception;

public class PurchaseOrderConflictException extends RuntimeException {
    public PurchaseOrderConflictException(String message) {
        super(message);
    }
}
