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

// OO: Singleton Pattern (Spring bean) — container is class ka ek hi instance banata hai; sab clients wahi instance share karte hain.
@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
            RowMappers.MOVEMENT
        );

        // Calculate Period-Based Activity using Asia/Kolkata timezone
        ZoneId zone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(zone);
        LocalDate from;
        LocalDate to;
        String resolvedPeriod = (period != null && !period.isBlank()) ? period.trim().toUpperCase() : "TODAY";

        if (fromStr != null && !fromStr.isBlank()) {
            from = QuerySupport.parseIsoDate(fromStr, "from");
            to = (toStr != null && !toStr.isBlank()) ? QuerySupport.parseIsoDate(toStr, "to") : from;
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
}
