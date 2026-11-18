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
public class StockAuditTests {

    @Autowired
    private StockpileService service;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
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

    private Product createTestProduct(String name, String sku, String category, long purchasePaise, long sellingPaise, int qty) {
        return service.createProduct(new CreateProductRequest(
            name, sku, category, purchasePaise, sellingPaise, qty, 5, 20, 1.0, 5
        ));
    }

    private Supplier createTestSupplier(String name) {
        return service.createSupplier(new CreateSupplierRequest(
            name, "Contact", "1234567890", "vendor@example.com", "Address", "Notes"
        ));
    }

    // ==========================================
    // 1-8: AUDIT CREATION TESTS
    // ==========================================

    @Test
    @DisplayName("1. Create audit for selected products")
    void testCreateAuditForSelectedProducts() {
        Product p1 = createTestProduct("Hammer", "HMR-01", "Tools", 5000L, 10000L, 15);
        Product p2 = createTestProduct("Wrench", "WRN-01", "Tools", 6000L, 12000L, 20);
        Product p3 = createTestProduct("Pliers", "PLR-01", "Tools", 4000L, 8000L, 25);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id(), p2.id()),
            "Quarterly count for select tools"
        ));

        assertNotNull(audit);
        assertNotNull(audit.id());
        assertEquals("OPEN", audit.status());
        assertEquals("Quarterly count for select tools", audit.notes());
        assertEquals(2, audit.totalProducts());
        assertEquals(0, audit.countedProducts());
        assertEquals(0, audit.discrepancyCount());
        assertEquals(2, audit.items().size());

        List<Long> auditProductIds = audit.items().stream().map(StockAuditItemDetails::productId).toList();
        assertTrue(auditProductIds.contains(p1.id()));
        assertTrue(auditProductIds.contains(p2.id()));
        assertFalse(auditProductIds.contains(p3.id()));
    }

    @Test
    @DisplayName("2. Create audit for all products")
    void testCreateAuditForAllProducts() {
        Product p1 = createTestProduct("Bolt", "BLT-01", "Hardware", 100L, 200L, 100);
        Product p2 = createTestProduct("Nut", "NUT-01", "Hardware", 80L, 160L, 150);

        // When productIds is null, includes all existing products
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            null,
            "Full warehouse physical audit"
        ));

        assertNotNull(audit);
        assertEquals(2, audit.totalProducts());
        assertEquals(2, audit.items().size());
        assertEquals("OPEN", audit.status());
    }

    @Test
    @DisplayName("3. Verify system quantity snapshots")
    void testVerifySystemQuantitySnapshots() {
        Product p1 = createTestProduct("Cable", "CBL-01", "Electrical", 1000L, 2000L, 42);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Snapshots test"
        ));

        StockAuditItemDetails item = audit.items().get(0);
        assertEquals(42, item.systemQuantity());
        assertNull(item.countedQuantity());
        assertNull(item.variance());
        assertEquals("UNCOUNTED", item.countStatus());
    }

    @Test
    @DisplayName("4. Verify product name and SKU snapshots")
    void testVerifyProductNameAndSkuSnapshots() {
        Product p1 = createTestProduct("Industrial Drill 18V", "DRL-18V-IND", "Machinery", 150000L, 250000L, 10);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Snapshots check"
        ));

        StockAuditItemDetails item = audit.items().get(0);
        assertEquals("Industrial Drill 18V", item.productNameSnapshot());
        assertEquals("DRL-18V-IND", item.skuSnapshot());
    }

    @Test
    @DisplayName("5. Reject empty product selection")
    void testRejectEmptyProductSelection() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.createStockAudit(new CreateStockAuditRequest(
                List.of(),
                "Empty selection"
            ));
        });
    }

    @Test
    @DisplayName("6. Reject nonexistent products")
    void testRejectNonexistentProducts() {
        assertThrows(ProductNotFoundException.class, () -> {
            service.createStockAudit(new CreateStockAuditRequest(
                List.of(999999L),
                "Nonexistent product"
            ));
        });
    }

    @Test
    @DisplayName("7. Reject duplicate product IDs")
    void testRejectDuplicateProductIds() {
        Product p1 = createTestProduct("Screwdriver", "SCR-01", "Tools", 1000L, 2000L, 30);

        assertThrows(IllegalArgumentException.class, () -> {
            service.createStockAudit(new CreateStockAuditRequest(
                List.of(p1.id(), p1.id()),
                "Duplicate products"
            ));
        });
    }

    @Test
    @DisplayName("8. Verify stock remains unchanged upon audit creation")
    void testVerifyStockRemainsUnchangedOnCreation() {
        Product p1 = createTestProduct("Tape", "TP-01", "Supplies", 500L, 1000L, 50);

        service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Stock check on create"
        ));

        Product refreshed = service.getProductById(p1.id());
        assertEquals(50, refreshed.quantity());
    }

    // ==========================================
    // 9-15: COUNTING TESTS
    // ==========================================

    @Test
    @DisplayName("9. Enter a physical quantity")
    void testEnterPhysicalQuantity() {
        Product p1 = createTestProduct("Paint", "PNT-01", "Finishes", 2000L, 4000L, 20);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Counting test"
        ));

        Long itemId = audit.items().get(0).id();
        StockAuditItemDetails updatedItem = service.enterCount(
            audit.id(),
            itemId,
            new EnterCountRequest(27, "Seven extra cans found in back shelf")
        );

        assertEquals(27, updatedItem.countedQuantity());
        assertEquals(7, updatedItem.variance());
        assertEquals("DISCREPANCY", updatedItem.countStatus());
        assertEquals("Seven extra cans found in back shelf", updatedItem.itemNotes());

        // Verify audit details aggregates reflect the count
        StockAuditDetails refreshedAudit = service.getStockAuditById(audit.id());
        assertEquals(1, refreshedAudit.countedProducts());
        assertEquals(1, refreshedAudit.discrepancyCount());
    }

    @Test
    @DisplayName("10. Enter zero as a physical quantity")
    void testEnterZeroAsPhysicalQuantity() {
        Product p1 = createTestProduct("Glue", "GLU-01", "Supplies", 1000L, 2000L, 15);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Zero count"
        ));

        Long itemId = audit.items().get(0).id();
        StockAuditItemDetails updatedItem = service.enterCount(
            audit.id(),
            itemId,
            new EnterCountRequest(0, "All depleted or expired")
        );

        assertEquals(0, updatedItem.countedQuantity());
        assertEquals(-15, updatedItem.variance());
        assertEquals("DISCREPANCY", updatedItem.countStatus());
    }

    @Test
    @DisplayName("11. Update an existing count")
    void testUpdateExistingCount() {
        Product p1 = createTestProduct("Nails", "NLS-01", "Hardware", 500L, 1000L, 100);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Recount test"
        ));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(90, "First count"));
        StockAuditItemDetails recount = service.enterCount(
            audit.id(),
            itemId,
            new EnterCountRequest(95, "Second recount found 5 more")
        );

        assertEquals(95, recount.countedQuantity());
        assertEquals(-5, recount.variance());
        assertEquals("Second recount found 5 more", recount.itemNotes());
    }

    @Test
    @DisplayName("12. Reject negative counts")
    void testRejectNegativeCounts() {
        Product p1 = createTestProduct("Screws", "SCR-02", "Hardware", 400L, 800L, 50);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id()),
            "Negative count"
        ));

        Long itemId = audit.items().get(0).id();
        assertThrows(IllegalArgumentException.class, () -> {
            service.enterCount(audit.id(), itemId, new EnterCountRequest(-5, "Negative value"));
        });
    }

    @Test
    @DisplayName("13. Reject an item belonging to another audit")
    void testRejectItemBelongingToAnotherAudit() {
        Product p1 = createTestProduct("Item A", "ITM-A", "Cat", 1000L, 2000L, 10);
        Product p2 = createTestProduct("Item B", "ITM-B", "Cat", 1000L, 2000L, 10);

        StockAuditDetails audit1 = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Audit 1"));
        StockAuditDetails audit2 = service.createStockAudit(new CreateStockAuditRequest(List.of(p2.id()), "Audit 2"));

        Long item1Id = audit1.items().get(0).id();

        assertThrows(StockAuditNotFoundException.class, () -> {
            service.enterCount(audit2.id(), item1Id, new EnterCountRequest(10, "Wrong audit"));
        });
    }

    @Test
    @DisplayName("14. Reject count updates on completed audits")
    void testRejectCountUpdatesOnCompletedAudits() {
        Product p1 = createTestProduct("Widget", "WDG-01", "Cat", 1000L, 2000L, 10);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Audit"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(10, "Matched count"));
        service.completeStockAudit(audit.id());

        assertThrows(StockAuditConflictException.class, () -> {
            service.enterCount(audit.id(), itemId, new EnterCountRequest(12, "Count after completion"));
        });
    }

    @Test
    @DisplayName("15. Verify stock remains unchanged while counting")
    void testVerifyStockRemainsUnchangedWhileCounting() {
        Product p1 = createTestProduct("Bulb", "BLB-01", "Electrical", 1000L, 2000L, 20);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Counting"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(50, "Count higher"));

        // Product stock in database must remain 20
        assertEquals(20, service.getProductById(p1.id()).quantity());
    }

    // ==========================================
    // 16-24: COMPLETION TESTS
    // ==========================================

    @Test
    @DisplayName("16. Complete an audit with no discrepancies")
    void testCompleteAuditWithNoDiscrepancies() {
        Product p1 = createTestProduct("Switch", "SW-01", "Electrical", 1000L, 2000L, 25);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Audit match"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(25, "Count exact"));

        StockAuditCompletionSummary summary = service.completeStockAudit(audit.id());
        assertEquals("COMPLETED", summary.status());
        assertNotNull(summary.completedAt());
        assertEquals(0, summary.adjustedProducts());
        assertEquals(1, summary.unchangedProducts());

        // Verify product quantity unchanged
        assertEquals(25, service.getProductById(p1.id()).quantity());

        // Verify NO stock movements created for zero discrepancy
        Integer movementCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM stock_movements WHERE product_id = ?",
            Integer.class,
            p1.id()
        );
        assertEquals(1, movementCount); // only initial opening stock movement from createProduct
    }

    @Test
    @DisplayName("17. Complete an audit with multiple discrepancies")
    void testCompleteAuditWithMultipleDiscrepancies() {
        Product p1 = createTestProduct("Gasket", "GSK-01", "Hardware", 1000L, 2000L, 20);
        Product p2 = createTestProduct("Valve", "VLV-01", "Hardware", 5000L, 10000L, 30);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id(), p2.id()),
            "Multiple discrepancies"
        ));

        Long item1Id = audit.items().get(0).id();
        Long item2Id = audit.items().get(1).id();

        service.enterCount(audit.id(), item1Id, new EnterCountRequest(25, "+5 found"));
        service.enterCount(audit.id(), item2Id, new EnterCountRequest(27, "-3 missing"));

        StockAuditCompletionSummary summary = service.completeStockAudit(audit.id());
        assertEquals("COMPLETED", summary.status());
        assertEquals(2, summary.adjustedProducts());
        assertEquals(0, summary.unchangedProducts());
    }

    @Test
    @DisplayName("18. Verify correct product quantities after completion")
    void testVerifyCorrectProductQuantitiesAfterCompletion() {
        Product p1 = createTestProduct("Wire", "WR-01", "Electrical", 1000L, 2000L, 50);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Reconcile"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(42, "Missing 8"));
        service.completeStockAudit(audit.id());

        Product updated = service.getProductById(p1.id());
        assertEquals(42, updated.quantity());
    }

    @Test
    @DisplayName("19. Verify one movement for every non-zero discrepancy")
    void testVerifyOneMovementForEveryNonZeroDiscrepancy() {
        Product p1 = createTestProduct("Fuse", "FS-01", "Electrical", 500L, 1000L, 40);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Movement check"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(46, "Six extra"));
        service.completeStockAudit(audit.id());

        List<RecentMovement> movements = service.getMovements(p1.id(), "ADJUSTMENT");
        assertEquals(1, movements.size());
        RecentMovement m = movements.get(0);
        assertEquals("ADJUSTMENT", m.movementType());
        assertEquals(6, m.quantity());
        assertEquals(40, m.previousQuantity());
        assertEquals(46, m.newQuantity());
        assertTrue(m.reason().contains("Stock Audit #" + audit.id()));
    }

    @Test
    @DisplayName("20. Verify no movement for zero discrepancies")
    void testVerifyNoMovementForZeroDiscrepancies() {
        Product p1 = createTestProduct("Relay", "RLY-01", "Electrical", 2000L, 4000L, 10);
        Product p2 = createTestProduct("Sensor", "SNR-01", "Electrical", 5000L, 10000L, 15);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id(), p2.id()),
            "Zero variance movement check"
        ));

        service.enterCount(audit.id(), audit.items().get(0).id(), new EnterCountRequest(10, "Exact match"));
        service.enterCount(audit.id(), audit.items().get(1).id(), new EnterCountRequest(18, "Three surplus"));
        service.completeStockAudit(audit.id());

        // p1 had 0 discrepancy -> 0 ADJUSTMENT movements
        List<RecentMovement> p1Adjustments = service.getMovements(p1.id(), "ADJUSTMENT");
        assertTrue(p1Adjustments.isEmpty());

        // p2 had non-zero discrepancy -> 1 ADJUSTMENT movement
        List<RecentMovement> p2Adjustments = service.getMovements(p2.id(), "ADJUSTMENT");
        assertEquals(1, p2Adjustments.size());
    }

    @Test
    @DisplayName("21. Reject completion if products are uncounted")
    void testRejectCompletionIfProductsAreUncounted() {
        Product p1 = createTestProduct("Socket", "SKT-01", "Electrical", 1000L, 2000L, 20);
        Product p2 = createTestProduct("Plug", "PLG-01", "Electrical", 800L, 1600L, 30);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id(), p2.id()),
            "Partial count completion"
        ));

        // Count only product 1, leave product 2 uncounted
        service.enterCount(audit.id(), audit.items().get(0).id(), new EnterCountRequest(20, "Counted p1"));

        assertThrows(StockAuditConflictException.class, () -> {
            service.completeStockAudit(audit.id());
        });
    }

    @Test
    @DisplayName("22. Reject duplicate completion")
    void testRejectDuplicateCompletion() {
        Product p1 = createTestProduct("Capacitor", "CAP-01", "Electrical", 200L, 400L, 100);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Duplicate completion"));

        service.enterCount(audit.id(), audit.items().get(0).id(), new EnterCountRequest(100, "Counted"));
        service.completeStockAudit(audit.id());

        assertThrows(StockAuditConflictException.class, () -> {
            service.completeStockAudit(audit.id());
        });
    }

    @Test
    @DisplayName("23. Verify the entire completion rolls back if one update fails")
    void testCompletionRollsBackIfOneUpdateFails() {
        Product p1 = createTestProduct("Item Rollback 1", "RB-01", "Testing", 1000L, 2000L, 10);
        Product p2 = createTestProduct("Item Rollback 2", "RB-02", "Testing", 1000L, 2000L, 20);

        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(
            List.of(p1.id(), p2.id()),
            "Rollback test"
        ));

        service.enterCount(audit.id(), audit.items().get(0).id(), new EnterCountRequest(15, "+5"));
        service.enterCount(audit.id(), audit.items().get(1).id(), new EnterCountRequest(25, "+5"));

        // Simulate concurrent change on product 2 that triggers concurrency rejection
        jdbcTemplate.update("UPDATE products SET quantity = 99 WHERE id = ?", p2.id());

        assertThrows(StockAuditConflictException.class, () -> {
            service.completeStockAudit(audit.id());
        });

        // Verify product 1 was NOT modified during failed completion
        assertEquals(10, service.getProductById(p1.id()).quantity());
        // Verify no ADJUSTMENT stock movement was recorded
        List<RecentMovement> movements = service.getMovements(p1.id(), "ADJUSTMENT");
        assertTrue(movements.isEmpty());
        // Verify audit remains OPEN
        assertEquals("OPEN", service.getStockAuditById(audit.id()).status());
    }

    @Test
    @DisplayName("24. Reject stale stock snapshots when inventory changes during an audit")
    void testRejectStaleStockSnapshotsWhenInventoryChangesDuringAudit() {
        Product p1 = createTestProduct("Stale Test", "STL-01", "Testing", 1000L, 2000L, 30);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Stale test"));

        service.enterCount(audit.id(), audit.items().get(0).id(), new EnterCountRequest(30, "Matched snapshot"));

        // A sale, stock-in or adjustment occurs while counting
        service.recordMovement(new CreateMovementRequest(p1.id(), "IN", 10, "Supplier shipment arrived"));
        assertEquals(40, service.getProductById(p1.id()).quantity());

        // Completion must be rejected with 409 Conflict
        StockAuditConflictException ex = assertThrows(StockAuditConflictException.class, () -> {
            service.completeStockAudit(audit.id());
        });

        assertTrue(ex.getMessage().contains("changed during the audit"));
        assertEquals(40, service.getProductById(p1.id()).quantity());
        assertEquals("OPEN", service.getStockAuditById(audit.id()).status());
    }

    // ==========================================
    // 25-29: CANCELLATION TESTS
    // ==========================================

    @Test
    @DisplayName("25. Cancel an OPEN audit")
    void testCancelOpenAudit() {
        Product p1 = createTestProduct("Canceller", "CNC-01", "Testing", 1000L, 2000L, 10);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Cancel me"));

        StockAuditDetails cancelled = service.cancelStockAudit(
            audit.id(),
            new CancelStockAuditRequest("Physical counting interrupted")
        );

        assertEquals("CANCELLED", cancelled.status());
        assertNotNull(cancelled.cancelledAt());
        assertEquals("Physical counting interrupted", cancelled.cancellationReason());
    }

    @Test
    @DisplayName("26. Verify cancellation preserves all count records")
    void testCancellationPreservesAllCountRecords() {
        Product p1 = createTestProduct("Preserve", "PRS-01", "Testing", 1000L, 2000L, 20);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Preserve"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(18, "Partially counted"));

        service.cancelStockAudit(audit.id(), new CancelStockAuditRequest("Shift ended"));

        StockAuditDetails cancelled = service.getStockAuditById(audit.id());
        assertEquals(1, cancelled.items().size());
        assertEquals(18, cancelled.items().get(0).countedQuantity());
        assertEquals("Partially counted", cancelled.items().get(0).itemNotes());
    }

    @Test
    @DisplayName("27. Verify cancellation does not change stock")
    void testCancellationDoesNotChangeStock() {
        Product p1 = createTestProduct("NoStockChange", "NSC-01", "Testing", 1000L, 2000L, 20);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "No stock change"));

        Long itemId = audit.items().get(0).id();
        service.enterCount(audit.id(), itemId, new EnterCountRequest(5, "Discrepancy counted"));

        service.cancelStockAudit(audit.id(), new CancelStockAuditRequest("Counting error"));

        assertEquals(20, service.getProductById(p1.id()).quantity());
    }

    @Test
    @DisplayName("28. Reject cancelling a completed audit")
    void testRejectCancellingCompletedAudit() {
        Product p1 = createTestProduct("CompCancel", "CC-01", "Testing", 1000L, 2000L, 10);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "CompCancel"));

        service.enterCount(audit.id(), audit.items().get(0).id(), new EnterCountRequest(10, "Exact"));
        service.completeStockAudit(audit.id());

        assertThrows(StockAuditConflictException.class, () -> {
            service.cancelStockAudit(audit.id(), new CancelStockAuditRequest("Too late"));
        });
    }

    @Test
    @DisplayName("29. Reject cancelling an already cancelled audit")
    void testRejectCancellingAlreadyCancelledAudit() {
        Product p1 = createTestProduct("DupCancel", "DC-01", "Testing", 1000L, 2000L, 10);
        StockAuditDetails audit = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "DupCancel"));

        service.cancelStockAudit(audit.id(), new CancelStockAuditRequest("First cancel"));

        assertThrows(StockAuditConflictException.class, () -> {
            service.cancelStockAudit(audit.id(), new CancelStockAuditRequest("Second cancel"));
        });
    }

    // ==========================================
    // 30-36: REGRESSION TESTS
    // ==========================================

    @Test
    @DisplayName("30. Verify Product CRUD")
    void testRegressionProductCrud() {
        Product p = createTestProduct("Drill Set", "DRL-CRUD", "Tools", 10000L, 20000L, 5);
        assertNotNull(p.id());

        Product fetched = service.getProductById(p.id());
        assertEquals("Drill Set", fetched.name());

        Product updated = service.updateProduct(p.id(), new UpdateProductRequest(
            "Drill Set Pro", "DRL-CRUD", "Tools", 12000L, 24000L, 5, 20, 1.0, 5
        ));
        assertEquals("Drill Set Pro", updated.name());

        // Product without movements or audits can be deleted
        Product pToDelete = service.createProduct(new CreateProductRequest(
            "Disposable", "DSP-01", "Misc", 100L, 200L, 0, 0, 0, 0.0, 0
        ));
        service.deleteProduct(pToDelete.id());
        assertThrows(ProductNotFoundException.class, () -> service.getProductById(pToDelete.id()));
    }

    @Test
    @DisplayName("31. Verify Stock In and Stock Out")
    void testRegressionStockInAndStockOut() {
        Product p = createTestProduct("Motor", "MTR-01", "Hardware", 5000L, 10000L, 10);

        service.recordMovement(new CreateMovementRequest(p.id(), "IN", 5, "Restock"));
        assertEquals(15, service.getProductById(p.id()).quantity());

        service.recordMovement(new CreateMovementRequest(p.id(), "OUT", 3, "Customer sale"));
        assertEquals(12, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("32. Verify Sales and sale cancellation")
    void testRegressionSalesAndSaleCancellation() {
        Product p = createTestProduct("Wheel", "WHL-01", "Auto", 3000L, 6000L, 20);

        SaleDetails sale = service.createSale(new CreateSaleRequest(
            List.of(new SaleItemRequest(p.id(), 4)),
            0L,
            "CASH"
        ));
        assertEquals("COMPLETED", sale.status());
        assertEquals(16, service.getProductById(p.id()).quantity());

        service.cancelSale(sale.id(), new CancelSaleRequest("Customer returned items"));
        assertEquals(20, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("33. Verify Purchase Orders and receiving")
    void testRegressionPurchaseOrdersAndReceiving() {
        Supplier supplier = createTestSupplier("Supplier PO Regress");
        Product p = createTestProduct("Bearing", "BRG-01", "Hardware", 2000L, 4000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            supplier.id(),
            "Monthly stock replenishment",
            List.of(new CreatePurchaseOrderItemRequest(p.id(), 15, 2000L))
        ));

        service.placePurchaseOrder(po.id());

        Long poItemId = po.items().get(0).id();
        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(poItemId, 15))
        ));

        assertEquals(25, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("34. Verify Stock Movement History")
    void testRegressionStockMovementHistory() {
        Product p = createTestProduct("Ledger Item", "LDG-01", "Misc", 1000L, 2000L, 10);
        service.recordMovement(new CreateMovementRequest(p.id(), "IN", 10, "Shipment A"));

        List<RecentMovement> list = service.getMovements(p.id(), null);
        assertFalse(list.isEmpty());
        assertTrue(list.stream().anyMatch(m -> m.reason().equals("Shipment A")));
    }

    @Test
    @DisplayName("35. Verify Dashboard")
    void testRegressionDashboard() {
        createTestProduct("Dash 1", "DSH-01", "Electronics", 1000L, 2000L, 10);
        createTestProduct("Dash 2", "DSH-02", "Hardware", 2000L, 4000L, 5);

        DashboardResponse dash = service.getDashboard();
        assertNotNull(dash);
        assertEquals(2, dash.totalProducts());
        assertEquals(15, dash.totalQuantity());
    }

    @Test
    @DisplayName("36. Verify Sales-Based Intelligence")
    void testRegressionSalesBasedIntelligence() {
        Product p = createTestProduct("Intel Item", "INT-01", "Cat", 1000L, 2000L, 10);

        SalesIntelligenceResponse intel = service.getSalesIntelligence();
        assertNotNull(intel);
        assertNotNull(intel.summary());
        assertEquals(1, intel.summary().totalProducts());
    }

    // ==========================================
    // EXTRA: LIST AUDITS & PROTECTION TESTS
    // ==========================================

    @Test
    @DisplayName("37. List audits returns newest first with correct database aggregations")
    void testListAuditsAggregation() {
        Product p1 = createTestProduct("Prod 1", "P-01", "Tools", 1000L, 2000L, 10);
        Product p2 = createTestProduct("Prod 2", "P-02", "Tools", 2000L, 4000L, 20);

        StockAuditDetails a1 = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id(), p2.id()), "Audit 1"));
        StockAuditDetails a2 = service.createStockAudit(new CreateStockAuditRequest(List.of(p1.id()), "Audit 2"));

        // Enter count for a1: 1 match, 1 discrepancy
        service.enterCount(a1.id(), a1.items().get(0).id(), new EnterCountRequest(10, "match"));
        service.enterCount(a1.id(), a1.items().get(1).id(), new EnterCountRequest(25, "discrepancy"));

        List<StockAuditSummary> list = service.getStockAudits();
        assertEquals(2, list.size());

        // Newest first: a2 is first, a1 is second
        assertEquals(a2.id(), list.get(0).id());
        assertEquals(a1.id(), list.get(1).id());

        // Check a1 aggregated stats
        StockAuditSummary a1Summary = list.get(1);
        assertEquals(2, a1Summary.totalProducts());
        assertEquals(2, a1Summary.productsCounted());
        assertEquals(1, a1Summary.productsWithDiscrepancies());
    }

    @Test
    @DisplayName("38. Product referenced in stock audit cannot be deleted")
    void testProductWithAuditCannotBeDeleted() {
        Product p = createTestProduct("Protected", "PRT-01", "Cat", 1000L, 2000L, 0);
        service.createStockAudit(new CreateStockAuditRequest(List.of(p.id()), "Audit protecting product"));

        assertThrows(ProductConflictException.class, () -> {
            service.deleteProduct(p.id());
        });
    }
}
