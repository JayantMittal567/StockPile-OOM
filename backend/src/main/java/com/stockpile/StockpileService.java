package com.stockpile;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
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
            if (currentQty < req.quantity()) {
                throw new IllegalArgumentException(
                    "Insufficient stock: available " + currentQty + ", cannot dispatch " + req.quantity()
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
        if (movementType != null && !movementType.isBlank()) {
            sql.append(" AND UPPER(sm.movement_type) = ?");
            params.add(movementType.trim().toUpperCase());
        }
        sql.append(" ORDER BY sm.id DESC");

        return jdbcTemplate.query(sql.toString(), recentMovementRowMapper, params.toArray());
    }

    // --- Dashboard Aggregations ---

    public DashboardResponse getDashboard() {
        String summarySql = """
            SELECT 
                COUNT(*) AS total_products,
                COALESCE(SUM(quantity), 0) AS total_quantity,
                COALESCE(SUM(quantity * purchase_price_paise), 0) AS inventory_value_paise,
                COALESCE(SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END), 0) AS low_stock_count,
                COALESCE(SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count
            FROM products
            """;

        DashboardSummary summary = jdbcTemplate.queryForObject(
            summarySql,
            (rs, rowNum) -> new DashboardSummary(
                rs.getInt("total_products"),
                rs.getInt("total_quantity"),
                rs.getLong("inventory_value_paise"),
                rs.getInt("low_stock_count"),
                rs.getInt("out_of_stock_count")
            )
        );

        if (summary == null) {
            summary = new DashboardSummary(0, 0, 0L, 0, 0);
        }

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

        return new DashboardResponse(
            summary.totalProducts(),
            summary.totalQuantity(),
            summary.inventoryValuePaise(),
            summary.lowStockCount(),
            summary.outOfStockCount(),
            summary,
            categoryBreakdown,
            recentMovements
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

        long discountPaise = req.discountPaise() != null ? req.discountPaise() : 0L;
        if (discountPaise < 0) {
            throw new IllegalArgumentException("Discount cannot be negative");
        }

        Set<Long> seenProductIds = new HashSet<>();
        for (SaleItemRequest item : req.items()) {
            if (item.productId() == null || item.productId() <= 0) {
                throw new IllegalArgumentException("Invalid product ID");
            }
            if (item.quantity() == null || item.quantity() <= 0) {
                throw new IllegalArgumentException("Item quantity must be a positive integer");
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
            long lineCostPaise
        ) {}

        List<PreparedItem> preparedItems = new ArrayList<>();
        long subtotalPaise = 0L;
        long totalCostPaise = 0L;

        for (SaleItemRequest itemReq : req.items()) {
            Product product = getProductById(itemReq.productId());
            if (product.quantity() < itemReq.quantity()) {
                throw new IllegalArgumentException(
                    "Insufficient stock for product '" + product.name() + "' (SKU: " + product.sku() +
                    "): available " + product.quantity() + ", requested " + itemReq.quantity()
                );
            }

            long unitSelling = product.sellingPricePaise();
            long unitPurchase = product.purchasePricePaise();
            long lineTotal = (long) itemReq.quantity() * unitSelling;
            long lineCost = (long) itemReq.quantity() * unitPurchase;

            subtotalPaise += lineTotal;
            totalCostPaise += lineCost;

            preparedItems.add(new PreparedItem(product, itemReq.quantity(), unitSelling, unitPurchase, lineTotal, lineCost));
        }

        if (discountPaise > subtotalPaise) {
            throw new IllegalArgumentException("Discount cannot exceed subtotal (" + subtotalPaise + " paise)");
        }

        long totalPaise = subtotalPaise - discountPaise;
        long grossProfitPaise = totalPaise - totalCostPaise;

        String insertSaleSql = """
            INSERT INTO sales (
                subtotal_paise, discount_paise, total_paise, total_cost_paise,
                gross_profit_paise, payment_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
            """;

        jdbcTemplate.update(
            insertSaleSql,
            subtotalPaise,
            discountPaise,
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
            SELECT s.id, s.subtotal_paise, s.discount_paise, s.total_paise, s.total_cost_paise,
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
            LIMIT 50
            """);

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> new SaleSummary(
            rs.getLong("id"),
            rs.getLong("id"),
            rs.getLong("subtotal_paise"),
            rs.getLong("discount_paise"),
            rs.getLong("total_paise"),
            rs.getLong("total_cost_paise"),
            rs.getLong("gross_profit_paise"),
            rs.getString("payment_method"),
            rs.getString("status"),
            rs.getString("created_at"),
            rs.getString("cancelled_at"),
            rs.getInt("item_count"),
            rs.getInt("total_quantity")
        ), params.toArray());
    }

    public SalesMetricsSummary getSalesMetricsSummary() {
        String sql = """
            SELECT 
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total_paise ELSE 0 END), 0) AS sales_today_paise,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END), 0) AS sales_today_count,
                COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_paise ELSE 0 END), 0) AS sales_month_paise,
                COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END), 0) AS sales_month_count,
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
        ));
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
            SELECT id, subtotal_paise, discount_paise, total_paise, total_cost_paise,
                   gross_profit_paise, payment_method, status, created_at, cancelled_at
            FROM sales
            WHERE id = ?
            """;

        List<SaleDetails> sales = jdbcTemplate.query(saleSql, (rs, rowNum) -> new SaleDetails(
            rs.getLong("id"),
            rs.getLong("id"),
            rs.getLong("subtotal_paise"),
            rs.getLong("discount_paise"),
            rs.getLong("total_paise"),
            rs.getLong("total_cost_paise"),
            rs.getLong("gross_profit_paise"),
            rs.getString("payment_method"),
            rs.getString("status"),
            rs.getString("created_at"),
            rs.getString("cancelled_at"),
            new ArrayList<>()
        ), id);

        if (sales.isEmpty()) {
            throw new SaleNotFoundException("Sale not found with id: " + id);
        }

        SaleDetails baseSale = sales.get(0);

        String itemsSql = """
            SELECT id, sale_id, product_id, product_name_snapshot, sku_snapshot,
                   quantity, unit_selling_price_paise, unit_purchase_price_paise,
                   line_total_paise, line_cost_paise
            FROM sale_items
            WHERE sale_id = ?
            ORDER BY id ASC
            """;

        List<SaleItemDetails> items = jdbcTemplate.query(itemsSql, (rs, rowNum) -> new SaleItemDetails(
            rs.getLong("id"),
            rs.getLong("sale_id"),
            rs.getLong("product_id"),
            rs.getString("product_name_snapshot"),
            rs.getString("sku_snapshot"),
            rs.getInt("quantity"),
            rs.getLong("unit_selling_price_paise"),
            rs.getLong("unit_purchase_price_paise"),
            rs.getLong("line_total_paise"),
            rs.getLong("line_cost_paise")
        ), id);

        return new SaleDetails(
            baseSale.id(),
            baseSale.saleId(),
            baseSale.subtotalPaise(),
            baseSale.discountPaise(),
            baseSale.totalPaise(),
            baseSale.totalCostPaise(),
            baseSale.grossProfitPaise(),
            baseSale.paymentMethod(),
            baseSale.status(),
            baseSale.createdAt(),
            baseSale.cancelledAt(),
            items
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
        if (status != null && !status.isBlank()) {
            sql.append(" AND UPPER(po.status) = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" GROUP BY po.id ORDER BY po.id DESC LIMIT 50");
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

    public record DashboardSummary(
        int totalProducts,
        int totalQuantity,
        long inventoryValuePaise,
        int lowStockCount,
        int outOfStockCount
    ) {}

    public record DashboardResponse(
        int totalProducts,
        int totalQuantity,
        long inventoryValuePaise,
        int lowStockCount,
        int outOfStockCount,
        DashboardSummary summary,
        List<CategoryBreakdown> categoryBreakdown,
        List<RecentMovement> recentMovements
    ) {}

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
        String paymentMethod
    ) {}

    public record SaleItemRequest(
        Long productId,
        Integer quantity
    ) {}

    public record CancelSaleRequest(
        String reason
    ) {}

    public record SaleSummary(
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
    ) {}

    public record SaleDetails(
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
    ) {}

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
        long lineCostPaise
    ) {}

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
}
