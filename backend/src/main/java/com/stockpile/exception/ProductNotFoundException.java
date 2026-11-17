package com.stockpile.exception;

// Custom Exceptions for clean HTTP status mappings
// OO: Inheritance — RuntimeException se derive (is-a); parent type ke catch/handler is child ko bhi pakad lete hain.
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}
