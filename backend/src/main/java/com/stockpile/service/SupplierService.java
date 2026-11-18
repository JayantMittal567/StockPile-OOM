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

// OO: Abstraction — SQL queries aur validation andar chhupi hain; bahar sirf clean business methods dikhte hain.
@Service
public class SupplierService {

    private final JdbcTemplate jdbcTemplate;

    public SupplierService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // --- Supplier Management ---
    private String trimToNull(String str) {
        if (str == null) return null;
        String trimmed = str.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateSupplierInput(String name, String phone, String email) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name is required");
        }
        if (email != null && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + email);
        }
        if (phone != null) {
            long digitCount = phone.chars().filter(Character::isDigit).count();
            if (digitCount < 7 || digitCount > 15 || !phone.matches("^[+]?[0-9\\s\\-().]{7,25}$")) {
                throw new IllegalArgumentException("Invalid phone number format: " + phone);
            }
        }
    }

    public List<Supplier> getSuppliers(String search) {
        StringBuilder sql = new StringBuilder("""
            SELECT id, name, contact_person, phone, email, address, notes, created_at, updated_at
            FROM suppliers
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();
        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(COALESCE(name, '')) LIKE ? OR LOWER(COALESCE(phone, '')) LIKE ? OR LOWER(COALESCE(email, '')) LIKE ?)");
            String term = "%" + search.trim().toLowerCase() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }

        sql.append(" ORDER BY id DESC");
        return jdbcTemplate.query(sql.toString(), RowMappers.SUPPLIER, params.toArray());
    }

    public Supplier getSupplierById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Supplier ID is required");
        }
        String sql = """
            SELECT id, name, contact_person, phone, email, address, notes, created_at, updated_at
            FROM suppliers WHERE id = ?
            """;
        List<Supplier> list = jdbcTemplate.query(sql, RowMappers.SUPPLIER, id);
        if (list.isEmpty()) {
            throw new SupplierNotFoundException("Supplier not found with id: " + id);
        }
        return list.get(0);
    }

    @Transactional
    public Supplier createSupplier(CreateSupplierRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        String name = req.name() != null ? req.name().trim() : null;
        String contactPerson = trimToNull(req.contactPerson());
        String phone = trimToNull(req.phone());
        String email = trimToNull(req.email());
        String address = trimToNull(req.address());
        String notes = trimToNull(req.notes());

        validateSupplierInput(name, phone, email);

        String sql = """
            INSERT INTO suppliers (name, contact_person, phone, email, address, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.update(sql, name, contactPerson, phone, email, address, notes);
        Long id = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);
        return getSupplierById(id);
    }

    @Transactional
    public Supplier updateSupplier(Long id, UpdateSupplierRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        getSupplierById(id);

        String name = req.name() != null ? req.name().trim() : null;
        String contactPerson = trimToNull(req.contactPerson());
        String phone = trimToNull(req.phone());
        String email = trimToNull(req.email());
        String address = trimToNull(req.address());
        String notes = trimToNull(req.notes());

        validateSupplierInput(name, phone, email);

        String sql = """
            UPDATE suppliers
            SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """;
        jdbcTemplate.update(sql, name, contactPerson, phone, email, address, notes, id);
        return getSupplierById(id);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        getSupplierById(id);

        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM product_suppliers WHERE supplier_id = ?",
            Integer.class,
            id
        );
        if (count != null && count > 0) {
            throw new SupplierConflictException(
                "Cannot delete supplier: " + count + " product(s) are associated with this supplier"
            );
        }

        Integer poCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = ?",
            Integer.class,
            id
        );
        if (poCount != null && poCount > 0) {
            throw new SupplierConflictException(
                "Cannot delete supplier referenced by " + poCount + " purchase order(s)"
            );
        }

        jdbcTemplate.update("DELETE FROM suppliers WHERE id = ?", id);
    }
}
