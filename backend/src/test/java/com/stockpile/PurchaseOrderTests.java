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
public class PurchaseOrderTests {

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

    private Product createTestProduct(String name, String sku, String category, long purchasePaise, long sellingPaise, int qty) {
        return service.createProduct(new CreateProductRequest(
            name, sku, category, purchasePaise, sellingPaise, qty, 5, 20, 1.0, 5
        ));
    }

    private Supplier createTestSupplier(String name) {
        return service.createSupplier(new CreateSupplierRequest(
            name, "Contact Person", "9876543210", "vendor@example.com", "Industrial Estate", "Standard Vendor"
        ));
    }

    // ==========================================
    // 1-11: PURCHASE ORDER CREATION
    // ==========================================

    @Test
    @DisplayName("1. Create a draft purchase order")
    void testCreateDraftOrder() {
        Supplier supplier = createTestSupplier("Apex Supplies");
        Product product = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 80000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            supplier.id(),
            "Initial replenishment",
            List.of(new CreatePurchaseOrderItemRequest(product.id(), 20, null))
        ));

        assertNotNull(po.id());
        assertEquals("DRAFT", po.status());
        assertEquals(supplier.id(), po.supplierId());
        assertEquals("Apex Supplies", po.supplierName());
        assertEquals(1000000L, po.totalAmountPaise()); // 20 * 50,000
        assertEquals(1, po.items().size());

        PurchaseOrderItemDetails item = po.items().get(0);
        assertEquals("Hammer", item.productNameSnapshot());
        assertEquals("HMR-01", item.skuSnapshot());
        assertEquals(20, item.quantityOrdered());
        assertEquals(0, item.quantityReceived());
        assertEquals(20, item.remainingQuantity());
        assertEquals(50000L, item.unitCostPaise());
        assertEquals(1000000L, item.lineTotalPaise());
    }

    @Test
    @DisplayName("2. Create an order with multiple products")
    void testCreateOrderMultipleProducts() {
        Supplier supplier = createTestSupplier("Metro Hardware");
        Product p1 = createTestProduct("P1", "SKU-01", "Cat", 10000L, 20000L, 5);
        Product p2 = createTestProduct("P2", "SKU-02", "Cat", 20000L, 40000L, 5);
        Product p3 = createTestProduct("P3", "SKU-03", "Cat", 30000L, 60000L, 5);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            supplier.id(),
            "Bulk order",
            List.of(
                new CreatePurchaseOrderItemRequest(p1.id(), 10, null),
                new CreatePurchaseOrderItemRequest(p2.id(), 5, null),
                new CreatePurchaseOrderItemRequest(p3.id(), 2, null)
            )
        ));

        assertEquals(3, po.items().size());
        // 10*10000 + 5*20000 + 2*30000 = 100000 + 100000 + 60000 = 260000
        assertEquals(260000L, po.totalAmountPaise());
    }

    @Test
    @DisplayName("3. Calculate total amount correctly")
    void testCalculateTotalAmountCorrectly() {
        Supplier supplier = createTestSupplier("Global Tools");
        Product p1 = createTestProduct("Drill", "DRL-01", "Tools", 45000L, 90000L, 5);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            supplier.id(), null, List.of(new CreatePurchaseOrderItemRequest(p1.id(), 15, 40000L))
        ));

        assertEquals(600000L, po.totalAmountPaise()); // 15 * 40,000
    }

    @Test
    @DisplayName("4. Use product purchase price when unitCostPaise is omitted")
    void testUseProductPurchasePriceWhenUnitCostOmitted() {
        Supplier supplier = createTestSupplier("Vendor X");
        Product p = createTestProduct("Screwdriver", "SD-01", "Tools", 12500L, 25000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            supplier.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 8, null))
        ));

        assertEquals(12500L, po.items().get(0).unitCostPaise());
        assertEquals(100000L, po.totalAmountPaise());
    }

    @Test
    @DisplayName("5. Use an explicitly supplied valid unit cost")
    void testUseExplicitlySuppliedValidUnitCost() {
        Supplier supplier = createTestSupplier("Vendor Y");
        Product p = createTestProduct("Saw", "SAW-01", "Tools", 20000L, 40000L, 10);

        // Negotiated custom unit cost of 18000 paise
        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            supplier.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, 18000L))
        ));

        assertEquals(18000L, po.items().get(0).unitCostPaise());
        assertEquals(180000L, po.totalAmountPaise());
    }

    @Test
    @DisplayName("6. Reject nonexistent suppliers")
    void testRejectNonexistentSupplier() {
        Product p = createTestProduct("Wrench", "WRN-01", "Tools", 10000L, 20000L, 10);

        assertThrows(SupplierNotFoundException.class, () ->
            service.createPurchaseOrder(new CreatePurchaseOrderRequest(
                99999L, null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 5, null))
            ))
        );
    }

    @Test
    @DisplayName("7. Reject nonexistent products")
    void testRejectNonexistentProduct() {
        Supplier s = createTestSupplier("Vendor Z");

        assertThrows(ProductNotFoundException.class, () ->
            service.createPurchaseOrder(new CreatePurchaseOrderRequest(
                s.id(), null, List.of(new CreatePurchaseOrderItemRequest(99999L, 5, null))
            ))
        );
    }

    @Test
    @DisplayName("8. Reject empty orders")
    void testRejectEmptyOrder() {
        Supplier s = createTestSupplier("Vendor Empty");

        assertThrows(IllegalArgumentException.class, () ->
            service.createPurchaseOrder(new CreatePurchaseOrderRequest(
                s.id(), null, List.of()
            ))
        );
    }

    @Test
    @DisplayName("9. Reject duplicate products in the same order")
    void testRejectDuplicateProducts() {
        Supplier s = createTestSupplier("Vendor Dup");
        Product p = createTestProduct("Plier", "PLR-01", "Tools", 10000L, 20000L, 10);

        assertThrows(IllegalArgumentException.class, () ->
            service.createPurchaseOrder(new CreatePurchaseOrderRequest(
                s.id(), null, List.of(
                    new CreatePurchaseOrderItemRequest(p.id(), 5, null),
                    new CreatePurchaseOrderItemRequest(p.id(), 10, null)
                )
            ))
        );
    }

    @Test
    @DisplayName("10. Reject zero or negative quantities")
    void testRejectZeroOrNegativeQuantity() {
        Supplier s = createTestSupplier("Vendor Q");
        Product p = createTestProduct("Tape", "TP-01", "Tools", 5000L, 10000L, 10);

        assertThrows(IllegalArgumentException.class, () ->
            service.createPurchaseOrder(new CreatePurchaseOrderRequest(
                s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 0, null))
            ))
        );

        assertThrows(IllegalArgumentException.class, () ->
            service.createPurchaseOrder(new CreatePurchaseOrderRequest(
                s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), -5, null))
            ))
        );
    }

    @Test
    @DisplayName("11. Verify creating an order does not change stock")
    void testCreateOrderDoesNotChangeStock() {
        Supplier s = createTestSupplier("Vendor Stock");
        Product p = createTestProduct("Level", "LVL-01", "Tools", 15000L, 30000L, 25);

        service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 100, null))
        ));

        assertEquals(25, service.getProductById(p.id()).quantity());
    }

    // ==========================================
    // 12-17: EDITING AND PLACING
    // ==========================================

    @Test
    @DisplayName("12. Edit a draft purchase order")
    void testEditDraftOrder() {
        Supplier s1 = createTestSupplier("Vendor One");
        Supplier s2 = createTestSupplier("Vendor Two");
        Product p1 = createTestProduct("Item 1", "ITM-01", "Tools", 10000L, 20000L, 10);
        Product p2 = createTestProduct("Item 2", "ITM-02", "Tools", 20000L, 40000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s1.id(), "Old notes", List.of(new CreatePurchaseOrderItemRequest(p1.id(), 5, null))
        ));

        PurchaseOrderDetails updated = service.updatePurchaseOrder(po.id(), new UpdatePurchaseOrderRequest(
            s2.id(), "Updated notes", List.of(
                new CreatePurchaseOrderItemRequest(p1.id(), 10, null),
                new CreatePurchaseOrderItemRequest(p2.id(), 5, 25000L)
            )
        ));

        assertEquals(s2.id(), updated.supplierId());
        assertEquals("Vendor Two", updated.supplierName());
        assertEquals("Updated notes", updated.notes());
        assertEquals(2, updated.items().size());
        assertEquals(po.id(), updated.id());
    }

    @Test
    @DisplayName("13. Recalculate total on edit")
    void testRecalculateTotalOnEdit() {
        Supplier s = createTestSupplier("Vendor Recalc");
        Product p = createTestProduct("Widget", "WDG-01", "Tools", 10000L, 20000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 5, null))
        ));
        assertEquals(50000L, po.totalAmountPaise());

        PurchaseOrderDetails updated = service.updatePurchaseOrder(po.id(), new UpdatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, 15000L))
        ));
        assertEquals(300000L, updated.totalAmountPaise()); // 20 * 15,000
    }

    @Test
    @DisplayName("14. Reject editing an ordered or placed purchase order")
    void testRejectEditingOrderedPurchaseOrder() {
        Supplier s = createTestSupplier("Vendor Placed");
        Product p = createTestProduct("Nut", "NUT-01", "Hardware", 500L, 1000L, 100);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 50, null))
        ));
        service.placePurchaseOrder(po.id());

        assertThrows(PurchaseOrderConflictException.class, () ->
            service.updatePurchaseOrder(po.id(), new UpdatePurchaseOrderRequest(
                s.id(), "New notes", List.of(new CreatePurchaseOrderItemRequest(p.id(), 60, null))
            ))
        );
    }

    @Test
    @DisplayName("15. Place a draft order")
    void testPlaceDraftOrder() {
        Supplier s = createTestSupplier("Vendor Place");
        Product p = createTestProduct("Bolt", "BLT-01", "Hardware", 800L, 1600L, 50);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 100, null))
        ));

        PurchaseOrderDetails placed = service.placePurchaseOrder(po.id());
        assertEquals("ORDERED", placed.status());
        assertNotNull(placed.placedAt());
    }

    @Test
    @DisplayName("16. Reject placing an order twice")
    void testRejectPlacingTwice() {
        Supplier s = createTestSupplier("Vendor Twice");
        Product p = createTestProduct("Cable", "CBL-01", "Electrical", 2000L, 4000L, 20);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 30, null))
        ));
        service.placePurchaseOrder(po.id());

        assertThrows(PurchaseOrderConflictException.class, () ->
            service.placePurchaseOrder(po.id())
        );
    }

    @Test
    @DisplayName("17. Verify placing does not change inventory")
    void testPlacingOrderDoesNotChangeInventory() {
        Supplier s = createTestSupplier("Vendor Inv");
        Product p = createTestProduct("Wire", "WIR-01", "Electrical", 1500L, 3000L, 40);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 50, null))
        ));
        service.placePurchaseOrder(po.id());

        assertEquals(40, service.getProductById(p.id()).quantity());
    }

    // ==========================================
    // 18-27: RECEIVING STOCK
    // ==========================================

    @Test
    @DisplayName("18. Receive an entire order")
    void testReceiveEntireOrder() {
        Supplier s = createTestSupplier("Vendor Recv All");
        Product p = createTestProduct("Nail", "NL-01", "Hardware", 200L, 500L, 100);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 50, null))
        ));
        service.placePurchaseOrder(po.id());

        Long itemId = po.items().get(0).id();
        PurchaseOrderDetails received = service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(itemId, 50))
        ));

        assertEquals("RECEIVED", received.status());
        assertNotNull(received.receivedAt());
        assertEquals(50, received.items().get(0).quantityReceived());
        assertEquals(0, received.items().get(0).remainingQuantity());
        assertEquals(150, service.getProductById(p.id()).quantity()); // 100 + 50
    }

    @Test
    @DisplayName("19. Receive an order partially")
    void testReceiveOrderPartially() {
        Supplier s = createTestSupplier("Vendor Partial");
        Product p = createTestProduct("Clamp", "CLP-01", "Tools", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, null))
        ));
        service.placePurchaseOrder(po.id());

        Long itemId = po.items().get(0).id();
        PurchaseOrderDetails received = service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(itemId, 8))
        ));

        assertEquals("PARTIALLY_RECEIVED", received.status());
        assertNull(received.receivedAt());
        assertEquals(8, received.items().get(0).quantityReceived());
        assertEquals(12, received.items().get(0).remainingQuantity());
        assertEquals(18, service.getProductById(p.id()).quantity()); // 10 + 8
    }

    @Test
    @DisplayName("20. Receive remaining items in a later request")
    void testReceiveRemainingItemsLater() {
        Supplier s = createTestSupplier("Vendor Multi-Step");
        Product p = createTestProduct("Chisel", "CH-01", "Tools", 8000L, 16000L, 5);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.placePurchaseOrder(po.id());
        Long itemId = po.items().get(0).id();

        // 1st receipt: 6 items
        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(itemId, 6))
        ));
        assertEquals(11, service.getProductById(p.id()).quantity());

        // 2nd receipt: 4 remaining items
        PurchaseOrderDetails finalPo = service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(itemId, 4))
        ));

        assertEquals("RECEIVED", finalPo.status());
        assertNotNull(finalPo.receivedAt());
        assertEquals(10, finalPo.items().get(0).quantityReceived());
        assertEquals(0, finalPo.items().get(0).remainingQuantity());
        assertEquals(15, service.getProductById(p.id()).quantity()); // 5 + 6 + 4
    }

    @Test
    @DisplayName("21. Verify product quantities increase correctly")
    void testProductQuantitiesIncreaseCorrectly() {
        Supplier s = createTestSupplier("Vendor Qty");
        Product p1 = createTestProduct("Item A", "IA-01", "Hardware", 1000L, 2000L, 20);
        Product p2 = createTestProduct("Item B", "IB-01", "Hardware", 2000L, 4000L, 30);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(
                new CreatePurchaseOrderItemRequest(p1.id(), 15, null),
                new CreatePurchaseOrderItemRequest(p2.id(), 25, null)
            )
        ));
        service.placePurchaseOrder(po.id());

        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(
                new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 15),
                new ReceivePurchaseOrderItemRequest(po.items().get(1).id(), 25)
            )
        ));

        assertEquals(35, service.getProductById(p1.id()).quantity());
        assertEquals(55, service.getProductById(p2.id()).quantity());
    }

    @Test
    @DisplayName("22. Verify stock movement records are generated")
    void testStockMovementRecordsGenerated() {
        Supplier s = createTestSupplier("Vendor Movements");
        Product p = createTestProduct("Goggles", "GGL-01", "Safety", 10000L, 20000L, 5);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 12, null))
        ));
        service.placePurchaseOrder(po.id());

        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 12))
        ));

        List<RecentMovement> movements = service.getMovements(p.id(), "IN");
        assertFalse(movements.isEmpty());

        RecentMovement latest = movements.get(0);
        assertEquals("IN", latest.movementType());
        assertEquals(12, latest.quantity());
        assertEquals(5, latest.previousQuantity());
        assertEquals(17, latest.newQuantity());
        assertTrue(latest.reason().contains("PO #" + po.id()));
    }

    @Test
    @DisplayName("23. Verify order status transitions correctly: DRAFT -> ORDERED -> PARTIALLY_RECEIVED -> RECEIVED")
    void testOrderStatusTransitionsCorrectly() {
        Supplier s = createTestSupplier("Vendor Transitions");
        Product p = createTestProduct("Gloves", "GLV-01", "Safety", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, null))
        ));
        assertEquals("DRAFT", po.status());

        po = service.placePurchaseOrder(po.id());
        assertEquals("ORDERED", po.status());

        po = service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 10))
        ));
        assertEquals("PARTIALLY_RECEIVED", po.status());

        po = service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 10))
        ));
        assertEquals("RECEIVED", po.status());
    }

    @Test
    @DisplayName("24. Reject receiving more than outstanding quantity")
    void testRejectReceivingMoreThanOutstanding() {
        Supplier s = createTestSupplier("Vendor Over");
        Product p = createTestProduct("Helmet", "HLM-01", "Safety", 15000L, 30000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.placePurchaseOrder(po.id());

        assertThrows(IllegalArgumentException.class, () ->
            service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
                List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 11))
            ))
        );
    }

    @Test
    @DisplayName("25. Reject receiving a cancelled order")
    void testRejectReceivingCancelledOrder() {
        Supplier s = createTestSupplier("Vendor Cancelled");
        Product p = createTestProduct("Boots", "BT-01", "Safety", 25000L, 50000L, 5);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.placePurchaseOrder(po.id());
        service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Cancelled due to delay"));

        assertThrows(PurchaseOrderConflictException.class, () ->
            service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
                List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 5))
            ))
        );
    }

    @Test
    @DisplayName("26. Reject receiving stock for an item belonging to another order")
    void testRejectReceivingItemFromAnotherOrder() {
        Supplier s = createTestSupplier("Vendor Cross");
        Product p = createTestProduct("Vest", "VST-01", "Safety", 8000L, 16000L, 10);

        PurchaseOrderDetails po1 = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        PurchaseOrderDetails po2 = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.placePurchaseOrder(po2.id());

        // Try passing item from po1 to po2 receive request
        Long po1ItemId = po1.items().get(0).id();
        assertThrows(IllegalArgumentException.class, () ->
            service.receivePurchaseOrder(po2.id(), new ReceivePurchaseOrderRequest(
                List.of(new ReceivePurchaseOrderItemRequest(po1ItemId, 5))
            ))
        );
    }

    @Test
    @DisplayName("27. Verify failed multi-item receipt rolls back every change")
    void testFailedMultiItemReceiptRollsBackEveryChange() {
        Supplier s = createTestSupplier("Vendor Atom");
        Product p1 = createTestProduct("Part 1", "P1-01", "Hardware", 1000L, 2000L, 10);
        Product p2 = createTestProduct("Part 2", "P2-01", "Hardware", 2000L, 4000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(
                new CreatePurchaseOrderItemRequest(p1.id(), 10, null),
                new CreatePurchaseOrderItemRequest(p2.id(), 10, null)
            )
        ));
        service.placePurchaseOrder(po.id());

        // Request has valid 1st item (5) but invalid 2nd item (20 > 10 remaining)
        assertThrows(IllegalArgumentException.class, () ->
            service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
                List.of(
                    new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 5),
                    new ReceivePurchaseOrderItemRequest(po.items().get(1).id(), 20)
                )
            ))
        );

        // Verify Part 1 stock was NOT incremented (remains 10)
        assertEquals(10, service.getProductById(p1.id()).quantity());
        assertEquals(10, service.getProductById(p2.id()).quantity());
        assertEquals(0, service.getPurchaseOrderById(po.id()).items().get(0).quantityReceived());
    }

    // ==========================================
    // 28-34: CANCELLATION
    // ==========================================

    @Test
    @DisplayName("28. Cancel a draft order")
    void testCancelDraftOrder() {
        Supplier s = createTestSupplier("Vendor Cancel Draft");
        Product p = createTestProduct("Tape 2", "TP2-01", "Tools", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));

        PurchaseOrderDetails cancelled = service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("No longer required"));
        assertEquals("CANCELLED", cancelled.status());
        assertEquals("No longer required", cancelled.cancellationReason());
        assertNotNull(cancelled.cancelledAt());
    }

    @Test
    @DisplayName("29. Cancel an ordered purchase order")
    void testCancelOrderedPurchaseOrder() {
        Supplier s = createTestSupplier("Vendor Cancel Ordered");
        Product p = createTestProduct("Tape 3", "TP3-01", "Tools", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.placePurchaseOrder(po.id());

        PurchaseOrderDetails cancelled = service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Supplier out of stock"));
        assertEquals("CANCELLED", cancelled.status());
    }

    @Test
    @DisplayName("30. Cancel a partially received order")
    void testCancelPartiallyReceivedOrder() {
        Supplier s = createTestSupplier("Vendor Cancel Partial");
        Product p = createTestProduct("Tape 4", "TP4-01", "Tools", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, null))
        ));
        service.placePurchaseOrder(po.id());
        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 5))
        ));

        PurchaseOrderDetails cancelled = service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Vendor discontinued line"));
        assertEquals("CANCELLED", cancelled.status());
    }

    @Test
    @DisplayName("31. Verify already received stock remains unchanged on cancel")
    void testAlreadyReceivedStockRemainsUnchangedOnCancel() {
        Supplier s = createTestSupplier("Vendor Retain Stock");
        Product p = createTestProduct("Tape 5", "TP5-01", "Tools", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, null))
        ));
        service.placePurchaseOrder(po.id());
        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 8))
        ));

        assertEquals(18, service.getProductById(p.id()).quantity()); // 10 + 8

        service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Remaining cancelled"));

        // Received stock remains 18
        assertEquals(18, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("32. Verify cancellation reason is stored")
    void testCancellationReasonStored() {
        Supplier s = createTestSupplier("Vendor Reason");
        Product p = createTestProduct("Ruler", "RLR-01", "Tools", 2000L, 4000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 15, null))
        ));

        PurchaseOrderDetails cancelled = service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Price dispute"));
        assertEquals("Price dispute", cancelled.cancellationReason());

        PurchaseOrderDetails reloaded = service.getPurchaseOrderById(po.id());
        assertEquals("Price dispute", reloaded.cancellationReason());
    }

    @Test
    @DisplayName("33. Reject cancellation of an already received order")
    void testRejectCancellationOfReceivedOrder() {
        Supplier s = createTestSupplier("Vendor Fully Received");
        Product p = createTestProduct("Stapler", "STP-01", "Office", 6000L, 12000L, 5);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.placePurchaseOrder(po.id());
        service.receivePurchaseOrder(po.id(), new ReceivePurchaseOrderRequest(
            List.of(new ReceivePurchaseOrderItemRequest(po.items().get(0).id(), 10))
        ));

        assertThrows(PurchaseOrderConflictException.class, () ->
            service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Want to cancel"))
        );
    }

    @Test
    @DisplayName("34. Reject duplicate cancellation")
    void testRejectDuplicateCancellation() {
        Supplier s = createTestSupplier("Vendor Dup Cancel");
        Product p = createTestProduct("Marker", "MKR-01", "Office", 1500L, 3000L, 20);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));
        service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("First cancel"));

        assertThrows(PurchaseOrderConflictException.class, () ->
            service.cancelPurchaseOrder(po.id(), new CancelPurchaseOrderRequest("Second cancel"))
        );
    }

    // ==========================================
    // 35-44: HISTORY & REGRESSION
    // ==========================================

    @Test
    @DisplayName("35. Verify list filtering by supplier and status")
    void testListFilteringBySupplierAndStatus() {
        Supplier s1 = createTestSupplier("Supplier F1");
        Supplier s2 = createTestSupplier("Supplier F2");
        Product p = createTestProduct("Folder", "FLD-01", "Office", 3000L, 6000L, 10);

        PurchaseOrderDetails po1 = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s1.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 5, null))
        ));
        PurchaseOrderDetails po2 = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s2.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 5, null))
        ));
        service.placePurchaseOrder(po2.id());

        // Filter by supplier
        List<PurchaseOrderSummary> bySup1 = service.getPurchaseOrders(s1.id(), null);
        assertEquals(1, bySup1.size());
        assertEquals(po1.id(), bySup1.get(0).id());

        // Filter by status
        List<PurchaseOrderSummary> byStatus = service.getPurchaseOrders(null, "ORDERED");
        assertEquals(1, byStatus.size());
        assertEquals(po2.id(), byStatus.get(0).id());
    }

    @Test
    @DisplayName("36. Verify order detail snapshots")
    void testOrderDetailSnapshots() {
        Supplier s = createTestSupplier("Snapshot Vendor");
        Product p = createTestProduct("Binder", "BND-01", "Office", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 10, null))
        ));

        assertEquals("Snapshot Vendor", po.supplierName());
        assertEquals("Binder", po.items().get(0).productNameSnapshot());
        assertEquals("BND-01", po.items().get(0).skuSnapshot());
    }

    @Test
    @DisplayName("37. Verify historical purchase prices remain unchanged after product edits")
    void testHistoricalPurchasePricesUnchangedAfterProductEdits() {
        Supplier s = createTestSupplier("Price Vendor");
        Product p = createTestProduct("Eraser", "ERS-01", "Office", 1000L, 2000L, 50);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 20, 1000L))
        ));

        // Update product price to 3000 paise
        service.updateProduct(p.id(), new UpdateProductRequest(
            p.name(), p.sku(), p.category(), 3000L, 5000L,
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));

        // Reload PO: unit cost must still be 1000 paise
        PurchaseOrderDetails reloaded = service.getPurchaseOrderById(po.id());
        assertEquals(1000L, reloaded.items().get(0).unitCostPaise());
        assertEquals(20000L, reloaded.totalAmountPaise());
    }

    @Test
    @DisplayName("38. Verify product deletion is blocked when referenced by an order")
    void testProductDeletionBlockedWhenReferencedByOrder() {
        Supplier s = createTestSupplier("PO Prod Del Vendor");
        Product p = createTestProduct("Pen", "PEN-01", "Office", 1000L, 2000L, 0);

        service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 5, null))
        ));

        ProductConflictException ex = assertThrows(
            ProductConflictException.class,
            () -> service.deleteProduct(p.id())
        );
        assertTrue(ex.getMessage().contains("purchase order item"));
    }

    @Test
    @DisplayName("39. Verify supplier deletion is blocked when referenced by an order")
    void testSupplierDeletionBlockedWhenReferencedByOrder() {
        Supplier s = createTestSupplier("PO Sup Del Vendor");
        Product p = createTestProduct("Pencil", "PNC-01", "Office", 500L, 1000L, 0);

        service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), null, List.of(new CreatePurchaseOrderItemRequest(p.id(), 5, null))
        ));

        SupplierConflictException ex = assertThrows(
            SupplierConflictException.class,
            () -> service.deleteSupplier(s.id())
        );
        assertTrue(ex.getMessage().contains("purchase order"));
    }

    @Test
    @DisplayName("40. Verify existing Sales APIs still work")
    void testExistingSalesApisStillWork() {
        Product p = createTestProduct("Scissors", "SCS-01", "Tools", 4000L, 8000L, 20);

        SaleDetails sale = service.createSale(new CreateSaleRequest(
            List.of(new SaleItemRequest(p.id(), 5)),
            0L,
            "CASH"
        ));
        assertEquals("COMPLETED", sale.status());
        assertEquals(15, service.getProductById(p.id()).quantity());

        SaleDetails cancelled = service.cancelSale(sale.id(), new CancelSaleRequest("Customer returned"));
        assertEquals("CANCELLED", cancelled.status());
        assertEquals(20, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("41. Verify existing Product CRUD still works")
    void testExistingProductCrudStillWorks() {
        Product p = createTestProduct("Cutter", "CTR-01", "Tools", 3000L, 6000L, 10);

        Product updated = service.updateProduct(p.id(), new UpdateProductRequest(
            "Box Cutter", p.sku(), p.category(), 3500L, 7000L,
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));
        assertEquals("Box Cutter", updated.name());
        assertEquals(10, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("42. Verify existing inventory operations and movement history still work")
    void testExistingInventoryOperationsStillWork() {
        Product p = createTestProduct("Glue", "GLU-01", "Office", 2000L, 4000L, 10);

        service.recordMovement(new CreateMovementRequest(p.id(), "IN", 10, "Manual restock"));
        assertEquals(20, service.getProductById(p.id()).quantity());

        service.recordMovement(new CreateMovementRequest(p.id(), "OUT", 5, "Internal use"));
        assertEquals(15, service.getProductById(p.id()).quantity());
    }

    @Test
    @DisplayName("43. Verify dashboard data remains correct")
    void testDashboardDataRemainsCorrect() {
        createTestProduct("Item D1", "D1-01", "Tools", 1000L, 2000L, 10);
        createTestProduct("Item D2", "D2-01", "Tools", 2000L, 4000L, 20);

        DashboardResponse dashboard = service.getDashboard();
        assertNotNull(dashboard);
        assertTrue(dashboard.totalProducts() >= 2);
        assertTrue(dashboard.totalQuantity() >= 30);
    }

    @Test
    @DisplayName("44. Verify data persists after backend restart (direct JDBC query)")
    void testDataPersistsInDatabase() {
        Supplier s = createTestSupplier("Persist PO Vendor");
        Product p = createTestProduct("Compass", "CMP-01", "Tools", 5000L, 10000L, 10);

        PurchaseOrderDetails po = service.createPurchaseOrder(new CreatePurchaseOrderRequest(
            s.id(), "Test persistence", List.of(new CreatePurchaseOrderItemRequest(p.id(), 15, null))
        ));

        Integer poCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM purchase_orders WHERE id = ? AND status = 'DRAFT'",
            Integer.class,
            po.id()
        );
        assertEquals(1, poCount);

        Integer itemCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = ? AND product_id = ?",
            Integer.class,
            po.id(), p.id()
        );
        assertEquals(1, itemCount);
    }
}
