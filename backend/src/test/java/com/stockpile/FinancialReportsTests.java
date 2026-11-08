package com.stockpile;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:sqlite:target/test-stockpile.db",
    "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:schema.sql"
})
public class FinancialReportsTests {

    @Autowired
    private StockpileService service;

    @Autowired
    private StockpileController controller;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM expenses");
        jdbcTemplate.update("DELETE FROM stock_audit_items");
        jdbcTemplate.update("DELETE FROM stock_audits");
        jdbcTemplate.update("DELETE FROM purchase_order_items");
        jdbcTemplate.update("DELETE FROM purchase_orders");
        jdbcTemplate.update("DELETE FROM product_suppliers");
        jdbcTemplate.update("DELETE FROM suppliers");
        jdbcTemplate.update("DELETE FROM sale_items");
        jdbcTemplate.update("DELETE FROM sales");
        jdbcTemplate.update("DELETE FROM stock_movements");
        jdbcTemplate.update("DELETE FROM products");
    }

    private StockpileService.Product createTestProduct(String name, String sku, String category, long purchasePaise, long sellingPaise, int qty) {
        return service.createProduct(new StockpileService.CreateProductRequest(
            name, sku, category, purchasePaise, sellingPaise, qty, 5, 20, 1.0, 5
        ));
    }

    private StockpileService.Supplier createTestSupplier(String name) {
        return service.createSupplier(new StockpileService.CreateSupplierRequest(
            name, "Contact Person", "9876543210", "vendor@example.com", "Industrial Area", "Reliable"
        ));
    }

    // ==========================================
    // 1. EMPTY PERIOD ZERO VALUE TESTS
    // ==========================================

    @Test
    @DisplayName("1. Empty period returns zero values and not nulls across all 5 report endpoints")
    void testEmptyPeriodReturnsZeroValues() {
        StockpileService.FinancialSummaryReport summary = service.getFinancialSummaryReport("CUSTOM", "2026-01-01", "2026-01-05", null, null, null);
        assertNotNull(summary);
        assertEquals("CUSTOM", summary.periodType());
        assertEquals("2026-01-01", summary.from());
        assertEquals("2026-01-05", summary.to());
        assertEquals("INR", summary.currency());
        assertEquals(0L, summary.grossSalesPaise());
        assertEquals(0L, summary.discountsPaise());
        assertEquals(0L, summary.netRevenuePaise());
        assertEquals(0L, summary.cogsPaise());
        assertEquals(0L, summary.grossProfitPaise());
        assertEquals(0L, summary.inventoryLossPaise());
        assertEquals(0L, summary.operatingExpensesPaise());
        assertEquals(0L, summary.operatingResultPaise());
        assertEquals(0L, summary.totalPurchasesPaise());
        assertEquals(0, summary.purchaseOrdersCount());
        assertEquals(0, summary.completedSalesCount());
        assertEquals(0, summary.unitsSold());
        assertEquals(5, summary.breakdown().size());
        assertTrue(summary.transactions().isEmpty());

        StockpileService.ProfitLossReport pnl = service.getProfitLossReport("CUSTOM", "2026-01-01", "2026-01-05", null, null, null);
        assertNotNull(pnl);
        assertEquals(0L, pnl.netRevenuePaise());
        assertEquals(0L, pnl.grossProfitPaise());
        assertEquals(0.0, pnl.grossMarginPercentage());
        assertEquals(0.0, pnl.netMarginPercentage());
        assertEquals(5, pnl.breakdown().size());

        StockpileService.SalesReport sales = service.getSalesReport("CUSTOM", "2026-01-01", "2026-01-05", null, null, null);
        assertNotNull(sales);
        assertEquals(0, sales.completedSalesCount());
        assertEquals(0L, sales.averageOrderValuePaise());
        assertTrue(sales.paymentMethods().isEmpty());
        assertTrue(sales.topSellingProducts().isEmpty());

        StockpileService.InventoryLossReport loss = service.getInventoryLossReport("CUSTOM", "2026-01-01", "2026-01-05", null, null, null);
        assertNotNull(loss);
        assertEquals(0L, loss.totalLossPaise());
        assertEquals(0, loss.totalUnitsLost());
        assertEquals(0, loss.incidentCount());
        assertTrue(loss.incidents().isEmpty());

        StockpileService.PurchasesReport po = service.getPurchasesReport("CUSTOM", "2026-01-01", "2026-01-05", null, null, null);
        assertNotNull(po);
        assertEquals(0, po.totalOrdersCount());
        assertEquals(0L, po.totalSpendPaise());
        assertTrue(po.supplierBreakdown().isEmpty());
        assertTrue(po.orders().isEmpty());
    }

    // ==========================================
    // 2. SINGLE-DAY REPORT TESTS
    // ==========================================

    @Test
    @DisplayName("2. Single-day report includes metrics and transactions for that date only")
    void testSingleDayReport() {
        StockpileService.Product p = createTestProduct("Widget A", "WID-01", "Gadgets", 10000L, 25000L, 50);

        // Create sale on 2026-03-15 (UTC 2026-03-15 06:00:00 -> Kolkata 11:30:00)
        StockpileService.SaleDetails s = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            2000L, // 20.00 discount
            "UPI"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-03-15 06:00:00' WHERE id = ?", s.id());

        // Create expense on 2026-03-15
        StockpileService.ExpenseRecord exp = service.createExpense(new StockpileService.CreateExpenseRequest(
            "Utilities", 1500L, "Electricity bill"
        ));
        jdbcTemplate.update("UPDATE expenses SET created_at = '2026-03-15 07:00:00' WHERE id = ?", exp.id());

        // Create purchase order on 2026-03-15
        StockpileService.Supplier sup = createTestSupplier("Alpha Corp");
        StockpileService.PurchaseOrderDetails po = service.createPurchaseOrder(new StockpileService.CreatePurchaseOrderRequest(
            sup.id(), "PO for Widget", List.of(new StockpileService.CreatePurchaseOrderItemRequest(p.id(), 10, 10000L))
        ));
        jdbcTemplate.update("UPDATE purchase_orders SET created_at = '2026-03-15 08:00:00' WHERE id = ?", po.id());

        // Query daily report
        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport("DAILY", null, null, "2026-03-15", null, null);

        assertEquals("DAILY", report.periodType());
        assertEquals("2026-03-15", report.from());
        assertEquals("2026-03-15", report.to());
        assertEquals(50000L, report.grossSalesPaise());
        assertEquals(2000L, report.discountsPaise());
        assertEquals(48000L, report.netRevenuePaise());
        assertEquals(20000L, report.cogsPaise()); // 2 * 10000
        assertEquals(28000L, report.grossProfitPaise()); // 48000 - 20000
        assertEquals(1500L, report.operatingExpensesPaise());
        assertEquals(26500L, report.operatingResultPaise()); // 28000 - 1500
        assertEquals(100000L, report.totalPurchasesPaise());
        assertEquals(1, report.purchaseOrdersCount());
        assertEquals(1, report.completedSalesCount());
        assertEquals(2, report.unitsSold());
        assertEquals(1, report.breakdown().size());
        assertEquals("2026-03-15", report.breakdown().get(0).period());
        assertEquals(1, report.transactions().size());
        assertEquals(s.id(), report.transactions().get(0).id());
    }

    // ==========================================
    // 3. MONTHLY REPORT TESTS
    // ==========================================

    @Test
    @DisplayName("3. Monthly report includes first and last day of month and aggregates 30 daily buckets")
    void testMonthlyReportFirstAndLastDay() {
        StockpileService.Product p = createTestProduct("Cable", "CBL-01", "Electronics", 2000L, 5000L, 100);

        // Sale on first day of April: 2026-04-01 02:00:00 UTC (Kolkata 07:30:00)
        StockpileService.SaleDetails s1 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-04-01 02:00:00' WHERE id = ?", s1.id());

        // Sale on last day of April: 2026-04-30 12:00:00 UTC (Kolkata 17:30:00)
        StockpileService.SaleDetails s2 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)), 0L, "CARD"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-04-30 12:00:00' WHERE id = ?", s2.id());

        // Sale on May 1st (outside range): 2026-05-01 02:00:00 UTC
        StockpileService.SaleDetails sOut = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 5)), 0L, "CASH"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-05-01 02:00:00' WHERE id = ?", sOut.id());

        StockpileService.ProfitLossReport pnl = service.getProfitLossReport("MONTHLY", null, null, null, 4, 2026);

        assertEquals("MONTHLY", pnl.periodType());
        assertEquals("2026-04-01", pnl.from());
        assertEquals("2026-04-30", pnl.to());
        assertEquals(30, pnl.breakdown().size()); // 30 days in April
        assertEquals("2026-04-01", pnl.breakdown().get(0).period());
        assertEquals("2026-04-30", pnl.breakdown().get(29).period());

        // Total sales: 1 + 3 = 4 units -> net revenue 20000 paise (May 1st sale excluded)
        assertEquals(20000L, pnl.netRevenuePaise());
        assertEquals(8000L, pnl.cogsPaise()); // 4 * 2000
        assertEquals(12000L, pnl.grossProfitPaise());
        assertEquals(60.0, pnl.grossMarginPercentage());

        // First day breakdown verification
        assertEquals(5000L, pnl.breakdown().get(0).netRevenuePaise());
        assertEquals(1, pnl.breakdown().get(0).unitsSold());

        // Last day breakdown verification
        assertEquals(15000L, pnl.breakdown().get(29).netRevenuePaise());
        assertEquals(3, pnl.breakdown().get(29).unitsSold());
    }

    // ==========================================
    // 4. YEARLY REPORT TESTS
    // ==========================================

    @Test
    @DisplayName("4. Yearly report spans 12 months with January and December transactions")
    void testYearlyReportJanuaryAndDecember() {
        StockpileService.Product p = createTestProduct("Monitor", "MON-01", "Electronics", 800000L, 1200000L, 20);

        // Sale in January: 2026-01-15 06:00:00 UTC
        StockpileService.SaleDetails sJan = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CARD"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-01-15 06:00:00' WHERE id = ?", sJan.id());

        // Sale in December: 2026-12-25 06:00:00 UTC
        StockpileService.SaleDetails sDec = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "UPI"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-12-25 06:00:00' WHERE id = ?", sDec.id());

        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport("YEARLY", null, null, null, null, 2026);

        assertEquals("YEARLY", report.periodType());
        assertEquals("2026-01-01", report.from());
        assertEquals("2026-12-31", report.to());
        assertEquals(12, report.breakdown().size());
        assertEquals("2026-01", report.breakdown().get(0).period());
        assertEquals("2026-12", report.breakdown().get(11).period());

        // Total 3 monitors sold: 3600000 revenue
        assertEquals(3600000L, report.netRevenuePaise());
        assertEquals(2400000L, report.cogsPaise());
        assertEquals(1200000L, report.grossProfitPaise());
        assertEquals(2, report.completedSalesCount());
        assertEquals(3, report.unitsSold());

        // Breakdown check
        assertEquals(1200000L, report.breakdown().get(0).netRevenuePaise());
        assertEquals(2400000L, report.breakdown().get(11).netRevenuePaise());
        assertEquals(0L, report.breakdown().get(5).netRevenuePaise()); // June has 0
    }

    // ==========================================
    // 5. CUSTOM DATE RANGE TESTS (DAILY VS MONTHLY AGGREGATION)
    // ==========================================

    @Test
    @DisplayName("5. Custom range <= 31 days generates daily aggregation")
    void testCustomRangeDailyAggregation() {
        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport(
            "CUSTOM", "2026-06-01", "2026-06-25", null, null, null
        );

        assertEquals("CUSTOM", report.periodType());
        assertEquals(25, report.breakdown().size());
        assertEquals("2026-06-01", report.breakdown().get(0).period());
        assertEquals("2026-06-25", report.breakdown().get(24).period());
    }

    @Test
    @DisplayName("6. Custom range > 31 days generates monthly aggregation")
    void testCustomRangeMonthlyAggregation() {
        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport(
            "CUSTOM", "2026-06-01", "2026-07-20", null, null, null
        );

        assertEquals("CUSTOM", report.periodType());
        assertEquals(2, report.breakdown().size()); // June 2026 and July 2026
        assertEquals("2026-06", report.breakdown().get(0).period());
        assertEquals("2026-07", report.breakdown().get(1).period());
    }

    // ==========================================
    // 6. VALIDATION AND ERROR HANDLING TESTS
    // ==========================================

    @Test
    @DisplayName("7. Rejects start date after end date with 400 Bad Request")
    void testValidationStartDateAfterEndDate() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("CUSTOM", "2026-06-20", "2026-06-10", null, null, null);
        });
        assertTrue(ex.getMessage().contains("cannot be after end date"));

        ResponseEntity<Map<String, String>> resp = controller.handleBadRequest(ex);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertTrue(resp.getBody().get("error").contains("cannot be after end date"));
    }

    @Test
    @DisplayName("8. Rejects invalid date format with 400 Bad Request")
    void testValidationInvalidDateFormat() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("CUSTOM", "invalid-date", "2026-06-10", null, null, null);
        });
        assertTrue(ex1.getMessage().contains("Expected format: YYYY-MM-DD"));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("DAILY", null, null, "2026/05/10", null, null);
        });
        assertTrue(ex2.getMessage().contains("Expected format: YYYY-MM-DD"));
    }

    @Test
    @DisplayName("9. Rejects invalid month and year parameters")
    void testValidationInvalidMonthAndYear() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("MONTHLY", null, null, null, 13, 2026);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("MONTHLY", null, null, null, 0, 2026);
        });
        assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("YEARLY", null, null, null, null, 1850);
        });
    }

    @Test
    @DisplayName("10. Rejects invalid period type")
    void testValidationInvalidPeriodType() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.getFinancialSummaryReport("BIWEEKLY", null, null, null, null, null);
        });
    }

    // ==========================================
    // 7. CALENDAR BOUNDARY & LEAP YEAR TESTS
    // ==========================================

    @Test
    @DisplayName("11. Handles leap year and non-leap year February dates correctly")
    void testLeapYearFebruaryHandling() {
        // Leap year 2024
        StockpileService.FinancialSummaryReport leap = service.getFinancialSummaryReport("MONTHLY", null, null, null, 2, 2024);
        assertEquals("2024-02-01", leap.from());
        assertEquals("2024-02-29", leap.to());
        assertEquals(29, leap.breakdown().size());

        // Non-leap year 2025
        StockpileService.FinancialSummaryReport nonLeap = service.getFinancialSummaryReport("MONTHLY", null, null, null, 2, 2025);
        assertEquals("2025-02-01", nonLeap.from());
        assertEquals("2025-02-28", nonLeap.to());
        assertEquals(28, nonLeap.breakdown().size());
    }

    // ==========================================
    // 8. ASIA/KOLKATA TIMEZONE BOUNDARY TESTS
    // ==========================================

    @Test
    @DisplayName("12. Precisely respects Asia/Kolkata (UTC+05:30) business day boundaries")
    void testAsiaKolkataTimezoneBoundaries() {
        StockpileService.Product p = createTestProduct("Tea", "TEA-01", "Beverages", 1000L, 2000L, 200);

        // Target business day: 2026-08-15 (Independence Day)
        // 00:00:00 Asia/Kolkata is 2026-08-14 18:30:00 UTC
        // 23:59:59 Asia/Kolkata is 2026-08-15 18:29:59 UTC

        // 1. Just before start: 2026-08-14 18:29:59 UTC (Kolkata 23:59:59 Aug 14) -> EXCLUDED
        StockpileService.SaleDetails sBefore = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-08-14 18:29:59' WHERE id = ?", sBefore.id());

        // 2. Exact start boundary: 2026-08-14 18:30:00 UTC (Kolkata 00:00:00 Aug 15) -> INCLUDED
        StockpileService.SaleDetails sStart = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "UPI"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-08-14 18:30:00' WHERE id = ?", sStart.id());

        // 3. Just before end boundary: 2026-08-15 18:29:59 UTC (Kolkata 23:59:59 Aug 15) -> INCLUDED
        StockpileService.SaleDetails sEnd = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)), 0L, "CARD"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-08-15 18:29:59' WHERE id = ?", sEnd.id());

        // 4. Exact end boundary / next day: 2026-08-15 18:30:00 UTC (Kolkata 00:00:00 Aug 16) -> EXCLUDED
        StockpileService.SaleDetails sAfter = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 4)), 0L, "CASH"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-08-15 18:30:00' WHERE id = ?", sAfter.id());

        // Query daily report for 2026-08-15
        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport("DAILY", null, null, "2026-08-15", null, null);

        // Only sStart (2 units) and sEnd (3 units) should be included = 5 units
        assertEquals(2, report.completedSalesCount());
        assertEquals(5, report.unitsSold());
        assertEquals(10000L, report.netRevenuePaise()); // 5 * 2000
        assertEquals(2, report.transactions().size());
    }

    // ==========================================
    // 9. CONSISTENCY ACROSS ALL 5 ENDPOINTS
    // ==========================================

    @Test
    @DisplayName("13. Consistent totals across all 5 report endpoints under identical filter")
    void testConsistentTotalsAcrossAllEndpoints() {
        StockpileService.Product p1 = createTestProduct("Book", "BK-01", "Stationery", 20000L, 35000L, 50);
        StockpileService.Product p2 = createTestProduct("Pen", "PN-01", "Stationery", 2000L, 5000L, 100);

        // Sale 1
        StockpileService.SaleDetails s1 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p1.id(), 2)), 5000L, "UPI"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-09-10 10:00:00' WHERE id = ?", s1.id());

        // Sale 2
        StockpileService.SaleDetails s2 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p2.id(), 10)), 0L, "CASH"
        ));
        jdbcTemplate.update("UPDATE sales SET created_at = '2026-09-15 10:00:00' WHERE id = ?", s2.id());

        // Inventory Loss: 3 pens damaged
        service.recordMovement(new StockpileService.CreateMovementRequest(
            p2.id(), "ADJUSTMENT", 97, "Damaged during stock check"
        ));
        jdbcTemplate.update("UPDATE stock_movements SET created_at = '2026-09-12 10:00:00' WHERE reason LIKE 'Damaged%'");

        // Operating Expense
        StockpileService.ExpenseRecord exp = service.createExpense(new StockpileService.CreateExpenseRequest(
            "Software", 10000L, "Accounting tools"
        ));
        jdbcTemplate.update("UPDATE expenses SET created_at = '2026-09-14 10:00:00' WHERE id = ?", exp.id());

        // Purchase Order
        StockpileService.Supplier sup = createTestSupplier("Paper Co");
        StockpileService.PurchaseOrderDetails po = service.createPurchaseOrder(new StockpileService.CreatePurchaseOrderRequest(
            sup.id(), "Restock pens", List.of(new StockpileService.CreatePurchaseOrderItemRequest(p2.id(), 50, 2000L))
        ));
        jdbcTemplate.update("UPDATE purchase_orders SET created_at = '2026-09-16 10:00:00' WHERE id = ?", po.id());

        String from = "2026-09-01";
        String to = "2026-09-30";

        StockpileService.FinancialSummaryReport summary = service.getFinancialSummaryReport("CUSTOM", from, to, null, null, null);
        StockpileService.ProfitLossReport pnl = service.getProfitLossReport("CUSTOM", from, to, null, null, null);
        StockpileService.SalesReport sales = service.getSalesReport("CUSTOM", from, to, null, null, null);
        StockpileService.InventoryLossReport loss = service.getInventoryLossReport("CUSTOM", from, to, null, null, null);
        StockpileService.PurchasesReport purchases = service.getPurchasesReport("CUSTOM", from, to, null, null, null);

        // Verify mathematical cross-endpoint consistency
        assertEquals(summary.grossSalesPaise(), pnl.grossSalesPaise());
        assertEquals(summary.grossSalesPaise(), sales.grossSalesPaise());

        assertEquals(summary.discountsPaise(), pnl.discountsPaise());
        assertEquals(summary.discountsPaise(), sales.discountsPaise());

        assertEquals(summary.netRevenuePaise(), pnl.netRevenuePaise());
        assertEquals(summary.netRevenuePaise(), sales.netRevenuePaise());

        assertEquals(summary.cogsPaise(), pnl.cogsPaise());
        assertEquals(summary.cogsPaise(), sales.cogsPaise());

        assertEquals(summary.grossProfitPaise(), pnl.grossProfitPaise());
        assertEquals(summary.grossProfitPaise(), sales.grossProfitPaise());

        assertEquals(summary.inventoryLossPaise(), pnl.inventoryLossPaise());
        assertEquals(summary.inventoryLossPaise(), loss.totalLossPaise());

        assertEquals(summary.operatingExpensesPaise(), pnl.operatingExpensesPaise());
        assertEquals(summary.operatingResultPaise(), pnl.operatingResultPaise());

        assertEquals(summary.totalPurchasesPaise(), purchases.totalSpendPaise());
        assertEquals(summary.purchaseOrdersCount(), purchases.totalOrdersCount());
        assertEquals(summary.completedSalesCount(), sales.completedSalesCount());
        assertEquals(summary.unitsSold(), sales.unitsSold());
    }

    // ==========================================
    // 10. CANCELLED SALES EXCLUDED
    // ==========================================

    @Test
    @DisplayName("14. Cancelled sales are strictly excluded from all reports")
    void testCancelledSalesExcluded() {
        StockpileService.Product p = createTestProduct("Chair", "CHR-01", "Furniture", 100000L, 200000L, 10);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));
        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer returned goods"));

        StockpileService.FinancialSummaryReport summary = service.getFinancialSummaryReport("DAILY", null, null, LocalDate.now().toString(), null, null);
        assertEquals(0, summary.completedSalesCount());
        assertEquals(0L, summary.netRevenuePaise());
        assertEquals(0L, summary.cogsPaise());
        assertEquals(0L, summary.grossProfitPaise());
        assertTrue(summary.transactions().isEmpty());
    }

    // ==========================================
    // 11. INVENTORY LOSS DERIVATION & NO DOUBLE COUNTING
    // ==========================================

    @Test
    @DisplayName("15. Inventory losses properly derived from adjustments, non-sale outs and stock audits without double counting")
    void testInventoryLossDerivation() {
        StockpileService.Product p = createTestProduct("Glassware", "GLS-01", "Kitchen", 5000L, 10000L, 50);

        // 1. Adjustment deficit: 50 -> 45 (5 lost)
        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "ADJUSTMENT", 45, "Broken items found"));

        // 2. Non-sale OUT: 2 lost
        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "OUT", 2, "Sample given to reviewer"));

        // 3. Regular sale: OUT with reason "Sale #..." -> MUST NOT be in loss report
        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)), 0L, "CASH"
        ));

        // 4. Stock Audit completion discrepancy: 40 -> 38 (2 lost)
        StockpileService.StockAuditDetails audit = service.createStockAudit(new StockpileService.CreateStockAuditRequest(
            List.of(p.id()), "Audit discrepancy test"
        ));
        service.enterCount(audit.id(), audit.items().get(0).id(), new StockpileService.EnterCountRequest(38, "Found 38"));
        service.completeStockAudit(audit.id());

        StockpileService.InventoryLossReport loss = service.getInventoryLossReport("DAILY", null, null, LocalDate.now().toString(), null, null);

        // Total lost: 5 (adjustment) + 2 (non-sale out) + 2 (audit adjustment) = 9 units
        assertEquals(9, loss.totalUnitsLost());
        assertEquals(9 * 5000L, loss.totalLossPaise()); // 45000 paise
        assertEquals(3, loss.incidentCount());
    }

    // ==========================================
    // 12. PURCHASES ARE NOT OPERATING EXPENSES
    // ==========================================

    @Test
    @DisplayName("16. Purchases are procurement and not classified as operating expenses")
    void testPurchasesNotOperatingExpenses() {
        StockpileService.Product p = createTestProduct("Steel", "STL-01", "Raw", 100000L, 150000L, 10);
        StockpileService.Supplier sup = createTestSupplier("Metal Supplies");

        // PO for 500000 paise
        service.createPurchaseOrder(new StockpileService.CreatePurchaseOrderRequest(
            sup.id(), "Raw metal PO", List.of(new StockpileService.CreatePurchaseOrderItemRequest(p.id(), 5, 100000L))
        ));

        StockpileService.ProfitLossReport pnl = service.getProfitLossReport("DAILY", null, null, LocalDate.now().toString(), null, null);
        StockpileService.PurchasesReport purchases = service.getPurchasesReport("DAILY", null, null, LocalDate.now().toString(), null, null);

        assertEquals(500000L, purchases.totalSpendPaise());
        assertEquals(0L, pnl.operatingExpensesPaise()); // PO spend must NOT be in operating expenses!
    }

    // ==========================================
    // 13. OPERATING EXPENSES CRUD AND PNL IMPACT
    // ==========================================

    @Test
    @DisplayName("17. Operating expenses CRUD and correct deduction in Profit & Loss report")
    void testOperatingExpensesCRUDAndPnL() {
        StockpileService.ExpenseRecord e1 = service.createExpense(new StockpileService.CreateExpenseRequest(
            "Rent", 3000000L, "Warehouse rental"
        ));
        StockpileService.ExpenseRecord e2 = service.createExpense(new StockpileService.CreateExpenseRequest(
            "Internet", 150000L, "Fiber optic broadband"
        ));

        assertNotNull(e1.id());
        assertNotNull(e2.id());

        List<StockpileService.ExpenseRecord> list = service.getExpenses();
        assertTrue(list.size() >= 2);

        StockpileService.ProfitLossReport pnl = service.getProfitLossReport("DAILY", null, null, LocalDate.now().toString(), null, null);
        assertEquals(3150000L, pnl.operatingExpensesPaise());
        assertEquals(-3150000L, pnl.operatingResultPaise()); // 0 gross profit - 3150000 expenses
    }

    // ==========================================
    // 14. TOP SELLING PRODUCTS & PAYMENT METHOD BREAKDOWN
    // ==========================================

    @Test
    @DisplayName("18. Sales report calculates payment methods and top products ranked by revenue")
    void testSalesReportRankings() {
        StockpileService.Product p1 = createTestProduct("iPhone Case", "CS-01", "Accessories", 50000L, 150000L, 100);
        StockpileService.Product p2 = createTestProduct("Screen Protector", "SP-01", "Accessories", 20000L, 60000L, 100);

        // 2 cases via UPI
        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p1.id(), 2)), 0L, "UPI"
        ));

        // 1 case and 3 screen protectors via CASH
        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 1),
                new StockpileService.SaleItemRequest(p2.id(), 3)
            ), 0L, "CASH"
        ));

        StockpileService.SalesReport report = service.getSalesReport("DAILY", null, null, LocalDate.now().toString(), null, null);

        assertEquals(2, report.paymentMethods().size());
        assertEquals(2, report.topSellingProducts().size());

        // Top product: iPhone Case (3 units * 150000 = 450000 paise)
        StockpileService.TopSellingProduct top = report.topSellingProducts().get(0);
        assertEquals(p1.id(), top.productId());
        assertEquals("iPhone Case", top.productName());
        assertEquals(3, top.unitsSold());
        assertEquals(450000L, top.totalRevenuePaise());
    }

    // ==========================================
    // 15. CONTROLLER HTTP ENDPOINT INTEGRATION
    // ==========================================

    @Test
    @DisplayName("19. Controller endpoints map query params and return expected responses")
    void testControllerEndpointsIntegration() {
        StockpileService.FinancialSummaryReport summary = controller.getFinancialSummaryReport(
            "DAILY", null, null, LocalDate.now().toString(), null, null
        );
        assertNotNull(summary);

        StockpileService.ProfitLossReport pnl = controller.getProfitLossReport(
            "DAILY", null, null, LocalDate.now().toString(), null, null
        );
        assertNotNull(pnl);

        StockpileService.SalesReport sales = controller.getSalesReport(
            "DAILY", null, null, LocalDate.now().toString(), null, null
        );
        assertNotNull(sales);

        StockpileService.InventoryLossReport loss = controller.getInventoryLossReport(
            "DAILY", null, null, LocalDate.now().toString(), null, null
        );
        assertNotNull(loss);

        StockpileService.PurchasesReport po = controller.getPurchasesReport(
            "DAILY", null, null, LocalDate.now().toString(), null, null
        );
        assertNotNull(po);

        StockpileService.ExpenseRecord created = controller.createExpense(
            new StockpileService.CreateExpenseRequest("Stationery", 25000L, "Office printing")
        );
        assertNotNull(created.id());

        List<StockpileService.ExpenseRecord> expenses = controller.getExpenses();
        assertFalse(expenses.isEmpty());
    }

    // ==========================================
    // 16. IMPLICIT DATE RANGE RESOLUTION
    // ==========================================

    @Test
    @DisplayName("20. Single 'from' or 'to' defaults appropriately to single-day range")
    void testImplicitDateRange() {
        StockpileService.FinancialSummaryReport r1 = service.getFinancialSummaryReport(null, "2026-10-15", null, null, null, null);
        assertEquals("2026-10-15", r1.from());
        assertEquals("2026-10-15", r1.to());
        assertEquals("DAILY", r1.periodType());

        StockpileService.FinancialSummaryReport r2 = service.getFinancialSummaryReport(null, null, "2026-10-20", null, null, null);
        assertEquals("2026-10-20", r2.from());
        assertEquals("2026-10-20", r2.to());
        assertEquals("DAILY", r2.periodType());
    }
}
