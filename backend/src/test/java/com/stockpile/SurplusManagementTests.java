package com.stockpile;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:sqlite:target/test-stockpile.db",
    "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:schema.sql"
})
public class SurplusManagementTests {

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
        jdbcTemplate.update("DELETE FROM surplus_listings");
        jdbcTemplate.update("DELETE FROM stock_movements");
        jdbcTemplate.update("DELETE FROM products");
    }

    private StockpileService.Product createProduct(String name, String sku, String category, long purchasePaise, long sellingPaise, int qty, int targetStock) {
        return service.createProduct(new StockpileService.CreateProductRequest(
            name, sku, category, purchasePaise, sellingPaise, qty, 5, targetStock, 1.0, 5
        ));
    }

    private StockpileService.Supplier createSupplier(String name) {
        return service.createSupplier(new StockpileService.CreateSupplierRequest(
            name, "Contact Person", "9876543210", "vendor@example.com", "Main Street", "Reliable"
        ));
    }

    // ==========================================
    // 1. SUGGESTIONS TESTS
    // ==========================================

    @Test
    @DisplayName("1. Product above preferred stock level produces suggested surplus quantity")
    void testProductAbovePreferredStockLevel() {
        StockpileService.Product p = createProduct("Wireless Mouse", "WM-001", "Electronics", 30000, 50000, 50, 30);
        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertEquals(50, s.currentQuantity());
        assertEquals(0, s.reservedQuantity());
        assertEquals(50, s.availableQuantity());
        assertEquals(30, s.preferredStockLevel());
        assertEquals(20, s.suggestedSurplusQuantity());
        assertTrue(s.recommendationReason().contains("exceeds preferred stock level"));
    }

    @Test
    @DisplayName("2. Product at preferred stock level produces zero suggested surplus")
    void testProductAtPreferredStockLevel() {
        StockpileService.Product p = createProduct("Keyboard", "KB-002", "Electronics", 40000, 70000, 30, 30);
        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertEquals(30, s.currentQuantity());
        assertEquals(0, s.suggestedSurplusQuantity());
    }

    @Test
    @DisplayName("3. Product below preferred stock level produces zero suggested surplus")
    void testProductBelowPreferredStockLevel() {
        StockpileService.Product p = createProduct("Monitor", "MN-003", "Electronics", 800000, 1200000, 15, 30);
        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertEquals(15, s.currentQuantity());
        assertEquals(0, s.suggestedSurplusQuantity());
    }

    @Test
    @DisplayName("4. Product with no preferred level configured produces zero preferred-based surplus")
    void testProductWithNoPreferredLevel() {
        StockpileService.Product p = createProduct("USB Cable", "USB-004", "Accessories", 5000, 15000, 40, 0);
        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertNull(s.preferredStockLevel());
        assertEquals(0, s.suggestedSurplusQuantity());
        assertTrue(s.recommendationReason().contains("No preferred stock level configured"));
    }

    @Test
    @DisplayName("5. Slow-moving product with available stock is clearly identified")
    void testSlowMovingProductWithAvailableStock() {
        StockpileService.Product p = createProduct("Old Adapter", "OA-005", "Accessories", 10000, 25000, 25, 0);
        // Create an older completed sale 35 days ago to flag product as SLOW_MOVING
        jdbcTemplate.update("""
            INSERT INTO sales (subtotal_paise, discount_paise, total_paise, total_cost_paise, gross_profit_paise, payment_method, status, created_at)
            VALUES (25000, 0, 25000, 10000, 15000, 'CASH', 'COMPLETED', datetime('now', '-35 days'))
        """);
        Long saleId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);
        jdbcTemplate.update("""
            INSERT INTO sale_items (sale_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_selling_price_paise, unit_purchase_price_paise, line_total_paise, line_cost_paise)
            VALUES (?, ?, 'Old Adapter', 'OA-005', 1, 25000, 10000, 25000, 10000)
        """, saleId, p.id());

        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertEquals("SLOW_MOVING", s.salesActivity());
        assertTrue(s.recommendationReason().toLowerCase().contains("slow-moving"));
    }

    @Test
    @DisplayName("6. Product with active reservations shows correct reserved and available quantity")
    void testProductWithActiveReservations() {
        StockpileService.Product p = createProduct("Headphones", "HP-006", "Audio", 50000, 100000, 60, 20);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(
            p.id(), 15, 80000L, "Clearance promo"
        ));

        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertEquals(60, s.currentQuantity());
        assertEquals(15, s.reservedQuantity());
        assertEquals(45, s.availableQuantity());
    }

    @Test
    @DisplayName("7. Suggestions formula excludes already reserved quantities")
    void testSuggestionsExcludeReservedQuantities() {
        StockpileService.Product p = createProduct("Webcam", "WC-007", "Cameras", 80000, 150000, 50, 20);
        // Formula: max(0, 50 - 20 - 10) = 20
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(
            p.id(), 10, 120000L, "First batch clearance"
        ));

        List<StockpileService.SurplusSuggestion> suggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = suggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();

        assertEquals(20, s.suggestedSurplusQuantity());
    }

    // ==========================================
    // 2. LISTING CREATION TESTS
    // ==========================================

    @Test
    @DisplayName("8. Create valid surplus listing")
    void testCreateValidListing() {
        StockpileService.Product p = createProduct("Laptop Stand", "LS-008", "Accessories", 40000, 80000, 30, 10);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 65000L, "Seasonal clearance", "Batch 1")
        );

        assertNotNull(listing);
        assertNotNull(listing.id());
        assertEquals(p.id(), listing.productId());
        assertEquals("Laptop Stand", listing.productName());
        assertEquals("LS-008", listing.sku());
        assertEquals(10, listing.quantityListed());
        assertEquals(0, listing.quantitySold());
        assertEquals(10, listing.quantityRemaining());
        assertEquals(80000L, listing.regularUnitPricePaise());
        assertEquals(65000L, listing.discountedUnitPricePaise());
        assertEquals(40000L, listing.unitCostPaiseSnapshot());
        assertEquals("ACTIVE", listing.status());
        assertEquals(18.75, listing.discountPercentage());
    }

    @Test
    @DisplayName("9. Reject listing for nonexistent product")
    void testRejectNonexistentProduct() {
        assertThrows(StockpileService.ProductNotFoundException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(
                99999L, 10, 50000L, "Excess inventory"
            ));
        });
    }

    @Test
    @DisplayName("10. Reject zero or negative quantity")
    void testRejectZeroOrNegativeQuantity() {
        StockpileService.Product p = createProduct("Desk Mat", "DM-010", "Accessories", 10000, 20000, 20, 5);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 0, 15000L, "Reason"));
        });
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), -5, 15000L, "Reason"));
        });
    }

    @Test
    @DisplayName("11. Reject invalid discounted price")
    void testRejectInvalidDiscountedPrice() {
        StockpileService.Product p = createProduct("Speaker", "SP-011", "Audio", 20000, 40000, 15, 5);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 5, 0L, "Reason"));
        });
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 5, -100L, "Reason"));
        });
    }

    @Test
    @DisplayName("12. Reject discounted price greater than or equal to regular price")
    void testRejectDiscountedPriceGteRegularPrice() {
        StockpileService.Product p = createProduct("Router", "RT-012", "Networking", 30000, 60000, 20, 5);

        // Price equal to regular price
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 5, 60000L, "Reason"));
        });
        // Price greater than regular price
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 5, 75000L, "Reason"));
        });
    }

    @Test
    @DisplayName("13. Reject reservation exceeding available stock")
    void testRejectReservationExceedingAvailableStock() {
        StockpileService.Product p = createProduct("Switch", "SW-013", "Networking", 20000, 50000, 15, 5);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 20, 40000L, "Excess"));
        });
    }

    @Test
    @DisplayName("14. Verify creating listing does not reduce physical quantity")
    void testCreateListingDoesNotReducePhysicalQuantity() {
        StockpileService.Product p = createProduct("Flash Drive", "FD-014", "Storage", 5000, 10000, 50, 10);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 20, 8000L, "Promo"));

        StockpileService.Product after = service.getProductById(p.id());
        assertEquals(50, after.quantity(), "Physical stock must remain unchanged when creating surplus listing");
    }

    @Test
    @DisplayName("15. Verify no stock movement is created when creating surplus listing")
    void testNoStockMovementOnListingCreation() {
        StockpileService.Product p = createProduct("HDMI Cable", "HC-015", "Cables", 5000, 12000, 30, 5);
        int movementsBefore = service.getMovements(p.id(), null).size();

        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 10, 9000L, "Promo"));

        int movementsAfter = service.getMovements(p.id(), null).size();
        assertEquals(movementsBefore, movementsAfter, "No stock movement should be generated merely by creating a listing");
    }

    @Test
    @DisplayName("16. Multiple listings cannot reserve more than available stock")
    void testMultipleListingsCannotExceedStock() {
        StockpileService.Product p = createProduct("SD Card", "SD-016", "Storage", 8000, 16000, 25, 5);

        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 15, 13000L, "Batch 1"));
        assertEquals(15, service.getActiveReservedQuantity(p.id()));

        // Available is now 10; requesting 12 must fail
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 12, 12000L, "Batch 2"));
        });

        // Requesting 10 must succeed
        StockpileService.SurplusListingDetails second = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 12000L, "Batch 2")
        );
        assertEquals(10, second.quantityListed());
        assertEquals(25, service.getActiveReservedQuantity(p.id()));
    }

    // ==========================================
    // 3. RESERVATION INTEGRATION TESTS
    // ==========================================

    @Test
    @DisplayName("17. Normal sale cannot consume reserved stock")
    void testNormalSaleCannotConsumeReservedStock() {
        StockpileService.Product p = createProduct("Power Bank", "PB-017", "Accessories", 60000, 120000, 30, 5);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 20, 90000L, "Clearance"));

        // Physical is 30, reserved is 20, available is 10. Attempting regular sale of 15 must fail
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 15)),
                0L, "CASH"
            ));
        });

        // Sale of 10 must succeed
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 10)),
            0L, "CASH"
        ));
        assertNotNull(sale);
        assertEquals(20, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("18. Manual Stock Out cannot consume reserved stock")
    void testManualStockOutCannotConsumeReservedStock() {
        StockpileService.Product p = createProduct("Earbuds", "EB-018", "Audio", 40000, 80000, 25, 5);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 15, 60000L, "Promo"));

        // Physical: 25, Reserved: 15, Available: 10. Manual OUT of 12 must fail
        assertThrows(IllegalArgumentException.class, () -> {
            service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "OUT", 12, "Dispatch"));
        });

        // Manual OUT of 10 must succeed
        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "OUT", 10, "Dispatch"));
        assertEquals(15, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("19. Stock In remains fully functional with active reservations")
    void testStockInRemainsFunctional() {
        StockpileService.Product p = createProduct("Adapter", "AD-019", "Cables", 5000, 12000, 20, 5);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 10, 9000L, "Clearance"));

        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "IN", 15, "New Shipment"));
        assertEquals(35, service.getProductById(p.id()).quantity());
        assertEquals(10, service.getActiveReservedQuantity(p.id()));
    }

    @Test
    @DisplayName("20. Purchase receiving remains functional with active reservations")
    void testPurchaseReceivingRemainsFunctional() {
        StockpileService.Product p = createProduct("Paper", "PP-020", "Stationery", 20000, 40000, 10, 5);
        StockpileService.Supplier sup = createSupplier("Stationery Supplier");
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 5, 30000L, "Surplus"));

        StockpileService.PurchaseOrderDetails po = service.createPurchaseOrder(new StockpileService.CreatePurchaseOrderRequest(
            sup.id(),
            "Stock restock",
            List.of(new StockpileService.CreatePurchaseOrderItemRequest(p.id(), 20, 20000L))
        ));
        service.placePurchaseOrder(po.id());

        service.receivePurchaseOrder(po.id(), new StockpileService.ReceivePurchaseOrderRequest(
            List.of(new StockpileService.ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 20))
        ));

        assertEquals(30, service.getProductById(p.id()).quantity());
        assertEquals(5, service.getActiveReservedQuantity(p.id()));
    }

    @Test
    @DisplayName("21. Physical adjustment cannot reduce stock below reservations (HTTP 409)")
    void testAdjustmentCannotReduceStockBelowReservations() {
        StockpileService.Product p = createProduct("Tripod", "TP-021", "Accessories", 60000, 120000, 20, 5);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 12, 90000L, "Clearance"));

        // Adjusting physical stock to 10 (< 12 reserved) must throw ProductConflictException
        assertThrows(StockpileService.ProductConflictException.class, () -> {
            service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "ADJUSTMENT", 10, "Physical Count"));
        });

        // Adjusting physical stock to 15 (>= 12 reserved) must succeed
        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "ADJUSTMENT", 15, "Physical Count"));
        assertEquals(15, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("22. Audit completion cannot reduce stock below reservations (HTTP 409)")
    void testAuditCompletionCannotReduceStockBelowReservations() {
        StockpileService.Product p = createProduct("Microphone", "MIC-022", "Audio", 80000, 160000, 30, 5);
        service.createSurplusListing(new StockpileService.CreateSurplusListingRequest(p.id(), 20, 120000L, "Clearance"));

        StockpileService.StockAuditDetails audit = service.createStockAudit(new StockpileService.CreateStockAuditRequest(
            List.of(p.id()), "Year-end audit"
        ));
        Long itemId = audit.items().get(0).id();

        // Physical count is 15 (< 20 reserved)
        service.enterCount(audit.id(), itemId, new StockpileService.EnterCountRequest(15, "Deficit"));

        // Completing audit must fail with StockAuditConflictException
        assertThrows(StockpileService.StockAuditConflictException.class, () -> {
            service.completeStockAudit(audit.id());
        });

        // Updating count to 22 (>= 20) allows completion
        service.enterCount(audit.id(), itemId, new StockpileService.EnterCountRequest(22, "Recount"));
        service.completeStockAudit(audit.id());
        assertEquals(22, service.getProductById(p.id()).quantity());
    }

    // ==========================================
    // 4. SURPLUS SALE TESTS
    // ==========================================

    @Test
    @DisplayName("23. Record partial surplus sale")
    void testRecordPartialSurplusSale() {
        StockpileService.Product p = createProduct("Tablet Case", "TC-023", "Accessories", 20000, 50000, 40, 10);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 20, 35000L, "Discount")
        );

        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(8, "UPI"));

        assertNotNull(sale);
        assertEquals(8 * 35000L, sale.totalPaise());
        assertEquals(8 * 20000L, sale.totalCostPaise());
        assertEquals(8 * 15000L, sale.grossProfitPaise());
        assertEquals("UPI", sale.paymentMethod());

        StockpileService.SurplusListingDetails updated = service.getSurplusListingById(listing.id());
        assertEquals(8, updated.quantitySold());
        assertEquals(12, updated.quantityRemaining());
        assertEquals("PARTIALLY_SOLD", updated.status());
    }

    @Test
    @DisplayName("24. Record final surplus sale to mark listing as SOLD")
    void testRecordFinalSurplusSale() {
        StockpileService.Product p = createProduct("Lens Filter", "LF-024", "Cameras", 10000, 30000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 20000L, "Clearance")
        );

        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(6, "CASH"));
        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(4, "CARD"));

        StockpileService.SurplusListingDetails updated = service.getSurplusListingById(listing.id());
        assertEquals(10, updated.quantitySold());
        assertEquals(0, updated.quantityRemaining());
        assertEquals("SOLD", updated.status());
    }

    @Test
    @DisplayName("25. Verify discounted price is used for surplus sale instead of regular price")
    void testDiscountedPriceUsedInSurplusSale() {
        StockpileService.Product p = createProduct("Stylus", "ST-025", "Accessories", 15000, 40000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 5, 25000L, "Sale")
        );

        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(2, "CASH"));
        StockpileService.SaleItemDetails item = sale.items().get(0);

        assertEquals(25000L, item.unitSellingPricePaise());
        assertEquals(50000L, item.lineTotalPaise());
    }

    @Test
    @DisplayName("26. Verify correct COGS and gross profit using snapshot purchase cost")
    void testCorrectCogsAndProfit() {
        StockpileService.Product p = createProduct("Mousepad", "MP-026", "Accessories", 12000, 30000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 20000L, "Clearance")
        );

        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(5, "CASH"));
        assertEquals(5 * 20000L, sale.totalPaise());
        assertEquals(5 * 12000L, sale.totalCostPaise());
        assertEquals(5 * (20000L - 12000L), sale.grossProfitPaise());
    }

    @Test
    @DisplayName("27. Verify physical product quantity decreases upon surplus sale")
    void testPhysicalQuantityDecreases() {
        StockpileService.Product p = createProduct("Phone Grip", "PG-027", "Accessories", 5000, 15000, 50, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 20, 10000L, "Promo")
        );

        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(7, "CASH"));
        StockpileService.Product after = service.getProductById(p.id());
        assertEquals(43, after.quantity());
    }

    @Test
    @DisplayName("28. Verify active reserved quantity decreases upon surplus sale")
    void testReservedQuantityDecreases() {
        StockpileService.Product p = createProduct("Cable Wrap", "CW-028", "Accessories", 3000, 8000, 40, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 15, 6000L, "Promo")
        );

        assertEquals(15, service.getActiveReservedQuantity(p.id()));
        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(6, "CASH"));
        assertEquals(9, service.getActiveReservedQuantity(p.id()));
    }

    @Test
    @DisplayName("29. Verify stock OUT movement is generated upon surplus sale")
    void testStockOutMovementGenerated() {
        StockpileService.Product p = createProduct("Cleaning Kit", "CK-029", "Accessories", 8000, 20000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 15000L, "Promo")
        );

        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(4, "CASH"));

        List<StockpileService.RecentMovement> movements = service.getMovements(p.id(), null);
        StockpileService.RecentMovement movement = movements.get(0);
        assertEquals("OUT", movement.movementType());
        assertEquals(4, movement.quantity());
        assertTrue(movement.reason().contains("Surplus Sale #" + sale.id()));
    }

    @Test
    @DisplayName("30. Verify surplus sale appears in ordinary sales history")
    void testSurplusSaleAppearsInSalesHistory() {
        StockpileService.Product p = createProduct("Gel Pen", "GP-030", "Stationery", 2000, 5000, 100, 20);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 25, 3500L, "Back to School")
        );

        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(10, "CASH"));

        StockpileService.SaleDetails fetched = service.getSaleById(sale.id());
        assertNotNull(fetched);
        assertEquals(listing.id(), fetched.items().get(0).surplusListingId());
    }

    @Test
    @DisplayName("31. Verify revenue and financial reports include surplus sale")
    void testReportsIncludeSurplusSale() {
        StockpileService.Product p = createProduct("Binder", "BD-031", "Stationery", 10000, 25000, 50, 10);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 15, 18000L, "Surplus")
        );

        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(5, "CASH"));

        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport(
            "CUSTOM", LocalDate.now().toString(), LocalDate.now().toString(), null, null, null
        );

        assertEquals(5 * 18000L, report.grossSalesPaise());
        assertEquals(5 * 10000L, report.cogsPaise());
        assertEquals(5 * (18000L - 10000L), report.grossProfitPaise());
    }

    @Test
    @DisplayName("32. Reject sale exceeding remaining listing quantity")
    void testRejectSaleExceedingRemaining() {
        StockpileService.Product p = createProduct("Folder", "FL-032", "Stationery", 5000, 15000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 8, 10000L, "Surplus")
        );

        assertThrows(IllegalArgumentException.class, () -> {
            service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(10, "CASH"));
        });
    }

    @Test
    @DisplayName("33. Reject sale from cancelled listing")
    void testRejectSaleFromCancelledListing() {
        StockpileService.Product p = createProduct("Pouch", "PC-033", "Stationery", 8000, 20000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 14000L, "Surplus")
        );
        service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("End sale"));

        assertThrows(StockpileService.SurplusListingConflictException.class, () -> {
            service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(3, "CASH"));
        });
    }

    @Test
    @DisplayName("34. Reject sale from fully sold listing")
    void testRejectSaleFromSoldListing() {
        StockpileService.Product p = createProduct("Eraser", "ER-034", "Stationery", 1000, 3000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 5, 2000L, "Surplus")
        );
        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(5, "CASH"));

        assertThrows(StockpileService.SurplusListingConflictException.class, () -> {
            service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(1, "CASH"));
        });
    }

    // ==========================================
    // 5. LISTING UPDATES AND CANCELLATION
    // ==========================================

    @Test
    @DisplayName("35. Update discounted price before any sales")
    void testUpdatePriceBeforeSales() {
        StockpileService.Product p = createProduct("Ruler", "RL-035", "Stationery", 2000, 6000, 40, 10);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 15, 4500L, "Sale")
        );

        StockpileService.SurplusListingDetails updated = service.updateSurplusListing(
            listing.id(), new StockpileService.UpdateSurplusListingRequest(4000L, null, null)
        );
        assertEquals(4000L, updated.discountedUnitPricePaise());
    }

    @Test
    @DisplayName("36. Update notes on surplus listing")
    void testUpdateNotes() {
        StockpileService.Product p = createProduct("Sharpener", "SH-036", "Stationery", 1500, 4000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 3000L, "Sale", "Old notes")
        );

        StockpileService.SurplusListingDetails updated = service.updateSurplusListing(
            listing.id(), new StockpileService.UpdateSurplusListingRequest(null, "Sale", "New updated notes")
        );
        assertEquals("New updated notes", updated.notes());
    }

    @Test
    @DisplayName("37. Reject update with price equal to or greater than regular price")
    void testRejectPriceGteRegularPriceOnUpdate() {
        StockpileService.Product p = createProduct("Pencil Box", "PB-037", "Stationery", 5000, 12000, 25, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 9000L, "Sale")
        );

        assertThrows(IllegalArgumentException.class, () -> {
            service.updateSurplusListing(listing.id(), new StockpileService.UpdateSurplusListingRequest(12000L, null, null));
        });
    }

    @Test
    @DisplayName("38. Cancel active listing")
    void testCancelActiveListing() {
        StockpileService.Product p = createProduct("Marker", "MK-038", "Stationery", 3000, 8000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 15, 6000L, "Sale")
        );

        StockpileService.SurplusListingDetails cancelled = service.cancelSurplusListing(
            listing.id(), new StockpileService.CancelSurplusListingRequest("Promotion ended")
        );

        assertEquals("CANCELLED", cancelled.status());
        assertNotNull(cancelled.cancelledAt());
        assertEquals(0, cancelled.quantityRemaining());
    }

    @Test
    @DisplayName("39. Cancel partially sold listing")
    void testCancelPartiallySoldListing() {
        StockpileService.Product p = createProduct("Highlighter", "HL-039", "Stationery", 4000, 10000, 40, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 20, 7500L, "Sale")
        );
        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(8, "CASH"));

        StockpileService.SurplusListingDetails cancelled = service.cancelSurplusListing(
            listing.id(), new StockpileService.CancelSurplusListingRequest("Sale ended")
        );

        assertEquals("CANCELLED", cancelled.status());
        assertEquals(8, cancelled.quantitySold());
        assertEquals(0, cancelled.quantityRemaining());
    }

    @Test
    @DisplayName("40. Verify unsold reserved stock is released after cancellation")
    void testUnsoldReservedStockReleased() {
        StockpileService.Product p = createProduct("Stapler", "ST-040", "Stationery", 15000, 35000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 15, 25000L, "Sale")
        );
        assertEquals(15, service.getActiveReservedQuantity(p.id()));

        service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("Cancel promo"));
        assertEquals(0, service.getActiveReservedQuantity(p.id()), "Unsold reserved units must be completely released");
    }

    @Test
    @DisplayName("41. Verify physical stock remains unchanged when cancelling listing")
    void testPhysicalStockUnchangedOnCancel() {
        StockpileService.Product p = createProduct("Scissors", "SC-041", "Stationery", 10000, 25000, 25, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 18000L, "Sale")
        );

        service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("Cancel promo"));
        StockpileService.Product after = service.getProductById(p.id());
        assertEquals(25, after.quantity(), "Physical stock must not change when cancelling listing");
    }

    @Test
    @DisplayName("42. Reject duplicate cancellation")
    void testRejectDuplicateCancellation() {
        StockpileService.Product p = createProduct("Calculator", "CA-042", "Stationery", 25000, 60000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 45000L, "Sale")
        );
        service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("Cancel 1"));

        assertThrows(StockpileService.SurplusListingConflictException.class, () -> {
            service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("Cancel 2"));
        });
    }

    @Test
    @DisplayName("43. Reject cancellation of fully sold listing")
    void testRejectCancellationOfFullySoldListing() {
        StockpileService.Product p = createProduct("Tape", "TP-043", "Stationery", 5000, 12000, 15, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 5, 9000L, "Sale")
        );
        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(5, "CASH"));

        assertThrows(StockpileService.SurplusListingConflictException.class, () -> {
            service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("Cancel"));
        });
    }

    // ==========================================
    // 6. SALE CANCELLATION INTEGRATION
    // ==========================================

    @Test
    @DisplayName("44. Cancel an ordinary surplus sale")
    void testCancelSurplusSale() {
        StockpileService.Product p = createProduct("Notepad", "NP-044", "Stationery", 4000, 10000, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 15, 7500L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(6, "CASH"));

        StockpileService.SaleDetails cancelledSale = service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer return"));
        assertEquals("CANCELLED", cancelledSale.status());
    }

    @Test
    @DisplayName("45. Verify physical stock is restored when surplus sale is cancelled")
    void testPhysicalStockRestoredOnSaleCancel() {
        StockpileService.Product p = createProduct("Diary", "DY-045", "Stationery", 15000, 35000, 25, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 25000L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(4, "CASH"));
        assertEquals(21, service.getProductById(p.id()).quantity());

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Defective goods"));
        assertEquals(25, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("46. Verify listing sold quantity is reversed when surplus sale is cancelled")
    void testListingSoldQuantityReversedOnSaleCancel() {
        StockpileService.Product p = createProduct("Sticky Notes", "SN-046", "Stationery", 3000, 8000, 40, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 20, 6000L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(8, "CASH"));
        assertEquals(8, service.getSurplusListingById(listing.id()).quantitySold());

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Return"));
        assertEquals(0, service.getSurplusListingById(listing.id()).quantitySold());
    }

    @Test
    @DisplayName("47. Verify listing status is restored to ACTIVE/PARTIALLY_SOLD on sale cancellation")
    void testListingStatusRestoredOnSaleCancel() {
        StockpileService.Product p = createProduct("Clip", "CL-047", "Stationery", 1000, 3000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 5, 2000L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(5, "CASH"));
        assertEquals("SOLD", service.getSurplusListingById(listing.id()).status());

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Return"));
        assertEquals("ACTIVE", service.getSurplusListingById(listing.id()).status());
    }

    @Test
    @DisplayName("48. Verify an already cancelled listing remains cancelled after surplus sale cancellation")
    void testCancelledListingRemainsCancelledAfterSaleCancellation() {
        StockpileService.Product p = createProduct("Pin", "PN-048", "Stationery", 1000, 2500, 30, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 10, 1800L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(4, "CASH"));

        // Cancel listing first
        service.cancelSurplusListing(listing.id(), new StockpileService.CancelSurplusListingRequest("Discontinue"));
        assertEquals("CANCELLED", service.getSurplusListingById(listing.id()).status());

        // Cancel the prior surplus sale
        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Return"));

        StockpileService.SurplusListingDetails after = service.getSurplusListingById(listing.id());
        assertEquals("CANCELLED", after.status(), "Listing must remain CANCELLED");
        assertEquals(0, after.quantitySold());
        assertEquals(0, service.getActiveReservedQuantity(p.id()), "Cancelled listing units must remain unreserved");
    }

    @Test
    @DisplayName("49. Verify sale history remains preserved after surplus sale cancellation")
    void testSaleHistoryPreservedAfterCancel() {
        StockpileService.Product p = createProduct("Desk Lamp", "DL-049", "Furniture", 50000, 120000, 15, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 5, 90000L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(2, "CASH"));

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer request"));
        StockpileService.SaleDetails fetched = service.getSaleById(sale.id());

        assertEquals("CANCELLED", fetched.status());
        assertNotNull(fetched.cancelledAt());
    }

    @Test
    @DisplayName("50. Verify cancelled surplus sale is excluded from revenue and profit reports")
    void testCancelledSurplusSaleExcludedFromReports() {
        StockpileService.Product p = createProduct("Chair Mat", "CM-050", "Furniture", 40000, 100000, 20, 5);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 8, 75000L, "Sale")
        );
        StockpileService.SaleDetails sale = service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(3, "CASH"));

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Damaged"));

        StockpileService.FinancialSummaryReport report = service.getFinancialSummaryReport(
            "CUSTOM", LocalDate.now().toString(), LocalDate.now().toString(), null, null, null
        );

        assertEquals(0L, report.grossSalesPaise());
        assertEquals(0L, report.cogsPaise());
        assertEquals(0L, report.grossProfitPaise());
    }

    // ==========================================
    // 7. REGRESSION TESTS
    // ==========================================

    @Test
    @DisplayName("51. Verify ordinary Product CRUD remains intact")
    void testRegressionProductCrud() {
        StockpileService.Product created = service.createProduct(new StockpileService.CreateProductRequest(
            "Desk Organizer", "DO-051", "Office", 20000L, 45000L, 15, 3, 10, 1.0, 5
        ));
        assertNotNull(created.id());

        StockpileService.Product updated = service.updateProduct(created.id(), new StockpileService.UpdateProductRequest(
            "Premium Desk Organizer", "DO-051", "Office", 22000L, 50000L, 3, 10, 1.0, 5
        ));
        assertEquals("Premium Desk Organizer", updated.name());

        // Product with opening stock (15 units) has movement history and cannot be deleted
        assertThrows(StockpileService.ProductConflictException.class, () -> service.deleteProduct(created.id()));
        assertNotNull(service.getProductById(created.id()));

        // Separate product with zero opening quantity and no stock movements can be deleted
        StockpileService.Product zeroQtyProduct = service.createProduct(new StockpileService.CreateProductRequest(
            "Disposable Organizer", "DO-051-Z", "Office", 10000L, 20000L, 0, 0, 5, 0.0, 1
        ));
        assertNotNull(zeroQtyProduct.id());
        assertEquals(0, zeroQtyProduct.quantity());

        service.deleteProduct(zeroQtyProduct.id());
        assertThrows(StockpileService.ProductNotFoundException.class, () -> service.getProductById(zeroQtyProduct.id()));
    }

    @Test
    @DisplayName("52. Verify ordinary Sales remain intact")
    void testRegressionOrdinarySales() {
        StockpileService.Product p = createProduct("Bookend", "BE-052", "Office", 15000, 35000, 20, 5);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            0L, "CASH"
        ));

        assertEquals(70000L, sale.totalPaise());
        assertEquals(18, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("53. Verify ordinary Sales cancellation remains intact")
    void testRegressionOrdinarySalesCancellation() {
        StockpileService.Product p = createProduct("Paperweight", "PW-053", "Office", 10000, 25000, 15, 5);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)),
            0L, "CASH"
        ));
        assertEquals(12, service.getProductById(p.id()).quantity());

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer Return"));
        assertEquals(15, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("54. Verify Stock In and Stock Out remain intact")
    void testRegressionStockInAndOut() {
        StockpileService.Product p = createProduct("Card Holder", "CH-054", "Office", 5000, 15000, 20, 5);

        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "IN", 10, "Restock"));
        assertEquals(30, service.getProductById(p.id()).quantity());

        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "OUT", 5, "Dispatch"));
        assertEquals(25, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("55. Verify Adjustments and Stock Audits remain intact")
    void testRegressionAdjustmentsAndStockAudits() {
        StockpileService.Product p = createProduct("Letter Opener", "LO-055", "Office", 6000, 14000, 20, 5);

        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "ADJUSTMENT", 25, "Physical Count"));
        assertEquals(25, service.getProductById(p.id()).quantity());

        StockpileService.StockAuditDetails audit = service.createStockAudit(new StockpileService.CreateStockAuditRequest(
            List.of(p.id()), "Audit"
        ));
        service.enterCount(audit.id(), audit.items().get(0).id(), new StockpileService.EnterCountRequest(22, "Count"));
        service.completeStockAudit(audit.id());

        assertEquals(22, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("56. Verify Purchase Orders and receiving remain intact")
    void testRegressionPurchaseOrdersAndReceiving() {
        StockpileService.Product p = createProduct("File Cabinet", "FC-056", "Office", 200000, 450000, 5, 2);
        StockpileService.Supplier sup = createSupplier("Office Supply Co");

        StockpileService.PurchaseOrderDetails po = service.createPurchaseOrder(new StockpileService.CreatePurchaseOrderRequest(
            sup.id(),
            "Order notes",
            List.of(new StockpileService.CreatePurchaseOrderItemRequest(p.id(), 5, 200000L))
        ));
        service.placePurchaseOrder(po.id());

        service.receivePurchaseOrder(po.id(), new StockpileService.ReceivePurchaseOrderRequest(
            List.of(new StockpileService.ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 5))
        ));

        assertEquals(10, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("57. Verify Dashboard and Intelligence remain intact")
    void testRegressionDashboardAndIntelligence() {
        createProduct("Desk Clock", "DC-057", "Office", 12000, 30000, 10, 5);

        StockpileService.HealthStatus health = service.checkHealth();
        assertEquals("UP", health.status());

        List<StockpileService.ProductIntelligence> intel = service.getInventoryIntelligence();
        assertFalse(intel.isEmpty());
    }

    @Test
    @DisplayName("58. Verify all Financial Reports remain intact")
    void testRegressionAllFinancialReports() {
        StockpileService.Product p = createProduct("Whiteboard", "WB-058", "Office", 50000, 120000, 10, 2);
        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
            0L, "CASH"
        ));

        String today = LocalDate.now().toString();
        StockpileService.FinancialSummaryReport summary = service.getFinancialSummaryReport("CUSTOM", today, today, null, null, null);
        assertNotNull(summary);
        assertEquals(120000L, summary.grossSalesPaise());

        StockpileService.ProfitLossReport pnl = service.getProfitLossReport("CUSTOM", today, today, null, null, null);
        assertNotNull(pnl);

        StockpileService.SalesReport salesRep = service.getSalesReport("CUSTOM", today, today, null, null, null);
        assertNotNull(salesRep);

        StockpileService.InventoryLossReport lossRep = service.getInventoryLossReport("CUSTOM", today, today, null, null, null);
        assertNotNull(lossRep);

        StockpileService.PurchasesReport purchRep = service.getPurchasesReport("CUSTOM", today, today, null, null, null);
        assertNotNull(purchRep);
    }

    @Test
    @DisplayName("59. Verify summary metrics and database persistence")
    void testSummaryMetricsAndPersistence() {
        StockpileService.Product p = createProduct("Monitor Arm", "MA-059", "Hardware", 80000, 180000, 40, 10);
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 20, 140000L, "Clearance")
        );
        service.recordSurplusSale(listing.id(), new StockpileService.RecordSurplusSaleRequest(8, "UPI"));

        StockpileService.SurplusSummary summary = service.getSurplusSummary();
        assertEquals(1, summary.totalListings());
        assertEquals(0, summary.activeListings());
        assertEquals(1, summary.partiallySoldListings());
        assertEquals(0, summary.fullySoldListings());
        assertEquals(0, summary.cancelledListings());
        assertEquals(20, summary.totalUnitsListed());
        assertEquals(8, summary.totalUnitsSold());
        assertEquals(12, summary.totalUnitsRemaining());
        assertEquals(8 * 140000L, summary.totalSurplusSalesRevenuePaise());
        assertEquals(8 * 80000L, summary.totalSurplusCostPaise());
        assertEquals(8 * 60000L, summary.totalSurplusGrossProfitPaise());
    }

    @Test
    @DisplayName("60. Verify Utensils clearance listing creation and reservation metrics")
    void testUtensilsClearanceListingCreation() {
        // Form values from user request:
        // Product: Utensils (ACC-U-610), Physical stock: 38, Preferred stock: 30, Selling price: Rs 380 (38000 paise)
        StockpileService.Product p = createProduct("Utensils", "ACC-U-610", "Accessories", 20000, 38000, 38, 30);
        assertEquals(38, p.quantity());
        assertEquals(30, p.targetStockLevel());

        // Check initial suggestions: physical = 38, reserved = 0, available = 38, suggested = 8
        List<StockpileService.SurplusSuggestion> initialSuggestions = service.getSurplusSuggestions();
        StockpileService.SurplusSuggestion s = initialSuggestions.stream()
            .filter(item -> item.productId().equals(p.id()))
            .findFirst().orElseThrow();
        assertEquals(38, s.currentQuantity());
        assertEquals(0, s.reservedQuantity());
        assertEquals(38, s.availableQuantity());
        assertEquals(30, s.preferredStockLevel());
        assertEquals(8, s.suggestedSurplusQuantity());

        // Create clearance listing: 8 units at Rs 323 (32300 paise), 15% discount
        // Test with both reason and notes populated (as frontend now sends)
        String reason = "Current stock exceeds preferred stock level by 8 units.";
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 8, 32300L, reason, reason)
        );

        // 1. Verify listing is stored successfully
        assertNotNull(listing);
        assertNotNull(listing.id());
        assertEquals(p.id(), listing.productId());
        assertEquals("Utensils", listing.productName());
        assertEquals("ACC-U-610", listing.sku());
        assertEquals(8, listing.quantityListed());
        assertEquals(0, listing.quantitySold());
        assertEquals(8, listing.quantityRemaining());
        assertEquals(38000L, listing.regularUnitPricePaise());
        assertEquals(32300L, listing.discountedUnitPricePaise());
        assertEquals(15.0, listing.discountPercentage(), 0.1);
        assertEquals("ACTIVE", listing.status());
        assertEquals(reason, listing.reason());

        // 2. Verify physical stock remains 38
        StockpileService.Product productAfter = service.getProductById(p.id());
        assertEquals(38, productAfter.quantity(), "Physical stock must remain 38 after listing creation");

        // 3. Verify reserved quantity becomes 8
        int reservedQty = service.getActiveReservedQuantity(p.id());
        assertEquals(8, reservedQty, "Reserved quantity must be 8");

        // 4. Verify available unreserved stock becomes 30
        int availableQty = productAfter.quantity() - reservedQty;
        assertEquals(30, availableQty, "Available unreserved stock must be 30");

        // 5. Verify potential clearance revenue is Rs 2,584 (258400 paise)
        long potentialRevenuePaise = (long) listing.quantityListed() * listing.discountedUnitPricePaise();
        assertEquals(258400L, potentialRevenuePaise, "Potential revenue must be 258400 paise (Rs 2,584)");

        // 6. Verify listing appears in listings page
        List<StockpileService.SurplusListingDetails> allListings = service.getSurplusListings("ACTIVE", p.id(), null, null);
        assertFalse(allListings.isEmpty(), "Listing must appear in the active listings query");
        assertEquals(listing.id(), allListings.get(0).id());

        // 7. Verify creating listing with only notes (fallback handling) works seamlessly
        StockpileService.Product p2 = createProduct("Plates", "ACC-P-611", "Accessories", 15000, 30000, 20, 15);
        StockpileService.SurplusListingDetails listing2 = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p2.id(), 5, 25000L, null, "Clearance promo")
        );
        assertNotNull(listing2);
        assertEquals("Clearance promo", listing2.reason());
    }

    @Test
    @DisplayName("61. Verify Utensils surplus sale revenue, cost, and gross profit consistency across summary and listings")
    void testUtensilsSurplusSaleRevenueCalculations() {
        // Test listing:
        // Product: Utensils, Purchase cost: Rs 200 (20000 paise), Selling price: Rs 380 (38000 paise)
        StockpileService.Product p = createProduct("Utensils", "ACC-U-612", "Accessories", 20000, 38000, 38, 30);

        // Create clearance listing: 8 units at Rs 323 (32300 paise)
        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(p.id(), 8, 32300L, "Surplus stock clearance", "Excess inventory")
        );

        // Record completed surplus sale for 8 units
        StockpileService.SaleDetails sale = service.recordSurplusSale(
            listing.id(),
            new StockpileService.RecordSurplusSaleRequest(8, "CASH")
        );
        assertNotNull(sale);
        assertEquals("COMPLETED", sale.status());

        // Expected financial calculations:
        // Quantity sold = 8
        // Discounted selling price = Rs 323 (32300 paise)
        // Purchase cost = Rs 200 (20000 paise)
        // Revenue recovered = 8 * 323 = Rs 2,584 (258400 paise)
        // Total cost = 8 * 200 = Rs 1,600 (160000 paise)
        // Gross profit = 2584 - 1600 = Rs 984 (98400 paise)
        long expectedRevenue = 258400L;
        long expectedCost = 160000L;
        long expectedGrossProfit = 98400L;

        // 1. Verify GET /api/surplus-listings/summary calculations
        StockpileService.SurplusSummary summary = service.getSurplusSummary();
        assertEquals(expectedRevenue, summary.totalSurplusSalesRevenuePaise(), "Summary sales revenue must be Rs 2,584");
        assertEquals(expectedRevenue, summary.getTotalSurplusRevenuePaise(), "Summary revenue getter must match Rs 2,584");
        assertEquals(expectedCost, summary.totalSurplusCostPaise(), "Summary total cost must be Rs 1,600");
        assertEquals(expectedGrossProfit, summary.totalSurplusGrossProfitPaise(), "Summary gross profit must be Rs 984");
        assertEquals(1, summary.fullySoldListings());
        assertEquals(8, summary.totalUnitsSold());
        assertEquals(0, summary.totalUnitsRemaining());

        // 2. Verify GET /api/surplus-listings row calculations
        List<StockpileService.SurplusListingDetails> listings = service.getSurplusListings("SOLD", p.id(), null, null);
        assertFalse(listings.isEmpty());
        StockpileService.SurplusListingDetails row = listings.get(0);
        assertEquals(expectedRevenue, row.recoveredRevenuePaise(), "Listing row recovered revenue must be Rs 2,584");
        assertEquals(expectedRevenue, row.getTotalRealizedRevenuePaise(), "Listing row realized revenue getter must match");
        assertEquals(expectedGrossProfit, row.grossProfitPaise(), "Listing row gross profit must be Rs 984");
        assertEquals(expectedGrossProfit, row.getTotalRealizedGrossProfitPaise(), "Listing row gross profit getter must match");
        assertEquals(32300L, row.discountedUnitPricePaise());
        assertEquals(32300L, row.getDiscountedSellingPricePaise());
        assertEquals(38000L, row.regularUnitPricePaise());
        assertEquals(38000L, row.getOriginalSellingPricePaise());
        assertEquals(20000L, row.unitCostPaiseSnapshot());
        assertEquals(20000L, row.getOriginalPurchasePricePaise());
        assertEquals(8, row.quantitySold());
        assertEquals(0, row.quantityRemaining());

        // 3. Verify GET /api/surplus-listings/{id} details and sales transaction breakdown
        StockpileService.SurplusListingDetails detail = service.getSurplusListingById(listing.id());
        assertEquals(expectedRevenue, detail.recoveredRevenuePaise());
        assertEquals(expectedGrossProfit, detail.grossProfitPaise());
        assertNotNull(detail.sales());
        assertEquals(1, detail.sales().size());
        StockpileService.SurplusSaleTransaction tx = detail.sales().get(0);
        assertEquals(8, tx.quantity());
        assertEquals(32300L, tx.unitSellingPricePaise());
        assertEquals(20000L, tx.unitPurchasePricePaise());
        assertEquals(expectedRevenue, tx.lineTotalPaise());
        assertEquals(expectedCost, tx.lineCostPaise());
        assertEquals(expectedGrossProfit, tx.getGrossProfitPaise());

        // 4. Verify cancelling sale restores consistency and excludes cancelled sales from revenue
        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer returned items"));
        StockpileService.SurplusSummary summaryAfterCancel = service.getSurplusSummary();
        assertEquals(0L, summaryAfterCancel.totalSurplusSalesRevenuePaise(), "Revenue must exclude cancelled sales");
        assertEquals(0L, summaryAfterCancel.totalSurplusCostPaise(), "Cost must exclude cancelled sales");
        assertEquals(0L, summaryAfterCancel.totalSurplusGrossProfitPaise(), "Gross profit must exclude cancelled sales");

        StockpileService.SurplusListingDetails listingAfterCancel = service.getSurplusListingById(listing.id());
        assertEquals(0L, listingAfterCancel.recoveredRevenuePaise(), "Listing recovered revenue must exclude cancelled sales");
        assertEquals(0L, listingAfterCancel.grossProfitPaise(), "Listing gross profit must exclude cancelled sales");
        assertEquals(0, listingAfterCancel.quantitySold());
        assertEquals(8, listingAfterCancel.quantityRemaining());
        assertEquals("ACTIVE", listingAfterCancel.status());
    }
}
