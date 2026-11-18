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

// OO: Single Responsibility (SRP) — ye module sirf product catalog aur supplier-link ka kaam karta hai; sales/stock ka bojh nahi.
@Service
public class ProductService {

    private final JdbcTemplate jdbcTemplate;
    private final SupplierService supplierService;

    public ProductService(JdbcTemplate jdbcTemplate, SupplierService supplierService) {
        this.jdbcTemplate = jdbcTemplate;
        this.supplierService = supplierService;
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

        return jdbcTemplate.query(sql.toString(), RowMappers.PRODUCT, params.toArray());
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

        List<Product> list = jdbcTemplate.query(sql, RowMappers.PRODUCT, id);
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
            supplierService.getSupplierById(req.supplierId());
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

    @Transactional
    // OO: Association (many-to-many) — product_suppliers link table products aur suppliers ko jodti hai; dono sides independent exist karti hain.
    public Product assignSupplierToProduct(Long productId, Long supplierId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (supplierId == null) {
            throw new IllegalArgumentException("Supplier ID is required");
        }

        getProductById(productId);
        supplierService.getSupplierById(supplierId);

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
        supplierService.getSupplierById(supplierId);

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
}
