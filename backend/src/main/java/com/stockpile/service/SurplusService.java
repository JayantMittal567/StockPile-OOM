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
public class SurplusService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final SalesService salesService;
    private final IntelligenceService intelligenceService;

    public SurplusService(JdbcTemplate jdbcTemplate, ProductService productService, InventoryService inventoryService, SalesService salesService, IntelligenceService intelligenceService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
        this.inventoryService = inventoryService;
        this.salesService = salesService;
        this.intelligenceService = intelligenceService;
    }

    public List<SurplusSuggestion> getSurplusSuggestions() {
        SalesIntelligenceResponse salesIntel = intelligenceService.getSalesIntelligence();
        Map<Long, ProductSalesIntelligence> intelMap = new HashMap<>();
        if (salesIntel != null && salesIntel.products() != null) {
            for (ProductSalesIntelligence p : salesIntel.products()) {
                intelMap.put(p.productId(), p);
            }
        }

        // Batch-load all active reserved surplus quantities in a single query (eliminates N+1 query loop)
        Map<Long, Integer> reservedMap = new HashMap<>();
        String reservedSql = """
            SELECT product_id, COALESCE(SUM(quantity_listed - quantity_sold), 0) AS reserved_qty
            FROM surplus_listings
            WHERE status IN ('ACTIVE', 'PARTIALLY_SOLD')
            GROUP BY product_id
            """;
        try {
            jdbcTemplate.query(reservedSql, rs -> {
                reservedMap.put(rs.getLong("product_id"), Math.max(0, rs.getInt("reserved_qty")));
            });
        } catch (Exception ignored) {}

        List<Product> products = productService.getProducts(null, null);
        List<SurplusSuggestion> suggestions = new ArrayList<>();

        for (Product p : products) {
            int reserved = reservedMap.getOrDefault(p.id(), 0);
            int available = Math.max(0, p.quantity() - reserved);
            int preferredStock = p.targetStockLevel();

            int suggestedSurplus = (preferredStock > 0) ? Math.max(0, p.quantity() - preferredStock - reserved) : 0;

            ProductSalesIntelligence intel = intelMap.get(p.id());
            int unitsSold30d = intel != null ? intel.unitsSoldLast30Days() : 0;
            String lastSoldAt = intel != null ? intel.lastSoldAt() : null;
            String salesActivity = intel != null ? intel.salesActivity() : (p.quantity() == 0 ? "OUT_OF_STOCK" : "NO_SALES_HISTORY");

            String recommendationReason;
            if (suggestedSurplus > 0) {
                if ("SLOW_MOVING".equals(salesActivity) || "POTENTIAL_DEAD_STOCK".equals(salesActivity)) {
                    String activityDesc = "SLOW_MOVING".equals(salesActivity) ? "slow-moving" : "potential dead stock";
                    recommendationReason = "Current stock exceeds preferred stock level by " + suggestedSurplus + " units; product is " + activityDesc + ".";
                } else {
                    recommendationReason = "Current stock exceeds preferred stock level by " + suggestedSurplus + " units.";
                }
            } else if (preferredStock > 0 && available <= preferredStock) {
                if ("SLOW_MOVING".equals(salesActivity) || "POTENTIAL_DEAD_STOCK".equals(salesActivity)) {
                    String activityDesc = "SLOW_MOVING".equals(salesActivity) ? "slow-moving" : "potential dead stock";
                    recommendationReason = "Stock is within preferred level, but product is " + activityDesc + "; consider clearance.";
                } else {
                    recommendationReason = "Stock is within or below preferred level (" + preferredStock + "); surplus clearance not recommended.";
                }
            } else if (preferredStock <= 0) {
                if ("SLOW_MOVING".equals(salesActivity) || "POTENTIAL_DEAD_STOCK".equals(salesActivity)) {
                    String activityDesc = "SLOW_MOVING".equals(salesActivity) ? "slow-moving" : "potential dead stock";
                    recommendationReason = "No preferred stock level configured; product is " + activityDesc + "; consider clearance.";
                } else if ("NO_SALES_HISTORY".equals(salesActivity)) {
                    recommendationReason = "No preferred stock level configured and no sales history to determine surplus.";
                } else {
                    recommendationReason = "No preferred stock level configured.";
                }
            } else {
                recommendationReason = "Surplus clearance not recommended.";
            }

            suggestions.add(new SurplusSuggestion(
                p.id(),
                p.name(),
                p.sku(),
                p.category(),
                p.quantity(),
                reserved,
                available,
                preferredStock > 0 ? preferredStock : null,
                suggestedSurplus,
                p.sellingPricePaise(),
                p.purchasePricePaise(),
                unitsSold30d,
                lastSoldAt,
                salesActivity,
                recommendationReason
            ));
        }

        return suggestions;
    }

    @Transactional
    public SurplusListingDetails createSurplusListing(CreateSurplusListingRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (req.productId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        Product product = productService.getProductById(req.productId());

        if (req.quantity() == null || req.quantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be a positive integer");
        }
        if (req.discountedPricePaise() == null || req.discountedPricePaise() <= 0) {
            throw new IllegalArgumentException("Discounted price must be positive");
        }
        if (req.discountedPricePaise() >= product.sellingPricePaise()) {
            throw new IllegalArgumentException("Discounted price must be lower than regular selling price (" + product.sellingPricePaise() + " paise)");
        }
        String reasonText = req.reason();
        if ((reasonText == null || reasonText.trim().isEmpty()) && req.notes() != null && !req.notes().trim().isEmpty()) {
            reasonText = req.notes().trim();
        }
        if (reasonText == null || reasonText.trim().isEmpty()) {
            throw new IllegalArgumentException("Reason must not be empty");
        }

        int reserved = inventoryService.getActiveReservedQuantity(product.id());
        int available = product.quantity() - reserved;
        if (req.quantity() > available) {
            throw new IllegalArgumentException(
                "Requested surplus quantity (" + req.quantity() + ") exceeds available unreserved stock (" + available + ")"
            );
        }

        String notesText = (req.notes() != null && !req.notes().trim().isEmpty()) ? req.notes().trim() : reasonText;

        String insertSql = """
            INSERT INTO surplus_listings (
                product_id, product_name_snapshot, sku_snapshot, quantity_listed,
                quantity_sold, regular_unit_price_paise, discounted_unit_price_paise,
                unit_cost_paise_snapshot, reason, notes, status
            ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'ACTIVE')
            """;
        jdbcTemplate.update(
            insertSql,
            product.id(),
            product.name(),
            product.sku(),
            req.quantity(),
            product.sellingPricePaise(),
            req.discountedPricePaise(),
            product.purchasePricePaise(),
            reasonText,
            notesText
        );

        Long listingId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);
        return getSurplusListingById(listingId);
    }

    public List<SurplusListingDetails> getSurplusListings(String status, Long productId, String category, String search) {
        return getSurplusListings(status, productId, category, search, null, null);
    }

    public List<SurplusListingDetails> getSurplusListings(String status, Long productId, String category, String search, Integer limit, Integer offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT sl.*, p.category,
                   COALESCE(sales_agg.revenue_paise, 0) AS actual_revenue_paise,
                   COALESCE(sales_agg.cost_paise, 0) AS actual_cost_paise
            FROM surplus_listings sl
            LEFT JOIN products p ON sl.product_id = p.id
            LEFT JOIN (
                SELECT si.surplus_listing_id,
                       SUM(si.line_total_paise) AS revenue_paise,
                       SUM(si.line_cost_paise) AS cost_paise
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE si.surplus_listing_id IS NOT NULL AND s.status = 'COMPLETED'
                GROUP BY si.surplus_listing_id
            ) sales_agg ON sl.id = sales_agg.surplus_listing_id
            WHERE 1=1
            """);
        List<Object> params = new ArrayList<>();

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            sql.append(" AND sl.status = ?");
            params.add(status.trim().toUpperCase());
        }
        if (productId != null) {
            sql.append(" AND sl.product_id = ?");
            params.add(productId);
        }
        if (category != null && !category.trim().isEmpty()) {
            sql.append(" AND p.category = ?");
            params.add(category.trim());
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(sl.product_name_snapshot) LIKE ? OR LOWER(sl.sku_snapshot) LIKE ?)");
            String term = "%" + search.trim().toLowerCase() + "%";
            params.add(term);
            params.add(term);
        }

        sql.append(" ORDER BY sl.created_at DESC, sl.id DESC");

        if (limit != null && limit > 0) {
            int effectiveLimit = Math.min(100, Math.max(1, limit));
            sql.append(" LIMIT ?");
            params.add(effectiveLimit);
            if (offset != null && offset > 0) {
                sql.append(" OFFSET ?");
                params.add(offset);
            }
        }

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> mapSurplusListing(rs), params.toArray());
    }

    public SurplusListingDetails getSurplusListingById(Long id) {
        if (id == null) {
            throw new SurplusListingNotFoundException("Surplus listing ID is required");
        }
        String sql = """
            SELECT sl.*, p.category,
                   COALESCE(sales_agg.revenue_paise, 0) AS actual_revenue_paise,
                   COALESCE(sales_agg.cost_paise, 0) AS actual_cost_paise
            FROM surplus_listings sl
            LEFT JOIN products p ON sl.product_id = p.id
            LEFT JOIN (
                SELECT si.surplus_listing_id,
                       SUM(si.line_total_paise) AS revenue_paise,
                       SUM(si.line_cost_paise) AS cost_paise
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE si.surplus_listing_id IS NOT NULL AND s.status = 'COMPLETED'
                GROUP BY si.surplus_listing_id
            ) sales_agg ON sl.id = sales_agg.surplus_listing_id
            WHERE sl.id = ?
            """;
        List<SurplusListingDetails> results = jdbcTemplate.query(sql, (rs, rowNum) -> mapSurplusListing(rs), id);
        if (results.isEmpty()) {
            throw new SurplusListingNotFoundException("Surplus listing #" + id + " not found");
        }
        SurplusListingDetails listing = results.get(0);

        String salesSql = """
            SELECT s.id AS sale_id, si.id AS sale_item_id, si.quantity,
                   si.unit_selling_price_paise, si.unit_purchase_price_paise,
                   si.line_total_paise, si.line_cost_paise,
                   s.payment_method, s.status, s.created_at
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE si.surplus_listing_id = ?
            ORDER BY s.id DESC
            """;
        List<SurplusSaleTransaction> transactions = jdbcTemplate.query(salesSql, (rs, rowNum) -> new SurplusSaleTransaction(
            rs.getLong("sale_id"),
            rs.getLong("sale_item_id"),
            rs.getInt("quantity"),
            rs.getLong("unit_selling_price_paise"),
            rs.getLong("unit_purchase_price_paise"),
            rs.getLong("line_total_paise"),
            rs.getLong("line_cost_paise"),
            rs.getString("payment_method"),
            rs.getString("status"),
            rs.getString("created_at")
        ), id);

        return listing.withSales(transactions);
    }

    private SurplusListingDetails mapSurplusListing(java.sql.ResultSet rs) throws java.sql.SQLException {
        Long id = rs.getLong("id");
        Long productId = rs.getLong("product_id");
        String productName = rs.getString("product_name_snapshot");
        String sku = rs.getString("sku_snapshot");
        String category = QuerySupport.hasColumn(rs, "category") ? rs.getString("category") : null;
        int qtyListed = rs.getInt("quantity_listed");
        int qtySold = rs.getInt("quantity_sold");
        long regularPrice = rs.getLong("regular_unit_price_paise");
        long discountedPrice = rs.getLong("discounted_unit_price_paise");
        long unitCost = rs.getLong("unit_cost_paise_snapshot");
        String reason = rs.getString("reason");
        String notes = rs.getString("notes");
        String status = rs.getString("status");
        String createdAt = rs.getString("created_at");
        String updatedAt = rs.getString("updated_at");
        String cancelledAt = rs.getString("cancelled_at");

        int qtyRemaining = "CANCELLED".equalsIgnoreCase(status) ? 0 : Math.max(0, qtyListed - qtySold);
        double discountPct = regularPrice > 0 
            ? Math.round(((double)(regularPrice - discountedPrice) / regularPrice) * 10000.0) / 100.0 
            : 0.0;
        long recoveredRevenue = (long) qtySold * discountedPrice;
        long grossProfit = recoveredRevenue - ((long) qtySold * unitCost);
        if (QuerySupport.hasColumn(rs, "actual_revenue_paise")) {
            long actualRev = rs.getLong("actual_revenue_paise");
            long actualCost = rs.getLong("actual_cost_paise");
            if (actualRev > 0 || actualCost > 0 || qtySold == 0) {
                recoveredRevenue = actualRev;
                grossProfit = actualRev - actualCost;
            }
        }

        return new SurplusListingDetails(
            id,
            productId,
            productName,
            sku,
            category,
            qtyListed,
            qtySold,
            qtyRemaining,
            regularPrice,
            discountedPrice,
            discountPct,
            unitCost,
            recoveredRevenue,
            grossProfit,
            status,
            reason,
            notes,
            createdAt,
            updatedAt,
            cancelledAt,
            List.of()
        );
    }

    public SurplusSummary getSurplusSummary() {
        int totalListings = 0;
        int activeListings = 0;
        int partiallySoldListings = 0;
        int fullySoldListings = 0;
        int cancelledListings = 0;
        int totalUnitsListed = 0;
        int totalUnitsSold = 0;
        int totalUnitsRemaining = 0;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
            SELECT status,
                   COUNT(*) AS cnt,
                   COALESCE(SUM(quantity_listed), 0) AS units_listed,
                   COALESCE(SUM(quantity_sold), 0) AS units_sold,
                   COALESCE(SUM(quantity_listed - quantity_sold), 0) AS units_remaining
            FROM surplus_listings
            GROUP BY status
        """);

        for (Map<String, Object> r : rows) {
            String status = (String) r.get("status");
            int count = ((Number) r.get("cnt")).intValue();
            int listed = ((Number) r.get("units_listed")).intValue();
            int sold = ((Number) r.get("units_sold")).intValue();
            int remaining = ((Number) r.get("units_remaining")).intValue();

            totalListings += count;
            totalUnitsListed += listed;
            totalUnitsSold += sold;

            if ("ACTIVE".equalsIgnoreCase(status)) {
                activeListings += count;
                totalUnitsRemaining += remaining;
            } else if ("PARTIALLY_SOLD".equalsIgnoreCase(status)) {
                partiallySoldListings += count;
                totalUnitsRemaining += remaining;
            } else if ("SOLD".equalsIgnoreCase(status)) {
                fullySoldListings += count;
            } else if ("CANCELLED".equalsIgnoreCase(status)) {
                cancelledListings += count;
            }
        }

        Map<String, Object> salesAgg = jdbcTemplate.queryForMap("""
            SELECT 
                COALESCE(SUM(si.line_total_paise), 0) AS surplus_revenue,
                COALESCE(SUM(si.line_cost_paise), 0) AS surplus_cost
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'COMPLETED' AND si.surplus_listing_id IS NOT NULL
        """);

        long surplusRevenue = ((Number) salesAgg.get("surplus_revenue")).longValue();
        long surplusCost = ((Number) salesAgg.get("surplus_cost")).longValue();
        long surplusGrossProfit = surplusRevenue - surplusCost;

        return new SurplusSummary(
            totalListings,
            activeListings,
            partiallySoldListings,
            fullySoldListings,
            cancelledListings,
            totalUnitsListed,
            totalUnitsSold,
            totalUnitsRemaining,
            surplusRevenue,
            surplusCost,
            surplusGrossProfit
        );
    }

    @Transactional
    public SaleDetails recordSurplusSale(Long id, RecordSurplusSaleRequest req) {
        if (id == null) {
            throw new SurplusListingNotFoundException("Surplus listing ID is required");
        }
        if (req == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (req.quantity() <= 0) {
            throw new IllegalArgumentException("Sale quantity must be greater than zero");
        }
        SurplusListingDetails listing = getSurplusListingById(id);

        if (!"ACTIVE".equalsIgnoreCase(listing.status()) && !"PARTIALLY_SOLD".equalsIgnoreCase(listing.status())) {
            throw new SurplusListingConflictException("Cannot sell from listing with status: " + listing.status());
        }

        int remainingOnListing = listing.quantityListed() - listing.quantitySold();
        if (req.quantity() > remainingOnListing) {
            throw new IllegalArgumentException(
                "Sale quantity (" + req.quantity() + ") exceeds remaining surplus quantity (" + remainingOnListing + ")"
            );
        }

        Product product = productService.getProductById(listing.productId());
        if (product.quantity() < req.quantity()) {
            throw new IllegalArgumentException(
                "Insufficient physical stock for product '" + product.name() + "': available " + product.quantity() + ", requested " + req.quantity()
            );
        }

        String paymentMethod = req.paymentMethod() == null ? "CASH" : req.paymentMethod().trim().toUpperCase();
        if (!Set.of("CASH", "UPI", "CARD", "OTHER").contains(paymentMethod)) {
            throw new IllegalArgumentException("Invalid payment method: " + req.paymentMethod());
        }

        long unitSelling = listing.discountedUnitPricePaise();
        long unitCost = listing.unitCostPaiseSnapshot();
        long lineTotal = (long) req.quantity() * unitSelling;
        long lineCost = (long) req.quantity() * unitCost;
        long grossProfit = lineTotal - lineCost;

        String insertSaleSql = """
            INSERT INTO sales (
                subtotal_paise, discount_paise, total_paise, total_cost_paise,
                gross_profit_paise, payment_method, status
            ) VALUES (?, 0, ?, ?, ?, ?, 'COMPLETED')
            """;
        jdbcTemplate.update(
            insertSaleSql,
            lineTotal, lineTotal, lineCost, grossProfit, paymentMethod
        );
        Long saleId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        String insertItemSql = """
            INSERT INTO sale_items (
                sale_id, product_id, product_name_snapshot, sku_snapshot,
                quantity, unit_selling_price_paise, unit_purchase_price_paise,
                line_total_paise, line_cost_paise, surplus_listing_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.update(
            insertItemSql,
            saleId, product.id(), product.name(), product.sku(),
            req.quantity(), unitSelling, unitCost, lineTotal, lineCost, listing.id()
        );

        jdbcTemplate.update(
            "UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            req.quantity(), product.id()
        );

        int newQtySold = listing.quantitySold() + req.quantity();
        String newStatus = (newQtySold >= listing.quantityListed()) ? "SOLD" : "PARTIALLY_SOLD";
        jdbcTemplate.update(
            "UPDATE surplus_listings SET quantity_sold = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            newQtySold, newStatus, listing.id()
        );

        String movementReason = "Surplus Sale #" + saleId + " (Listing #" + listing.id() + ")";
        jdbcTemplate.update(
            """
            INSERT INTO stock_movements (
                product_id, movement_type, quantity, previous_quantity, new_quantity, reason
            ) VALUES (?, 'OUT', ?, ?, ?, ?)
            """,
            product.id(), req.quantity(), product.quantity(), product.quantity() - req.quantity(), movementReason
        );

        return salesService.getSaleById(saleId);
    }

    @Transactional
    public SurplusListingDetails updateSurplusListing(Long id, UpdateSurplusListingRequest req) {
        if (id == null) {
            throw new SurplusListingNotFoundException("Surplus listing ID is required");
        }
        SurplusListingDetails listing = getSurplusListingById(id);

        if ("SOLD".equalsIgnoreCase(listing.status()) || "CANCELLED".equalsIgnoreCase(listing.status())) {
            throw new SurplusListingConflictException("Cannot update listing with status: " + listing.status());
        }

        Long newPrice = listing.discountedUnitPricePaise();
        if (req.discountedPricePaise() != null) {
            if (req.discountedPricePaise() <= 0) {
                throw new IllegalArgumentException("Discounted price must be positive");
            }
            if (req.discountedPricePaise() >= listing.regularUnitPricePaise()) {
                throw new IllegalArgumentException(
                    "Discounted price must be lower than regular selling price (" + listing.regularUnitPricePaise() + " paise)"
                );
            }
            newPrice = req.discountedPricePaise();
        }

        Integer newQuantity = listing.quantityListed();
        if (req.quantity() != null) {
            if (req.quantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be a positive integer");
            }
            if (listing.quantitySold() > 0 && !req.quantity().equals(listing.quantityListed())) {
                throw new SurplusListingConflictException("Cannot change listed quantity after sales have occurred");
            }
            if (listing.quantitySold() == 0 && !req.quantity().equals(listing.quantityListed())) {
                Product product = productService.getProductById(listing.productId());
                int otherReserved = inventoryService.getActiveReservedQuantity(product.id()) - listing.quantityListed();
                int availableForThis = product.quantity() - otherReserved;
                if (req.quantity() > availableForThis) {
                    throw new IllegalArgumentException(
                        "Requested quantity (" + req.quantity() + ") exceeds available unreserved stock (" + availableForThis + ")"
                    );
                }
                newQuantity = req.quantity();
            }
        }

        String newReason = (req.reason() != null && !req.reason().trim().isEmpty()) ? req.reason().trim() : listing.reason();
        String newNotes = req.notes() != null ? req.notes().trim() : listing.notes();

        jdbcTemplate.update("""
            UPDATE surplus_listings
            SET discounted_unit_price_paise = ?,
                quantity_listed = ?,
                reason = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, newPrice, newQuantity, newReason, newNotes, id);

        return getSurplusListingById(id);
    }

    @Transactional
    public SurplusListingDetails cancelSurplusListing(Long id, CancelSurplusListingRequest req) {
        if (id == null) {
            throw new SurplusListingNotFoundException("Surplus listing ID is required");
        }
        if (req == null || req.reason() == null || req.reason().trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }
        SurplusListingDetails listing = getSurplusListingById(id);

        if ("CANCELLED".equalsIgnoreCase(listing.status())) {
            throw new SurplusListingConflictException("Surplus listing #" + id + " is already cancelled");
        }
        if ("SOLD".equalsIgnoreCase(listing.status())) {
            throw new SurplusListingConflictException("Cannot cancel a fully sold surplus listing");
        }

        String cancelNote = (listing.notes() != null && !listing.notes().isEmpty())
            ? listing.notes() + " | Cancelled: " + req.reason().trim()
            : "Cancelled: " + req.reason().trim();

        jdbcTemplate.update("""
            UPDATE surplus_listings
            SET status = 'CANCELLED',
                notes = ?,
                cancelled_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, cancelNote, id);

        return getSurplusListingById(id);
    }
}
