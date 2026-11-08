package com.stockpile;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
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
public class StockpileService {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final RowMapper<Product> productRowMapper = (rs, rowNum) -> new Product(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("sku"),
        rs.getString("category"),
        rs.getLong("purchase_price_paise"),
        rs.getLong("selling_price_paise"),
        rs.getInt("quantity"),
        rs.getInt("min_stock_level"),
        rs.getInt("target_stock_level"),
        rs.getDouble("average_daily_sales"),
        rs.getInt("lead_time_days"),
        rs.getString("created_at"),
        rs.getString("updated_at"),
        hasColumn(rs, "supplier_id") && rs.getObject("supplier_id") != null ? rs.getLong("supplier_id") : null,
        hasColumn(rs, "supplier_name") ? rs.getString("supplier_name") : null
    );

    private final RowMapper<Supplier> supplierRowMapper = (rs, rowNum) -> new Supplier(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("contact_person"),
        rs.getString("phone"),
        rs.getString("email"),
        rs.getString("address"),
        rs.getString("notes"),
        rs.getString("created_at"),
        rs.getString("updated_at")
    );

    private static boolean hasColumn(java.sql.ResultSet rs, String columnName) {
        try {
            rs.findColumn(columnName);
            return true;
        } catch (java.sql.SQLException e) {
            return false;
        }
    }

    private final RowMapper<RecentMovement> recentMovementRowMapper = (rs, rowNum) -> new RecentMovement(
        rs.getLong("movement_id"),
        rs.getLong("product_id"),
        rs.getString("product_name"),
        rs.getString("movement_type"),
        rs.getInt("quantity"),
        rs.getInt("previous_quantity"),
        rs.getInt("new_quantity"),
        rs.getString("reason"),
        rs.getString("created_at")
    );

    public StockpileService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initDatabase() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS surplus_listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                product_name_snapshot TEXT NOT NULL,
                sku_snapshot TEXT NOT NULL,
                quantity_listed INTEGER NOT NULL CHECK (quantity_listed > 0),
                quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
                regular_unit_price_paise INTEGER NOT NULL CHECK (regular_unit_price_paise >= 0),
                discounted_unit_price_paise INTEGER NOT NULL CHECK (discounted_unit_price_paise > 0),
                unit_cost_paise_snapshot INTEGER NOT NULL CHECK (unit_cost_paise_snapshot >= 0),
                reason TEXT NOT NULL,
                notes TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTIALLY_SOLD', 'SOLD', 'CANCELLED')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cancelled_at TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id)
            );
        """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_product_id ON surplus_listings(product_id);");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_status ON surplus_listings(status);");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_created_at ON surplus_listings(created_at);");

        boolean hasSurplusListingId = false;
        try {
            List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(sale_items)");
            for (Map<String, Object> col : columns) {
                if ("surplus_listing_id".equalsIgnoreCase((String) col.get("name"))) {
                    hasSurplusListingId = true;
                    break;
                }
            }
        } catch (Exception ignored) {}

        if (!hasSurplusListingId) {
            try {
                jdbcTemplate.execute("ALTER TABLE sale_items ADD COLUMN surplus_listing_id INTEGER REFERENCES surplus_listings(id);");
            } catch (Exception ignored) {}
        }

        boolean hasDiscountPercentBasisPoints = false;
        try {
            List<Map<String, Object>> salesColumns = jdbcTemplate.queryForList("PRAGMA table_info(sales)");
            for (Map<String, Object> col : salesColumns) {
                if ("discount_percent_basis_points".equalsIgnoreCase((String) col.get("name"))) {
                    hasDiscountPercentBasisPoints = true;
                    break;
                }
            }
        } catch (Exception ignored) {}

        if (!hasDiscountPercentBasisPoints) {
            try {
                jdbcTemplate.execute("ALTER TABLE sales ADD COLUMN discount_percent_basis_points INTEGER;");
            } catch (Exception ignored) {}
        }
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_sale_items_surplus_listing_id ON sale_items(surplus_listing_id);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_stock_audits_completed_at ON stock_audits(completed_at);");

            // Performance Optimisation Composite & Expression Indexes
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_sales_created_at_expr ON sales(datetime(replace(created_at, 'T', ' ')));");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_sales_status_created ON sales(status, created_at);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_status_created ON surplus_listings(status, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_po_status_created ON purchase_orders(status, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_created ON stock_movements(product_id, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_stock_audits_status_created ON stock_audits(status, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_expenses_created_at_expr ON expenses(datetime(replace(created_at, 'T', ' ')));");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_expenses_category_created ON expenses(category, created_at DESC);");
        } catch (Exception ignored) {}
    }

    public HealthStatus checkHealth() {
        try {
            Integer ping = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            boolean dbConnected = ping != null && ping == 1;

            Integer productCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
            Integer movementCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM stock_movements", Integer.class);

            return new HealthStatus(
                "UP",
                dbConnected ? "CONNECTED" : "DISCONNECTED",
                "SQLite",
                productCount != null ? productCount : 0,
                movementCount != null ? movementCount : 0,
                Instant.now().toString()
            );
        } catch (Exception e) {
            return new HealthStatus(
                "DEGRADED",
                "ERROR: " + e.getMessage(),
                "SQLite",
                0,
                0,
                Instant.now().toString()
            );
        }
    }

    // --- Product CRUD ---

    public List<Product> getProducts(String search, String category) {
        StringBuilder sql = new StringBuilder("""
            SELECT p.id, p.name, p.sku, p.category, p.purchase_price_paise, p.selling_price_paise, p.quantity,
                   p.min_stock_level, p.target_stock_level, p.average_daily_sales, p.lead_time_days,
                   p.created_at, p.updated_at,
                   ps.supplier_id, s.name AS supplier_name
            FROM products p
            LEFT JOIN product_suppliers ps ON p.id = ps.product_id
            LEFT JOIN suppliers s ON ps.supplier_id = s.id
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ?)");
            String term = "%" + search.trim().toLowerCase() + "%";
            params.add(term);
            params.add(term);
        }

        if (category != null && !category.trim().isEmpty()) {
            sql.append(" AND LOWER(p.category) = ?");
            params.add(category.trim().toLowerCase());
        }

        sql.append(" ORDER BY p.id DESC");

        return jdbcTemplate.query(sql.toString(), productRowMapper, params.toArray());
    }

    public Product getProductById(Long id) {
        String sql = """
            SELECT p.id, p.name, p.sku, p.category, p.purchase_price_paise, p.selling_price_paise, p.quantity,
                   p.min_stock_level, p.target_stock_level, p.average_daily_sales, p.lead_time_days,
                   p.created_at, p.updated_at,
                   ps.supplier_id, s.name AS supplier_name
            FROM products p
            LEFT JOIN product_suppliers ps ON p.id = ps.product_id
            LEFT JOIN suppliers s ON ps.supplier_id = s.id
            WHERE p.id = ?
            """;

        List<Product> list = jdbcTemplate.query(sql, productRowMapper, id);
        if (list.isEmpty()) {
            throw new ProductNotFoundException("Product not found with id: " + id);
        }
        return list.get(0);
    }

    @Transactional
    public Product createProduct(CreateProductRequest req) {
        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Product name is required");
        }
        if (req.sku() == null || req.sku().isBlank()) {
            throw new IllegalArgumentException("SKU is required");
        }
        if (req.category() == null || req.category().isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (req.purchasePricePaise() == null || req.purchasePricePaise() < 0) {
            throw new IllegalArgumentException("Purchase price must not be negative");
        }
        if (req.sellingPricePaise() == null || req.sellingPricePaise() < 0) {
            throw new IllegalArgumentException("Selling price must not be negative");
        }
        if (req.quantity() == null || req.quantity() < 0) {
            throw new IllegalArgumentException("Quantity must not be negative");
        }
        if (req.minStockLevel() == null || req.minStockLevel() < 0) {
            throw new IllegalArgumentException("Minimum stock level must not be negative");
        }
        if (req.targetStockLevel() == null || req.targetStockLevel() < 0) {
            throw new IllegalArgumentException("Target stock level must not be negative");
        }
        if (req.averageDailySales() == null || req.averageDailySales() < 0.0) {
            throw new IllegalArgumentException("Average daily sales must not be negative");
        }
        if (req.leadTimeDays() == null || req.leadTimeDays() < 0) {
            throw new IllegalArgumentException("Lead time days must not be negative");
        }

        String cleanSku = req.sku().trim().toUpperCase();

        Integer existing = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM products WHERE UPPER(sku) = ?",
            Integer.class,
            cleanSku
        );
        if (existing != null && existing > 0) {
            throw new ProductConflictException("Product with SKU '" + cleanSku + "' already exists");
        }

        if (req.supplierId() != null) {
            getSupplierById(req.supplierId());
        }

        int initialQty = req.quantity();

        String insertSql = """
            INSERT INTO products (
                name, sku, category, purchase_price_paise, selling_price_paise,
                quantity, min_stock_level, target_stock_level, average_daily_sales, lead_time_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(
            insertSql,
            req.name().trim(),
            cleanSku,
            req.category().trim(),
            req.purchasePricePaise(),
            req.sellingPricePaise(),
            initialQty,
            req.minStockLevel(),
            req.targetStockLevel(),
            req.averageDailySales(),
            req.leadTimeDays()
        );

        Long productId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

        if (initialQty > 0) {
            jdbcTemplate.update(
                """
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity, previous_quantity, new_quantity, reason
                ) VALUES (?, 'IN', ?, 0, ?, 'Opening Stock')
                """,
                productId, initialQty, initialQty
            );
        }

        if (req.supplierId() != null) {
            jdbcTemplate.update(
                "INSERT INTO product_suppliers (product_id, supplier_id) VALUES (?, ?)",
                productId, req.supplierId()
            );
        }

        return getProductById(productId);
    }

    @Transactional
    public Product updateProduct(Long id, UpdateProductRequest req) {
        getProductById(id);

        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Product name is required");
        }
        if (req.sku() == null || req.sku().isBlank()) {
            throw new IllegalArgumentException("SKU is required");
        }
        if (req.category() == null || req.category().isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (req.purchasePricePaise() == null || req.purchasePricePaise() < 0) {
            throw new IllegalArgumentException("Purchase price must not be negative");
        }
        if (req.sellingPricePaise() == null || req.sellingPricePaise() < 0) {
            throw new IllegalArgumentException("Selling price must not be negative");
        }
        if (req.minStockLevel() == null || req.minStockLevel() < 0) {
            throw new IllegalArgumentException("Minimum stock level must not be negative");
        }
        if (req.targetStockLevel() == null || req.targetStockLevel() < 0) {
            throw new IllegalArgumentException("Target stock level must not be negative");
        }
        if (req.averageDailySales() == null || req.averageDailySales() < 0.0) {
            throw new IllegalArgumentException("Average daily sales must not be negative");
        }
        if (req.leadTimeDays() == null || req.leadTimeDays() < 0) {
            throw new IllegalArgumentException("Lead time days must not be negative");
        }

        String cleanSku = req.sku().trim().toUpperCase();

        Integer existing = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM products WHERE UPPER(sku) = ? AND id != ?",
            Integer.class,
            cleanSku, id
        );
        if (existing != null && existing > 0) {
            throw new ProductConflictException("Product with SKU '" + cleanSku + "' already exists");
        }

        String updateSql = """
            UPDATE products SET
                name = ?,
                sku = ?,
                category = ?,
                purchase_price_paise = ?,
                selling_price_paise = ?,
                min_stock_level = ?,
                target_stock_level = ?,
                average_daily_sales = ?,
                lead_time_days = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """;

        jdbcTemplate.update(
            updateSql,
            req.name().trim(),
            cleanSku,
            req.category().trim(),
            req.purchasePricePaise(),
            req.sellingPricePaise(),
            req.minStockLevel(),
            req.targetStockLevel(),
            req.averageDailySales(),
            req.leadTimeDays(),
            id
        );

        return getProductById(id);
    }

    @Transactional
    public void deleteProduct(Long id) {
        getProductById(id);

        Integer movementCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM stock_movements WHERE product_id = ?",
            Integer.class,
            id
        );

        if (movementCount != null && movementCount > 0) {
            throw new ProductConflictException(
                "Cannot delete product with existing stock movement history (" + movementCount + " movement(s) found)"
            );
        }

        Integer poItemCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM purchase_order_items WHERE product_id = ?",
            Integer.class,
            id
        );

        if (poItemCount != null && poItemCount > 0) {
            throw new ProductConflictException(
                "Cannot delete product referenced by " + poItemCount + " purchase order item(s)"
            );
        }

        Integer auditItemCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM stock_audit_items WHERE product_id = ?",
            Integer.class,
            id
        );

        if (auditItemCount != null && auditItemCount > 0) {
            throw new ProductConflictException(
                "Cannot delete product referenced by " + auditItemCount + " stock audit item(s)"
            );
        }

        Integer surplusListingCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM surplus_listings WHERE product_id = ?",
            Integer.class,
            id
        );

        if (surplusListingCount != null && surplusListingCount > 0) {
            throw new ProductConflictException(
                "Cannot delete product with existing surplus listing history (" + surplusListingCount + " listing(s) found)"
            );
        }

        jdbcTemplate.update("DELETE FROM product_suppliers WHERE product_id = ?", id);
        jdbcTemplate.update("DELETE FROM products WHERE id = ?", id);
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

        Product product = getProductById(req.productId());
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
            LocalDate from = parseIsoDate(fromStr, "from");
            LocalDate to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;
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

        return jdbcTemplate.query(sql.toString(), recentMovementRowMapper, params.toArray());
    }

    // --- Dashboard Aggregations ---

    public DashboardResponse getDashboard() {
        return getDashboard("TODAY", null, null);
    }

    public DashboardResponse getDashboard(String period, String fromStr, String toStr) {
        String summarySql = """
            SELECT 
                (SELECT COUNT(*) FROM products) AS total_products,
                (SELECT COALESCE(SUM(quantity), 0) FROM products) AS total_quantity,
                (SELECT COALESCE(SUM(quantity * purchase_price_paise), 0) FROM products) AS inventory_value_paise,
                (SELECT COALESCE(SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END), 0) FROM products) AS low_stock_count,
                (SELECT COALESCE(SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END), 0) FROM products) AS out_of_stock_count,
                (SELECT COUNT(*) FROM surplus_listings WHERE status IN ('ACTIVE', 'PARTIALLY_SOLD')) AS active_surplus,
                (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED')) AS pending_po,
                (SELECT COUNT(*) FROM stock_audits WHERE status = 'OPEN') AS open_audits
            """;

        DashboardSummary rawSummary = null;
        int activeSurplusListings = 0;
        int pendingPurchaseOrders = 0;
        int openStockAudits = 0;

        try {
            var row = jdbcTemplate.queryForMap(summarySql);
            rawSummary = new DashboardSummary(
                ((Number) row.get("total_products")).intValue(),
                ((Number) row.get("total_quantity")).intValue(),
                ((Number) row.get("inventory_value_paise")).longValue(),
                ((Number) row.get("low_stock_count")).intValue(),
                ((Number) row.get("out_of_stock_count")).intValue()
            );
            activeSurplusListings = ((Number) row.get("active_surplus")).intValue();
            pendingPurchaseOrders = ((Number) row.get("pending_po")).intValue();
            openStockAudits = ((Number) row.get("open_audits")).intValue();
        } catch (Exception e) {
            rawSummary = new DashboardSummary(0, 0, 0L, 0, 0);
        }

        LiveBusinessState liveState = new LiveBusinessState(
            rawSummary.totalProducts(),
            rawSummary.totalQuantity(),
            rawSummary.inventoryValuePaise(),
            rawSummary.lowStockCount(),
            rawSummary.outOfStockCount(),
            activeSurplusListings,
            pendingPurchaseOrders,
            openStockAudits
        );

        DashboardSummary summary = new DashboardSummary(
            rawSummary.totalProducts(),
            rawSummary.totalQuantity(),
            rawSummary.inventoryValuePaise(),
            rawSummary.lowStockCount(),
            rawSummary.outOfStockCount(),
            activeSurplusListings,
            pendingPurchaseOrders,
            openStockAudits
        );

        String categorySql = """
            SELECT 
                category,
                COUNT(*) AS product_count,
                COALESCE(SUM(quantity), 0) AS total_quantity
            FROM products
            GROUP BY category
            ORDER BY product_count DESC, category ASC
            """;

        List<CategoryBreakdown> categoryBreakdown = jdbcTemplate.query(
            categorySql,
            (rs, rowNum) -> new CategoryBreakdown(
                rs.getString("category"),
                rs.getInt("product_count"),
                rs.getInt("total_quantity")
            )
        );

        String movementsSql = """
            SELECT 
                sm.id AS movement_id,
                sm.product_id,
                p.name AS product_name,
                sm.movement_type,
                sm.quantity,
                sm.previous_quantity,
                sm.new_quantity,
                sm.reason,
                sm.created_at
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            ORDER BY sm.id DESC
            LIMIT 5
            """;

        List<RecentMovement> recentMovements = jdbcTemplate.query(
            movementsSql,
            recentMovementRowMapper
        );

        // Calculate Period-Based Activity using Asia/Kolkata timezone
        ZoneId zone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(zone);
        LocalDate from;
        LocalDate to;
        String resolvedPeriod = (period != null && !period.isBlank()) ? period.trim().toUpperCase() : "TODAY";

        if (fromStr != null && !fromStr.isBlank()) {
            from = parseIsoDate(fromStr, "from");
            to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;
            if (from.isAfter(to)) {
                throw new IllegalArgumentException("Start date (" + from + ") cannot be after end date (" + to + ")");
            }
            resolvedPeriod = "CUSTOM";
        } else {
            switch (resolvedPeriod) {
                case "TODAY", "DAILY" -> {
                    resolvedPeriod = "TODAY";
                    from = today;
                    to = today;
                }
                case "THIS_WEEK", "WEEKLY" -> {
                    resolvedPeriod = "THIS_WEEK";
                    from = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    to = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                }
                case "THIS_MONTH", "MONTHLY" -> {
                    resolvedPeriod = "THIS_MONTH";
                    YearMonth ym = YearMonth.now(zone);
                    from = ym.atDay(1);
                    to = ym.atEndOfMonth();
                }
                case "THIS_YEAR", "YEARLY" -> {
                    resolvedPeriod = "THIS_YEAR";
                    from = LocalDate.of(today.getYear(), 1, 1);
                    to = LocalDate.of(today.getYear(), 12, 31);
                }
                case "CUSTOM" -> {
                    from = today.minusDays(30);
                    to = today;
                }
                default -> {
                    resolvedPeriod = "TODAY";
                    from = today;
                    to = today;
                }
            }
        }

        ZonedDateTime startKolkata = from.atStartOfDay(zone);
        ZonedDateTime endKolkataExclusive = to.plusDays(1).atStartOfDay(zone);
        DateTimeFormatter SQLITE_UTC = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
        String startUtc = SQLITE_UTC.format(startKolkata.toInstant());
        String endUtc = SQLITE_UTC.format(endKolkataExclusive.toInstant());

        // Period Sales & Gross Profit
        String periodSalesSql = """
            SELECT 
                COALESCE(SUM(total_paise), 0) AS sales_paise,
                COALESCE(SUM(gross_profit_paise), 0) AS gross_profit_paise,
                COUNT(*) AS sales_count
            FROM sales
            WHERE status = 'COMPLETED'
              AND datetime(replace(created_at, 'T', ' ')) >= ?
              AND datetime(replace(created_at, 'T', ' ')) < ?
            """;
        Long salesPaise = 0L;
        Long grossProfitPaise = 0L;
        Integer completedSalesCount = 0;
        try {
            var row = jdbcTemplate.queryForMap(periodSalesSql, startUtc, endUtc);
            salesPaise = ((Number) row.get("sales_paise")).longValue();
            grossProfitPaise = ((Number) row.get("gross_profit_paise")).longValue();
            completedSalesCount = ((Number) row.get("sales_count")).intValue();
        } catch (Exception ignored) {}

        // Period Units Sold
        String periodUnitsSql = """
            SELECT COALESCE(SUM(si.quantity), 0) AS units_sold
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'COMPLETED'
              AND datetime(replace(s.created_at, 'T', ' ')) >= ?
              AND datetime(replace(s.created_at, 'T', ' ')) < ?
            """;
        Integer unitsSold = 0;
        try {
            unitsSold = jdbcTemplate.queryForObject(periodUnitsSql, Integer.class, startUtc, endUtc);
        } catch (Exception ignored) {}
        int totalUnitsSold = (unitsSold != null) ? unitsSold : 0;

        // Period Operating Expenses
        Long expenses = 0L;
        try {
            String expenseSql = """
                SELECT COALESCE(SUM(amount_paise), 0) AS total_expenses
                FROM expenses
                WHERE datetime(replace(created_at, 'T', ' ')) >= ?
                  AND datetime(replace(created_at, 'T', ' ')) < ?
                """;
            expenses = jdbcTemplate.queryForObject(expenseSql, Long.class, startUtc, endUtc);
        } catch (Exception ignored) {}
        long totalExpensesPaise = (expenses != null) ? expenses : 0L;

        // Period Inventory Loss
        String lossSql = """
            SELECT COALESCE(SUM((CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END) * p.purchase_price_paise), 0) AS loss_paise
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE ((sm.movement_type = 'ADJUSTMENT' AND sm.new_quantity < sm.previous_quantity) OR (sm.movement_type = 'OUT' AND sm.reason NOT LIKE 'Sale #%'))
              AND datetime(replace(sm.created_at, 'T', ' ')) >= ?
              AND datetime(replace(sm.created_at, 'T', ' ')) < ?
            """;
        Long lossPaise = 0L;
        try {
            lossPaise = jdbcTemplate.queryForObject(lossSql, Long.class, startUtc, endUtc);
        } catch (Exception ignored) {}
        long totalLossPaise = (lossPaise != null) ? lossPaise : 0L;

        // Period Discrepancies Discovered: from completed audits + non-audit manual adjustments
        Integer auditDiscrepancies = 0;
        try {
            String auditDiscrepancySql = """
                SELECT COALESCE(SUM(CASE WHEN sai.counted_quantity != sai.system_quantity THEN 1 ELSE 0 END), 0)
                FROM stock_audit_items sai
                JOIN stock_audits sa ON sai.audit_id = sa.id
                WHERE sa.status = 'COMPLETED'
                  AND datetime(replace(sa.completed_at, 'T', ' ')) >= ?
                  AND datetime(replace(sa.completed_at, 'T', ' ')) < ?
                """;
            auditDiscrepancies = jdbcTemplate.queryForObject(auditDiscrepancySql, Integer.class, startUtc, endUtc);
        } catch (Exception ignored) {}

        Integer manualDiscrepancies = 0;
        try {
            String manualSql = """
                SELECT COUNT(*)
                FROM stock_movements sm
                WHERE sm.movement_type = 'ADJUSTMENT'
                  AND sm.reason NOT LIKE 'Stock Audit #%'
                  AND datetime(replace(sm.created_at, 'T', ' ')) >= ?
                  AND datetime(replace(sm.created_at, 'T', ' ')) < ?
                """;
            manualDiscrepancies = jdbcTemplate.queryForObject(manualSql, Integer.class, startUtc, endUtc);
        } catch (Exception ignored) {}

        int totalDiscrepancies = (auditDiscrepancies != null ? auditDiscrepancies : 0) + (manualDiscrepancies != null ? manualDiscrepancies : 0);

        PeriodActivity periodActivity = new PeriodActivity(
            resolvedPeriod,
            from.toString(),
            to.toString(),
            salesPaise,
            grossProfitPaise,
            totalUnitsSold,
            totalExpensesPaise,
            totalLossPaise,
            totalDiscrepancies,
            completedSalesCount
        );

        return new DashboardResponse(
            summary.totalProducts(),
            summary.totalQuantity(),
            summary.inventoryValuePaise(),
            summary.lowStockCount(),
            summary.outOfStockCount(),
            summary,
            categoryBreakdown,
            recentMovements,
            liveState,
            periodActivity
        );
    }

    // --- Inventory Intelligence ---

    public List<ProductIntelligence> getInventoryIntelligence() {
        List<Product> products = getProducts(null, null);

        return products.stream().map(p -> {
            // Reorder Point = (Average Daily Sales × Lead Time Days) + Safety Stock (min_stock_level proxy)
            double rawRop = (p.averageDailySales() * p.leadTimeDays()) + p.minStockLevel();
            double reorderPoint = Math.round(rawRop * 100.0) / 100.0;
            int currentQty = p.quantity();
            int targetStock = p.targetStockLevel();

            // Reorder Quantity = max(0, Target Stock Level - Current Quantity)
            int reorderQuantity = Math.max(0, targetStock - currentQty);

            // Surplus Quantity = max(0, Current Quantity - Target Stock Level)
            int surplusQuantity = Math.max(0, currentQty - targetStock);

            // Status checks in strict priority order:
            // 1. OUT_OF_STOCK: Current quantity is zero
            // 2. LOW_STOCK: Current quantity is positive and <= reorder point
            // 3. OVERSTOCKED: Current quantity exceeds target stock level
            // 4. HEALTHY: None of the above
            String status;
            String recommendation;

            if (currentQty == 0) {
                status = "OUT_OF_STOCK";
                recommendation = "Restock this product immediately.";
            } else if (currentQty <= reorderPoint) {
                status = "LOW_STOCK";
                if (p.averageDailySales() <= 0.0) {
                    recommendation = "Reorder the calculated reorder quantity (" + reorderQuantity + " units; based on minimum stock threshold).";
                } else {
                    recommendation = "Reorder the calculated reorder quantity (" + reorderQuantity + " units).";
                }
            } else if (currentQty > targetStock) {
                status = "OVERSTOCKED";
                recommendation = "Consider selling or reducing excess inventory.";
            } else {
                status = "HEALTHY";
                recommendation = "No action required.";
            }

            return new ProductIntelligence(
                p.id(),
                p.name(),
                p.sku(),
                p.category(),
                currentQty,
                p.minStockLevel(),
                targetStock,
                p.averageDailySales(),
                p.leadTimeDays(),
                reorderPoint,
                reorderQuantity,
                surplusQuantity,
                status,
                recommendation
            );
        }).toList();
    }

    public SalesIntelligenceResponse getSalesIntelligence() {
        String sql = """
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                p.sku,
                p.category,
                p.quantity AS current_quantity,
                p.min_stock_level,
                p.target_stock_level,
                COALESCE(sales_summary.units_sold_last_30_days, 0) AS units_sold_last_30_days,
                COALESCE(sales_summary.units_sold_previous_30_days, 0) AS units_sold_previous_30_days,
                sales_summary.last_sold_at,
                CAST(julianday('now') - julianday(sales_summary.last_sold_at) AS INTEGER) AS days_since_last_sale
            FROM products p
            LEFT JOIN (
                SELECT 
                    si.product_id,
                    SUM(CASE WHEN s.created_at >= datetime('now', '-30 days') THEN si.quantity ELSE 0 END) AS units_sold_last_30_days,
                    SUM(CASE WHEN s.created_at >= datetime('now', '-60 days') AND s.created_at < datetime('now', '-30 days') THEN si.quantity ELSE 0 END) AS units_sold_previous_30_days,
                    MAX(s.created_at) AS last_sold_at
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'COMPLETED'
                GROUP BY si.product_id
            ) sales_summary ON p.id = sales_summary.product_id
            ORDER BY p.id ASC
            """;

        List<ProductSalesIntelligence> products = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Long productId = rs.getLong("product_id");
            String productName = rs.getString("product_name");
            String sku = rs.getString("sku");
            String category = rs.getString("category");
            int currentQuantity = rs.getInt("current_quantity");
            int lowStockLevel = rs.getInt("min_stock_level");
            int preferredStockLevel = rs.getInt("target_stock_level");
            int unitsSoldLast30Days = rs.getInt("units_sold_last_30_days");
            int unitsSoldPrevious30Days = rs.getInt("units_sold_previous_30_days");
            String lastSoldAt = rs.getString("last_sold_at");

            // Elapsed days calculation
            Integer daysSinceLastSale = null;
            if (lastSoldAt != null) {
                Object daysObj = rs.getObject("days_since_last_sale");
                if (daysObj != null) {
                    daysSinceLastSale = Math.max(0, rs.getInt("days_since_last_sale"));
                } else {
                    daysSinceLastSale = calculateDaysSince(lastSoldAt);
                }
            }

            // Average Daily Sales
            double averageDailySalesLast30Days = 0.0;
            if (unitsSoldLast30Days > 0) {
                averageDailySalesLast30Days = Math.round((unitsSoldLast30Days / 30.0) * 100.0) / 100.0;
            }

            // Section 4: PRODUCT CLASSIFICATION in exact priority order:
            // 1. OUT_OF_STOCK: Current quantity equals zero
            // 2. NO_SALES_HISTORY: The product has never had a completed sale
            // 3. POTENTIAL_DEAD_STOCK: Product has stock remaining and its last completed sale was more than 45 days ago
            // 4. SLOW_MOVING: Product has stock remaining and its last completed sale was more than 30 days ago
            // 5. ACTIVE: Product has stock remaining and was sold within the last 30 days
            String salesActivity;
            if (currentQuantity == 0) {
                salesActivity = "OUT_OF_STOCK";
            } else if (daysSinceLastSale == null) {
                salesActivity = "NO_SALES_HISTORY";
            } else if (daysSinceLastSale > 45) {
                salesActivity = "POTENTIAL_DEAD_STOCK";
            } else if (daysSinceLastSale > 30) {
                salesActivity = "SLOW_MOVING";
            } else {
                salesActivity = "ACTIVE";
            }

            // Section 5: SALES TREND
            String salesTrend;
            if (daysSinceLastSale == null) {
                salesTrend = "INSUFFICIENT_DATA";
            } else if (unitsSoldPrevious30Days == 0) {
                if (unitsSoldLast30Days > 0) {
                    salesTrend = "NEW_SALES";
                } else {
                    salesTrend = "NO_RECENT_SALES";
                }
            } else {
                // unitsSoldPrevious30Days > 0
                if (unitsSoldLast30Days == 0) {
                    salesTrend = "DECREASING";
                } else {
                    double diff = (double) (unitsSoldLast30Days - unitsSoldPrevious30Days) / (double) unitsSoldPrevious30Days;
                    if (diff > 0.10) {
                        salesTrend = "INCREASING";
                    } else if (diff < -0.10) {
                        salesTrend = "DECREASING";
                    } else {
                        salesTrend = "STABLE";
                    }
                }
            }

            // Section 6: RESTOCK RECOMMENDATIONS
            int recommendedRestockQuantity = 0;
            String recommendation;
            boolean needsRestock = currentQuantity <= lowStockLevel;

            if (needsRestock) {
                if (preferredStockLevel > 0) {
                    recommendedRestockQuantity = Math.max(0, preferredStockLevel - currentQuantity);
                    if (currentQuantity == 0) {
                        recommendation = "Product is out of stock! Restock " + recommendedRestockQuantity + " units to reach preferred stock level (" + preferredStockLevel + ").";
                    } else {
                        recommendation = "Low stock alert: current quantity (" + currentQuantity + ") is at or below alert level (" + lowStockLevel + "). Reorder " + recommendedRestockQuantity + " units to reach preferred stock level (" + preferredStockLevel + ").";
                    }
                } else {
                    recommendedRestockQuantity = 0;
                    if (currentQuantity == 0) {
                        recommendation = "Product is out of stock! Preferred stock level is not configured. Please configure preferred stock level.";
                    } else {
                        recommendation = "Low stock alert: current quantity (" + currentQuantity + ") is at or below alert level (" + lowStockLevel + "). Preferred stock level is not configured. Please configure preferred stock level.";
                    }
                }
            } else {
                recommendedRestockQuantity = 0;
                if (preferredStockLevel > 0 && currentQuantity > preferredStockLevel) {
                    recommendation = "Stock is healthy (" + currentQuantity + " units). Current quantity exceeds preferred stock level (" + preferredStockLevel + ").";
                } else {
                    recommendation = "Stock is healthy (" + currentQuantity + " units). No restocking needed at this time.";
                }
            }

            return new ProductSalesIntelligence(
                productId,
                productName,
                sku,
                category,
                currentQuantity,
                lowStockLevel,
                preferredStockLevel,
                unitsSoldLast30Days,
                unitsSoldPrevious30Days,
                averageDailySalesLast30Days,
                lastSoldAt,
                daysSinceLastSale,
                salesActivity,
                salesTrend,
                recommendedRestockQuantity,
                recommendation
            );
        });

        // Section 7: SUMMARY INFORMATION
        int totalProducts = products.size();
        int slowMovingCount = 0;
        int potentialDeadStockCount = 0;
        int noSalesHistoryCount = 0;
        int outOfStockCount = 0;
        int productsNeedingRestock = 0;

        for (ProductSalesIntelligence p : products) {
            switch (p.salesActivity()) {
                case "SLOW_MOVING" -> slowMovingCount++;
                case "POTENTIAL_DEAD_STOCK" -> potentialDeadStockCount++;
                case "NO_SALES_HISTORY" -> noSalesHistoryCount++;
                case "OUT_OF_STOCK" -> outOfStockCount++;
            }
            if (p.currentQuantity() <= p.lowStockLevel()) {
                productsNeedingRestock++;
            }
        }

        // Fast selling products: top products ranked by units sold during the last 30 days
        List<ProductSalesIntelligence> fastSellingProducts = products.stream()
            .filter(p -> p.unitsSoldLast30Days() > 0)
            .sorted((a, b) -> {
                int cmp = Integer.compare(b.unitsSoldLast30Days(), a.unitsSoldLast30Days());
                if (cmp != 0) return cmp;
                return a.productName().compareToIgnoreCase(b.productName());
            })
            .limit(5)
            .toList();

        SalesIntelligenceSummary summary = new SalesIntelligenceSummary(
            totalProducts,
            fastSellingProducts,
            slowMovingCount,
            potentialDeadStockCount,
            noSalesHistoryCount,
            outOfStockCount,
            productsNeedingRestock
        );

        return new SalesIntelligenceResponse(summary, products);
    }

    private Integer calculateDaysSince(String timestampStr) {
        if (timestampStr == null || timestampStr.isBlank()) {
            return null;
        }
        try {
            String clean = timestampStr.trim().replace('T', ' ');
            if (clean.contains(".")) {
                clean = clean.substring(0, clean.indexOf('.'));
            }
            if (clean.contains("+")) {
                clean = clean.substring(0, clean.indexOf('+'));
            }
            LocalDateTime saleTime = LocalDateTime.parse(
                clean,
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            );
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
            long days = Duration.between(saleTime, now).toDays();
            return (int) Math.max(0, days);
        } catch (Exception e) {
            return null;
        }
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
            Product product = getProductById(itemReq.productId());
            int reserved = getActiveReservedQuantity(product.id());
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
            Integer basisPoints = hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
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
            LocalDate from = parseIsoDate(fromStr, "from");
            LocalDate to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;
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
            Integer basisPoints = hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
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
            Integer basisPoints = hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
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
                hasColumn(rs, "surplus_listing_id") && rs.getObject("surplus_listing_id") != null
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
        return jdbcTemplate.query(sql.toString(), supplierRowMapper, params.toArray());
    }

    public Supplier getSupplierById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Supplier ID is required");
        }
        String sql = """
            SELECT id, name, contact_person, phone, email, address, notes, created_at, updated_at
            FROM suppliers WHERE id = ?
            """;
        List<Supplier> list = jdbcTemplate.query(sql, supplierRowMapper, id);
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

    @Transactional
    public Product assignSupplierToProduct(Long productId, Long supplierId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (supplierId == null) {
            throw new IllegalArgumentException("Supplier ID is required");
        }

        getProductById(productId);
        getSupplierById(supplierId);

        jdbcTemplate.update("DELETE FROM product_suppliers WHERE product_id = ?", productId);
        jdbcTemplate.update("INSERT INTO product_suppliers (product_id, supplier_id) VALUES (?, ?)", productId, supplierId);

        return getProductById(productId);
    }

    @Transactional
    public void removeSupplierFromProduct(Long productId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        getProductById(productId);
        jdbcTemplate.update("DELETE FROM product_suppliers WHERE product_id = ?", productId);
    }

    public List<SupplierProduct> getProductsBySupplier(Long supplierId) {
        getSupplierById(supplierId);

        String sql = """
            SELECT p.id, p.name, p.sku, p.category, p.quantity,
                   p.purchase_price_paise, p.selling_price_paise,
                   p.min_stock_level, p.target_stock_level,
                   ps.supplier_id, s.name AS supplier_name
            FROM products p
            JOIN product_suppliers ps ON p.id = ps.product_id
            JOIN suppliers s ON ps.supplier_id = s.id
            WHERE ps.supplier_id = ?
            ORDER BY p.id DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SupplierProduct(
            rs.getLong("id"),
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("sku"),
            rs.getString("category"),
            rs.getInt("quantity"),
            rs.getInt("quantity"),
            rs.getLong("purchase_price_paise"),
            rs.getLong("selling_price_paise"),
            rs.getInt("min_stock_level"),
            rs.getInt("target_stock_level"),
            rs.getLong("supplier_id"),
            rs.getString("supplier_name")
        ), supplierId);
    }

    // --- Purchase Order Management ---

    private final RowMapper<PurchaseOrderItemDetails> poItemRowMapper = (rs, rowNum) -> {
        int ordered = rs.getInt("quantity_ordered");
        int received = rs.getInt("quantity_received");
        return new PurchaseOrderItemDetails(
            rs.getLong("id"),
            rs.getLong("purchase_order_id"),
            rs.getLong("product_id"),
            rs.getString("product_name_snapshot"),
            rs.getString("sku_snapshot"),
            ordered,
            received,
            Math.max(0, ordered - received),
            rs.getLong("unit_cost_paise"),
            rs.getLong("line_total_paise")
        );
    };

    private final RowMapper<PurchaseOrderSummary> poSummaryRowMapper = (rs, rowNum) -> new PurchaseOrderSummary(
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
        rs.getInt("item_count"),
        rs.getInt("total_quantity_ordered"),
        rs.getInt("total_quantity_received")
    );

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

        Supplier supplier = getSupplierById(req.supplierId());

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
            Product product = getProductById(item.productId());
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
            Product product = getProductById(item.productId());
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
            LocalDate from = parseIsoDate(fromStr, "from");
            LocalDate to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;
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

        return jdbcTemplate.query(sql.toString(), poSummaryRowMapper, params.toArray());
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
        List<PurchaseOrderItemDetails> items = jdbcTemplate.query(itemsSql, poItemRowMapper, id);

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

        Supplier supplier = getSupplierById(req.supplierId());

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
            Product product = getProductById(item.productId());
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
            Product product = getProductById(item.productId());
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

    // --- Stock Auditing Management ---

    @Transactional
    public StockAuditDetails createStockAudit(CreateStockAuditRequest req) {
        List<Long> productIds = (req != null) ? req.productIds() : null;
        List<Product> targetProducts = new ArrayList<>();

        if (productIds == null) {
            targetProducts = jdbcTemplate.query("SELECT * FROM products ORDER BY id ASC", productRowMapper);
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
                Product p = getProductById(pid);
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
            LocalDate from = parseIsoDate(fromStr, "from");
            LocalDate to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;
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
            Product currentProduct = getProductById(item.productId());
            if (currentProduct.quantity() != item.systemQuantity()) {
                throw new StockAuditConflictException(
                    "Inventory for product '" + item.productNameSnapshot() + "' (SKU: " + item.skuSnapshot() + 
                    ") changed during the audit (snapshot: " + item.systemQuantity() + 
                    ", current: " + currentProduct.quantity() + 
                    "). The audit must be cancelled and restarted."
                );
            }

            int reserved = getActiveReservedQuantity(item.productId());
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

    // --- Financial Reporting Management ---

    public DateRangeFilter resolveDateRange(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        ZoneId zone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(zone);

        LocalDate from;
        LocalDate to;
        String resolvedPeriodType;

        if (fromStr != null || toStr != null) {
            from = (fromStr != null && !fromStr.isBlank()) ? parseIsoDate(fromStr, "from") : parseIsoDate(toStr, "to");
            to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;

            if (from.isAfter(to)) {
                throw new IllegalArgumentException("Start date (" + from + ") cannot be after end date (" + to + ")");
            }

            if (period != null && !period.isBlank()) {
                resolvedPeriodType = period.trim().toUpperCase();
                validatePeriodType(resolvedPeriodType);
            } else {
                if (from.equals(to)) {
                    resolvedPeriodType = "DAILY";
                } else if (from.getDayOfMonth() == 1 && to.equals(YearMonth.from(from).atEndOfMonth())
                           && from.getMonth() == to.getMonth() && from.getYear() == to.getYear()) {
                    resolvedPeriodType = "MONTHLY";
                } else if (from.getMonthValue() == 1 && from.getDayOfMonth() == 1
                           && to.getMonthValue() == 12 && to.getDayOfMonth() == 31
                           && from.getYear() == to.getYear()) {
                    resolvedPeriodType = "YEARLY";
                } else {
                    resolvedPeriodType = "CUSTOM";
                }
            }
        } else if (period != null && !period.isBlank()) {
            resolvedPeriodType = period.trim().toUpperCase();
            validatePeriodType(resolvedPeriodType);

            switch (resolvedPeriodType) {
                case "DAILY" -> {
                    LocalDate d = (dateStr != null && !dateStr.isBlank()) ? parseIsoDate(dateStr, "date") : today;
                    from = d;
                    to = d;
                }
                case "MONTHLY" -> {
                    int y = (year != null) ? year : today.getYear();
                    int m = (month != null) ? month : today.getMonthValue();
                    if (m < 1 || m > 12) {
                        throw new IllegalArgumentException("Invalid month: " + m + ". Must be between 1 and 12");
                    }
                    if (y < 1900 || y > 3000) {
                        throw new IllegalArgumentException("Invalid year: " + y);
                    }
                    YearMonth ym = YearMonth.of(y, m);
                    from = ym.atDay(1);
                    to = ym.atEndOfMonth();
                }
                case "YEARLY" -> {
                    int y = (year != null) ? year : today.getYear();
                    if (y < 1900 || y > 3000) {
                        throw new IllegalArgumentException("Invalid year: " + y);
                    }
                    from = LocalDate.of(y, 1, 1);
                    to = LocalDate.of(y, 12, 31);
                }
                case "CUSTOM" -> {
                    to = today;
                    from = today.minusDays(30);
                }
                default -> throw new IllegalArgumentException("Unsupported period type: " + resolvedPeriodType);
            }
        } else {
            resolvedPeriodType = "MONTHLY";
            YearMonth currentMonth = YearMonth.now(zone);
            from = currentMonth.atDay(1);
            to = currentMonth.atEndOfMonth();
        }

        ZonedDateTime startKolkata = from.atStartOfDay(zone);
        ZonedDateTime endKolkataExclusive = to.plusDays(1).atStartOfDay(zone);

        DateTimeFormatter SQLITE_UTC = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);
        String startUtc = SQLITE_UTC.format(startKolkata.toInstant());
        String endUtc = SQLITE_UTC.format(endKolkataExclusive.toInstant());

        return new DateRangeFilter(resolvedPeriodType, from, to, startUtc, endUtc);
    }

    private LocalDate parseIsoDate(String dateStr, String paramName) {
        if (dateStr == null || dateStr.isBlank()) {
            throw new IllegalArgumentException("Date parameter '" + paramName + "' is required");
        }
        try {
            return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format for '" + paramName + "': '" + dateStr + "'. Expected format: YYYY-MM-DD");
        }
    }

    private void validatePeriodType(String type) {
        if (!type.equals("DAILY") && !type.equals("MONTHLY") && !type.equals("YEARLY") && !type.equals("CUSTOM")) {
            throw new IllegalArgumentException("Invalid period type: '" + type + "'. Supported values: DAILY, MONTHLY, YEARLY, CUSTOM");
        }
    }

    private AggregatedFinancials computeAggregatedFinancials(String startUtc, String endUtc) {
        String salesSql = """
            SELECT 
                COUNT(s.id) AS sales_count,
                COALESCE(SUM(s.subtotal_paise), 0) AS gross_sales_paise,
                COALESCE(SUM(s.discount_paise), 0) AS discounts_paise,
                COALESCE(SUM(s.total_paise), 0) AS net_revenue_paise,
                COALESCE(SUM(s.total_cost_paise), 0) AS cogs_paise,
                COALESCE(SUM(s.gross_profit_paise), 0) AS gross_profit_paise
            FROM sales s
            WHERE s.status = 'COMPLETED'
              AND datetime(replace(s.created_at, 'T', ' ')) >= ?
              AND datetime(replace(s.created_at, 'T', ' ')) < ?
            """;

        SalesAggregate salesAgg = jdbcTemplate.queryForObject(salesSql, (rs, rowNum) -> new SalesAggregate(
            rs.getLong("gross_sales_paise"),
            rs.getLong("discounts_paise"),
            rs.getLong("net_revenue_paise"),
            rs.getLong("cogs_paise"),
            rs.getLong("gross_profit_paise"),
            rs.getInt("sales_count")
        ), startUtc, endUtc);

        String unitsSoldSql = """
            SELECT COALESCE(SUM(si.quantity), 0) AS units_sold
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'COMPLETED'
              AND datetime(replace(s.created_at, 'T', ' ')) >= ?
              AND datetime(replace(s.created_at, 'T', ' ')) < ?
            """;
        Integer unitsSold = jdbcTemplate.queryForObject(unitsSoldSql, Integer.class, startUtc, endUtc);
        int totalUnitsSold = (unitsSold != null) ? unitsSold : 0;

        String lossSql = """
            SELECT 
                COUNT(sm.id) AS loss_incidents,
                COALESCE(SUM(CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END), 0) AS units_lost,
                COALESCE(SUM((CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END) * p.purchase_price_paise), 0) AS loss_paise
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE ((sm.movement_type = 'ADJUSTMENT' AND sm.new_quantity < sm.previous_quantity) OR (sm.movement_type = 'OUT' AND sm.reason NOT LIKE 'Sale #%'))
              AND datetime(replace(sm.created_at, 'T', ' ')) >= ?
              AND datetime(replace(sm.created_at, 'T', ' ')) < ?
            """;

        LossAggregate lossAgg = jdbcTemplate.queryForObject(lossSql, (rs, rowNum) -> new LossAggregate(
            rs.getInt("loss_incidents"),
            rs.getInt("units_lost"),
            rs.getLong("loss_paise")
        ), startUtc, endUtc);

        Long expenses = 0L;
        try {
            String expenseSql = """
                SELECT COALESCE(SUM(amount_paise), 0) AS total_expenses
                FROM expenses
                WHERE datetime(replace(created_at, 'T', ' ')) >= ?
                  AND datetime(replace(created_at, 'T', ' ')) < ?
                """;
            expenses = jdbcTemplate.queryForObject(expenseSql, Long.class, startUtc, endUtc);
        } catch (Exception e) {
            expenses = 0L;
        }
        long totalExpensesPaise = (expenses != null) ? expenses : 0L;

        String poSql = """
            SELECT 
                COUNT(po.id) AS po_count,
                COALESCE(SUM(po.total_amount_paise), 0) AS total_purchases_paise
            FROM purchase_orders po
            WHERE po.status != 'CANCELLED'
              AND datetime(replace(po.created_at, 'T', ' ')) >= ?
              AND datetime(replace(po.created_at, 'T', ' ')) < ?
            """;

        PoAggregate poAgg = jdbcTemplate.queryForObject(poSql, (rs, rowNum) -> new PoAggregate(
            rs.getInt("po_count"),
            rs.getLong("total_purchases_paise")
        ), startUtc, endUtc);

        long netRevenue = salesAgg.netRevenuePaise();
        long cogs = salesAgg.cogsPaise();
        long grossProfit = salesAgg.grossProfitPaise();
        long lossPaise = lossAgg.lossPaise();
        long opResult = grossProfit - lossPaise - totalExpensesPaise;

        return new AggregatedFinancials(
            salesAgg.grossSalesPaise(),
            salesAgg.discountsPaise(),
            netRevenue,
            cogs,
            grossProfit,
            salesAgg.salesCount(),
            totalUnitsSold,
            lossPaise,
            lossAgg.unitsLost(),
            lossAgg.lossIncidents(),
            totalExpensesPaise,
            opResult,
            poAgg.totalPurchasesPaise(),
            poAgg.poCount()
        );
    }

    private List<FinancialMetricBreakdown> computeBreakdown(DateRangeFilter range) {
        boolean isMonthlyAggregation;

        if ("YEARLY".equals(range.periodType())) {
            isMonthlyAggregation = true;
        } else if ("MONTHLY".equals(range.periodType())) {
            isMonthlyAggregation = false;
        } else if ("DAILY".equals(range.periodType())) {
            isMonthlyAggregation = false;
        } else {
            long days = ChronoUnit.DAYS.between(range.from(), range.to()) + 1;
            isMonthlyAggregation = (days > 31);
        }

        String periodKeyExpr = isMonthlyAggregation
            ? "strftime('%Y-%m', replace(datetime(replace(created_at, 'T', ' '), '+5 hours', '30 minutes'), 'T', ' '))"
            : "date(replace(created_at, 'T', ' '), '+5 hours', '30 minutes')";

        String salesGroupSql = String.format("""
            SELECT 
                %s AS period_key,
                COALESCE(SUM(s.subtotal_paise), 0) AS gross_sales_paise,
                COALESCE(SUM(s.discount_paise), 0) AS discounts_paise,
                COALESCE(SUM(s.total_paise), 0) AS net_revenue_paise,
                COALESCE(SUM(s.total_cost_paise), 0) AS cogs_paise,
                COALESCE(SUM(s.gross_profit_paise), 0) AS gross_profit_paise,
                COUNT(DISTINCT s.id) AS sales_count,
                COALESCE(SUM(si.quantity), 0) AS units_sold
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE s.status = 'COMPLETED'
              AND datetime(replace(s.created_at, 'T', ' ')) >= ?
              AND datetime(replace(s.created_at, 'T', ' ')) < ?
            GROUP BY period_key
            """, periodKeyExpr.replace("created_at", "s.created_at"));

        Map<String, SalesPeriodMetric> salesMap = new HashMap<>();
        jdbcTemplate.query(salesGroupSql, (rs) -> {
            String key = rs.getString("period_key");
            salesMap.put(key, new SalesPeriodMetric(
                rs.getLong("gross_sales_paise"),
                rs.getLong("discounts_paise"),
                rs.getLong("net_revenue_paise"),
                rs.getLong("cogs_paise"),
                rs.getLong("gross_profit_paise"),
                rs.getInt("sales_count"),
                rs.getInt("units_sold")
            ));
        }, range.startUtc(), range.endUtc());

        String lossGroupSql = String.format("""
            SELECT 
                %s AS period_key,
                COALESCE(SUM((CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END) * p.purchase_price_paise), 0) AS loss_paise
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE ((sm.movement_type = 'ADJUSTMENT' AND sm.new_quantity < sm.previous_quantity) OR (sm.movement_type = 'OUT' AND sm.reason NOT LIKE 'Sale #%%'))
              AND datetime(replace(sm.created_at, 'T', ' ')) >= ?
              AND datetime(replace(sm.created_at, 'T', ' ')) < ?
            GROUP BY period_key
            """, periodKeyExpr.replace("created_at", "sm.created_at"));

        Map<String, Long> lossMap = new HashMap<>();
        jdbcTemplate.query(lossGroupSql, (rs) -> {
            String key = rs.getString("period_key");
            lossMap.put(key, rs.getLong("loss_paise"));
        }, range.startUtc(), range.endUtc());

        Map<String, Long> expenseMap = new HashMap<>();
        try {
            String expenseGroupSql = String.format("""
                SELECT 
                    %s AS period_key,
                    COALESCE(SUM(amount_paise), 0) AS expenses_paise
                FROM expenses
                WHERE datetime(replace(created_at, 'T', ' ')) >= ?
                  AND datetime(replace(created_at, 'T', ' ')) < ?
                GROUP BY period_key
                """, periodKeyExpr);

            jdbcTemplate.query(expenseGroupSql, (rs) -> {
                String key = rs.getString("period_key");
                expenseMap.put(key, rs.getLong("expenses_paise"));
            }, range.startUtc(), range.endUtc());
        } catch (Exception ignored) {}

        List<FinancialMetricBreakdown> result = new ArrayList<>();

        if (isMonthlyAggregation) {
            YearMonth curr = YearMonth.from(range.from());
            YearMonth endYm = YearMonth.from(range.to());
            while (!curr.isAfter(endYm)) {
                String key = curr.toString();
                SalesPeriodMetric sm = salesMap.getOrDefault(key, SalesPeriodMetric.ZERO);
                long loss = lossMap.getOrDefault(key, 0L);
                long exp = expenseMap.getOrDefault(key, 0L);
                long opResult = sm.grossProfitPaise() - loss - exp;

                result.add(new FinancialMetricBreakdown(
                    key,
                    sm.grossSalesPaise(),
                    sm.discountsPaise(),
                    sm.netRevenuePaise(),
                    sm.cogsPaise(),
                    sm.grossProfitPaise(),
                    loss,
                    exp,
                    opResult,
                    sm.salesCount(),
                    sm.unitsSold()
                ));
                curr = curr.plusMonths(1);
            }
        } else {
            LocalDate curr = range.from();
            while (!curr.isAfter(range.to())) {
                String key = curr.toString();
                SalesPeriodMetric sm = salesMap.getOrDefault(key, SalesPeriodMetric.ZERO);
                long loss = lossMap.getOrDefault(key, 0L);
                long exp = expenseMap.getOrDefault(key, 0L);
                long opResult = sm.grossProfitPaise() - loss - exp;

                result.add(new FinancialMetricBreakdown(
                    key,
                    sm.grossSalesPaise(),
                    sm.discountsPaise(),
                    sm.netRevenuePaise(),
                    sm.cogsPaise(),
                    sm.grossProfitPaise(),
                    loss,
                    exp,
                    opResult,
                    sm.salesCount(),
                    sm.unitsSold()
                ));
                curr = curr.plusDays(1);
            }
        }

        return result;
    }

    private List<PaymentMethodSummary> getPaymentMethodSummary(String startUtc, String endUtc) {
        String sql = """
            SELECT payment_method, COUNT(*) AS order_count, COALESCE(SUM(total_paise), 0) AS total_paise
            FROM sales
            WHERE status = 'COMPLETED'
              AND datetime(replace(created_at, 'T', ' ')) >= ?
              AND datetime(replace(created_at, 'T', ' ')) < ?
            GROUP BY payment_method
            ORDER BY total_paise DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new PaymentMethodSummary(
            rs.getString("payment_method"),
            rs.getInt("order_count"),
            rs.getLong("total_paise")
        ), startUtc, endUtc);
    }

    private List<TopSellingProduct> getTopSellingProducts(String startUtc, String endUtc) {
        String sql = """
            SELECT 
                si.product_id,
                si.product_name_snapshot,
                si.sku_snapshot,
                COALESCE(p.category, 'General') AS category,
                COALESCE(SUM(si.quantity), 0) AS units_sold,
                COALESCE(SUM(si.line_total_paise), 0) AS total_revenue_paise,
                COALESCE(SUM(si.line_cost_paise), 0) AS total_cost_paise,
                COALESCE(SUM(si.line_total_paise - si.line_cost_paise), 0) AS gross_profit_paise
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE s.status = 'COMPLETED'
              AND datetime(replace(s.created_at, 'T', ' ')) >= ?
              AND datetime(replace(s.created_at, 'T', ' ')) < ?
            GROUP BY si.product_id, si.product_name_snapshot, si.sku_snapshot, p.category
            ORDER BY total_revenue_paise DESC
            LIMIT 10
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new TopSellingProduct(
            rs.getLong("product_id"),
            rs.getString("product_name_snapshot"),
            rs.getString("sku_snapshot"),
            rs.getString("category"),
            rs.getInt("units_sold"),
            rs.getLong("total_revenue_paise"),
            rs.getLong("total_cost_paise"),
            rs.getLong("gross_profit_paise")
        ), startUtc, endUtc);
    }

    private List<InventoryLossIncident> getInventoryLossIncidents(String startUtc, String endUtc) {
        String sql = """
            SELECT 
                sm.id AS movement_id,
                sm.product_id,
                p.name AS product_name,
                p.sku,
                (CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END) AS units_lost,
                p.purchase_price_paise AS unit_cost_paise,
                ((CASE WHEN sm.movement_type = 'ADJUSTMENT' THEN (sm.previous_quantity - sm.new_quantity) ELSE sm.quantity END) * p.purchase_price_paise) AS total_loss_paise,
                sm.reason,
                sm.created_at
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE ((sm.movement_type = 'ADJUSTMENT' AND sm.new_quantity < sm.previous_quantity) OR (sm.movement_type = 'OUT' AND sm.reason NOT LIKE 'Sale #%'))
              AND datetime(replace(sm.created_at, 'T', ' ')) >= ?
              AND datetime(replace(sm.created_at, 'T', ' ')) < ?
            ORDER BY sm.id DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new InventoryLossIncident(
            rs.getLong("movement_id"),
            rs.getLong("product_id"),
            rs.getString("product_name"),
            rs.getString("sku"),
            rs.getInt("units_lost"),
            rs.getLong("unit_cost_paise"),
            rs.getLong("total_loss_paise"),
            rs.getString("reason"),
            rs.getString("created_at")
        ), startUtc, endUtc);
    }

    private PurchasesData getPurchasesData(String startUtc, String endUtc) {
        String sql = """
            SELECT po.id, po.supplier_id, po.supplier_name_snapshot, po.status,
                   po.total_amount_paise, po.notes, po.created_at, po.updated_at,
                   po.placed_at, po.received_at, po.cancelled_at,
                   COUNT(poi.id) AS item_count,
                   COALESCE(SUM(poi.quantity_ordered), 0) AS total_quantity_ordered,
                   COALESCE(SUM(poi.quantity_received), 0) AS total_quantity_received
            FROM purchase_orders po
            LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE datetime(replace(po.created_at, 'T', ' ')) >= ?
              AND datetime(replace(po.created_at, 'T', ' ')) < ?
            GROUP BY po.id
            ORDER BY po.id DESC
            """;

        List<PurchaseOrderSummary> orders = jdbcTemplate.query(sql, poSummaryRowMapper, startUtc, endUtc);

        int totalOrdersCount = 0;
        long totalSpendPaise = 0L;
        int totalUnitsOrdered = 0;
        int totalUnitsReceived = 0;

        Map<String, Integer> countByStatus = new LinkedHashMap<>();
        Map<String, Long> spendByStatus = new LinkedHashMap<>();
        Map<Long, SupplierSpendAccumulator> supplierMap = new LinkedHashMap<>();

        for (PurchaseOrderSummary po : orders) {
            String status = (po.status() != null) ? po.status().toUpperCase() : "DRAFT";
            countByStatus.put(status, countByStatus.getOrDefault(status, 0) + 1);
            spendByStatus.put(status, spendByStatus.getOrDefault(status, 0L) + po.totalAmountPaise());

            if (!"CANCELLED".equals(status)) {
                totalOrdersCount++;
                totalSpendPaise += po.totalAmountPaise();
                totalUnitsOrdered += po.totalQuantityOrdered();
                totalUnitsReceived += po.totalQuantityReceived();

                SupplierSpendAccumulator acc = supplierMap.computeIfAbsent(
                    po.supplierId(),
                    id -> new SupplierSpendAccumulator(id, po.supplierName(), 0, 0L)
                );
                acc.orderCount++;
                acc.totalSpendPaise += po.totalAmountPaise();
            }
        }

        List<SupplierSpendSummary> supplierBreakdown = new ArrayList<>();
        for (SupplierSpendAccumulator acc : supplierMap.values()) {
            supplierBreakdown.add(new SupplierSpendSummary(
                acc.supplierId,
                acc.supplierName,
                acc.orderCount,
                acc.totalSpendPaise
            ));
        }

        return new PurchasesData(
            totalOrdersCount,
            totalSpendPaise,
            totalUnitsOrdered,
            totalUnitsReceived,
            countByStatus,
            spendByStatus,
            supplierBreakdown,
            orders
        );
    }

    private List<SaleSummary> getSalesInRange(String startUtc, String endUtc) {
        String sql = """
            SELECT s.id, s.subtotal_paise, s.discount_paise, s.discount_percent_basis_points, s.total_paise, s.total_cost_paise,
                   s.gross_profit_paise, s.payment_method, s.status, s.created_at, s.cancelled_at,
                   COUNT(si.id) AS item_count,
                   COALESCE(SUM(si.quantity), 0) AS total_quantity
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE s.status = 'COMPLETED'
              AND datetime(replace(s.created_at, 'T', ' ')) >= ?
              AND datetime(replace(s.created_at, 'T', ' ')) < ?
            GROUP BY s.id
            ORDER BY s.id DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Integer basisPoints = hasColumn(rs, "discount_percent_basis_points") && rs.getObject("discount_percent_basis_points") != null
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
        }, startUtc, endUtc);
    }

    public FinancialSummaryReport getFinancialSummaryReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        DateRangeFilter range = resolveDateRange(period, fromStr, toStr, dateStr, month, year);
        ReportMetadata meta = new ReportMetadata(
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            Instant.now().toString(),
            "INR"
        );

        AggregatedFinancials agg = computeAggregatedFinancials(range.startUtc(), range.endUtc());
        List<FinancialMetricBreakdown> breakdown = computeBreakdown(range);
        List<SaleSummary> transactions = getSalesInRange(range.startUtc(), range.endUtc());

        return new FinancialSummaryReport(
            meta,
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            meta.generatedAt(),
            meta.currency(),
            agg.grossSalesPaise(),
            agg.discountsPaise(),
            agg.netRevenuePaise(),
            agg.cogsPaise(),
            agg.grossProfitPaise(),
            agg.inventoryLossPaise(),
            agg.operatingExpensesPaise(),
            agg.operatingResultPaise(),
            agg.totalPurchasesPaise(),
            agg.purchaseOrdersCount(),
            agg.completedSalesCount(),
            agg.unitsSold(),
            breakdown,
            transactions
        );
    }

    public ProfitLossReport getProfitLossReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        DateRangeFilter range = resolveDateRange(period, fromStr, toStr, dateStr, month, year);
        ReportMetadata meta = new ReportMetadata(
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            Instant.now().toString(),
            "INR"
        );

        AggregatedFinancials agg = computeAggregatedFinancials(range.startUtc(), range.endUtc());
        List<FinancialMetricBreakdown> breakdown = computeBreakdown(range);

        double grossMarginPercentage = agg.netRevenuePaise() > 0
            ? Math.round((double) agg.grossProfitPaise() / agg.netRevenuePaise() * 10000.0) / 100.0
            : 0.0;

        long totalOperatingExpensesPaise = agg.inventoryLossPaise() + agg.operatingExpensesPaise();

        double netMarginPercentage = agg.netRevenuePaise() > 0
            ? Math.round((double) agg.operatingResultPaise() / agg.netRevenuePaise() * 10000.0) / 100.0
            : 0.0;

        return new ProfitLossReport(
            meta,
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            meta.generatedAt(),
            meta.currency(),
            agg.grossSalesPaise(),
            agg.discountsPaise(),
            agg.netRevenuePaise(),
            agg.cogsPaise(),
            agg.grossProfitPaise(),
            grossMarginPercentage,
            agg.inventoryLossPaise(),
            agg.operatingExpensesPaise(),
            totalOperatingExpensesPaise,
            agg.operatingResultPaise(),
            netMarginPercentage,
            breakdown
        );
    }

    public SalesReport getSalesReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        DateRangeFilter range = resolveDateRange(period, fromStr, toStr, dateStr, month, year);
        ReportMetadata meta = new ReportMetadata(
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            Instant.now().toString(),
            "INR"
        );

        AggregatedFinancials agg = computeAggregatedFinancials(range.startUtc(), range.endUtc());
        long avgOrderVal = agg.completedSalesCount() > 0 ? (agg.netRevenuePaise() / agg.completedSalesCount()) : 0L;

        List<PaymentMethodSummary> paymentMethods = getPaymentMethodSummary(range.startUtc(), range.endUtc());
        List<TopSellingProduct> topProducts = getTopSellingProducts(range.startUtc(), range.endUtc());
        List<FinancialMetricBreakdown> trend = computeBreakdown(range);
        List<SaleSummary> sales = getSalesInRange(range.startUtc(), range.endUtc());

        return new SalesReport(
            meta,
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            meta.generatedAt(),
            meta.currency(),
            agg.completedSalesCount(),
            agg.unitsSold(),
            agg.grossSalesPaise(),
            agg.discountsPaise(),
            agg.netRevenuePaise(),
            agg.cogsPaise(),
            agg.grossProfitPaise(),
            avgOrderVal,
            paymentMethods,
            topProducts,
            trend,
            sales
        );
    }

    public InventoryLossReport getInventoryLossReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        DateRangeFilter range = resolveDateRange(period, fromStr, toStr, dateStr, month, year);
        ReportMetadata meta = new ReportMetadata(
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            Instant.now().toString(),
            "INR"
        );

        AggregatedFinancials agg = computeAggregatedFinancials(range.startUtc(), range.endUtc());
        List<FinancialMetricBreakdown> breakdown = computeBreakdown(range);
        List<InventoryLossIncident> incidents = getInventoryLossIncidents(range.startUtc(), range.endUtc());

        return new InventoryLossReport(
            meta,
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            meta.generatedAt(),
            meta.currency(),
            agg.inventoryLossPaise(),
            agg.unitsLost(),
            agg.lossIncidents(),
            breakdown,
            incidents
        );
    }

    public PurchasesReport getPurchasesReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        DateRangeFilter range = resolveDateRange(period, fromStr, toStr, dateStr, month, year);
        ReportMetadata meta = new ReportMetadata(
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            Instant.now().toString(),
            "INR"
        );

        PurchasesData purchasesData = getPurchasesData(range.startUtc(), range.endUtc());

        return new PurchasesReport(
            meta,
            range.periodType(),
            range.from().toString(),
            range.to().toString(),
            meta.generatedAt(),
            meta.currency(),
            purchasesData.totalOrdersCount(),
            purchasesData.totalSpendPaise(),
            purchasesData.totalUnitsOrdered(),
            purchasesData.totalUnitsReceived(),
            purchasesData.countByStatus(),
            purchasesData.spendByStatus(),
            purchasesData.supplierBreakdown(),
            purchasesData.orders()
        );
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
            LocalDate from = parseIsoDate(fromStr, "from");
            LocalDate to = (toStr != null && !toStr.isBlank()) ? parseIsoDate(toStr, "to") : from;
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

    // --- Surplus Stock Management ---

    public int getActiveReservedQuantity(Long productId) {
        if (productId == null) return 0;
        Integer reserved = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(quantity_listed - quantity_sold), 0) FROM surplus_listings WHERE product_id = ? AND status IN ('ACTIVE', 'PARTIALLY_SOLD')",
            Integer.class,
            productId
        );
        return reserved != null ? Math.max(0, reserved) : 0;
    }

    public List<SurplusSuggestion> getSurplusSuggestions() {
        SalesIntelligenceResponse salesIntel = getSalesIntelligence();
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

        List<Product> products = getProducts(null, null);
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
        Product product = getProductById(req.productId());

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

        int reserved = getActiveReservedQuantity(product.id());
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
        String category = hasColumn(rs, "category") ? rs.getString("category") : null;
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
        if (hasColumn(rs, "actual_revenue_paise")) {
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

        Product product = getProductById(listing.productId());
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

        return getSaleById(saleId);
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
                Product product = getProductById(listing.productId());
                int otherReserved = getActiveReservedQuantity(product.id()) - listing.quantityListed();
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

    // --- Domain Records ---

    public record HealthStatus(
        String status,
        String database,
        String databaseType,
        int totalProducts,
        int totalMovements,
        String timestamp
    ) {}

    public record Product(
        Long id,
        String name,
        String sku,
        String category,
        long purchasePricePaise,
        long sellingPricePaise,
        int quantity,
        int minStockLevel,
        int targetStockLevel,
        double averageDailySales,
        int leadTimeDays,
        String createdAt,
        String updatedAt,
        Long supplierId,
        String supplierName
    ) {
        public Product(
            Long id,
            String name,
            String sku,
            String category,
            long purchasePricePaise,
            long sellingPricePaise,
            int quantity,
            int minStockLevel,
            int targetStockLevel,
            double averageDailySales,
            int leadTimeDays,
            String createdAt,
            String updatedAt
        ) {
            this(id, name, sku, category, purchasePricePaise, sellingPricePaise, quantity, minStockLevel, targetStockLevel, averageDailySales, leadTimeDays, createdAt, updatedAt, null, null);
        }
    }

    public record CreateProductRequest(
        String name,
        String sku,
        String category,
        Long purchasePricePaise,
        Long sellingPricePaise,
        Integer quantity,
        Integer minStockLevel,
        Integer targetStockLevel,
        Double averageDailySales,
        Integer leadTimeDays,
        Long supplierId
    ) {
        public CreateProductRequest(
            String name,
            String sku,
            String category,
            Long purchasePricePaise,
            Long sellingPricePaise,
            Integer quantity,
            Integer minStockLevel,
            Integer targetStockLevel,
            Double averageDailySales,
            Integer leadTimeDays
        ) {
            this(name, sku, category, purchasePricePaise, sellingPricePaise, quantity, minStockLevel, targetStockLevel, averageDailySales, leadTimeDays, null);
        }
    }

    public record UpdateProductRequest(
        String name,
        String sku,
        String category,
        Long purchasePricePaise,
        Long sellingPricePaise,
        Integer minStockLevel,
        Integer targetStockLevel,
        Double averageDailySales,
        Integer leadTimeDays
    ) {}

    public record CreateMovementRequest(
        Long productId,
        String movementType,
        Integer quantity,
        String reason
    ) {}

    public record RecentMovement(
        Long movementId,
        Long productId,
        String productName,
        String movementType,
        int quantity,
        int previousQuantity,
        int newQuantity,
        String reason,
        String createdAt
    ) {}

    public record CategoryBreakdown(
        String category,
        int productCount,
        int totalQuantity
    ) {}

    public record LiveBusinessState(
        int totalProducts,
        int totalQuantity,
        long inventoryValuePaise,
        int lowStockCount,
        int outOfStockCount,
        int activeSurplusListings,
        int pendingPurchaseOrders,
        int openStockAudits
    ) {}

    public record PeriodActivity(
        String period,
        String from,
        String to,
        long salesPaise,
        long grossProfitPaise,
        int unitsSold,
        long expensesPaise,
        long inventoryLossPaise,
        int discrepanciesCount,
        int completedSalesCount
    ) {}

    public record DashboardSummary(
        int totalProducts,
        int totalQuantity,
        long inventoryValuePaise,
        int lowStockCount,
        int outOfStockCount,
        int activeSurplusListings,
        int pendingPurchaseOrders,
        int openStockAudits
    ) {
        public DashboardSummary(int totalProducts, int totalQuantity, long inventoryValuePaise, int lowStockCount, int outOfStockCount) {
            this(totalProducts, totalQuantity, inventoryValuePaise, lowStockCount, outOfStockCount, 0, 0, 0);
        }
    }

    public record DashboardResponse(
        int totalProducts,
        int totalQuantity,
        long inventoryValuePaise,
        int lowStockCount,
        int outOfStockCount,
        DashboardSummary summary,
        List<CategoryBreakdown> categoryBreakdown,
        List<RecentMovement> recentMovements,
        LiveBusinessState liveState,
        PeriodActivity periodActivity
    ) {
        public DashboardResponse(
            int totalProducts,
            int totalQuantity,
            long inventoryValuePaise,
            int lowStockCount,
            int outOfStockCount,
            DashboardSummary summary,
            List<CategoryBreakdown> categoryBreakdown,
            List<RecentMovement> recentMovements
        ) {
            this(totalProducts, totalQuantity, inventoryValuePaise, lowStockCount, outOfStockCount, summary, categoryBreakdown, recentMovements, null, null);
        }
    }

    public record ProductIntelligence(
        Long productId,
        String productName,
        String sku,
        String category,
        int currentQuantity,
        int minStockLevel,
        int targetStockLevel,
        double averageDailySales,
        int leadTimeDays,
        double reorderPoint,
        int reorderQuantity,
        int surplusQuantity,
        String status,
        String recommendation
    ) {}

    // Custom Exceptions for clean HTTP status mappings
    public static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(String message) {
            super(message);
        }
    }

    public static class ProductConflictException extends RuntimeException {
        public ProductConflictException(String message) {
            super(message);
        }
    }

    public record CreateSaleRequest(
        List<SaleItemRequest> items,
        Long discountPaise,
        BigDecimal discountPercent,
        String paymentMethod
    ) {
        public CreateSaleRequest(List<SaleItemRequest> items, Long discountPaise, String paymentMethod) {
            this(items, discountPaise, null, paymentMethod);
        }

        public CreateSaleRequest(List<SaleItemRequest> items, BigDecimal discountPercent, String paymentMethod) {
            this(items, null, discountPercent, paymentMethod);
        }

        public CreateSaleRequest(List<SaleItemRequest> items, Double discountPercent, String paymentMethod) {
            this(items, null, discountPercent != null ? BigDecimal.valueOf(discountPercent) : null, paymentMethod);
        }

        public CreateSaleRequest(List<SaleItemRequest> items, Integer discountPercent, String paymentMethod) {
            this(items, null, discountPercent != null ? BigDecimal.valueOf(discountPercent) : null, paymentMethod);
        }

        public CreateSaleRequest(List<SaleItemRequest> items, String paymentMethod) {
            this(items, null, null, paymentMethod);
        }
    }

    public record SaleItemRequest(
        Long productId,
        Integer quantity,
        Long unitSellingPricePaise
    ) {
        public SaleItemRequest(Long productId, Integer quantity) {
            this(productId, quantity, null);
        }
    }

    public record CreateSaleItemRequest(
        Long productId,
        Integer quantity,
        Long unitSellingPricePaise
    ) {
        public CreateSaleItemRequest(Long productId, Integer quantity) {
            this(productId, quantity, null);
        }
        public SaleItemRequest toSaleItemRequest() {
            return new SaleItemRequest(productId, quantity, unitSellingPricePaise);
        }
    }

    public record CancelSaleRequest(
        String reason
    ) {}

    public record SaleSummary(
        Long id,
        Long saleId,
        long subtotalPaise,
        long discountPaise,
        Integer discountPercentBasisPoints,
        Double discountPercent,
        long totalPaise,
        long totalCostPaise,
        long grossProfitPaise,
        String paymentMethod,
        String status,
        String createdAt,
        String cancelledAt,
        int itemCount,
        int totalQuantity
    ) {
        public SaleSummary(
            Long id,
            Long saleId,
            long subtotalPaise,
            long discountPaise,
            long totalPaise,
            long totalCostPaise,
            long grossProfitPaise,
            String paymentMethod,
            String status,
            String createdAt,
            String cancelledAt,
            int itemCount,
            int totalQuantity
        ) {
            this(id, saleId, subtotalPaise, discountPaise, null, null, totalPaise, totalCostPaise, grossProfitPaise, paymentMethod, status, createdAt, cancelledAt, itemCount, totalQuantity);
        }
    }

    public record SaleDetails(
        Long id,
        Long saleId,
        long subtotalPaise,
        long discountPaise,
        Integer discountPercentBasisPoints,
        Double discountPercent,
        long totalPaise,
        long totalCostPaise,
        long grossProfitPaise,
        String paymentMethod,
        String status,
        String createdAt,
        String cancelledAt,
        List<SaleItemDetails> items,
        Boolean hasBelowCostItem
    ) {
        public SaleDetails(
            Long id,
            Long saleId,
            long subtotalPaise,
            long discountPaise,
            long totalPaise,
            long totalCostPaise,
            long grossProfitPaise,
            String paymentMethod,
            String status,
            String createdAt,
            String cancelledAt,
            List<SaleItemDetails> items
        ) {
            this(
                id,
                saleId,
                subtotalPaise,
                discountPaise,
                null,
                null,
                totalPaise,
                totalCostPaise,
                grossProfitPaise,
                paymentMethod,
                status,
                createdAt,
                cancelledAt,
                items,
                items != null && items.stream().anyMatch(i -> Boolean.TRUE.equals(i.belowCost()))
            );
        }

        public SaleDetails(
            Long id,
            Long saleId,
            long subtotalPaise,
            long discountPaise,
            Integer discountPercentBasisPoints,
            Double discountPercent,
            long totalPaise,
            long totalCostPaise,
            long grossProfitPaise,
            String paymentMethod,
            String status,
            String createdAt,
            String cancelledAt,
            List<SaleItemDetails> items
        ) {
            this(
                id,
                saleId,
                subtotalPaise,
                discountPaise,
                discountPercentBasisPoints,
                discountPercent,
                totalPaise,
                totalCostPaise,
                grossProfitPaise,
                paymentMethod,
                status,
                createdAt,
                cancelledAt,
                items,
                items != null && items.stream().anyMatch(i -> Boolean.TRUE.equals(i.belowCost()))
            );
        }
    }

    public record SaleItemDetails(
        Long id,
        Long saleId,
        Long productId,
        String productNameSnapshot,
        String skuSnapshot,
        int quantity,
        long unitSellingPricePaise,
        long unitPurchasePricePaise,
        long lineTotalPaise,
        long lineCostPaise,
        Long surplusListingId,
        Boolean belowCost
    ) {
        public SaleItemDetails(
            Long id,
            Long saleId,
            Long productId,
            String productNameSnapshot,
            String skuSnapshot,
            int quantity,
            long unitSellingPricePaise,
            long unitPurchasePricePaise,
            long lineTotalPaise,
            long lineCostPaise,
            Long surplusListingId
        ) {
            this(id, saleId, productId, productNameSnapshot, skuSnapshot, quantity, unitSellingPricePaise, unitPurchasePricePaise, lineTotalPaise, lineCostPaise, surplusListingId, unitSellingPricePaise < unitPurchasePricePaise);
        }

        public SaleItemDetails(
            Long id,
            Long saleId,
            Long productId,
            String productNameSnapshot,
            String skuSnapshot,
            int quantity,
            long unitSellingPricePaise,
            long unitPurchasePricePaise,
            long lineTotalPaise,
            long lineCostPaise
        ) {
            this(id, saleId, productId, productNameSnapshot, skuSnapshot, quantity, unitSellingPricePaise, unitPurchasePricePaise, lineTotalPaise, lineCostPaise, null, unitSellingPricePaise < unitPurchasePricePaise);
        }
    }

    public static class SaleNotFoundException extends RuntimeException {
        public SaleNotFoundException(String message) {
            super(message);
        }
    }

    public static class SaleConflictException extends RuntimeException {
        public SaleConflictException(String message) {
            super(message);
        }
    }

    public record Supplier(
        Long id,
        String name,
        String contactPerson,
        String phone,
        String email,
        String address,
        String notes,
        String createdAt,
        String updatedAt
    ) {}

    public record CreateSupplierRequest(
        String name,
        String contactPerson,
        String phone,
        String email,
        String address,
        String notes
    ) {}

    public record UpdateSupplierRequest(
        String name,
        String contactPerson,
        String phone,
        String email,
        String address,
        String notes
    ) {}

    public record AssignSupplierRequest(
        Long supplierId
    ) {}

    public record SupplierProduct(
        Long id,
        Long productId,
        String name,
        String sku,
        String category,
        int quantity,
        int currentQuantity,
        long purchasePricePaise,
        long sellingPricePaise,
        int minStockLevel,
        int targetStockLevel,
        Long supplierId,
        String supplierName
    ) {}

    public static class SupplierNotFoundException extends RuntimeException {
        public SupplierNotFoundException(String message) {
            super(message);
        }
    }

    public static class SupplierConflictException extends RuntimeException {
        public SupplierConflictException(String message) {
            super(message);
        }
    }

    public record CreatePurchaseOrderItemRequest(
        Long productId,
        Integer quantity,
        Long unitCostPaise
    ) {}

    public record CreatePurchaseOrderRequest(
        Long supplierId,
        String notes,
        List<CreatePurchaseOrderItemRequest> items
    ) {}

    public record UpdatePurchaseOrderRequest(
        Long supplierId,
        String notes,
        List<CreatePurchaseOrderItemRequest> items
    ) {}

    public record ReceivePurchaseOrderItemRequest(
        Long purchaseOrderItemId,
        Integer quantity
    ) {}

    public record ReceivePurchaseOrderRequest(
        List<ReceivePurchaseOrderItemRequest> items
    ) {}

    public record CancelPurchaseOrderRequest(
        String reason
    ) {}

    public record PurchaseOrderSummary(
        Long id,
        Long orderId,
        Long supplierId,
        String supplierName,
        String status,
        long totalAmountPaise,
        String notes,
        String createdAt,
        String updatedAt,
        String placedAt,
        String receivedAt,
        String cancelledAt,
        int itemCount,
        int totalQuantityOrdered,
        int totalQuantityReceived
    ) {}

    public record PurchaseOrderItemDetails(
        Long id,
        Long purchaseOrderId,
        Long productId,
        String productNameSnapshot,
        String skuSnapshot,
        int quantityOrdered,
        int quantityReceived,
        int remainingQuantity,
        long unitCostPaise,
        long lineTotalPaise
    ) {}

    public record PurchaseOrderDetails(
        Long id,
        Long orderId,
        Long supplierId,
        String supplierName,
        String status,
        long totalAmountPaise,
        String notes,
        String createdAt,
        String updatedAt,
        String placedAt,
        String receivedAt,
        String cancelledAt,
        String cancellationReason,
        List<PurchaseOrderItemDetails> items
    ) {}

    public static class PurchaseOrderNotFoundException extends RuntimeException {
        public PurchaseOrderNotFoundException(String message) {
            super(message);
        }
    }

    public static class PurchaseOrderConflictException extends RuntimeException {
        public PurchaseOrderConflictException(String message) {
            super(message);
        }
    }

    public record ProductSalesIntelligence(
        Long productId,
        String productName,
        String sku,
        String category,
        int currentQuantity,
        int lowStockLevel,
        int preferredStockLevel,
        int unitsSoldLast30Days,
        int unitsSoldPrevious30Days,
        double averageDailySalesLast30Days,
        String lastSoldAt,
        Integer daysSinceLastSale,
        String salesActivity,
        String salesTrend,
        int recommendedRestockQuantity,
        String recommendation
    ) {}

    public record SalesIntelligenceSummary(
        int totalProducts,
        List<ProductSalesIntelligence> fastSellingProducts,
        int slowMovingProducts,
        int potentialDeadStockProducts,
        int noSalesHistoryProducts,
        int outOfStockProducts,
        int productsNeedingRestock
    ) {}

    public record SalesIntelligenceResponse(
        SalesIntelligenceSummary summary,
        List<ProductSalesIntelligence> products
    ) {}

    public record SalesMetricsSummary(
        long salesTodayPaise,
        int salesTodayCount,
        long salesMonthPaise,
        int salesMonthCount,
        long totalSalesPaise,
        long totalCostPaise,
        long totalProfitPaise,
        int totalSalesCount
    ) {}

    public record DailySalesTrend(
        String saleDate,
        long totalPaise,
        int orderCount
    ) {}

    // --- Stock Auditing Records and Exceptions ---

    public record CreateStockAuditRequest(
        List<Long> productIds,
        String notes
    ) {}

    public record EnterCountRequest(
        Integer countedQuantity,
        String notes
    ) {}

    public record CancelStockAuditRequest(
        String reason
    ) {}

    public record StockAuditMetricsSummary(
        int openAudits,
        int pendingDiscrepancies,
        long inventoryLossTodayPaise,
        int completedAuditsThisMonth
    ) {}

    public record StockAuditSummary(
        Long id,
        Long auditId,
        String status,
        String notes,
        String createdAt,
        String completedAt,
        String cancelledAt,
        String cancellationReason,
        int totalProducts,
        int productsCounted,
        int productsWithDiscrepancies
    ) {}

    public record StockAuditItemDetails(
        Long id,
        Long itemId,
        Long auditId,
        Long productId,
        String productNameSnapshot,
        String skuSnapshot,
        int systemQuantity,
        Integer countedQuantity,
        Integer variance,
        String countStatus,
        String itemNotes
    ) {}

    public record StockAuditDetails(
        Long id,
        Long auditId,
        String status,
        String notes,
        String createdAt,
        String completedAt,
        String cancelledAt,
        String cancellationReason,
        int totalProducts,
        int countedProducts,
        int discrepancyCount,
        List<StockAuditItemDetails> items
    ) {}

    public record StockAuditCompletionSummary(
        Long id,
        Long auditId,
        String status,
        String notes,
        String createdAt,
        String completedAt,
        int totalProducts,
        int countedProducts,
        int discrepancyCount,
        int adjustedProducts,
        int unchangedProducts,
        String message,
        List<StockAuditItemDetails> items
    ) {}

    private record StockAuditHeader(
        Long id,
        String status,
        String notes,
        String createdAt,
        String completedAt,
        String cancelledAt,
        String cancellationReason
    ) {}

    public static class StockAuditNotFoundException extends RuntimeException {
        public StockAuditNotFoundException(String message) {
            super(message);
        }
    }

    public static class StockAuditConflictException extends IllegalStateException {
        public StockAuditConflictException(String message) {
            super(message);
        }
    }

    // --- Financial Reports Records ---

    public record DateRangeFilter(
        String periodType,
        LocalDate from,
        LocalDate to,
        String startUtc,
        String endUtc
    ) {}

    public record ReportMetadata(
        String periodType,
        String from,
        String to,
        String generatedAt,
        String currency
    ) {}

    public record FinancialMetricBreakdown(
        String period,
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        long inventoryLossPaise,
        long operatingExpensesPaise,
        long operatingResultPaise,
        int salesCount,
        int unitsSold
    ) {}

    public record FinancialSummaryReport(
        ReportMetadata metadata,
        String periodType,
        String from,
        String to,
        String generatedAt,
        String currency,
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        long inventoryLossPaise,
        long operatingExpensesPaise,
        long operatingResultPaise,
        long totalPurchasesPaise,
        int purchaseOrdersCount,
        int completedSalesCount,
        int unitsSold,
        List<FinancialMetricBreakdown> breakdown,
        List<SaleSummary> transactions
    ) {}

    public record ProfitLossReport(
        ReportMetadata metadata,
        String periodType,
        String from,
        String to,
        String generatedAt,
        String currency,
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        double grossMarginPercentage,
        long inventoryLossPaise,
        long operatingExpensesPaise,
        long totalOperatingExpensesPaise,
        long operatingResultPaise,
        double netMarginPercentage,
        List<FinancialMetricBreakdown> breakdown
    ) {}

    public record PaymentMethodSummary(
        String paymentMethod,
        int orderCount,
        long totalPaise
    ) {}

    public record TopSellingProduct(
        Long productId,
        String productName,
        String sku,
        String category,
        int unitsSold,
        long totalRevenuePaise,
        long totalCostPaise,
        long grossProfitPaise
    ) {}

    public record SalesReport(
        ReportMetadata metadata,
        String periodType,
        String from,
        String to,
        String generatedAt,
        String currency,
        int completedSalesCount,
        int unitsSold,
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        long averageOrderValuePaise,
        List<PaymentMethodSummary> paymentMethods,
        List<TopSellingProduct> topSellingProducts,
        List<FinancialMetricBreakdown> trend,
        List<SaleSummary> sales
    ) {}

    public record InventoryLossIncident(
        Long movementId,
        Long productId,
        String productName,
        String sku,
        int unitsLost,
        long unitCostPaise,
        long totalLossPaise,
        String reason,
        String createdAt
    ) {}

    public record InventoryLossReport(
        ReportMetadata metadata,
        String periodType,
        String from,
        String to,
        String generatedAt,
        String currency,
        long totalLossPaise,
        int totalUnitsLost,
        int incidentCount,
        List<FinancialMetricBreakdown> breakdown,
        List<InventoryLossIncident> incidents
    ) {}

    public record SupplierSpendSummary(
        Long supplierId,
        String supplierName,
        int orderCount,
        long totalSpendPaise
    ) {}

    public record PurchasesReport(
        ReportMetadata metadata,
        String periodType,
        String from,
        String to,
        String generatedAt,
        String currency,
        int totalOrdersCount,
        long totalSpendPaise,
        int totalUnitsOrdered,
        int totalUnitsReceived,
        Map<String, Integer> countByStatus,
        Map<String, Long> spendByStatus,
        List<SupplierSpendSummary> supplierBreakdown,
        List<PurchaseOrderSummary> orders
    ) {}

    public record CreateExpenseRequest(
        String category,
        Long amountPaise,
        String description,
        String date
    ) {
        public CreateExpenseRequest(String category, Long amountPaise, String description) {
            this(category, amountPaise, description, null);
        }
    }

    public record ExpenseRecord(
        Long id,
        String category,
        long amountPaise,
        String description,
        String createdAt
    ) {}

    private record SalesAggregate(
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        int salesCount
    ) {}

    private record LossAggregate(
        int lossIncidents,
        int unitsLost,
        long lossPaise
    ) {}

    private record PoAggregate(
        int poCount,
        long totalPurchasesPaise
    ) {}

    private record AggregatedFinancials(
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        int completedSalesCount,
        int unitsSold,
        long inventoryLossPaise,
        int unitsLost,
        int lossIncidents,
        long operatingExpensesPaise,
        long operatingResultPaise,
        long totalPurchasesPaise,
        int purchaseOrdersCount
    ) {}

    private record SalesPeriodMetric(
        long grossSalesPaise,
        long discountsPaise,
        long netRevenuePaise,
        long cogsPaise,
        long grossProfitPaise,
        int salesCount,
        int unitsSold
    ) {
        public static final SalesPeriodMetric ZERO = new SalesPeriodMetric(0, 0, 0, 0, 0, 0, 0);
    }

    private static class SupplierSpendAccumulator {
        Long supplierId;
        String supplierName;
        int orderCount;
        long totalSpendPaise;

        SupplierSpendAccumulator(Long supplierId, String supplierName, int orderCount, long totalSpendPaise) {
            this.supplierId = supplierId;
            this.supplierName = supplierName;
            this.orderCount = orderCount;
            this.totalSpendPaise = totalSpendPaise;
        }
    }

    private record PurchasesData(
        int totalOrdersCount,
        long totalSpendPaise,
        int totalUnitsOrdered,
        int totalUnitsReceived,
        Map<String, Integer> countByStatus,
        Map<String, Long> spendByStatus,
        List<SupplierSpendSummary> supplierBreakdown,
        List<PurchaseOrderSummary> orders
    ) {}

    // --- Surplus Stock Management Records & Exceptions ---

    public record SurplusSuggestion(
        Long productId,
        String productName,
        String sku,
        String category,
        int currentQuantity,
        int reservedQuantity,
        int availableQuantity,
        Integer preferredStockLevel,
        int suggestedSurplusQuantity,
        long sellingPricePaise,
        long purchasePricePaise,
        int unitsSoldLast30Days,
        String lastSoldAt,
        String salesActivity,
        String recommendationReason
    ) {}

    public record CreateSurplusListingRequest(
        Long productId,
        Integer quantity,
        Long discountedPricePaise,
        String reason,
        String notes
    ) {
        public CreateSurplusListingRequest(Long productId, Integer quantity, Long discountedPricePaise, String reason) {
            this(productId, quantity, discountedPricePaise, reason, null);
        }
    }

    public record UpdateSurplusListingRequest(
        Long discountedPricePaise,
        Integer quantity,
        String reason,
        String notes
    ) {
        public UpdateSurplusListingRequest(Long discountedPricePaise, String reason, String notes) {
            this(discountedPricePaise, null, reason, notes);
        }
    }

    public record CancelSurplusListingRequest(
        String reason
    ) {}

    public record RecordSurplusSaleRequest(
        int quantity,
        String paymentMethod
    ) {
        public RecordSurplusSaleRequest(int quantity) {
            this(quantity, "CASH");
        }
    }

    public record SurplusSaleTransaction(
        Long saleId,
        Long saleItemId,
        int quantity,
        long unitSellingPricePaise,
        long unitPurchasePricePaise,
        long lineTotalPaise,
        long lineCostPaise,
        String paymentMethod,
        String status,
        String createdAt
    ) {
        public long getGrossProfitPaise() {
            return lineTotalPaise - lineCostPaise;
        }
    }

    public record SurplusListingDetails(
        Long id,
        Long productId,
        String productName,
        String sku,
        String category,
        int quantityListed,
        int quantitySold,
        int quantityRemaining,
        long regularUnitPricePaise,
        long discountedUnitPricePaise,
        double discountPercentage,
        long unitCostPaiseSnapshot,
        long recoveredRevenuePaise,
        long grossProfitPaise,
        String status,
        String reason,
        String notes,
        String createdAt,
        String updatedAt,
        String cancelledAt,
        List<SurplusSaleTransaction> sales
    ) {
        public SurplusListingDetails withSales(List<SurplusSaleTransaction> newSales) {
            return new SurplusListingDetails(
                id, productId, productName, sku, category, quantityListed, quantitySold, quantityRemaining,
                regularUnitPricePaise, discountedUnitPricePaise, discountPercentage, unitCostPaiseSnapshot,
                recoveredRevenuePaise, grossProfitPaise, status, reason, notes, createdAt, updatedAt, cancelledAt,
                newSales != null ? newSales : List.of()
            );
        }

        public long getDiscountedSellingPricePaise() {
            return discountedUnitPricePaise;
        }

        public long getOriginalSellingPricePaise() {
            return regularUnitPricePaise;
        }

        public long getTotalRealizedRevenuePaise() {
            return recoveredRevenuePaise;
        }

        public long getTotalRealizedGrossProfitPaise() {
            return grossProfitPaise;
        }

        public long getOriginalPurchasePricePaise() {
            return unitCostPaiseSnapshot;
        }

        public long getTotalPotentialRevenuePaise() {
            return (long) quantityListed * discountedUnitPricePaise;
        }
    }

    public record SurplusSummary(
        int totalListings,
        int activeListings,
        int partiallySoldListings,
        int fullySoldListings,
        int cancelledListings,
        int totalUnitsListed,
        int totalUnitsSold,
        int totalUnitsRemaining,
        long totalSurplusSalesRevenuePaise,
        long totalSurplusCostPaise,
        long totalSurplusGrossProfitPaise
    ) {
        public long getTotalSurplusRevenuePaise() {
            return totalSurplusSalesRevenuePaise;
        }

        public long totalSurplusRevenuePaise() {
            return totalSurplusSalesRevenuePaise;
        }

        public int getActiveListingsCount() {
            return activeListings;
        }
    }

    public static class SurplusListingNotFoundException extends RuntimeException {
        public SurplusListingNotFoundException(String message) {
            super(message);
        }
    }

    public static class SurplusListingConflictException extends RuntimeException {
        public SurplusListingConflictException(String message) {
            super(message);
        }
    }
}
