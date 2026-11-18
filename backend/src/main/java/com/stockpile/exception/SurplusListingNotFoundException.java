package com.stockpile.exception;

public class SurplusListingNotFoundException extends RuntimeException {
    public SurplusListingNotFoundException(String message) {
        super(message);
    }
}
