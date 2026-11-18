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
public class PurchaseOrderService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;
    private final SupplierService supplierService;

    public PurchaseOrderService(JdbcTemplate jdbcTemplate, ProductService productService, SupplierService supplierService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
        this.supplierService = supplierService;
    }

    @Transactional
    public PurchaseOrderDetails createPurchaseOrder(CreatePurchaseOrderRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (req.supplierId() == null) {
            throw new IllegalArgumentException("Supplier ID is required");
        }
        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Purchase order must contain at least one item");
        }

        Supplier supplier = supplierService.getSupplierById(req.supplierId());

        Set<Long> seenProductIds = new HashSet<>();
        long calculatedTotalPaise = 0L;

        for (CreatePurchaseOrderItemRequest item : req.items()) {
            if (item.productId() == null) {
                throw new IllegalArgumentException("Product ID is required for each item");
            }
            if (!seenProductIds.add(item.productId())) {
                throw new IllegalArgumentException("Duplicate product ID in purchase order: " + item.productId());
            }
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity ordered must be greater than zero");
            }
            if (item.unitCostPaise() != null && item.unitCostPaise() < 0) {
                throw new IllegalArgumentException("Unit cost cannot be negative");
            }
            Product product = productService.getProductById(item.productId());
            long unitCost = (item.unitCostPaise() != null) ? item.unitCostPaise() : product.purchasePricePaise();
            calculatedTotalPaise += (item.quantity() * unitCost);
        }

        String notes = (req.notes() != null && !req.notes().isBlank()) ? req.notes().trim() : null;

        String insertPoSql = """
            INSERT INTO purchase_orders (
                supplier_id, supplier_name_snapshot, status, total_amount_paise, notes
            ) VALUES (?, ?, 'DRAFT', ?, ?)
            """;
        jdbcTemplate.update(insertPoSql, supplier.id(), supplier.name(), calculatedTotalPaise, notes);
        Long poId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        String insertItemSql = """
            INSERT INTO purchase_order_items (
                purchase_order_id, product_id, product_name_snapshot, sku_snapshot,
                quantity_ordered, quantity_received, unit_cost_paise, line_total_paise
            ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            """;

        for (CreatePurchaseOrderItemRequest item : req.items()) {
            Product product = productService.getProductById(item.productId());
            long unitCost = (item.unitCostPaise() != null) ? item.unitCostPaise() : product.purchasePricePaise();
            long lineTotal = item.quantity() * unitCost;

            jdbcTemplate.update(
                insertItemSql,
                poId, product.id(), product.name(), product.sku(),
                item.quantity(), unitCost, lineTotal
            );
        }

        return getPurchaseOrderById(poId);
    }

    public List<PurchaseOrderSummary> getPurchaseOrders(Long supplierId, String status) {
        return getPurchaseOrders(supplierId, status, null, null, null, null);
    }

    public List<PurchaseOrderSummary> getPurchaseOrders(Long supplierId, String status, String fromStr, String toStr, Integer limit, Integer offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT po.id, po.supplier_id, po.supplier_name_snapshot, po.status,
                   po.total_amount_paise, po.notes, po.created_at, po.updated_at,
                   po.placed_at, po.received_at, po.cancelled_at,
                   COUNT(poi.id) AS item_count,
                   COALESCE(SUM(poi.quantity_ordered), 0) AS total_quantity_ordered,
                   COALESCE(SUM(poi.quantity_received), 0) AS total_quantity_received
            FROM purchase_orders po
            LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();
        if (supplierId != null) {
            sql.append(" AND po.supplier_id = ?");
            params.add(supplierId);
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            if ("ACTIVE".equalsIgnoreCase(status.trim())) {
                sql.append(" AND UPPER(po.status) IN ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED')");
            } else {
                sql.append(" AND UPPER(po.status) = ?");
                params.add(status.trim().toUpperCase());
            }
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

            sql.append(" AND datetime(replace(po.created_at, 'T', ' ')) >= ? AND datetime(replace(po.created_at, 'T', ' ')) < ?");
            params.add(startUtc);
            params.add(endUtc);
        }

        sql.append(" GROUP BY po.id ORDER BY po.id DESC");

        if (limit != null && limit > 0) {
            sql.append(" LIMIT ?");
            params.add(limit);
            if (offset != null && offset > 0) {
                sql.append(" OFFSET ?");
                params.add(offset);
            }
        }

        return jdbcTemplate.query(sql.toString(), RowMappers.PO_SUMMARY, params.toArray());
    }

    public PurchaseOrderDetails getPurchaseOrderById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Purchase order ID is required");
        }
        String sql = """
            SELECT id, supplier_id, supplier_name_snapshot, status, total_amount_paise,
                   notes, created_at, updated_at, placed_at, received_at, cancelled_at,
                   cancellation_reason
            FROM purchase_orders
            WHERE id = ?
            """;

        List<PurchaseOrderDetails> list = jdbcTemplate.query(sql, (rs, rowNum) -> new PurchaseOrderDetails(
            rs.getLong("id"),
            rs.getLong("id"),
            rs.getLong("supplier_id"),
            rs.getString("supplier_name_snapshot"),
            rs.getString("status"),
            rs.getLong("total_amount_paise"),
            rs.getString("notes"),
            rs.getString("created_at"),
            rs.getString("updated_at"),
            rs.getString("placed_at"),
            rs.getString("received_at"),
            rs.getString("cancelled_at"),
            rs.getString("cancellation_reason"),
            new ArrayList<>()
        ), id);

        if (list.isEmpty()) {
            throw new PurchaseOrderNotFoundException("Purchase order not found with id: " + id);
        }

        PurchaseOrderDetails base = list.get(0);

        String itemsSql = """
            SELECT id, purchase_order_id, product_id, product_name_snapshot, sku_snapshot,
                   quantity_ordered, quantity_received, unit_cost_paise, line_total_paise
            FROM purchase_order_items
            WHERE purchase_order_id = ?
            ORDER BY id ASC
            """;
        List<PurchaseOrderItemDetails> items = jdbcTemplate.query(itemsSql, RowMappers.PO_ITEM, id);

        return new PurchaseOrderDetails(
            base.id(),
            base.orderId(),
            base.supplierId(),
            base.supplierName(),
            base.status(),
            base.totalAmountPaise(),
            base.notes(),
            base.createdAt(),
            base.updatedAt(),
            base.placedAt(),
            base.receivedAt(),
            base.cancelledAt(),
            base.cancellationReason(),
            items
        );
    }

    @Transactional
    public PurchaseOrderDetails updatePurchaseOrder(Long id, UpdatePurchaseOrderRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        PurchaseOrderDetails existing = getPurchaseOrderById(id);

        if (!"DRAFT".equalsIgnoreCase(existing.status())) {
            throw new PurchaseOrderConflictException("Cannot edit purchase order #" + id + " with status: " + existing.status());
        }

        if (req.supplierId() == null) {
            throw new IllegalArgumentException("Supplier ID is required");
        }
        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Purchase order must contain at least one item");
        }

        Supplier supplier = supplierService.getSupplierById(req.supplierId());

        Set<Long> seenProductIds = new HashSet<>();
        long calculatedTotalPaise = 0L;

        for (CreatePurchaseOrderItemRequest item : req.items()) {
            if (item.productId() == null) {
                throw new IllegalArgumentException("Product ID is required for each item");
            }
            if (!seenProductIds.add(item.productId())) {
                throw new IllegalArgumentException("Duplicate product ID in purchase order: " + item.productId());
            }
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity ordered must be greater than zero");
            }
            if (item.unitCostPaise() != null && item.unitCostPaise() < 0) {
                throw new IllegalArgumentException("Unit cost cannot be negative");
            }
            Product product = productService.getProductById(item.productId());
            long unitCost = (item.unitCostPaise() != null) ? item.unitCostPaise() : product.purchasePricePaise();
            calculatedTotalPaise += (item.quantity() * unitCost);
        }

        String notes = (req.notes() != null && !req.notes().isBlank()) ? req.notes().trim() : null;

        jdbcTemplate.update("DELETE FROM purchase_order_items WHERE purchase_order_id = ?", id);

        String insertItemSql = """
            INSERT INTO purchase_order_items (
                purchase_order_id, product_id, product_name_snapshot, sku_snapshot,
                quantity_ordered, quantity_received, unit_cost_paise, line_total_paise
            ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            """;

        for (CreatePurchaseOrderItemRequest item : req.items()) {
            Product product = productService.getProductById(item.productId());
            long unitCost = (item.unitCostPaise() != null) ? item.unitCostPaise() : product.purchasePricePaise();
            long lineTotal = item.quantity() * unitCost;

            jdbcTemplate.update(
                insertItemSql,
                id, product.id(), product.name(), product.sku(),
                item.quantity(), unitCost, lineTotal
            );
        }

        String updatePoSql = """
            UPDATE purchase_orders SET
                supplier_id = ?,
                supplier_name_snapshot = ?,
                total_amount_paise = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """;
        jdbcTemplate.update(updatePoSql, supplier.id(), supplier.name(), calculatedTotalPaise, notes, id);

        return getPurchaseOrderById(id);
    }

    @Transactional
    public PurchaseOrderDetails placePurchaseOrder(Long id) {
        PurchaseOrderDetails po = getPurchaseOrderById(id);

        if (!"DRAFT".equalsIgnoreCase(po.status())) {
            throw new PurchaseOrderConflictException("Purchase order #" + id + " cannot be placed because it is in status: " + po.status());
        }
        if (po.items() == null || po.items().isEmpty()) {
            throw new IllegalArgumentException("Cannot place an empty purchase order");
        }

        jdbcTemplate.update(
            "UPDATE purchase_orders SET status = 'ORDERED', placed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            id
        );

        return getPurchaseOrderById(id);
    }

    @Transactional
    public PurchaseOrderDetails receivePurchaseOrder(Long id, ReceivePurchaseOrderRequest req) {
        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Receipt items are required");
        }

        PurchaseOrderDetails po = getPurchaseOrderById(id);

        if (!"ORDERED".equalsIgnoreCase(po.status()) && !"PARTIALLY_RECEIVED".equalsIgnoreCase(po.status())) {
            throw new PurchaseOrderConflictException("Cannot receive stock for purchase order #" + id + " with status: " + po.status());
        }

        Map<Long, PurchaseOrderItemDetails> itemMap = new java.util.HashMap<>();
        for (PurchaseOrderItemDetails item : po.items()) {
            itemMap.put(item.id(), item);
        }

        // Validate all receipt items first
        for (ReceivePurchaseOrderItemRequest rItem : req.items()) {
            if (rItem.purchaseOrderItemId() == null) {
                throw new IllegalArgumentException("Purchase order item ID is required");
            }
            if (!itemMap.containsKey(rItem.purchaseOrderItemId())) {
                throw new IllegalArgumentException("Item ID " + rItem.purchaseOrderItemId() + " does not belong to purchase order #" + id);
            }
            if (rItem.quantity() == null || rItem.quantity() <= 0) {
                throw new IllegalArgumentException("Received quantity must be greater than zero");
            }
            PurchaseOrderItemDetails itemDetails = itemMap.get(rItem.purchaseOrderItemId());
            int remaining = itemDetails.remainingQuantity();
            if (rItem.quantity() > remaining) {
                throw new IllegalArgumentException(
                    "Received quantity (" + rItem.quantity() + ") exceeds outstanding quantity (" + remaining + ") for product '" + itemDetails.productNameSnapshot() + "'"
                );
            }
        }

        // Apply updates atomically
        for (ReceivePurchaseOrderItemRequest rItem : req.items()) {
            PurchaseOrderItemDetails itemDetails = itemMap.get(rItem.purchaseOrderItemId());

            Integer currentStock = jdbcTemplate.queryForObject(
                "SELECT quantity FROM products WHERE id = ?",
                Integer.class,
                itemDetails.productId()
            );
            if (currentStock == null) {
                currentStock = 0;
            }

            int newStock = currentStock + rItem.quantity();

            // Increase product stock
            jdbcTemplate.update(
                "UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                newStock, itemDetails.productId()
            );

            // Increase received quantity in PO item
            jdbcTemplate.update(
                "UPDATE purchase_order_items SET quantity_received = quantity_received + ? WHERE id = ?",
                rItem.quantity(), rItem.purchaseOrderItemId()
            );

            // Record stock IN movement
            jdbcTemplate.update(
                """
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity, previous_quantity, new_quantity, reason
                ) VALUES (?, 'IN', ?, ?, ?, ?)
                """,
                itemDetails.productId(), rItem.quantity(), currentStock, newStock,
                "PO #" + id + " Received (" + itemDetails.productNameSnapshot() + ")"
            );
        }

        // Check overall completion
        Integer totalOrdered = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(quantity_ordered), 0) FROM purchase_order_items WHERE purchase_order_id = ?",
            Integer.class,
            id
        );
        Integer totalReceived = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(quantity_received), 0) FROM purchase_order_items WHERE purchase_order_id = ?",
            Integer.class,
            id
        );

        if (totalReceived != null && totalOrdered != null && totalReceived >= totalOrdered) {
            jdbcTemplate.update(
                "UPDATE purchase_orders SET status = 'RECEIVED', received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                id
            );
        } else {
            jdbcTemplate.update(
                "UPDATE purchase_orders SET status = 'PARTIALLY_RECEIVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                id
            );
        }

        return getPurchaseOrderById(id);
    }

    @Transactional
    public PurchaseOrderDetails cancelPurchaseOrder(Long id, CancelPurchaseOrderRequest req) {
        if (req == null || req.reason() == null || req.reason().isBlank()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        PurchaseOrderDetails po = getPurchaseOrderById(id);

        if ("RECEIVED".equalsIgnoreCase(po.status())) {
            throw new PurchaseOrderConflictException("Cannot cancel an already received purchase order");
        }
        if ("CANCELLED".equalsIgnoreCase(po.status())) {
            throw new PurchaseOrderConflictException("Purchase order #" + id + " is already cancelled");
        }

        jdbcTemplate.update(
            "UPDATE purchase_orders SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            req.reason().trim(), id
        );

        return getPurchaseOrderById(id);
    }
}
