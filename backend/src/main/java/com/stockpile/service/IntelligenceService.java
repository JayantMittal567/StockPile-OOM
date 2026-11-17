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
public class IntelligenceService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;

    public IntelligenceService(JdbcTemplate jdbcTemplate, ProductService productService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
    }

    // --- Inventory Intelligence ---
    public List<ProductIntelligence> getInventoryIntelligence() {
        List<Product> products = productService.getProducts(null, null);

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
}
