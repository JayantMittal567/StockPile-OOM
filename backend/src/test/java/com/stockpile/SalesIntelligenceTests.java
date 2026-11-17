package com.stockpile;

import com.stockpile.exception.*;
import com.stockpile.model.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:sqlite:target/test-stockpile.db",
    "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:schema.sql"
})
public class SalesIntelligenceTests {

    @Autowired
    private StockpileService service;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM purchase_order_items");
        jdbcTemplate.update("DELETE FROM purchase_orders");
        jdbcTemplate.update("DELETE FROM product_suppliers");
        jdbcTemplate.update("DELETE FROM suppliers");
        jdbcTemplate.update("DELETE FROM sale_items");
        jdbcTemplate.update("DELETE FROM sales");
        jdbcTemplate.update("DELETE FROM stock_movements");
        jdbcTemplate.update("DELETE FROM products");
    }

    private Product createProduct(String name, String sku, String category, int qty, int minStock, int targetStock) {
        return service.createProduct(new CreateProductRequest(
            name, sku, category, 10000L, 20000L, qty, minStock, targetStock, 1.0, 5
        ));
    }

    private SaleDetails createSale(Long productId, int quantity) {
        return service.createSale(new CreateSaleRequest(
            List.of(new SaleItemRequest(productId, quantity)),
            0L,
            "CASH"
        ));
    }

    // ==========================================
    // 1. EMPTY DATABASE
    // ==========================================
    @Test
    @DisplayName("1. Empty database returns zero counts and empty lists")
    void test01_EmptyDatabase() {
        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertNotNull(res);
        assertNotNull(res.summary());
        assertNotNull(res.products());

        assertTrue(res.products().isEmpty());
        assertEquals(0, res.summary().totalProducts());
        assertTrue(res.summary().fastSellingProducts().isEmpty());
        assertEquals(0, res.summary().slowMovingProducts());
        assertEquals(0, res.summary().potentialDeadStockProducts());
        assertEquals(0, res.summary().noSalesHistoryProducts());
        assertEquals(0, res.summary().outOfStockProducts());
        assertEquals(0, res.summary().productsNeedingRestock());
    }

    // ==========================================
    // 2. PRODUCT WITH NO SALES HISTORY
    // ==========================================
    @Test
    @DisplayName("2. Product with no sales history is classified as NO_SALES_HISTORY and INSUFFICIENT_DATA")
    void test02_ProductWithNoSalesHistory() {
        Product p = createProduct("Unsold Product", "UNS-001", "Tools", 15, 5, 25);

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(p.id(), intel.productId());
        assertEquals("Unsold Product", intel.productName());
        assertEquals(15, intel.currentQuantity());
        assertEquals(5, intel.lowStockLevel());
        assertEquals(25, intel.preferredStockLevel());
        assertEquals(0, intel.unitsSoldLast30Days());
        assertEquals(0, intel.unitsSoldPrevious30Days());
        assertEquals(0.0, intel.averageDailySalesLast30Days(), 0.001);
        assertNull(intel.lastSoldAt());
        assertNull(intel.daysSinceLastSale());
        assertEquals("NO_SALES_HISTORY", intel.salesActivity());
        assertEquals("INSUFFICIENT_DATA", intel.salesTrend());
        assertEquals(0, intel.recommendedRestockQuantity());

        assertEquals(1, res.summary().totalProducts());
        assertEquals(1, res.summary().noSalesHistoryProducts());
        assertEquals(0, res.summary().slowMovingProducts());
        assertEquals(0, res.summary().potentialDeadStockProducts());
    }

    // ==========================================
    // 3. PRODUCT SOLD RECENTLY
    // ==========================================
    @Test
    @DisplayName("3. Product sold recently is classified as ACTIVE with NEW_SALES trend")
    void test03_ProductSoldRecently() {
        Product p = createProduct("Active Drill", "DRL-ACT-01", "Power Tools", 20, 5, 30);
        createSale(p.id(), 3);

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(3, intel.unitsSoldLast30Days());
        assertEquals(0, intel.unitsSoldPrevious30Days());
        assertEquals(0.1, intel.averageDailySalesLast30Days(), 0.01);
        assertNotNull(intel.lastSoldAt());
        assertNotNull(intel.daysSinceLastSale());
        assertEquals(0, intel.daysSinceLastSale());
        assertEquals("ACTIVE", intel.salesActivity());
        assertEquals("NEW_SALES", intel.salesTrend());
        assertEquals(1, res.summary().fastSellingProducts().size());
    }

    // ==========================================
    // 4. PRODUCT LAST SOLD 35 DAYS AGO
    // ==========================================
    @Test
    @DisplayName("4. Product last sold 35 days ago is classified as SLOW_MOVING and DECREASING")
    void test04_ProductLastSold35DaysAgo() {
        Product p = createProduct("Slow Wrench", "WRN-SLW-01", "Hand Tools", 20, 5, 30);
        SaleDetails sale = createSale(p.id(), 4);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-35 days') WHERE id = ?", sale.id());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(0, intel.unitsSoldLast30Days());
        assertEquals(4, intel.unitsSoldPrevious30Days());
        assertEquals(35, intel.daysSinceLastSale());
        assertEquals("SLOW_MOVING", intel.salesActivity());
        assertEquals("DECREASING", intel.salesTrend());

        assertEquals(1, res.summary().slowMovingProducts());
        assertEquals(0, res.summary().potentialDeadStockProducts());
    }

    // ==========================================
    // 5. PRODUCT LAST SOLD 50 DAYS AGO
    // ==========================================
    @Test
    @DisplayName("5. Product last sold 50 days ago is classified as POTENTIAL_DEAD_STOCK and DECREASING")
    void test05_ProductLastSold50DaysAgo() {
        Product p = createProduct("Stagnant Saw", "SAW-STG-01", "Power Tools", 10, 5, 20);
        SaleDetails sale = createSale(p.id(), 2);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-50 days') WHERE id = ?", sale.id());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(0, intel.unitsSoldLast30Days());
        assertEquals(2, intel.unitsSoldPrevious30Days());
        assertEquals(50, intel.daysSinceLastSale());
        assertEquals("POTENTIAL_DEAD_STOCK", intel.salesActivity());
        assertEquals("DECREASING", intel.salesTrend());

        assertEquals(1, res.summary().potentialDeadStockProducts());
        assertEquals(0, res.summary().slowMovingProducts());
    }

    // ==========================================
    // 6. PRODUCT WITH ZERO STOCK
    // ==========================================
    @Test
    @DisplayName("6. Product with zero stock is strictly classified as OUT_OF_STOCK regardless of sale history")
    void test06_ProductWithZeroStock() {
        Product p = createProduct("Depleted Screws", "SCR-DEP-01", "Fasteners", 5, 5, 50);
        // Sell all 5 units
        createSale(p.id(), 5);

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(0, intel.currentQuantity());
        assertEquals("OUT_OF_STOCK", intel.salesActivity());
        assertEquals(50, intel.recommendedRestockQuantity());
        assertTrue(intel.recommendation().toLowerCase().contains("out of stock"));
        assertEquals(1, res.summary().outOfStockProducts());
        assertEquals(1, res.summary().productsNeedingRestock());
    }

    // ==========================================
    // 7. PRODUCT WITH MULTIPLE COMPLETED SALES
    // ==========================================
    @Test
    @DisplayName("7. Product with multiple completed sales aggregates correctly")
    void test07_ProductWithMultipleCompletedSales() {
        Product p = createProduct("Multi Sale Tape", "TAP-MLT-01", "Accessories", 50, 10, 60);
        createSale(p.id(), 5);
        createSale(p.id(), 7);
        createSale(p.id(), 3);

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(15, intel.unitsSoldLast30Days());
        assertEquals(0.5, intel.averageDailySalesLast30Days(), 0.01);
        assertEquals("ACTIVE", intel.salesActivity());
    }

    // ==========================================
    // 8. PRODUCT WITH CANCELLED SALES ONLY
    // ==========================================
    @Test
    @DisplayName("8. Product with only cancelled sales has no sales history in intelligence")
    void test08_ProductWithCancelledSalesOnly() {
        Product p = createProduct("Cancelled Product", "CAN-PRD-01", "Tools", 20, 5, 30);
        SaleDetails sale = createSale(p.id(), 5);
        service.cancelSale(sale.id(), new CancelSaleRequest("Customer cancelled order"));

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(20, intel.currentQuantity()); // stock restored
        assertEquals(0, intel.unitsSoldLast30Days());
        assertEquals(0, intel.unitsSoldPrevious30Days());
        assertNull(intel.lastSoldAt());
        assertNull(intel.daysSinceLastSale());
        assertEquals("NO_SALES_HISTORY", intel.salesActivity());
        assertEquals("INSUFFICIENT_DATA", intel.salesTrend());
    }

    // ==========================================
    // 9. CANCELLED SALE EXCLUDED FROM ANALYTICS
    // ==========================================
    @Test
    @DisplayName("9. Cancelled sales are strictly excluded when completed sales also exist")
    void test09_CancelledSaleExcludedFromAnalytics() {
        Product p = createProduct("Partially Cancelled", "PRT-CAN-01", "Tools", 30, 5, 40);
        createSale(p.id(), 4); // Completed sale (4 units)
        SaleDetails sale2 = createSale(p.id(), 10);
        service.cancelSale(sale2.id(), new CancelSaleRequest("Order error")); // Cancelled (10 units)

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(4, intel.unitsSoldLast30Days());
        assertEquals(0, intel.unitsSoldPrevious30Days());
        assertEquals("ACTIVE", intel.salesActivity());
    }

    // ==========================================
    // 10. CORRECT UNITS SOLD IN LAST 30 DAYS
    // ==========================================
    @Test
    @DisplayName("10. Correct units sold in the last 30 days window")
    void test10_CorrectUnitsSoldInLast30Days() {
        Product p = createProduct("Window Product", "WIN-PRD-01", "Hardware", 50, 10, 60);
        SaleDetails s1 = createSale(p.id(), 6);
        SaleDetails s2 = createSale(p.id(), 8);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-5 days') WHERE id = ?", s1.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-25 days') WHERE id = ?", s2.id());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(14, intel.unitsSoldLast30Days());
        assertEquals(0, intel.unitsSoldPrevious30Days());
    }

    // ==========================================
    // 11. CORRECT UNITS SOLD IN PREVIOUS 30 DAYS
    // ==========================================
    @Test
    @DisplayName("11. Correct units sold in the previous 30 days window (days 31-60)")
    void test11_CorrectUnitsSoldInPrevious30Days() {
        Product p = createProduct("Old Sale Product", "OLD-PRD-01", "Hardware", 40, 10, 50);
        SaleDetails s1 = createSale(p.id(), 5);
        SaleDetails s2 = createSale(p.id(), 7);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-35 days') WHERE id = ?", s1.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-55 days') WHERE id = ?", s2.id());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(0, intel.unitsSoldLast30Days());
        assertEquals(12, intel.unitsSoldPrevious30Days());
    }

    // ==========================================
    // 12. CORRECT AVERAGE DAILY SALES
    // ==========================================
    @Test
    @DisplayName("12. Correct Average Daily Sales (Units / 30 rounded to 2 decimals)")
    void test12_CorrectAverageDailySales() {
        Product p = createProduct("ADS Product", "ADS-PRD-01", "Hardware", 50, 10, 60);
        createSale(p.id(), 10); // 10 / 30 = 0.33

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(0.33, intel.averageDailySalesLast30Days(), 0.01);
    }

    // ==========================================
    // 13. CORRECT LAST SALE DATE
    // ==========================================
    @Test
    @DisplayName("13. Correct latest completed sale date is retrieved")
    void test13_CorrectLastSaleDate() {
        Product p = createProduct("Date Product", "DTE-PRD-01", "Hardware", 40, 10, 50);
        SaleDetails sOld = createSale(p.id(), 2);
        SaleDetails sNew = createSale(p.id(), 3);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-40 days') WHERE id = ?", sOld.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-5 days') WHERE id = ?", sNew.id());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence intel = res.products().get(0);

        assertNotNull(intel.lastSoldAt());
        assertEquals(5, intel.daysSinceLastSale());
    }

    // ==========================================
    // 14. CORRECT DAYS SINCE LAST SALE
    // ==========================================
    @Test
    @DisplayName("14. Correct days since last sale across multiple timeframes")
    void test14_CorrectDaysSinceLastSale() {
        Product p1 = createProduct("Today", "TDY-01", "Test", 20, 5, 25);
        Product p2 = createProduct("TenDays", "TEN-01", "Test", 20, 5, 25);
        Product p3 = createProduct("FortyDays", "FTY-01", "Test", 20, 5, 25);

        SaleDetails s1 = createSale(p1.id(), 1);
        SaleDetails s2 = createSale(p2.id(), 1);
        SaleDetails s3 = createSale(p3.id(), 1);

        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-10 days') WHERE id = ?", s2.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-40 days') WHERE id = ?", s3.id());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence i1 = res.products().stream().filter(p -> p.productId().equals(p1.id())).findFirst().get();
        ProductSalesIntelligence i2 = res.products().stream().filter(p -> p.productId().equals(p2.id())).findFirst().get();
        ProductSalesIntelligence i3 = res.products().stream().filter(p -> p.productId().equals(p3.id())).findFirst().get();

        assertEquals(0, i1.daysSinceLastSale());
        assertEquals(10, i2.daysSinceLastSale());
        assertEquals(40, i3.daysSinceLastSale());
    }

    // ==========================================
    // 15. CORRECT SALES TREND
    // ==========================================
    @Test
    @DisplayName("15. Correct sales trend across all 6 categories")
    void test15_CorrectSalesTrend() {
        // INCREASING: 10 prev, 20 recent (+100% > +10%)
        Product pInc = createProduct("Inc Product", "INC-01", "Test", 50, 5, 50);
        SaleDetails sIncOld = createSale(pInc.id(), 10);
        SaleDetails sIncNew = createSale(pInc.id(), 20);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-40 days') WHERE id = ?", sIncOld.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-5 days') WHERE id = ?", sIncNew.id());

        // DECREASING: 10 prev, 5 recent (-50% < -10%)
        Product pDec = createProduct("Dec Product", "DEC-01", "Test", 50, 5, 50);
        SaleDetails sDecOld = createSale(pDec.id(), 10);
        SaleDetails sDecNew = createSale(pDec.id(), 5);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-40 days') WHERE id = ?", sDecOld.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-5 days') WHERE id = ?", sDecNew.id());

        // STABLE: 10 prev, 10 recent (0% within [-10%, 10%])
        Product pStb = createProduct("Stb Product", "STB-01", "Test", 50, 5, 50);
        SaleDetails sStbOld = createSale(pStb.id(), 10);
        SaleDetails sStbNew = createSale(pStb.id(), 10);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-40 days') WHERE id = ?", sStbOld.id());
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-5 days') WHERE id = ?", sStbNew.id());

        // NEW_SALES: 0 prev, 5 recent
        Product pNew = createProduct("New Product", "NEW-01", "Test", 50, 5, 50);
        createSale(pNew.id(), 5);

        // NO_RECENT_SALES: sold 70 days ago (0 prev, 0 recent, has sale history)
        Product pNoRec = createProduct("NoRec Product", "NRC-01", "Test", 50, 5, 50);
        SaleDetails sAncient = createSale(pNoRec.id(), 2);
        jdbcTemplate.update("UPDATE sales SET created_at = datetime('now', '-70 days') WHERE id = ?", sAncient.id());

        // INSUFFICIENT_DATA: never sold
        Product pNone = createProduct("NoSale Product", "NSL-01", "Test", 50, 5, 50);

        SalesIntelligenceResponse res = service.getSalesIntelligence();

        assertEquals("INCREASING", res.products().stream().filter(p -> p.productId().equals(pInc.id())).findFirst().get().salesTrend());
        assertEquals("DECREASING", res.products().stream().filter(p -> p.productId().equals(pDec.id())).findFirst().get().salesTrend());
        assertEquals("STABLE", res.products().stream().filter(p -> p.productId().equals(pStb.id())).findFirst().get().salesTrend());
        assertEquals("NEW_SALES", res.products().stream().filter(p -> p.productId().equals(pNew.id())).findFirst().get().salesTrend());
        assertEquals("NO_RECENT_SALES", res.products().stream().filter(p -> p.productId().equals(pNoRec.id())).findFirst().get().salesTrend());
        assertEquals("INSUFFICIENT_DATA", res.products().stream().filter(p -> p.productId().equals(pNone.id())).findFirst().get().salesTrend());
    }

    // ==========================================
    // 16. NO DIVISION-BY-ZERO ERRORS
    // ==========================================
    @Test
    @DisplayName("16. No division-by-zero errors when previous sales are 0 or total sales 0")
    void test16_NoDivisionByZeroErrors() {
        createProduct("Zero Product 1", "ZER-01", "Test", 10, 5, 20);
        createProduct("Zero Product 2", "ZER-02", "Test", 0, 0, 0);

        assertDoesNotThrow(() -> {
            SalesIntelligenceResponse res = service.getSalesIntelligence();
            assertNotNull(res);
            assertEquals(2, res.products().size());
        });
    }

    // ==========================================
    // 17. CORRECT RESTOCK QUANTITY
    // ==========================================
    @Test
    @DisplayName("17. Correct restock quantity calculation: max(0, preferred - current) when current <= lowStock")
    void test17_CorrectRestockQuantity() {
        // Needs restock: current 3 <= lowStock 5 -> restock 20 - 3 = 17
        Product p1 = createProduct("Low Stock", "LOW-01", "Test", 3, 5, 20);
        // Healthy: current 15 > lowStock 5 -> restock 0
        Product p2 = createProduct("Healthy Stock", "HLT-01", "Test", 15, 5, 20);

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence i1 = res.products().stream().filter(p -> p.productId().equals(p1.id())).findFirst().get();
        ProductSalesIntelligence i2 = res.products().stream().filter(p -> p.productId().equals(p2.id())).findFirst().get();

        assertEquals(17, i1.recommendedRestockQuantity());
        assertTrue(i1.recommendation().contains("17 units"));

        assertEquals(0, i2.recommendedRestockQuantity());
        assertTrue(i2.recommendation().contains("healthy"));
    }

    // ==========================================
    // 18. MISSING PREFERRED STOCK LEVEL HANDLED CORRECTLY
    // ==========================================
    @Test
    @DisplayName("18. Missing preferred stock level prompts user to configure without inventing target")
    void test18_MissingPreferredStockLevelHandledCorrectly() {
        // targetStockLevel = 0 (unconfigured)
        Product p = createProduct("No Preferred", "NOP-01", "Test", 2, 5, 0);

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        ProductSalesIntelligence intel = res.products().get(0);

        assertEquals(0, intel.recommendedRestockQuantity());
        assertTrue(intel.recommendation().toLowerCase().contains("preferred stock level is not configured"));
    }

    // ==========================================
    // 19. EXISTING PRODUCTS WITHOUT SALES STILL WORK
    // ==========================================
    @Test
    @DisplayName("19. Existing product CRUD and inventory adjustments continue to function normally")
    void test19_ExistingProductsWithoutSalesStillWork() {
        Product p = createProduct("Standard Product", "STD-01", "General", 10, 5, 20);
        service.recordMovement(new CreateMovementRequest(p.id(), "IN", 5, "Received shipment"));
        service.recordMovement(new CreateMovementRequest(p.id(), "OUT", 3, "Internal use"));
        service.recordMovement(new CreateMovementRequest(p.id(), "ADJUSTMENT", 14, "Count reconciliation"));

        Product updated = service.getProductById(p.id());
        assertEquals(14, updated.quantity());

        SalesIntelligenceResponse res = service.getSalesIntelligence();
        assertEquals(1, res.products().size());
        assertEquals(14, res.products().get(0).currentQuantity());
    }

    // ==========================================
    // 20. EXISTING SALES APIS STILL WORK
    // ==========================================
    @Test
    @DisplayName("20. Existing Sales APIs (create, list, getById, cancel) remain fully functional")
    void test20_ExistingSalesApisStillWork() {
        Product p = createProduct("Sales Test", "SLS-01", "Tools", 30, 5, 40);
        SaleDetails sale = createSale(p.id(), 4);

        assertEquals(1, service.getSales(null).size());
        SaleDetails fetched = service.getSaleById(sale.id());
        assertEquals(sale.id(), fetched.id());

        SaleDetails cancelled = service.cancelSale(sale.id(), new CancelSaleRequest("Test cancel"));
        assertEquals("CANCELLED", cancelled.status());
    }

    // ==========================================
    // 21. EXISTING PURCHASE ORDER APIS STILL WORK
    // ==========================================
    @Test
    @DisplayName("21. Existing Purchase Order APIs remain fully functional")
    void test21_ExistingPurchaseOrderApisStillWork() {
        Supplier sup = service.createSupplier(new CreateSupplierRequest(
            "PO Supplier", "Contact", "9876543210", "po@sup.com", "Address", "Notes"
        ));
        Product p = createProduct("PO Item", "PO-ITM-01", "Parts", 10, 5, 50);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            sup.id(), "PO Notes", List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, 10000L))
        ));
        assertEquals("DRAFT", po.status());

        PurchaseOrderDetails placed = service.placePurchaseOrder(po.id());
        assertEquals("ORDERED", placed.status());

        PurchaseOrderDetails received = service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(placed.items().get(0).id(), 20))
        ));
        assertEquals("RECEIVED", received.status());
        assertEquals(30, service.getProductById(p.id()).quantity()); // 10 + 20 = 30
    }

    // ==========================================
    // 22. EXISTING DASHBOARD AND INVENTORY APIS REMAIN FUNCTIONAL
    // ==========================================
    @Test
    @DisplayName("22. Existing Dashboard and Intelligence APIs remain functional")
    void test22_ExistingDashboardAndInventoryApisRemainFunctional() {
        createProduct("Dash Item 1", "DSH-01", "Category A", 10, 5, 20);
        createProduct("Dash Item 2", "DSH-02", "Category B", 0, 5, 20);

        DashboardResponse dashboard = service.getDashboard();
        assertNotNull(dashboard);
        assertEquals(2, dashboard.summary().totalProducts());
        assertEquals(1, dashboard.summary().outOfStockCount());

        List<ProductIntelligence> legacyIntel = service.getInventoryIntelligence();
        assertNotNull(legacyIntel);
        assertEquals(2, legacyIntel.size());
    }
}
