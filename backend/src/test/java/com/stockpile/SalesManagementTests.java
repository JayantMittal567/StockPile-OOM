package com.stockpile;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:sqlite:target/test-stockpile.db",
    "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:schema.sql"
})
public class SalesManagementTests {

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
        jdbcTemplate.update("DELETE FROM surplus_listings");
        jdbcTemplate.update("DELETE FROM sales");
        jdbcTemplate.update("DELETE FROM stock_movements");
        jdbcTemplate.update("DELETE FROM products");
    }

    private StockpileService.Product createTestProduct(String name, String sku, String category, long purchasePaise, long sellingPaise, int qty) {
        return service.createProduct(new StockpileService.CreateProductRequest(
            name, sku, category, purchasePaise, sellingPaise, qty, 5, 20, 1.0, 5
        ));
    }

    // ==========================================
    // 1-10: SALE CREATION & CALCULATIONS
    // ==========================================

    @Test
    @DisplayName("1. Single-product sale creation")
    void testSingleProductSale() {
        StockpileService.Product p = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 80000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            0L,
            "CASH"
        ));

        assertNotNull(sale.id());
        assertEquals(1, sale.items().size());
        assertEquals("COMPLETED", sale.status());
    }

    @Test
    @DisplayName("2. Multi-product sale creation")
    void testMultiProductSale() {
        StockpileService.Product p1 = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 80000L, 10);
        StockpileService.Product p2 = createTestProduct("Wrench", "WRN-02", "Tools", 30000L, 50000L, 15);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 2),
                new StockpileService.SaleItemRequest(p2.id(), 3)
            ),
            0L,
            "UPI"
        ));

        assertEquals(2, sale.items().size());
        assertEquals("COMPLETED", sale.status());
    }

    @Test
    @DisplayName("3. Correct subtotal calculation")
    void testCorrectSubtotal() {
        StockpileService.Product p1 = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 80000L, 10);
        StockpileService.Product p2 = createTestProduct("Wrench", "WRN-02", "Tools", 30000L, 50000L, 15);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 2), // 2 * 80000 = 160000
                new StockpileService.SaleItemRequest(p2.id(), 3)  // 3 * 50000 = 150000
            ),
            0L,
            "CARD"
        ));

        assertEquals(310000L, sale.subtotalPaise());
    }

    @Test
    @DisplayName("4. Correct discount application")
    void testCorrectDiscount() {
        StockpileService.Product p = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 100000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), // 200000 paise
            25000L, // 25000 paise discount
            "CASH"
        ));

        assertEquals(25000L, sale.discountPaise());
    }

    @Test
    @DisplayName("5. Correct final amount calculation")
    void testCorrectFinalAmount() {
        StockpileService.Product p = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 100000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), // subtotal 200000
            25000L,
            "UPI"
        ));

        assertEquals(175000L, sale.totalPaise());
    }

    @Test
    @DisplayName("6. Correct total purchase cost calculation")
    void testCorrectTotalPurchaseCost() {
        StockpileService.Product p1 = createTestProduct("Hammer", "HMR-01", "Tools", 40000L, 80000L, 10);
        StockpileService.Product p2 = createTestProduct("Wrench", "WRN-02", "Tools", 25000L, 50000L, 15);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 2), // 2 * 40000 = 80000
                new StockpileService.SaleItemRequest(p2.id(), 4)  // 4 * 25000 = 100000
            ),
            10000L,
            "CARD"
        ));

        assertEquals(180000L, sale.totalCostPaise());
    }

    @Test
    @DisplayName("7. Correct gross profit calculation (including loss scenarios)")
    void testCorrectGrossProfit() {
        // Normal profitable sale
        StockpileService.Product p1 = createTestProduct("Drill", "DRL-01", "Tools", 300000L, 500000L, 5);
        StockpileService.SaleDetails profitableSale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p1.id(), 1)),
            50000L, // total = 450000, cost = 300000
            "UPI"
        ));
        assertEquals(150000L, profitableSale.grossProfitPaise());

        // Selling at a loss (negative gross profit)
        StockpileService.Product p2 = createTestProduct("Clearance", "CLR-01", "Tools", 200000L, 150000L, 5);
        StockpileService.SaleDetails lossSale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p2.id(), 1)),
            0L, // total = 150000, cost = 200000
            "CASH"
        ));
        assertEquals(-50000L, lossSale.grossProfitPaise());
    }

    @Test
    @DisplayName("8. Correct inventory deduction upon sale")
    void testCorrectInventoryDeduction() {
        StockpileService.Product p = createTestProduct("Saw", "SAW-01", "Tools", 100000L, 150000L, 20);
        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 7)),
            0L,
            "CASH"
        ));

        StockpileService.Product updated = service.getProductById(p.id());
        assertEquals(13, updated.quantity());
    }

    @Test
    @DisplayName("9. Correct stock movement OUT records created")
    void testCorrectStockMovementRecords() {
        StockpileService.Product p = createTestProduct("Tape", "TAP-01", "Tools", 5000L, 10000L, 50);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 5)),
            0L,
            "OTHER"
        ));

        List<StockpileService.RecentMovement> movements = service.getMovements(p.id(), "OUT");
        assertFalse(movements.isEmpty());
        StockpileService.RecentMovement latest = movements.get(0);
        assertEquals("OUT", latest.movementType());
        assertEquals(5, latest.quantity());
        assertEquals(50, latest.previousQuantity());
        assertEquals(45, latest.newQuantity());
        assertTrue(latest.reason().contains("Sale #" + sale.id()));
    }

    @Test
    @DisplayName("10. Correct payment method storage")
    void testCorrectPaymentMethodStorage() {
        for (String method : List.of("CASH", "UPI", "CARD", "OTHER")) {
            StockpileService.Product p = createTestProduct("Item-" + method, "SKU-" + method, "Misc", 1000L, 2000L, 10);
            StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                0L,
                method.toLowerCase()
            ));
            assertEquals(method, sale.paymentMethod());
        }
    }

    // ==========================================
    // 11-18: VALIDATION CHECKS
    // ==========================================

    @Test
    @DisplayName("11. Empty sale items rejected")
    void testEmptySale() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(List.of(), 0L, "CASH"));
        });
    }

    @Test
    @DisplayName("12. Nonexistent product ID rejected")
    void testNonexistentProduct() {
        assertThrows(StockpileService.ProductNotFoundException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(999999L, 1)),
                0L,
                "CASH"
            ));
        });
    }

    @Test
    @DisplayName("13. Zero quantity rejected")
    void testZeroQuantity() {
        StockpileService.Product p = createTestProduct("Nails", "NLS-01", "Hardware", 100L, 200L, 100);
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 0)),
                0L,
                "CASH"
            ));
        });
    }

    @Test
    @DisplayName("14. Negative quantity rejected")
    void testNegativeQuantity() {
        StockpileService.Product p = createTestProduct("Screws", "SCR-01", "Hardware", 100L, 200L, 100);
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), -5)),
                0L,
                "CASH"
            ));
        });
    }

    @Test
    @DisplayName("15. Insufficient stock rejected")
    void testInsufficientStock() {
        StockpileService.Product p = createTestProduct("Ladder", "LDR-01", "Tools", 500000L, 800000L, 2);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 5)),
                0L,
                "UPI"
            ));
        });
        assertTrue(ex.getMessage().contains("Insufficient stock"));
    }

    @Test
    @DisplayName("16. Duplicate product in the cart rejected")
    void testDuplicateProductInCart() {
        StockpileService.Product p = createTestProduct("Paint", "PNT-01", "Supplies", 100000L, 150000L, 20);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(
                    new StockpileService.SaleItemRequest(p.id(), 2),
                    new StockpileService.SaleItemRequest(p.id(), 3)
                ),
                0L,
                "CASH"
            ));
        });
        assertTrue(ex.getMessage().contains("Duplicate product ID"));
    }

    @Test
    @DisplayName("17. Invalid payment method rejected")
    void testInvalidPaymentMethod() {
        StockpileService.Product p = createTestProduct("Brush", "BRS-01", "Supplies", 2000L, 5000L, 10);
        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                0L,
                "BITCOIN"
            ));
        });
    }

    @Test
    @DisplayName("18. Discount exceeding subtotal rejected")
    void testDiscountExceedingSubtotal() {
        StockpileService.Product p = createTestProduct("Roller", "RLR-01", "Supplies", 5000L, 10000L, 10);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)), // subtotal = 10000
                15000L, // discount = 15000 > 10000
                "CASH"
            ));
        });
        assertTrue(ex.getMessage().contains("Discount cannot exceed subtotal"));
    }

    // ==========================================
    // 19-21: TRANSACTION INTEGRITY & ROLLBACK
    // ==========================================

    @Test
    @DisplayName("19. Multi-product sale where one item has insufficient stock must not partially deduct stock")
    void testMultiProductSaleWithInsufficientStockRollsBackEntirely() {
        StockpileService.Product p1 = createTestProduct("Item1", "ITM-01", "Cat", 1000L, 2000L, 10);
        StockpileService.Product p2 = createTestProduct("Item2", "ITM-02", "Cat", 1000L, 2000L, 2);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(
                    new StockpileService.SaleItemRequest(p1.id(), 5), // available
                    new StockpileService.SaleItemRequest(p2.id(), 10) // NOT available
                ),
                0L,
                "UPI"
            ));
        });

        // Verify item 1 stock was NOT partially deducted
        assertEquals(10, service.getProductById(p1.id()).quantity());
        assertEquals(2, service.getProductById(p2.id()).quantity());
    }

    @Test
    @DisplayName("20. Failed sale rolls back all database operations")
    void testSaleFailsRollsBackAll() {
        int initialSales = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sales", Integer.class);
        int initialItems = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sale_items", Integer.class);

        StockpileService.Product p = createTestProduct("ItemX", "ITM-X", "Cat", 1000L, 2000L, 5);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 100)), // causes fail
                0L,
                "CASH"
            ));
        });

        int finalSales = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sales", Integer.class);
        int finalItems = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sale_items", Integer.class);

        assertEquals(initialSales, finalSales);
        assertEquals(initialItems, finalItems);
    }

    @Test
    @DisplayName("21. No incomplete sales or orphaned sale items remain")
    void testNoOrphanedSaleOrItems() {
        StockpileService.Product p = createTestProduct("ItemY", "ITM-Y", "Cat", 1000L, 2000L, 5);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                50000L, // discount > subtotal fails after items loop
                "CASH"
            ));
        });

        Integer orphanedItems = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales)",
            Integer.class
        );
        assertEquals(0, orphanedItems);
    }

    // ==========================================
    // 22-25: SALE HISTORY & DETAILS
    // ==========================================

    @Test
    @DisplayName("22. List sales newest first")
    void testListSalesNewestFirst() {
        StockpileService.Product p = createTestProduct("Pen", "PEN-01", "Stationery", 500L, 1000L, 50);

        StockpileService.SaleDetails s1 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));
        StockpileService.SaleDetails s2 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "UPI"
        ));

        List<StockpileService.SaleSummary> sales = service.getSales(null);
        assertTrue(sales.size() >= 2);
        assertEquals(s2.id(), sales.get(0).id());
        assertEquals(s1.id(), sales.get(1).id());
    }

    @Test
    @DisplayName("23. Filter sales by status")
    void testFilterSalesByStatus() {
        StockpileService.Product p = createTestProduct("Pencil", "PNC-01", "Stationery", 200L, 500L, 50);

        StockpileService.SaleDetails s1 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));
        StockpileService.SaleDetails s2 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "UPI"
        ));

        service.cancelSale(s1.id(), new StockpileService.CancelSaleRequest("Customer request"));

        List<StockpileService.SaleSummary> completed = service.getSales("COMPLETED");
        List<StockpileService.SaleSummary> cancelled = service.getSales("CANCELLED");

        assertEquals(1, completed.size());
        assertEquals(s2.id(), completed.get(0).id());

        assertEquals(1, cancelled.size());
        assertEquals(s1.id(), cancelled.get(0).id());
    }

    @Test
    @DisplayName("24. Retrieve sale details with snapshots")
    void testRetrieveSaleDetails() {
        StockpileService.Product p = createTestProduct("Eraser", "ERS-01", "Stationery", 300L, 800L, 20);
        StockpileService.SaleDetails created = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)), 100L, "CARD"
        ));

        StockpileService.SaleDetails details = service.getSaleById(created.id());
        assertEquals(created.id(), details.id());
        assertEquals(2400L, details.subtotalPaise());
        assertEquals(100L, details.discountPaise());
        assertEquals(2300L, details.totalPaise());
        assertEquals(900L, details.totalCostPaise());
        assertEquals(1400L, details.grossProfitPaise());
        assertEquals(1, details.items().size());
        assertEquals("Eraser", details.items().get(0).productNameSnapshot());
        assertEquals("ERS-01", details.items().get(0).skuSnapshot());
    }

    @Test
    @DisplayName("25. Return 404 for nonexistent sales")
    void testNonexistentSaleReturns404() {
        assertThrows(StockpileService.SaleNotFoundException.class, () -> {
            service.getSaleById(888888L);
        });
    }

    // ==========================================
    // 26-31: CANCELLATION
    // ==========================================

    @Test
    @DisplayName("26. Cancel a completed sale")
    void testCancelCompletedSale() {
        StockpileService.Product p = createTestProduct("Ruler", "RLR-02", "Stationery", 1000L, 2500L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)), 0L, "CASH"
        ));

        StockpileService.SaleDetails cancelled = service.cancelSale(
            sale.id(), new StockpileService.CancelSaleRequest("Defective item return")
        );

        assertEquals("CANCELLED", cancelled.status());
        assertNotNull(cancelled.cancelledAt());
    }

    @Test
    @DisplayName("27. Verify stock is restored correctly upon cancellation")
    void testVerifyStockRestoredCorrectly() {
        StockpileService.Product p = createTestProduct("Notebook", "NTB-01", "Stationery", 5000L, 10000L, 20);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 6)), 0L, "UPI"
        ));
        assertEquals(14, service.getProductById(p.id()).quantity());

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Order canceled"));

        assertEquals(20, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("28. Verify restoration movements are created")
    void testVerifyRestorationMovementsCreated() {
        StockpileService.Product p = createTestProduct("Folder", "FLD-01", "Stationery", 2000L, 4000L, 15);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 4)), 0L, "CASH"
        ));

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Mistake order"));

        List<StockpileService.RecentMovement> inMovements = service.getMovements(p.id(), "IN");
        assertFalse(inMovements.isEmpty());
        StockpileService.RecentMovement latest = inMovements.get(0);
        assertEquals(4, latest.quantity());
        assertEquals(11, latest.previousQuantity());
        assertEquals(15, latest.newQuantity());
        assertTrue(latest.reason().contains("Sale #" + sale.id() + " Cancelled: Mistake order"));
    }

    @Test
    @DisplayName("29. Verify cancellation reason is recorded")
    void testVerifyCancellationReasonRecorded() {
        StockpileService.Product p = createTestProduct("Glue", "GLU-01", "Stationery", 1500L, 3000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "CASH"
        ));

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer double-ordered"));

        List<StockpileService.RecentMovement> inMovements = service.getMovements(p.id(), "IN");
        assertTrue(inMovements.get(0).reason().contains("Customer double-ordered"));
    }

    @Test
    @DisplayName("30. Try cancelling the same sale twice")
    void testCannotCancelSaleTwice() {
        StockpileService.Product p = createTestProduct("Scissors", "SCS-01", "Stationery", 4000L, 7000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));

        service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("First cancellation"));

        assertThrows(StockpileService.SaleConflictException.class, () -> {
            service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Second cancellation"));
        });
    }

    @Test
    @DisplayName("31. Verify cancelled sales are excluded from completed revenue calculations")
    void testCancelledSalesExcludedFromFutureRevenue() {
        StockpileService.Product p = createTestProduct("Stapler", "STP-01", "Stationery", 10000L, 20000L, 10);

        StockpileService.SaleDetails s1 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)), 0L, "CASH"
        ));
        StockpileService.SaleDetails s2 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "CASH"
        ));

        service.cancelSale(s1.id(), new StockpileService.CancelSaleRequest("Cancelled"));

        Long completedRevenue = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(total_paise), 0) FROM sales WHERE status = 'COMPLETED'",
            Long.class
        );
        assertEquals(s2.totalPaise(), completedRevenue);
    }

    // ==========================================
    // 32-35: HISTORICAL ACCURACY
    // ==========================================

    @Test
    @DisplayName("32. Change product selling price after sale")
    void testChangeProductSellingPriceAfterSale() {
        StockpileService.Product p = createTestProduct("Tape Measure", "TPM-01", "Tools", 10000L, 20000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "CASH"
        ));

        // Update product selling price to 50000 paise
        service.updateProduct(p.id(), new StockpileService.UpdateProductRequest(
            p.name(), p.sku(), p.category(), p.purchasePricePaise(), 50000L,
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));

        assertEquals(50000L, service.getProductById(p.id()).sellingPricePaise());
    }

    @Test
    @DisplayName("33. Verify old sale retains original selling price")
    void testOldSaleRetainsOriginalPrice() {
        StockpileService.Product p = createTestProduct("Leveler", "LVL-01", "Tools", 12000L, 24000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "CASH"
        ));

        // Update product selling price to 60000 paise
        service.updateProduct(p.id(), new StockpileService.UpdateProductRequest(
            p.name(), p.sku(), p.category(), p.purchasePricePaise(), 60000L,
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));

        StockpileService.SaleDetails reloaded = service.getSaleById(sale.id());
        assertEquals(48000L, reloaded.subtotalPaise());
        assertEquals(24000L, reloaded.items().get(0).unitSellingPricePaise());
        assertEquals(48000L, reloaded.items().get(0).lineTotalPaise());
    }

    @Test
    @DisplayName("34. Change product purchase price after sale")
    void testChangeProductPurchasePriceAfterSale() {
        StockpileService.Product p = createTestProduct("Flashlight", "FLS-01", "Tools", 15000L, 30000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)), 0L, "CASH"
        ));

        // Update product purchase price to 25000 paise
        service.updateProduct(p.id(), new StockpileService.UpdateProductRequest(
            p.name(), p.sku(), p.category(), 25000L, p.sellingPricePaise(),
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));

        assertEquals(25000L, service.getProductById(p.id()).purchasePricePaise());
    }

    @Test
    @DisplayName("35. Verify historical purchase cost and gross profit remain unchanged")
    void testHistoricalPurchaseCostAndGrossProfitRemainUnchanged() {
        StockpileService.Product p = createTestProduct("Clamp", "CLP-01", "Tools", 8000L, 16000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3)), 0L, "UPI"
        ));

        assertEquals(24000L, sale.totalCostPaise());
        assertEquals(24000L, sale.grossProfitPaise());

        // Update product purchase price to 14000 paise
        service.updateProduct(p.id(), new StockpileService.UpdateProductRequest(
            p.name(), p.sku(), p.category(), 14000L, p.sellingPricePaise(),
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));

        StockpileService.SaleDetails reloaded = service.getSaleById(sale.id());
        assertEquals(24000L, reloaded.totalCostPaise());
        assertEquals(24000L, reloaded.grossProfitPaise());
        assertEquals(8000L, reloaded.items().get(0).unitPurchasePricePaise());
        assertEquals(24000L, reloaded.items().get(0).lineCostPaise());
    }

    // ==========================================
    // 36-40: REGRESSION TESTING
    // ==========================================

    @Test
    @DisplayName("36. Product CRUD regression")
    void testRegressionProductCrud() {
        StockpileService.Product created = createTestProduct("Test Item", "TST-01", "Misc", 1000L, 2000L, 5);
        assertEquals("Test Item", created.name());

        StockpileService.Product fetched = service.getProductById(created.id());
        assertEquals(created.id(), fetched.id());

        StockpileService.Product updated = service.updateProduct(created.id(), new StockpileService.UpdateProductRequest(
            "Updated Item", "TST-01", "Misc", 1200L, 2500L, 5, 20, 1.0, 5
        ));
        assertEquals("Updated Item", updated.name());

        // Creating with 0 quantity allows deletion because no movement history
        StockpileService.Product zeroQty = createTestProduct("No Stock Item", "ZRO-01", "Misc", 1000L, 2000L, 0);
        assertDoesNotThrow(() -> service.deleteProduct(zeroQty.id()));
    }

    @Test
    @DisplayName("37. Stock In and Stock Out regression")
    void testRegressionStockInAndStockOut() {
        StockpileService.Product p = createTestProduct("Battery", "BAT-01", "Electronics", 5000L, 10000L, 10);

        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "IN", 5, "Batch arrival"));
        assertEquals(15, service.getProductById(p.id()).quantity());

        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "OUT", 3, "Sample unit"));
        assertEquals(12, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("38. Stock movement history regression")
    void testRegressionStockMovementHistory() {
        StockpileService.Product p = createTestProduct("Cable", "CBL-01", "Electronics", 2000L, 4000L, 10);
        List<StockpileService.RecentMovement> list = service.getMovements(p.id(), null);
        assertFalse(list.isEmpty());
        assertEquals(p.id(), list.get(0).productId());
        assertEquals("Cable", list.get(0).productName());
    }

    @Test
    @DisplayName("39. Dashboard API regression")
    void testRegressionDashboardApi() {
        createTestProduct("Lamp", "LMP-01", "Furniture", 10000L, 20000L, 10);
        createTestProduct("Chair", "CHR-01", "Furniture", 25000L, 50000L, 0); // Out of stock

        StockpileService.DashboardResponse dash = service.getDashboard();
        assertEquals(2, dash.totalProducts());
        assertEquals(10, dash.totalQuantity());
        assertEquals(1, dash.outOfStockCount());
        assertNotNull(dash.categoryBreakdown());
    }

    @Test
    @DisplayName("40. Inventory Intelligence API regression")
    void testRegressionInventoryIntelligenceApi() {
        StockpileService.Product p = createTestProduct("Bulb", "BLB-01", "Lighting", 1000L, 2000L, 0);
        List<StockpileService.ProductIntelligence> intel = service.getInventoryIntelligence();
        assertFalse(intel.isEmpty());

        StockpileService.ProductIntelligence item = intel.stream()
            .filter(i -> i.productId().equals(p.id()))
            .findFirst()
            .orElseThrow();

        assertEquals("OUT_OF_STOCK", item.status());
        assertEquals("Restock this product immediately.", item.recommendation());
    }

    // ==========================================
    // SALES FLEXIBILITY & CHECKOUT IMPROVEMENT TESTS (1 to 23)
    // ==========================================

    @Test
    @DisplayName("Flex 1. Normal sale without price override")
    void testNormalSaleWithoutPriceOverride() {
        StockpileService.Product p = createTestProduct("Standard Mug", "MUG-001", "Kitchen", 5000L, 12000L, 20);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            "CASH"
        ));

        assertEquals(24000L, sale.subtotalPaise());
        assertEquals(0L, sale.discountPaise());
        assertEquals(24000L, sale.totalPaise());
        assertEquals(1, sale.items().size());
        assertEquals(12000L, sale.items().get(0).unitSellingPricePaise());
        assertEquals(24000L, sale.items().get(0).lineTotalPaise());
        assertFalse(Boolean.TRUE.equals(sale.items().get(0).belowCost()));
        assertFalse(Boolean.TRUE.equals(sale.hasBelowCostItem()));
    }

    @Test
    @DisplayName("Flex 2. Sale with per-item price override")
    void testSaleWithPerItemPriceOverride() {
        StockpileService.Product p = createTestProduct("Custom Bottle", "BTL-002", "Kitchen", 4000L, 10000L, 20);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2, 8500L)),
            "UPI"
        ));

        assertEquals(17000L, sale.subtotalPaise());
        assertEquals(0L, sale.discountPaise());
        assertEquals(17000L, sale.totalPaise());
        assertEquals(8500L, sale.items().get(0).unitSellingPricePaise());
        assertEquals(17000L, sale.items().get(0).lineTotalPaise());
    }

    @Test
    @DisplayName("Flex 3. Verify product master price remains unchanged")
    void testProductMasterPriceRemainsUnchanged() {
        StockpileService.Product p = createTestProduct("Master Plate", "PLT-003", "Kitchen", 3000L, 7500L, 15);
        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3, 5000L)),
            "CARD"
        ));

        StockpileService.Product fetched = service.getProductById(p.id());
        assertEquals(7500L, fetched.sellingPricePaise(), "Master product selling price must remain completely unchanged");
        assertEquals(3000L, fetched.purchasePricePaise(), "Master product purchase price must remain completely unchanged");
        assertEquals(12, fetched.quantity(), "Physical stock must be decremented by sale quantity");
    }

    @Test
    @DisplayName("Flex 4. Multi-product sale with different custom prices")
    void testMultiProductSaleWithDifferentCustomPrices() {
        StockpileService.Product p1 = createTestProduct("Pen", "PEN-004", "Stationery", 1000L, 2500L, 30);
        StockpileService.Product p2 = createTestProduct("Notebook", "NB-004", "Stationery", 4000L, 8000L, 20);
        StockpileService.Product p3 = createTestProduct("Eraser", "ERS-004", "Stationery", 500L, 1000L, 50);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 4, 2000L),
                new StockpileService.SaleItemRequest(p2.id(), 2),
                new StockpileService.SaleItemRequest(p3.id(), 5, 800L)
            ),
            "UPI"
        ));

        assertEquals(28000L, sale.subtotalPaise());
        assertEquals(28000L, sale.totalPaise());
        assertEquals(3, sale.items().size());
        assertEquals(8000L, sale.items().get(0).lineTotalPaise());
        assertEquals(16000L, sale.items().get(1).lineTotalPaise());
        assertEquals(4000L, sale.items().get(2).lineTotalPaise());
    }

    @Test
    @DisplayName("Flex 5. Percentage discount of 5%")
    void testPercentageDiscountFivePercent() {
        StockpileService.Product p = createTestProduct("Shirt", "SHT-005", "Apparel", 20000L, 40000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
            BigDecimal.valueOf(5),
            "CASH"
        ));

        assertEquals(40000L, sale.subtotalPaise());
        assertEquals(2000L, sale.discountPaise(), "5% of 40000 is 2000 paise");
        assertEquals(38000L, sale.totalPaise());
        assertEquals(500, sale.discountPercentBasisPoints());
        assertEquals(5.0, sale.discountPercent());
    }

    @Test
    @DisplayName("Flex 6. Percentage discount of 10%")
    void testPercentageDiscountTenPercent() {
        StockpileService.Product p = createTestProduct("Pants", "PNT-006", "Apparel", 25000L, 50000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            BigDecimal.valueOf(10),
            "CARD"
        ));

        assertEquals(100000L, sale.subtotalPaise());
        assertEquals(10000L, sale.discountPaise(), "10% of 100000 is 10000 paise");
        assertEquals(90000L, sale.totalPaise());
        assertEquals(1000, sale.discountPercentBasisPoints());
        assertEquals(10.0, sale.discountPercent());
    }

    @Test
    @DisplayName("Flex 7. Percentage discount of 12.5%")
    void testPercentageDiscountTwelvePointFivePercent() {
        StockpileService.Product p = createTestProduct("Jacket", "JKT-007", "Apparel", 40000L, 80000L, 5);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
            BigDecimal.valueOf(12.5),
            "UPI"
        ));

        assertEquals(80000L, sale.subtotalPaise());
        assertEquals(10000L, sale.discountPaise());
        assertEquals(70000L, sale.totalPaise());
        assertEquals(1250, sale.discountPercentBasisPoints());
        assertEquals(12.5, sale.discountPercent());
    }

    @Test
    @DisplayName("Flex 8. Percentage discount of 100%")
    void testPercentageDiscountOneHundredPercent() {
        StockpileService.Product p = createTestProduct("Gift Item", "GFT-008", "Gifts", 1500L, 3000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            BigDecimal.valueOf(100),
            "OTHER"
        ));

        assertEquals(6000L, sale.subtotalPaise());
        assertEquals(6000L, sale.discountPaise());
        assertEquals(0L, sale.totalPaise());
        assertEquals(10000, sale.discountPercentBasisPoints());
        assertEquals(100.0, sale.discountPercent());
        assertEquals(-3000L, sale.grossProfitPaise(), "Gross profit is Total (0) - COGS (3000) = -3000");
    }

    @Test
    @DisplayName("Flex 9. Reject negative discount")
    void testRejectNegativeDiscount() {
        StockpileService.Product p = createTestProduct("Item A", "ITM-009", "General", 1000L, 2000L, 10);

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                BigDecimal.valueOf(-5),
                "CASH"
            ))
        );
        assertTrue(ex1.getMessage().contains("negative"), "Should reject negative discount percentage");

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                -500L,
                "CASH"
            ))
        );
        assertTrue(ex2.getMessage().contains("negative"), "Should reject negative legacy discount paise");
    }

    @Test
    @DisplayName("Flex 10. Reject discount above 100%")
    void testRejectDiscountAboveOneHundredPercent() {
        StockpileService.Product p = createTestProduct("Item B", "ITM-010", "General", 1000L, 2000L, 10);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                BigDecimal.valueOf(100.01),
                "CASH"
            ))
        );
        assertTrue(ex.getMessage().contains("exceed 100%"), "Should reject discount exceeding 100%");
    }

    @Test
    @DisplayName("Flex 11. Reject invalid monetary values")
    void testRejectInvalidMonetaryValues() {
        StockpileService.Product p = createTestProduct("Item C", "ITM-011", "General", 1000L, 2000L, 10);

        assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1, -100L)),
                "CASH"
            ))
        );

        assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                new BigDecimal("12.345"),
                "CASH"
            ))
        );
    }

    @Test
    @DisplayName("Flex 12. Verify rounding to paise")
    void testVerifyRoundingToPaise() {
        StockpileService.Product p1 = createTestProduct("Item D1", "ITM-012A", "General", 100L, 333L, 10);
        StockpileService.SaleDetails s1 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p1.id(), 1)),
            BigDecimal.valueOf(10),
            "CASH"
        ));
        assertEquals(333L, s1.subtotalPaise());
        assertEquals(33L, s1.discountPaise(), "333 * 0.10 = 33.3 -> rounds to 33 paise");
        assertEquals(300L, s1.totalPaise());

        StockpileService.Product p2 = createTestProduct("Item D2", "ITM-012B", "General", 100L, 335L, 10);
        StockpileService.SaleDetails s2 = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p2.id(), 1)),
            BigDecimal.valueOf(10),
            "CASH"
        ));
        assertEquals(335L, s2.subtotalPaise());
        assertEquals(34L, s2.discountPaise(), "335 * 0.10 = 33.5 -> rounds to 34 paise");
        assertEquals(301L, s2.totalPaise());
    }

    @Test
    @DisplayName("Flex 13. Verify correct subtotal")
    void testVerifyCorrectSubtotal() {
        StockpileService.Product p1 = createTestProduct("Item E1", "ITM-013A", "General", 2000L, 5000L, 10);
        StockpileService.Product p2 = createTestProduct("Item E2", "ITM-013B", "General", 3000L, 6000L, 10);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 3, 4500L),
                new StockpileService.SaleItemRequest(p2.id(), 2, 5500L)
            ),
            "UPI"
        ));

        assertEquals(24500L, sale.subtotalPaise());
    }

    @Test
    @DisplayName("Flex 14. Verify correct discount amount")
    void testVerifyCorrectDiscountAmount() {
        StockpileService.Product p = createTestProduct("Item F", "ITM-014", "General", 5000L, 15000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            new BigDecimal("15.75"),
            "CARD"
        ));

        assertEquals(30000L, sale.subtotalPaise());
        assertEquals(4725L, sale.discountPaise());
        assertEquals(1575, sale.discountPercentBasisPoints());
        assertEquals(15.75, sale.discountPercent());

        StockpileService.SaleDetails fetched = service.getSaleById(sale.id());
        assertEquals(4725L, fetched.discountPaise());
        assertEquals(1575, fetched.discountPercentBasisPoints());
        assertEquals(15.75, fetched.discountPercent());
    }

    @Test
    @DisplayName("Flex 15. Verify final total")
    void testVerifyFinalTotal() {
        StockpileService.Product p = createTestProduct("Item G", "ITM-015", "General", 1000L, 5000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2, 4000L)),
            BigDecimal.valueOf(20),
            "CASH"
        ));

        assertEquals(8000L, sale.subtotalPaise());
        assertEquals(1600L, sale.discountPaise());
        assertEquals(6400L, sale.totalPaise());
        assertEquals(sale.subtotalPaise() - sale.discountPaise(), sale.totalPaise());
    }

    @Test
    @DisplayName("Flex 16. Verify COGS")
    void testVerifyCogs() {
        StockpileService.Product p1 = createTestProduct("Item H1", "ITM-016A", "General", 2500L, 6000L, 10);
        StockpileService.Product p2 = createTestProduct("Item H2", "ITM-016B", "General", 4000L, 9000L, 10);

        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(
                new StockpileService.SaleItemRequest(p1.id(), 2, 5000L),
                new StockpileService.SaleItemRequest(p2.id(), 3, 7000L)
            ),
            "UPI"
        ));

        assertEquals(17000L, sale.totalCostPaise());
        assertEquals(5000L, sale.items().get(0).lineCostPaise());
        assertEquals(12000L, sale.items().get(1).lineCostPaise());
    }

    @Test
    @DisplayName("Flex 17. Verify gross profit, including negative profit")
    void testVerifyGrossProfitIncludingNegativeProfit() {
        StockpileService.Product p = createTestProduct("Loss Leader", "ITM-017", "Grocery", 8000L, 10000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2, 5000L)),
            "CASH"
        ));

        assertEquals(10000L, sale.totalPaise());
        assertEquals(16000L, sale.totalCostPaise());
        assertEquals(-6000L, sale.grossProfitPaise(), "Gross profit must allow negative value when sold below cost");
        assertTrue(Boolean.TRUE.equals(sale.items().get(0).belowCost()), "Item must indicate belowCost = true");
        assertTrue(Boolean.TRUE.equals(sale.hasBelowCostItem()), "SaleDetails must indicate hasBelowCostItem = true");
    }

    @Test
    @DisplayName("Flex 18. Verify historical price snapshots after later product price changes")
    void testHistoricalPriceSnapshotsAfterLaterProductPriceChanges() {
        StockpileService.Product p = createTestProduct("Snapshot Item", "ITM-018", "Tech", 10000L, 20000L, 15);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2, 18000L)),
            "UPI"
        ));

        service.updateProduct(p.id(), new StockpileService.UpdateProductRequest(
            "Snapshot Item Renamed", "ITM-018", "Tech", 15000L, 35000L, 5, 20, 1.0, 5
        ));

        StockpileService.Product updatedProduct = service.getProductById(p.id());
        assertEquals(35000L, updatedProduct.sellingPricePaise());
        assertEquals(15000L, updatedProduct.purchasePricePaise());

        StockpileService.SaleDetails historicalSale = service.getSaleById(sale.id());
        assertEquals(36000L, historicalSale.subtotalPaise());
        assertEquals(36000L, historicalSale.totalPaise());
        assertEquals(20000L, historicalSale.totalCostPaise());
        assertEquals(16000L, historicalSale.grossProfitPaise());
        assertEquals(18000L, historicalSale.items().get(0).unitSellingPricePaise());
        assertEquals(10000L, historicalSale.items().get(0).unitPurchasePricePaise());
    }

    @Test
    @DisplayName("Flex 19. Verify legacy discountPaise requests remain compatible")
    void testLegacyDiscountPaiseCompatibility() {
        StockpileService.Product p = createTestProduct("Legacy Item", "ITM-019", "General", 2000L, 5000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 2)),
            1500L,
            "CASH"
        ));

        assertEquals(10000L, sale.subtotalPaise());
        assertEquals(1500L, sale.discountPaise());
        assertEquals(8500L, sale.totalPaise());
        assertNull(sale.discountPercentBasisPoints(), "Legacy discountPaise request should have null basis points");
        assertNull(sale.discountPercent(), "Legacy discountPaise request should have null discount percent");
    }

    @Test
    @DisplayName("Flex 20. Reject ambiguous requests containing both discount fields")
    void testRejectAmbiguousBothDiscountFields() {
        StockpileService.Product p = createTestProduct("Item Both", "ITM-020", "General", 1000L, 4000L, 10);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 1)),
                500L,
                BigDecimal.valueOf(10),
                "CASH"
            ))
        );
        assertTrue(ex.getMessage().contains("both"), "Must reject request containing both discountPercent and discountPaise");
    }

    @Test
    @DisplayName("Flex 21. Verify surplus sales remain correct")
    void testSurplusSalesRemainCorrect() {
        StockpileService.Product p = createTestProduct("Surplus Chair", "CHR-021", "Furniture", 10000L, 25000L, 20);

        StockpileService.SurplusListingDetails listing = service.createSurplusListing(
            new StockpileService.CreateSurplusListingRequest(
                p.id(), 8, 18000L, "Overstock", "Special clearance"
            )
        );

        StockpileService.SaleDetails surplusSale = service.recordSurplusSale(
            listing.id(),
            new StockpileService.RecordSurplusSaleRequest(3, "UPI")
        );

        assertEquals(54000L, surplusSale.subtotalPaise(), "3 * 18000 = 54000");
        assertEquals(54000L, surplusSale.totalPaise());
        assertEquals(30000L, surplusSale.totalCostPaise(), "3 * 10000 = 30000");
        assertEquals(24000L, surplusSale.grossProfitPaise());
        assertEquals(18000L, surplusSale.items().get(0).unitSellingPricePaise());
        assertEquals(listing.id(), surplusSale.items().get(0).surplusListingId());

        StockpileService.Product currentP = service.getProductById(p.id());
        assertEquals(17, currentP.quantity());

        assertThrows(IllegalArgumentException.class, () ->
            service.createSale(new StockpileService.CreateSaleRequest(
                List.of(new StockpileService.SaleItemRequest(p.id(), 13, 20000L)),
                "CASH"
            ))
        );
    }

    @Test
    @DisplayName("Flex 22. Verify sale cancellation remains correct")
    void testSaleCancellationRemainsCorrect() {
        StockpileService.Product p = createTestProduct("Cancel Item", "CAN-022", "General", 3000L, 8000L, 10);
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 3, 7000L)),
            BigDecimal.valueOf(10),
            "UPI"
        ));

        assertEquals(7, service.getProductById(p.id()).quantity());

        StockpileService.SaleDetails cancelled = service.cancelSale(
            sale.id(),
            new StockpileService.CancelSaleRequest("Customer returned goods")
        );

        assertEquals("CANCELLED", cancelled.status());
        assertNotNull(cancelled.cancelledAt());
        assertEquals(10, service.getProductById(p.id()).quantity(), "Stock must be fully restored upon cancellation");

        List<StockpileService.RecentMovement> movements = service.getMovements(p.id(), null);
        assertTrue(movements.stream().anyMatch(m -> m.reason() != null && m.reason().contains("Cancelled")));
    }

    @Test
    @DisplayName("Flex 23. Verify reports continue calculating correctly")
    void testReportsContinueCalculatingCorrectly() {
        StockpileService.Product p1 = createTestProduct("Report Widget A", "RPT-023A", "General", 2000L, 5000L, 50);
        StockpileService.Product p2 = createTestProduct("Report Widget B", "RPT-023B", "General", 4000L, 10000L, 50);

        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p1.id(), 2, 4500L)),
            BigDecimal.valueOf(10),
            "CASH"
        ));

        service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p2.id(), 1, 9000L)),
            BigDecimal.valueOf(5),
            "UPI"
        ));

        StockpileService.SalesMetricsSummary metrics = service.getSalesMetricsSummary();
        assertNotNull(metrics);
        assertEquals(2, metrics.totalSalesCount());
        assertEquals(16650L, metrics.totalSalesPaise(), "8100 + 8550 = 16650");
        assertEquals(8000L, metrics.totalCostPaise(), "4000 + 4000 = 8000");
        assertEquals(8650L, metrics.totalProfitPaise(), "16650 - 8000 = 8650");

        List<StockpileService.DailySalesTrend> trend = service.getDailySalesTrend();
        assertFalse(trend.isEmpty());
        assertTrue(trend.stream().anyMatch(t -> t.totalPaise() >= 16650L));
    }
}
