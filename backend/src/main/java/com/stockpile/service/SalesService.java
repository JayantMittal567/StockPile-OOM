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
public class SalesService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;
    private final InventoryService inventoryService;

    public SalesService(JdbcTemplate jdbcTemplate, ProductService productService, InventoryService inventoryService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
        this.inventoryService = inventoryService;
    }

    // --- Sales Management ---
    @Transactional
    public SaleDetails createSale(CreateSaleRequest req) {
        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Sale must include at least one item");
        }

        if (req.paymentMethod() == null || req.paymentMethod().isBlank()) {
            throw new IllegalArgumentException("Payment method is required");
        }
        String paymentMethod = req.paymentMethod().trim().toUpperCase();
        if (!paymentMethod.equals("CASH") && !paymentMethod.equals("UPI") &&
            !paymentMethod.equals("CARD") && !paymentMethod.equals("OTHER")) {
            throw new IllegalArgumentException(
                "Invalid payment method: " + req.paymentMethod() + ". Supported values: CASH, UPI, CARD, OTHER"
            );
        }

        // Validate discount fields (mutually exclusive)
        if (req.discountPercent() != null && req.discountPaise() != null) {
            throw new IllegalArgumentException("Cannot specify both discountPercent and discountPaise");
        }

        Integer discountPercentBasisPoints = null;
        if (req.discountPercent() != null) {
            BigDecimal pct = req.discountPercent();
            if (pct.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Discount percentage cannot be negative: " + pct);
            }
            if (pct.compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Discount percentage cannot exceed 100%: " + pct);
            }
            if (pct.stripTrailingZeros().scale() > 2) {
                throw new IllegalArgumentException("Discount percentage cannot have more than 2 decimal places: " + pct);
            }
            discountPercentBasisPoints = pct.multiply(new BigDecimal("100")).setScale(0, RoundingMode.HALF_UP).intValueExact();
        } else if (req.discountPaise() != null) {
            if (req.discountPaise() < 0) {
                throw new IllegalArgumentException("Discount cannot be negative");
            }
        }

        Set<Long> seenProductIds = new HashSet<>();
        for (SaleItemRequest item : req.items()) {
            if (item.productId() == null || item.productId() <= 0) {
                throw new IllegalArgumentException("Invalid product ID");
            }
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Item quantity must be a positive integer");
            }
            if (item.unitSellingPricePaise() != null) {
                if (item.unitSellingPricePaise() < 0) {
                    throw new IllegalArgumentException("Selling price cannot be negative: " + item.unitSellingPricePaise());
                }
                if (item.unitSellingPricePaise() > 100_000_000_00L) {
                    throw new IllegalArgumentException("Selling price exceeds maximum allowed value: " + item.unitSellingPricePaise());
                }
            }
            if (!seenProductIds.add(item.productId())) {
                throw new IllegalArgumentException("Duplicate product ID " + item.productId() + " in cart items");
            }
        }

        record PreparedItem(
            Product product,
            int quantity,
            long unitSellingPricePaise,
            long unitPurchasePricePaise,
            long lineTotalPaise,
            long lineCostPaise,
            boolean belowCost
        ) {}

        List<PreparedItem> preparedItems = new ArrayList<>();
        long subtotalPaise = 0L;
        long totalCostPaise = 0L;

        for (SaleItemRequest itemReq : req.items()) {
            Product product = productService.getProductById(itemReq.productId());
            int reserved = inventoryService.getActiveReservedQuantity(product.id());
            int available = product.quantity() - reserved;
            if (available < itemReq.quantity()) {
                throw new IllegalArgumentException(
                    "Insufficient stock for product '" + product.name() + "' (SKU: " + product.sku() +
                    "): available " + available + " (physical " + product.quantity() + ", reserved " + reserved +
                    "), requested " + itemReq.quantity()
                );
            }

            long unitSelling = itemReq.unitSellingPricePaise() != null
                ? itemReq.unitSellingPricePaise()
                : product.sellingPricePaise();
            long unitPurchase = product.purchasePricePaise();
            long lineTotal = (long) itemReq.quantity() * unitSelling;
            long lineCost = (long) itemReq.quantity() * unitPurchase;
            boolean belowCost = unitSelling < unitPurchase;

            subtotalPaise += lineTotal;
            totalCostPaise += lineCost;

            preparedItems.add(new PreparedItem(product, itemReq.quantity(), unitSelling, unitPurchase, lineTotal, lineCost, belowCost));
        }

        long discountPaise;
        if (req.discountPercent() != null) {
            BigDecimal subtotalBd = BigDecimal.valueOf(subtotalPaise);
            discountPaise = subtotalBd.multiply(req.discountPercent())
                .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP)
                .longValueExact();
        } else if (req.discountPaise() != null) {
            discountPaise = req.discountPaise();
            if (discountPaise > subtotalPaise) {
                throw new IllegalArgumentException("Discount cannot exceed subtotal (" + subtotalPaise + " paise)");
            }
        } else {
            discountPaise = 0L;
        }

        long totalPaise = subtotalPaise - discountPaise;
        long grossProfitPaise = totalPaise - totalCostPaise;

        String insertSaleSql = """
            INSERT INTO sales (
                subtotal_paise, discount_paise, discount_percent_basis_points, total_paise, total_cost_paise,
                gross_profit_paise, payment_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
            """;

        jdbcTemplate.update(
            insertSaleSql,
            subtotalPaise,
            discountPaise,
            discountPercentBasisPoints,
            totalPaise,
            totalCostPaise,
            grossProfitPaise,
            paymentMethod
        );

        Long saleId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        String insertItemSql = """
            INSERT INTO sale_items (
                sale_id, product_id, product_name_snapshot, sku_snapshot,
                quantity, unit_selling_price_paise, unit_purchase_price_paise,
                line_total_paise, line_cost_paise
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        String deductStockSql = """
            UPDATE products
            SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND quantity >= ?
            """;

        String insertMovementSql = """
            INSERT INTO stock_movements (
                product_id, movement_type, quantity, previous_quantity, new_quantity, reason
            ) VALUES (?, 'OUT', ?, ?, ?, ?)
            """;

        for (PreparedItem item : preparedItems) {
            jdbcTemplate.update(
                insertItemSql,
                saleId,
                item.product().id(),
                item.product().name(),
                item.product().sku(),
                item.quantity(),
                item.unitSellingPricePaise(),
                item.unitPurchasePricePaise(),
                item.lineTotalPaise(),
                item.lineCostPaise()
            );

            int rowsUpdated = jdbcTemplate.update(deductStockSql, item.quantity(), item.product().id(), item.quantity());
            if (rowsUpdated != 1) {
                throw new IllegalArgumentException(
                    "Concurrent stock update conflict for product ID " + item.product().id()
                );
            }

            int prevQty = item.product().quantity();
            int newQty = prevQty - item.quantity();

            jdbcTemplate.update(
                insertMovementSql,
                item.product().id(),
                item.quantity(),
                prevQty,
                newQty,
                "Sale #" + saleId
            );
        }

        return getSaleById(saleId);
    }

    public List<SaleSummary> getSales(String status) {
        StringBuilder sql = new StringBuilder("""
            SELECT s.id, s.subtotal_paise, s.discount_paise, s.discount_percent_basis_points, s.total_paise, s.total_cost_paise,
                   s.gross_profit_paise, s.payment_method, s.status, s.created_at, s.cancelled_at,
                   COUNT(si.id) AS item_count,
                   COALESCE(SUM(si.quantity), 0) AS total_quantity
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            """);

        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            sql.append(" WHERE UPPER(s.status) = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append("""
            GROUP BY s.id
            ORDER BY s.id DESC
            """);

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            Integer basisPoints = QuerySupport.hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
                ? rs.getInt("discount_percent_basis_points")
                : null;
            Double discountPercent = basisPoints != null ? basisPoints / 100.0 : null;
            return new SaleSummary(
                rs.getLong("id"),
                rs.getLong("id"),
                rs.getLong("subtotal_paise"),
                rs.getLong("discount_paise"),
                basisPoints,
                discountPercent,
                rs.getLong("total_paise"),
                rs.getLong("total_cost_paise"),
                rs.getLong("gross_profit_paise"),
                rs.getString("payment_method"),
                rs.getString("status"),
                rs.getString("created_at"),
                rs.getString("cancelled_at"),
                rs.getInt("item_count"),
                rs.getInt("total_quantity")
            );
        }, params.toArray());
    }

    public List<SaleSummary> getSales(String status, String fromStr, String toStr, Integer limit, Integer offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT s.id, s.subtotal_paise, s.discount_paise, s.discount_percent_basis_points, s.total_paise, s.total_cost_paise,
                   s.gross_profit_paise, s.payment_method, s.status, s.created_at, s.cancelled_at,
                   COUNT(si.id) AS item_count,
                   COALESCE(SUM(si.quantity), 0) AS total_quantity
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            sql.append(" AND UPPER(s.status) = ?");
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

            sql.append(" AND datetime(replace(s.created_at, 'T', ' ')) >= ? AND datetime(replace(s.created_at, 'T', ' ')) < ?");
            params.add(startUtc);
            params.add(endUtc);
        }

        sql.append(" GROUP BY s.id ORDER BY s.id DESC");

        if (limit != null && limit > 0) {
            sql.append(" LIMIT ?");
            params.add(limit);
            if (offset != null && offset > 0) {
                sql.append(" OFFSET ?");
                params.add(offset);
            }
        }

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            Integer basisPoints = QuerySupport.hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
                ? rs.getInt("discount_percent_basis_points")
                : null;
            Double discountPercent = basisPoints != null ? basisPoints / 100.0 : null;
            return new SaleSummary(
                rs.getLong("id"),
                rs.getLong("id"),
                rs.getLong("subtotal_paise"),
                rs.getLong("discount_paise"),
                basisPoints,
                discountPercent,
                rs.getLong("total_paise"),
                rs.getLong("total_cost_paise"),
                rs.getLong("gross_profit_paise"),
                rs.getString("payment_method"),
                rs.getString("status"),
                rs.getString("created_at"),
                rs.getString("cancelled_at"),
                rs.getInt("item_count"),
                rs.getInt("total_quantity")
            );
        }, params.toArray());
    }

    public SalesMetricsSummary getSalesMetricsSummary() {
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

        String sql = """
            SELECT 
                COALESCE(SUM(CASE WHEN datetime(replace(created_at, 'T', ' ')) >= ? AND datetime(replace(created_at, 'T', ' ')) < ? THEN total_paise ELSE 0 END), 0) AS sales_today_paise,
                COALESCE(SUM(CASE WHEN datetime(replace(created_at, 'T', ' ')) >= ? AND datetime(replace(created_at, 'T', ' ')) < ? THEN 1 ELSE 0 END), 0) AS sales_today_count,
                COALESCE(SUM(CASE WHEN datetime(replace(created_at, 'T', ' ')) >= ? AND datetime(replace(created_at, 'T', ' ')) < ? THEN total_paise ELSE 0 END), 0) AS sales_month_paise,
                COALESCE(SUM(CASE WHEN datetime(replace(created_at, 'T', ' ')) >= ? AND datetime(replace(created_at, 'T', ' ')) < ? THEN 1 ELSE 0 END), 0) AS sales_month_count,
                COALESCE(SUM(total_paise), 0) AS total_sales_paise,
                COALESCE(SUM(total_cost_paise), 0) AS total_cost_paise,
                COALESCE(SUM(gross_profit_paise), 0) AS total_profit_paise,
                COUNT(*) AS total_sales_count
            FROM sales
            WHERE status = 'COMPLETED'
            """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new SalesMetricsSummary(
            rs.getLong("sales_today_paise"),
            rs.getInt("sales_today_count"),
            rs.getLong("sales_month_paise"),
            rs.getInt("sales_month_count"),
            rs.getLong("total_sales_paise"),
            rs.getLong("total_cost_paise"),
            rs.getLong("total_profit_paise"),
            rs.getInt("total_sales_count")
        ), todayStartUtc, todayEndUtc, todayStartUtc, todayEndUtc, monthStartUtc, monthEndUtc, monthStartUtc, monthEndUtc);
    }

    public List<DailySalesTrend> getDailySalesTrend() {
        String sql = """
            SELECT 
                date(created_at) AS sale_date,
                COALESCE(SUM(total_paise), 0) AS total_paise,
                COUNT(*) AS order_count
            FROM sales
            WHERE status = 'COMPLETED' AND created_at >= datetime('now', '-14 days')
            GROUP BY date(created_at)
            ORDER BY sale_date ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new DailySalesTrend(
            rs.getString("sale_date"),
            rs.getLong("total_paise"),
            rs.getInt("order_count")
        ));
    }

    public SaleDetails getSaleById(Long id) {
        String saleSql = """
            SELECT id, subtotal_paise, discount_paise, discount_percent_basis_points, total_paise, total_cost_paise,
                   gross_profit_paise, payment_method, status, created_at, cancelled_at
            FROM sales
            WHERE id = ?
            """;

        List<SaleDetails> sales = jdbcTemplate.query(saleSql, (rs, rowNum) -> {
            Integer basisPoints = QuerySupport.hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
                ? rs.getInt("discount_percent_basis_points")
                : null;
            Double discountPercent = basisPoints != null ? basisPoints / 100.0 : null;
            return new SaleDetails(
                rs.getLong("id"),
                rs.getLong("id"),
                rs.getLong("subtotal_paise"),
                rs.getLong("discount_paise"),
                basisPoints,
                discountPercent,
                rs.getLong("total_paise"),
                rs.getLong("total_cost_paise"),
                rs.getLong("gross_profit_paise"),
                rs.getString("payment_method"),
                rs.getString("status"),
                rs.getString("created_at"),
                rs.getString("cancelled_at"),
                new ArrayList<>(),
                false
            );
        }, id);

        if (sales.isEmpty()) {
            throw new SaleNotFoundException("Sale not found with id: " + id);
        }

        SaleDetails baseSale = sales.get(0);

        String itemsSql = """
            SELECT id, sale_id, product_id, product_name_snapshot, sku_snapshot,
                   quantity, unit_selling_price_paise, unit_purchase_price_paise,
                   line_total_paise, line_cost_paise, surplus_listing_id
            FROM sale_items
            WHERE sale_id = ?
            ORDER BY id ASC
            """;

        List<SaleItemDetails> items = jdbcTemplate.query(itemsSql, (rs, rowNum) -> {
            long unitSelling = rs.getLong("unit_selling_price_paise");
            long unitPurchase = rs.getLong("unit_purchase_price_paise");
            return new SaleItemDetails(
                rs.getLong("id"),
                rs.getLong("sale_id"),
                rs.getLong("product_id"),
                rs.getString("product_name_snapshot"),
                rs.getString("sku_snapshot"),
                rs.getInt("quantity"),
                unitSelling,
                unitPurchase,
                rs.getLong("line_total_paise"),
                rs.getLong("line_cost_paise"),
                QuerySupport.hasColumn(rs, "surplus_listing_id") && rs.getObject("surplus_listing_id") != null
                    ? rs.getLong("surplus_listing_id")
                    : null,
                unitSelling < unitPurchase
            );
        }, id);

        boolean hasBelowCost = items.stream().anyMatch(i -> Boolean.TRUE.equals(i.belowCost()));

        return new SaleDetails(
            baseSale.id(),
            baseSale.saleId(),
            baseSale.subtotalPaise(),
            baseSale.discountPaise(),
            baseSale.discountPercentBasisPoints(),
            baseSale.discountPercent(),
            baseSale.totalPaise(),
            baseSale.totalCostPaise(),
            baseSale.grossProfitPaise(),
            baseSale.paymentMethod(),
            baseSale.status(),
            baseSale.createdAt(),
            baseSale.cancelledAt(),
            items,
            hasBelowCost
        );
    }

    @Transactional
    public SaleDetails cancelSale(Long id, CancelSaleRequest req) {
        if (req == null || req.reason() == null || req.reason().isBlank()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        SaleDetails sale = getSaleById(id);
        if ("CANCELLED".equalsIgnoreCase(sale.status())) {
            throw new SaleConflictException("Sale #" + id + " is already cancelled");
        }
        if (!"COMPLETED".equalsIgnoreCase(sale.status())) {
            throw new SaleConflictException("Cannot cancel sale with status: " + sale.status());
        }

        String restoreStockSql = """
            UPDATE products
            SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """;

        String insertMovementSql = """
            INSERT INTO stock_movements (
                product_id, movement_type, quantity, previous_quantity, new_quantity, reason
            ) VALUES (?, 'IN', ?, ?, ?, ?)
            """;

        for (SaleItemDetails item : sale.items()) {
            Integer currentQty = jdbcTemplate.queryForObject(
                "SELECT quantity FROM products WHERE id = ?",
                Integer.class,
                item.productId()
            );
            if (currentQty == null) {
                currentQty = 0;
            }

            jdbcTemplate.update(restoreStockSql, item.quantity(), item.productId());

            int newQty = currentQty + item.quantity();
            jdbcTemplate.update(
                insertMovementSql,
                item.productId(),
                item.quantity(),
                currentQty,
                newQty,
                "Sale #" + id + " Cancelled: " + req.reason().trim()
            );

            if (item.surplusListingId() != null) {
                Long listingId = item.surplusListingId();
                List<Map<String, Object>> listingRows = jdbcTemplate.queryForList(
                    "SELECT quantity_listed, quantity_sold, status FROM surplus_listings WHERE id = ?",
                    listingId
                );
                if (!listingRows.isEmpty()) {
                    Map<String, Object> listingRow = listingRows.get(0);
                    int currentSold = ((Number) listingRow.get("quantity_sold")).intValue();
                    String listingStatus = (String) listingRow.get("status");
                    int newSold = Math.max(0, currentSold - item.quantity());

                    if ("CANCELLED".equalsIgnoreCase(listingStatus)) {
                        jdbcTemplate.update(
                            "UPDATE surplus_listings SET quantity_sold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            newSold, listingId
                        );
                    } else {
                        String restoredStatus = (newSold == 0) ? "ACTIVE" : "PARTIALLY_SOLD";
                        jdbcTemplate.update(
                            "UPDATE surplus_listings SET quantity_sold = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                            newSold, restoredStatus, listingId
                        );
                    }
                }
            }
        }

        jdbcTemplate.update(
            "UPDATE sales SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?",
            id
        );

        return getSaleById(id);
    }
}
