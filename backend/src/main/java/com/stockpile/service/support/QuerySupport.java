package com.stockpile.service.support;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

// OO: Modularity & Maintainable Design — shared helpers ek hi jagah; duplication nahi, ek fix sab jagah lagta hai.
public final class QuerySupport {

    private QuerySupport() {}

    public static boolean hasColumn(java.sql.ResultSet rs, String columnName) {
        try {
            rs.findColumn(columnName);
            return true;
        } catch (java.sql.SQLException e) {
            return false;
        }
    }

    public static LocalDate parseIsoDate(String dateStr, String paramName) {
        if (dateStr == null || dateStr.isBlank()) {
            throw new IllegalArgumentException("Date parameter '" + paramName + "' is required");
        }
        try {
            return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format for '" + paramName + "': '" + dateStr + "'. Expected format: YYYY-MM-DD");
        }
    }
}
