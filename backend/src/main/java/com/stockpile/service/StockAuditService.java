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
public class StockAuditService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;
    private final InventoryService inventoryService;

    public StockAuditService(JdbcTemplate jdbcTemplate, ProductService productService, InventoryService inventoryService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
        this.inventoryService = inventoryService;
    }

    // --- Stock Auditing Management ---
    @Transactional
    public StockAuditDetails createStockAudit(CreateStockAuditRequest req) {
        List<Long> productIds = (req != null) ? req.productIds() : null;
        List<Product> targetProducts = new ArrayList<>();

        if (productIds == null) {
            targetProducts = jdbcTemplate.query("SELECT * FROM products ORDER BY id ASC", RowMappers.PRODUCT);
            if (targetProducts.isEmpty()) {
                throw new IllegalArgumentException("Cannot create an audit with no products in the catalog");
            }
        } else {
            if (productIds.isEmpty()) {
                throw new IllegalArgumentException("Product IDs list cannot be empty");
            }
            Set<Long> seen = new HashSet<>();
            for (Long pid : productIds) {
                if (pid == null) {
                    throw new IllegalArgumentException("Product ID cannot be null");
                }
                if (!seen.add(pid)) {
                    throw new IllegalArgumentException("Duplicate product ID in stock audit: " + pid);
                }
                Product p = productService.getProductById(pid);
                targetProducts.add(p);
            }
        }

        String notes = (req != null && req.notes() != null && !req.notes().isBlank()) ? req.notes().trim() : null;

        jdbcTemplate.update("INSERT INTO stock_audits (status, notes) VALUES ('OPEN', ?)", notes);
        Long auditId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        String insertItemSql = """
            INSERT INTO stock_audit_items (
                audit_id, product_id, product_name_snapshot, sku_snapshot,
                system_quantity, counted_quantity, item_notes
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL)
            """;

        for (Product p : targetProducts) {
            jdbcTemplate.update(
                insertItemSql,
                auditId, p.id(), p.name(), p.sku(), p.quantity()
            );
        }

        return getStockAuditById(auditId);
    }

    public StockAuditMetricsSummary getStockAuditSummary() {
        ZoneId zone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(zone);
        ZonedDateTime todayStart = today.atStartOfDay(zone);
        ZonedDateTime todayEnd = today.plusDays(1).atStartOfDay(zone);

        YearMonth thisMonth = YearMonth.now(zone);
        ZonedDateTime monthStart = thisMonth.atDay(1).atStartOfDay(zone);
        ZonedDateTime monthEnd = thisMonth.atEndOfMonth().plusDays(1).atStartOfDay(zone);

        DateTimeFormatter SQLITE_UTC = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
        String todayStartUtc = SQLITE_UTC.format(todayStart.toInstant());
        String todayEndUtc = SQLITE_UTC.format(todayEnd.toInstant());
        String monthStartUtc = SQLITE_UTC.format(monthStart.toInstant());
        String monthEndUtc = SQLITE_UTC.format(monthEnd.toInstant());

        Integer openAudits = 0;
        try {
            openAudits = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM stock_audits WHERE status = 'OPEN'",
                Integer.class
            );
        } catch (Exception ignored) {}

        Integer pendingDiscrepancies = 0;
        try {
            pendingDiscrepancies = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(CASE WHEN sai.counted_quantity IS NOT NULL AND sai.counted_quantity != sai.system_quantity THEN 1 ELSE 0 END), 0)
                FROM stock_audit_items sai
                JOIN stock_audits sa ON sai.audit_id = sa.id
                WHERE sa.status = 'OPEN'
                """,
                Integer.class
            );
        } catch (Exception ignored) {}

        Long lossToday = 0L;
        try {
            lossToday = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM((CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END) * p.purchase_price_paise), 0)
                FROM stock_movements sm
                JOIN products p ON sm.product_id = p.id
                WHERE ((sm.movement_type = 'ADJUSTMENT' AND sm.new_quantity < sm.previous_quantity) OR (sm.movement_type = 'OUT' AND sm.reason NOT LIKE 'Sale #%'))
                  AND datetime(replace(sm.created_at, 'T', ' ')) >= ?
                  AND datetime(replace(sm.created_at, 'T', ' ')) < ?
                """,
                Long.class,
                todayStartUtc, todayEndUtc
            );
        } catch (Exception ignored) {}

        Integer completedThisMonth = 0;
        try {
            completedThisMonth = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM stock_audits
                WHERE status = 'COMPLETED'
                  AND datetime(replace(completed_at, 'T', ' ')) >= ?
                  AND datetime(replace(completed_at, 'T', ' ')) < ?
                """,
                Integer.class,
                monthStartUtc, monthEndUtc
            );
        } catch (Exception ignored) {}

        return new StockAuditMetricsSummary(
            openAudits != null ? openAudits : 0,
            pendingDiscrepancies != null ? pendingDiscrepancies : 0,
            lossToday != null ? lossToday : 0L,
            completedThisMonth != null ? completedThisMonth : 0
        );
    }

    public List<StockAuditSummary> getStockAudits() {
        return getStockAudits(null, null, null);
    }

    public List<StockAuditSummary> getStockAudits(String status, String fromStr, String toStr) {
        return getStockAudits(status, fromStr, toStr, null, null);
    }

    public List<StockAuditSummary> getStockAudits(String status, String fromStr, String toStr, Integer limit, Integer offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT sa.id,
                   sa.status,
                   sa.notes,
                   sa.created_at,
                   sa.completed_at,
                   sa.cancelled_at,
                   sa.cancellation_reason,
                   COUNT(sai.id) AS total_products,
                   COUNT(sai.counted_quantity) AS products_counted,
                   COALESCE(SUM(CASE WHEN sai.counted_quantity IS NOT NULL AND sai.counted_quantity != sai.system_quantity THEN 1 ELSE 0 END), 0) AS products_with_discrepancies
            FROM stock_audits sa
            LEFT JOIN stock_audit_items sai ON sa.id = sai.audit_id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            sql.append(" AND UPPER(sa.status) = ?");
            params.add(status.trim().toUpperCase());
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

            sql.append(" AND datetime(replace(sa.created_at, 'T', ' ')) >= ? AND datetime(replace(sa.created_at, 'T', ' ')) < ?");
            params.add(startUtc);
            params.add(endUtc);
        }

        sql.append("""
            GROUP BY sa.id
            ORDER BY sa.id DESC
            """);

        if (limit != null && limit > 0) {
            int effectiveLimit = Math.min(100, Math.max(1, limit));
            sql.append(" LIMIT ?");
            params.add(effectiveLimit);
            if (offset != null && offset > 0) {
                sql.append(" OFFSET ?");
                params.add(offset);
            }
        }

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> new StockAuditSummary(
            rs.getLong("id"),
            rs.getLong("id"),
            rs.getString("status"),
            rs.getString("notes"),
            rs.getString("created_at"),
            rs.getString("completed_at"),
            rs.getString("cancelled_at"),
            rs.getString("cancellation_reason"),
            rs.getInt("total_products"),
            rs.getInt("products_counted"),
            rs.getInt("products_with_discrepancies")
        ), params.toArray());
    }

    public StockAuditDetails getStockAuditById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Audit ID is required");
        }

        List<StockAuditHeader> list = jdbcTemplate.query(
            "SELECT id, status, notes, created_at, completed_at, cancelled_at, cancellation_reason FROM stock_audits WHERE id = ?",
            (rs, rowNum) -> new StockAuditHeader(
                rs.getLong("id"),
                rs.getString("status"),
                rs.getString("notes"),
                rs.getString("created_at"),
                rs.getString("completed_at"),
                rs.getString("cancelled_at"),
                rs.getString("cancellation_reason")
            ),
            id
        );

        if (list.isEmpty()) {
            throw new StockAuditNotFoundException("Stock audit not found with id: " + id);
        }

        StockAuditHeader header = list.get(0);

        String itemSql = """
            SELECT id, audit_id, product_id, product_name_snapshot, sku_snapshot,
                   system_quantity, counted_quantity, item_notes
            FROM stock_audit_items
            WHERE audit_id = ?
            ORDER BY id ASC
            """;

        List<StockAuditItemDetails> items = jdbcTemplate.query(itemSql, (rs, rowNum) -> {
            long itemId = rs.getLong("id");
            long auditRefId = rs.getLong("audit_id");
            long productId = rs.getLong("product_id");
            String prodName = rs.getString("product_name_snapshot");
            String sku = rs.getString("sku_snapshot");
            int sysQty = rs.getInt("system_quantity");
            Integer countedQty = rs.getObject("counted_quantity") != null ? rs.getInt("counted_quantity") : null;
            Integer variance = (countedQty != null) ? (countedQty - sysQty) : null;
            String countStatus;
            if (countedQty == null) {
                countStatus = "UNCOUNTED";
            } else if (variance == 0) {
                countStatus = "MATCH";
            } else {
                countStatus = "DISCREPANCY";
            }
            String notes = rs.getString("item_notes");

            return new StockAuditItemDetails(
                itemId,
                itemId,
                auditRefId,
                productId,
                prodName,
                sku,
                sysQty,
                countedQty,
                variance,
                countStatus,
                notes
            );
        }, id);

        int totalProducts = items.size();
        int countedProducts = (int) items.stream().filter(i -> i.countedQuantity() != null).count();
        int discrepancyCount = (int) items.stream().filter(i -> i.variance() != null && i.variance() != 0).count();

        return new StockAuditDetails(
            header.id(),
            header.id(),
            header.status(),
            header.notes(),
            header.createdAt(),
            header.completedAt(),
            header.cancelledAt(),
            header.cancellationReason(),
            totalProducts,
            countedProducts,
            discrepancyCount,
            items
        );
    }

    public StockAuditItemDetails getStockAuditItemById(Long auditId, Long itemId) {
        String sql = """
            SELECT id, audit_id, product_id, product_name_snapshot, sku_snapshot,
                   system_quantity, counted_quantity, item_notes
            FROM stock_audit_items
            WHERE id = ? AND audit_id = ?
            """;
        List<StockAuditItemDetails> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            long itId = rs.getLong("id");
            long audId = rs.getLong("audit_id");
            long prodId = rs.getLong("product_id");
            String prodName = rs.getString("product_name_snapshot");
            String sku = rs.getString("sku_snapshot");
            int sysQty = rs.getInt("system_quantity");
            Integer countedQty = rs.getObject("counted_quantity") != null ? rs.getInt("counted_quantity") : null;
            Integer variance = (countedQty != null) ? (countedQty - sysQty) : null;
            String countStatus;
            if (countedQty == null) {
                countStatus = "UNCOUNTED";
            } else if (variance == 0) {
                countStatus = "MATCH";
            } else {
                countStatus = "DISCREPANCY";
            }
            String notes = rs.getString("item_notes");
            return new StockAuditItemDetails(
                itId, itId, audId, prodId, prodName, sku, sysQty, countedQty, variance, countStatus, notes
            );
        }, itemId, auditId);

        if (list.isEmpty()) {
            throw new StockAuditNotFoundException("Audit item #" + itemId + " not found for audit #" + auditId);
        }
        return list.get(0);
    }

    @Transactional
    public StockAuditItemDetails enterCount(Long auditId, Long itemId, EnterCountRequest req) {
        if (auditId == null) {
            throw new IllegalArgumentException("Audit ID is required");
        }
        if (itemId == null) {
            throw new IllegalArgumentException("Audit item ID is required");
        }
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (req.countedQuantity() == null || req.countedQuantity() < 0) {
            throw new IllegalArgumentException("Counted quantity must be a non-negative integer");
        }

        StockAuditDetails audit = getStockAuditById(auditId);
        if (!"OPEN".equalsIgnoreCase(audit.status())) {
            throw new StockAuditConflictException(
                "Cannot record count for audit #" + auditId + " because its status is: " + audit.status()
            );
        }

        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM stock_audit_items WHERE id = ? AND audit_id = ?",
            Integer.class,
            itemId, auditId
        );
        if (count == null || count == 0) {
            throw new StockAuditNotFoundException(
                "Audit item #" + itemId + " not found for audit #" + auditId
            );
        }

        String itemNotes = (req.notes() != null && !req.notes().isBlank()) ? req.notes().trim() : null;

        jdbcTemplate.update(
            "UPDATE stock_audit_items SET counted_quantity = ?, item_notes = ? WHERE id = ? AND audit_id = ?",
            req.countedQuantity(), itemNotes, itemId, auditId
        );

        return getStockAuditItemById(auditId, itemId);
    }

    @Transactional
    public StockAuditCompletionSummary completeStockAudit(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Audit ID is required");
        }
        StockAuditDetails audit = getStockAuditById(id);

        if (!"OPEN".equalsIgnoreCase(audit.status())) {
            throw new StockAuditConflictException(
                "Audit #" + id + " cannot be completed because its status is: " + audit.status()
            );
        }

        List<StockAuditItemDetails> items = audit.items();
        if (items == null || items.isEmpty()) {
            throw new StockAuditConflictException("Audit #" + id + " contains no items");
        }

        // Verify every audit item has a physical count
        for (StockAuditItemDetails item : items) {
            if (item.countedQuantity() == null) {
                throw new StockAuditConflictException(
                    "Audit #" + id + " cannot be completed: item for product '" + 
                    item.productNameSnapshot() + "' has not been counted"
                );
            }
        }

        // Concurrency Rule: Verify current product quantities still match system quantities captured at start
        for (StockAuditItemDetails item : items) {
            Product currentProduct = productService.getProductById(item.productId());
            if (currentProduct.quantity() != item.systemQuantity()) {
                throw new StockAuditConflictException(
                    "Inventory for product '" + item.productNameSnapshot() + "' (SKU: " + item.skuSnapshot() + 
                    ") changed during the audit (snapshot: " + item.systemQuantity() + 
                    ", current: " + currentProduct.quantity() + 
                    "). The audit must be cancelled and restarted."
                );
            }

            int reserved = inventoryService.getActiveReservedQuantity(item.productId());
            if (item.countedQuantity() < reserved) {
                throw new StockAuditConflictException(
                    "Audit #" + id + " cannot reconcile product '" + item.productNameSnapshot() + 
                    "': counted quantity (" + item.countedQuantity() + ") is lower than active reserved quantity (" + 
                    reserved + "). Cancel or reduce affected surplus listings before completing this audit."
                );
            }
        }

        int adjustedProducts = 0;
        int unchangedProducts = 0;

        for (StockAuditItemDetails item : items) {
            int countedQty = item.countedQuantity();
            int systemQty = item.systemQuantity();
            int variance = countedQty - systemQty;

            if (variance == 0) {
                unchangedProducts++;
            } else {
                adjustedProducts++;

                // Update product quantity to counted quantity
                jdbcTemplate.update(
                    "UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    countedQty, item.productId()
                );

                // Create one stock adjustment movement
                String reason = "Stock Audit #" + id + " adjustment (variance: " + (variance > 0 ? "+" : "") + variance + ")" +
                    (item.itemNotes() != null && !item.itemNotes().isBlank() ? " - " + item.itemNotes() : "");

                jdbcTemplate.update(
                    """
                    INSERT INTO stock_movements (
                        product_id, movement_type, quantity, previous_quantity, new_quantity, reason
                    ) VALUES (?, 'ADJUSTMENT', ?, ?, ?, ?)
                    """,
                    item.productId(), Math.abs(variance), systemQty, countedQty, reason
                );
            }
        }

        jdbcTemplate.update(
            "UPDATE stock_audits SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
            id
        );

        StockAuditDetails updated = getStockAuditById(id);

        String message = String.format(
            "Stock audit #%d completed successfully. %d product(s) adjusted, %d unchanged.",
            id, adjustedProducts, unchangedProducts
        );

        return new StockAuditCompletionSummary(
            updated.id(),
            updated.auditId(),
            updated.status(),
            updated.notes(),
            updated.createdAt(),
            updated.completedAt(),
            updated.totalProducts(),
            updated.countedProducts(),
            updated.discrepancyCount(),
            adjustedProducts,
            unchangedProducts,
            message,
            updated.items()
        );
    }

    @Transactional
    public StockAuditDetails cancelStockAudit(Long id, CancelStockAuditRequest req) {
        if (id == null) {
            throw new IllegalArgumentException("Audit ID is required");
        }
        StockAuditDetails audit = getStockAuditById(id);

        if (!"OPEN".equalsIgnoreCase(audit.status())) {
            throw new StockAuditConflictException(
                "Cannot cancel audit #" + id + " because its status is: " + audit.status()
            );
        }

        if (req == null || req.reason() == null || req.reason().isBlank()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        String reason = req.reason().trim();

        jdbcTemplate.update(
            "UPDATE stock_audits SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = ? WHERE id = ?",
            reason, id
        );

        return getStockAuditById(id);
    }

    private record StockAuditHeader(
        Long id,
        String status,
        String notes,
        String createdAt,
        String completedAt,
        String cancelledAt,
        String cancellationReason
    ) {}
}
