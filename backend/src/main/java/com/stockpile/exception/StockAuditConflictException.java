package com.stockpile.exception;

// OO: Liskov Substitution (LSP) — IllegalStateException ki jagah ye child bina contract tode use ho sakta hai; parent ke rules ye bhi nibhata hai.
public class StockAuditConflictException extends IllegalStateException {
    public StockAuditConflictException(String message) {
        super(message);
    }
}
