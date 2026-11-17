package com.stockpile.service;

import com.stockpile.model.*;
import com.stockpile.exception.*;
import com.stockpile.service.support.QuerySupport;
import com.stockpile.service.support.RowMappers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

// OO: Interface Segregation (ISP) — chhota focused API; client ko sirf expenses ke methods milte hain, poora god-service nahi.
@Service
public class ExpenseService {

    private final JdbcTemplate jdbcTemplate;

    public ExpenseService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public ExpenseRecord createExpense(CreateExpenseRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (req.category() == null || req.category().isBlank()) {
            throw new IllegalArgumentException("Expense category is required");
        }
        if (req.amountPaise() == null || req.amountPaise() < 0) {
            throw new IllegalArgumentException("Expense amount must not be negative");
        }

        Long id;
        if (req.date() != null && !req.date().isBlank()) {
            String ts = req.date().trim().length() == 10 ? req.date().trim() + " 12:00:00" : req.date().trim();
            jdbcTemplate.update(
                "INSERT INTO expenses (category, amount_paise, description, created_at) VALUES (?, ?, ?, ?)",
                req.category().trim(), req.amountPaise(), req.description() != null ? req.description().trim() : null, ts
            );
        } else {
            jdbcTemplate.update(
                "INSERT INTO expenses (category, amount_paise, description) VALUES (?, ?, ?)",
                req.category().trim(), req.amountPaise(), req.description() != null ? req.description().trim() : null
            );
        }
        id = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        return jdbcTemplate.queryForObject(
            "SELECT id, category, amount_paise, description, created_at FROM expenses WHERE id = ?",
            (rs, rowNum) -> new ExpenseRecord(
                rs.getLong("id"),
                rs.getString("category"),
                rs.getLong("amount_paise"),
                rs.getString("description"),
                rs.getString("created_at")
            ),
            id
        );
    }

    @Transactional
    public ExpenseRecord updateExpense(Long id, CreateExpenseRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (req.category() == null || req.category().isBlank()) {
            throw new IllegalArgumentException("Expense category is required");
        }
        if (req.amountPaise() == null || req.amountPaise() < 0) {
            throw new IllegalArgumentException("Expense amount must not be negative");
        }

        int updated;
        if (req.date() != null && !req.date().isBlank()) {
            String ts = req.date().trim().length() == 10 ? req.date().trim() + " 12:00:00" : req.date().trim();
            updated = jdbcTemplate.update(
                "UPDATE expenses SET category = ?, amount_paise = ?, description = ?, created_at = ? WHERE id = ?",
                req.category().trim(), req.amountPaise(), req.description() != null ? req.description().trim() : null, ts, id
            );
        } else {
            updated = jdbcTemplate.update(
                "UPDATE expenses SET category = ?, amount_paise = ?, description = ? WHERE id = ?",
                req.category().trim(), req.amountPaise(), req.description() != null ? req.description().trim() : null, id
            );
        }

        if (updated == 0) {
            throw new IllegalArgumentException("Expense not found with id: " + id);
        }

        return jdbcTemplate.queryForObject(
            "SELECT id, category, amount_paise, description, created_at FROM expenses WHERE id = ?",
            (rs, rowNum) -> new ExpenseRecord(
                rs.getLong("id"),
                rs.getString("category"),
                rs.getLong("amount_paise"),
                rs.getString("description"),
                rs.getString("created_at")
            ),
            id
        );
    }

    @Transactional
    public void deleteExpense(Long id) {
        int deleted = jdbcTemplate.update("DELETE FROM expenses WHERE id = ?", id);
        if (deleted == 0) {
            throw new IllegalArgumentException("Expense not found with id: " + id);
        }
    }

    public List<ExpenseRecord> getExpenses() {
        return getExpenses(null, null, null, null, null);
    }

    public List<ExpenseRecord> getExpenses(String category, String fromStr, String toStr, Integer limit, Integer offset) {
        StringBuilder sql = new StringBuilder("SELECT id, category, amount_paise, description, created_at FROM expenses WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category.trim())) {
            sql.append(" AND category = ?");
            params.add(category.trim());
        }

        if (fromStr != null && !fromStr.isBlank()) {
            ZoneId zone = ZoneId.of("Asia/Kolkata");
            LocalDate from = QuerySupport.parseIsoDate(fromStr, "from");
            LocalDate to = (toStr != null && !toStr.isBlank()) ? QuerySupport.parseIsoDate(toStr, "to") : from;
            if (from.isAfter(to)) {
                throw new IllegalArgumentException("Start date (" + from + ") cannot be after end date (" + to + ")");
            }
            ZonedDateTime startKolkata = from.atStartOfDay(zone);
            ZonedDateTime endKolkataExclusive = to.plusDays(1).atStartOfDay(zone);
            DateTimeFormatter SQLITE_UTC = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
            String startUtc = SQLITE_UTC.format(startKolkata.toInstant());
            String endUtc = SQLITE_UTC.format(endKolkataExclusive.toInstant());

            sql.append(" AND datetime(replace(created_at, 'T', ' ')) >= ? AND datetime(replace(created_at, 'T', ' ')) < ?");
            params.add(startUtc);
            params.add(endUtc);
        }

        sql.append(" ORDER BY id DESC");

        if (limit != null && limit > 0) {
            sql.append(" LIMIT ?");
            params.add(limit);
            if (offset != null && offset > 0) {
                sql.append(" OFFSET ?");
                params.add(offset);
            }
        }

        return jdbcTemplate.query(
            sql.toString(),
            (rs, rowNum) -> new ExpenseRecord(
                rs.getLong("id"),
                rs.getString("category"),
                rs.getLong("amount_paise"),
                rs.getString("description"),
                rs.getString("created_at")
            ),
            params.toArray()
        );
    }
}
