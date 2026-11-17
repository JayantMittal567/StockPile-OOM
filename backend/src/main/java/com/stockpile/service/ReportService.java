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
public class ReportService {

    private final JdbcTemplate jdbcTemplate;

    public ReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // --- Financial Reporting Management ---
    public DateRangeFilter resolveDateRange(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        ZoneId zone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(zone);

        LocalDate from;
        LocalDate to;
        String resolvedPeriodType;

        if (fromStr != null || toStr != null) {
            from = (fromStr != null && !fromStr.isBlank()) ? QuerySupport.parseIsoDate(fromStr, "from") : QuerySupport.parseIsoDate(toStr, "to");
            to = (toStr != null && !toStr.isBlank()) ? QuerySupport.parseIsoDate(toStr, "to") : from;

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
                    LocalDate d = (dateStr != null && !dateStr.isBlank()) ? QuerySupport.parseIsoDate(dateStr, "date") : today;
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
            LEFT JOIN (
                SELECT sale_id, SUM(quantity) AS quantity
                FROM sale_items
                GROUP BY sale_id
            ) si ON s.id = si.sale_id
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

        List<PurchaseOrderSummary> orders = jdbcTemplate.query(sql, RowMappers.PO_SUMMARY, startUtc, endUtc);

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
        }, startUtc, endUtc);
    }

    // OO: Abstraction — bhaari SQL aggregation ek method ke peeche chhupi; caller ko sirf ready report milti hai, complexity nahi.
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
}
