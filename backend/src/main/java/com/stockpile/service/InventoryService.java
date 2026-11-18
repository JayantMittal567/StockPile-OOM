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

@Service
public class InventoryService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;

    // OO: Dependency Inversion (DIP) — concrete DB driver par nahi, JdbcTemplate abstraction par depend; driver badle to service nahi badalti.
    public InventoryService(JdbcTemplate jdbcTemplate, ProductService productService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
    }

    // --- Inventory Movements ---
    @Transactional
    public RecentMovement recordMovement(CreateMovementRequest req) {
        if (req.productId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (req.movementType() == null || req.movementType().isBlank()) {
            throw new IllegalArgumentException("Movement type is required");
        }
        if (req.quantity() == null) {
            throw new IllegalArgumentException("Quantity is required");
        }

        String type = req.movementType().trim().toUpperCase();
        if (!type.equals("IN") && !type.equals("OUT") && !type.equals("ADJUSTMENT")) {
            throw new IllegalArgumentException("Movement type must be IN, OUT, or ADJUSTMENT");
        }

        Product product = productService.getProductById(req.productId());
        int currentQty = product.quantity();
        int newQty;
        int loggedDelta;

        if (type.equals("IN")) {
            if (req.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity for Stock In must be greater than zero");
            }
            newQty = currentQty + req.quantity();
            loggedDelta = req.quantity();
        } else if (type.equals("OUT")) {
            if (req.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity for Stock Out must be greater than zero");
            }
            int reserved = getActiveReservedQuantity(req.productId());
            int available = currentQty - reserved;
            if (available < req.quantity()) {
                throw new IllegalArgumentException(
                    "Insufficient stock: physical " + currentQty + ", reserved " + reserved + ", available " + available + ", cannot dispatch " + req.quantity()
                );
            }
            newQty = currentQty - req.quantity();
            loggedDelta = req.quantity();
        } else { // ADJUSTMENT
            if (req.quantity() < 0) {
                throw new IllegalArgumentException("Adjusted stock quantity cannot be negative");
            }
            if (req.quantity() == currentQty) {
                throw new IllegalArgumentException(
                    "Adjustment quantity is identical to current stock (" + currentQty + ")"
                );
            }
            int reserved = getActiveReservedQuantity(req.productId());
            if (req.quantity() < reserved) {
                throw new ProductConflictException(
                    "Cannot adjust physical stock to " + req.quantity() + " because " + reserved + " units are reserved in active surplus listings. Cancel or update surplus listings first."
                );
            }
            newQty = req.quantity();
            loggedDelta = Math.abs(newQty - currentQty);
        }

        String reason = (req.reason() != null && !req.reason().isBlank())
            ? req.reason().trim()
            : "Stock " + type;

        jdbcTemplate.update(
            "UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            newQty, req.productId()
        );

        jdbcTemplate.update(
            """
            INSERT INTO stock_movements (
                product_id, movement_type, quantity, previous_quantity, new_quantity, reason
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            req.productId(), type, loggedDelta, currentQty, newQty, reason
        );

        Long movementId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        return new RecentMovement(
            movementId,
            req.productId(),
            product.name(),
            type,
            loggedDelta,
            currentQty,
            newQty,
            reason,
            Instant.now().toString()
        );
    }

    public List<RecentMovement> getMovements(Long productId, String movementType) {
        return getMovements(productId, movementType, null, null, null, null);
    }

    public List<RecentMovement> getMovements(Long productId, String movementType, String fromStr, String toStr, Integer limit, Integer offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT sm.id AS movement_id, sm.product_id, p.name AS product_name,
               sm.movement_type, sm.quantity, sm.previous_quantity, sm.new_quantity,
               sm.reason, sm.created_at
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();
        if (productId != null) {
            sql.append(" AND sm.product_id = ?");
            params.add(productId);
        }
        if (movementType != null && !movementType.isBlank() && !"ALL".equalsIgnoreCase(movementType.trim())) {
            sql.append(" AND UPPER(sm.movement_type) = ?");
            params.add(movementType.trim().toUpperCase());
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

            sql.append(" AND datetime(replace(sm.created_at, 'T', ' ')) >= ? AND datetime(replace(sm.created_at, 'T', ' ')) < ?");
            params.add(startUtc);
            params.add(endUtc);
        }

        sql.append(" ORDER BY sm.id DESC");

        if (limit != null && limit > 0) {
            sql.append(" LIMIT ?");
            params.add(limit);
            if (offset != null && offset > 0) {
                sql.append(" OFFSET ?");
                params.add(offset);
            }
        }

        return jdbcTemplate.query(sql.toString(), RowMappers.MOVEMENT, params.toArray());
    }

    // --- Surplus Stock Management ---
    // OO: Association — products aur surplus_listings alag entities hain, product_id foreign key se jude (uses-a); reservation ka hisaab yahan milta hai.
    public int getActiveReservedQuantity(Long productId) {
        if (productId == null) return 0;
        Integer reserved = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(quantity_listed - quantity_sold), 0) FROM surplus_listings WHERE product_id = ? AND status IN ('ACTIVE', 'PARTIALLY_SOLD')",
            Integer.class,
            productId
        );
        return reserved != null ? Math.max(0, reserved) : 0;
    }
}
