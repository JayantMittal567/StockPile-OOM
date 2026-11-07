package com.stockpile;

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
public class SupplierManagementTests {

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

    private StockpileService.Product createTestProduct(String name, String sku, String category, long purchasePaise, long sellingPaise, int qty) {
        return service.createProduct(new StockpileService.CreateProductRequest(
            name, sku, category, purchasePaise, sellingPaise, qty, 5, 20, 1.0, 5
        ));
    }

    private StockpileService.Supplier createTestSupplier(String name, String contact, String phone, String email, String address, String notes) {
        return service.createSupplier(new StockpileService.CreateSupplierRequest(
            name, contact, phone, email, address, notes
        ));
    }

    // ==========================================
    // 1-5: BASIC CRUD & SEARCH
    // ==========================================

    @Test
    @DisplayName("1. Create supplier with all fields")
    void testCreateSupplierFull() {
        StockpileService.Supplier s = createTestSupplier(
            "ABC Distributors", "Rahul Sharma", "9876543210", "rahul@abc.com", "New Delhi", "Key electronics vendor"
        );

        assertNotNull(s.id());
        assertEquals("ABC Distributors", s.name());
        assertEquals("Rahul Sharma", s.contactPerson());
        assertEquals("9876543210", s.phone());
        assertEquals("rahul@abc.com", s.email());
        assertEquals("New Delhi", s.address());
        assertEquals("Key electronics vendor", s.notes());
        assertNotNull(s.createdAt());
        assertNotNull(s.updatedAt());
    }

    @Test
    @DisplayName("2. Create supplier with only required name")
    void testCreateSupplierMinimal() {
        StockpileService.Supplier s = createTestSupplier(
            "Apex Wholesale", null, null, null, null, null
        );

        assertNotNull(s.id());
        assertEquals("Apex Wholesale", s.name());
        assertNull(s.contactPerson());
        assertNull(s.phone());
        assertNull(s.email());
        assertNull(s.address());
        assertNull(s.notes());
    }

    @Test
    @DisplayName("3. Retrieve all suppliers")
    void testGetAllSuppliers() {
        createTestSupplier("Supplier One", null, null, null, null, null);
        createTestSupplier("Supplier Two", null, null, null, null, null);

        List<StockpileService.Supplier> list = service.getSuppliers(null);
        assertEquals(2, list.size());
    }

    @Test
    @DisplayName("4. Search suppliers by name, phone, or email")
    void testSearchSuppliers() {
        createTestSupplier("Apex Tools", "John", "9876543210", "apex@tools.com", "Mumbai", null);
        createTestSupplier("Zenith Parts", "Jane", "9123456780", "contact@zenith.in", "Bengaluru", null);

        // Search by name
        List<StockpileService.Supplier> byName = service.getSuppliers("apex");
        assertEquals(1, byName.size());
        assertEquals("Apex Tools", byName.get(0).name());

        // Search by phone
        List<StockpileService.Supplier> byPhone = service.getSuppliers("12345");
        assertEquals(1, byPhone.size());
        assertEquals("Zenith Parts", byPhone.get(0).name());

        // Search by email
        List<StockpileService.Supplier> byEmail = service.getSuppliers("tools.com");
        assertEquals(1, byEmail.size());
        assertEquals("Apex Tools", byEmail.get(0).name());

        // No match
        List<StockpileService.Supplier> none = service.getSuppliers("nonexistent");
        assertTrue(none.isEmpty());
    }

    @Test
    @DisplayName("5. Retrieve supplier by ID")
    void testGetSupplierById() {
        StockpileService.Supplier created = createTestSupplier("Delta Global", null, null, null, null, null);
        StockpileService.Supplier fetched = service.getSupplierById(created.id());

        assertEquals(created.id(), fetched.id());
        assertEquals("Delta Global", fetched.name());

        assertThrows(StockpileService.SupplierNotFoundException.class, () -> service.getSupplierById(99999L));
    }

    @Test
    @DisplayName("6. Update supplier details")
    void testUpdateSupplier() {
        StockpileService.Supplier created = createTestSupplier("Old Name", "Old Contact", null, null, null, null);

        StockpileService.Supplier updated = service.updateSupplier(created.id(), new StockpileService.UpdateSupplierRequest(
            "New Name", "New Contact", "9876543210", "new@example.com", "Updated Address", "Updated Notes"
        ));

        assertEquals("New Name", updated.name());
        assertEquals("New Contact", updated.contactPerson());
        assertEquals("9876543210", updated.phone());
        assertEquals("new@example.com", updated.email());
        assertEquals("Updated Address", updated.address());
        assertEquals("Updated Notes", updated.notes());

        assertThrows(StockpileService.SupplierNotFoundException.class, () ->
            service.updateSupplier(99999L, new StockpileService.UpdateSupplierRequest(
                "Name", null, null, null, null, null
            ))
        );
    }

    // ==========================================
    // 7-9: VALIDATIONS
    // ==========================================

    @Test
    @DisplayName("7. Reject empty or blank supplier name")
    void testRejectEmptySupplierName() {
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier(null, null, null, null, null, null)
        );
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("", null, null, null, null, null)
        );
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("   ", null, null, null, null, null)
        );
    }

    @Test
    @DisplayName("8. Reject invalid email format")
    void testRejectInvalidEmail() {
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("Valid Name", null, null, "invalid-email", null, null)
        );
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("Valid Name", null, null, "user@", null, null)
        );
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("Valid Name", null, null, "@domain.com", null, null)
        );

        // Valid email formats
        assertDoesNotThrow(() ->
            createTestSupplier("Valid 1", null, null, "test@example.com", null, null)
        );
        assertDoesNotThrow(() ->
            createTestSupplier("Valid 2", null, null, "test.user+tag@sub.domain.co.in", null, null)
        );
    }

    @Test
    @DisplayName("9. Phone validation: allow flexible formats, reject invalid or too short/long")
    void testPhoneValidation() {
        // Too short (< 7 digits)
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("Valid Name", null, "12345", null, null, null)
        );
        // Letters in phone
        assertThrows(IllegalArgumentException.class, () ->
            createTestSupplier("Valid Name", null, "phone123456", null, null, null)
        );

        // Valid formats
        assertDoesNotThrow(() ->
            createTestSupplier("Vendor 1", null, "9876543210", null, null, null)
        );
        assertDoesNotThrow(() ->
            createTestSupplier("Vendor 2", null, "+91 98765 43210", null, null, null)
        );
        assertDoesNotThrow(() ->
            createTestSupplier("Vendor 3", null, "+1 (555) 123-4567", null, null, null)
        );
    }

    // ==========================================
    // 10-14: PRODUCT-SUPPLIER ASSOCIATIONS
    // ==========================================

    @Test
    @DisplayName("10. Assign preferred supplier to product")
    void testAssignSupplierToProduct() {
        StockpileService.Product p = createTestProduct("Hammer", "HMR-01", "Tools", 50000L, 80000L, 10);
        StockpileService.Supplier s = createTestSupplier("Tool Makers Ltd", null, null, null, null, null);

        StockpileService.Product updated = service.assignSupplierToProduct(p.id(), s.id());

        assertEquals(s.id(), updated.supplierId());
        assertEquals("Tool Makers Ltd", updated.supplierName());

        StockpileService.Product reloaded = service.getProductById(p.id());
        assertEquals(s.id(), reloaded.supplierId());
        assertEquals("Tool Makers Ltd", reloaded.supplierName());
    }

    @Test
    @DisplayName("11. Replace preferred supplier for product")
    void testReplacePreferredSupplier() {
        StockpileService.Product p = createTestProduct("Wrench", "WRN-01", "Tools", 30000L, 50000L, 10);
        StockpileService.Supplier s1 = createTestSupplier("Supplier Alpha", null, null, null, null, null);
        StockpileService.Supplier s2 = createTestSupplier("Supplier Beta", null, null, null, null, null);

        service.assignSupplierToProduct(p.id(), s1.id());
        StockpileService.Product afterFirst = service.getProductById(p.id());
        assertEquals(s1.id(), afterFirst.supplierId());

        service.assignSupplierToProduct(p.id(), s2.id());
        StockpileService.Product afterSecond = service.getProductById(p.id());
        assertEquals(s2.id(), afterSecond.supplierId());
        assertEquals("Supplier Beta", afterSecond.supplierName());
    }

    @Test
    @DisplayName("12. Remove preferred supplier from product")
    void testRemoveSupplierFromProduct() {
        StockpileService.Product p = createTestProduct("Pliers", "PLR-01", "Tools", 20000L, 35000L, 15);
        StockpileService.Supplier s = createTestSupplier("Hardware Supply", null, null, null, null, null);

        service.assignSupplierToProduct(p.id(), s.id());
        assertEquals(s.id(), service.getProductById(p.id()).supplierId());

        service.removeSupplierFromProduct(p.id());
        StockpileService.Product afterRemoval = service.getProductById(p.id());
        assertNull(afterRemoval.supplierId());
        assertNull(afterRemoval.supplierName());
        assertEquals(15, afterRemoval.quantity()); // Stock unchanged
    }

    @Test
    @DisplayName("13. Get products associated with supplier")
    void testGetProductsAssociatedWithSupplier() {
        StockpileService.Supplier s = createTestSupplier("Global Fasteners", null, null, null, null, null);
        StockpileService.Product p1 = createTestProduct("Screw M4", "SCR-M4", "Fasteners", 100L, 200L, 500);
        StockpileService.Product p2 = createTestProduct("Bolt M8", "BLT-M8", "Fasteners", 250L, 500L, 250);
        StockpileService.Product p3 = createTestProduct("Unrelated Tool", "TOOL-99", "Tools", 1000L, 2000L, 5);

        service.assignSupplierToProduct(p1.id(), s.id());
        service.assignSupplierToProduct(p2.id(), s.id());

        List<StockpileService.SupplierProduct> supplierProducts = service.getProductsBySupplier(s.id());
        assertEquals(2, supplierProducts.size());

        for (StockpileService.SupplierProduct sp : supplierProducts) {
            assertNotNull(sp.productId());
            assertNotNull(sp.name());
            assertNotNull(sp.sku());
            assertNotNull(sp.category());
            assertTrue(sp.currentQuantity() >= 0);
            assertTrue(sp.purchasePricePaise() > 0);
            assertTrue(sp.sellingPricePaise() > 0);
            assertEquals(s.id(), sp.supplierId());
            assertEquals("Global Fasteners", sp.supplierName());
        }
    }

    @Test
    @DisplayName("14. Reject association with nonexistent supplier or product")
    void testRejectNonexistentAssociation() {
        StockpileService.Product p = createTestProduct("Saw", "SAW-01", "Tools", 40000L, 70000L, 8);
        StockpileService.Supplier s = createTestSupplier("Saw Works", null, null, null, null, null);

        // Nonexistent supplier
        assertThrows(StockpileService.SupplierNotFoundException.class, () ->
            service.assignSupplierToProduct(p.id(), 99999L)
        );

        // Nonexistent product
        assertThrows(StockpileService.ProductNotFoundException.class, () ->
            service.assignSupplierToProduct(99999L, s.id())
        );
    }

    // ==========================================
    // 15-17: DELETION SAFETY & CONFLICT PROTECTION
    // ==========================================

    @Test
    @DisplayName("15. Prevent deletion when products are associated (HTTP 409 Conflict)")
    void testPreventDeletionWhenProductsAssociated() {
        StockpileService.Product p = createTestProduct("Tape", "TP-01", "Tools", 5000L, 10000L, 20);
        StockpileService.Supplier s = createTestSupplier("Tape Factory", null, null, null, null, null);
        service.assignSupplierToProduct(p.id(), s.id());

        StockpileService.SupplierConflictException ex = assertThrows(
            StockpileService.SupplierConflictException.class,
            () -> service.deleteSupplier(s.id())
        );
        assertTrue(ex.getMessage().contains("Cannot delete supplier"));
        assertTrue(ex.getMessage().contains("associated"));

        // Supplier still exists
        assertNotNull(service.getSupplierById(s.id()));
    }

    @Test
    @DisplayName("16. Delete an unassociated supplier successfully")
    void testDeleteUnassociatedSupplier() {
        StockpileService.Supplier s = createTestSupplier("Temp Supplier", null, null, null, null, null);
        assertNotNull(service.getSupplierById(s.id()));

        service.deleteSupplier(s.id());
        assertThrows(StockpileService.SupplierNotFoundException.class, () -> service.getSupplierById(s.id()));
    }

    @Test
    @DisplayName("17. Verify products without suppliers work and return null supplierId/supplierName")
    void testProductsWithoutSuppliers() {
        StockpileService.Product p = createTestProduct("Drill Bit", "DB-01", "Tools", 1500L, 3000L, 50);

        StockpileService.Product fetched = service.getProductById(p.id());
        assertNull(fetched.supplierId());
        assertNull(fetched.supplierName());

        List<StockpileService.Product> all = service.getProducts(null, null);
        assertFalse(all.isEmpty());
        StockpileService.Product inList = all.stream().filter(prod -> prod.id().equals(p.id())).findFirst().orElseThrow();
        assertNull(inList.supplierId());
        assertNull(inList.supplierName());
    }

    // ==========================================
    // 18-20: REGRESSION & PERSISTENCE
    // ==========================================

    @Test
    @DisplayName("18. Verify existing Product CRUD and Inventory Operations unaffected")
    void testProductCrudAndInventoryUnaffected() {
        StockpileService.Product p = createTestProduct("Chisel", "CH-01", "Tools", 8000L, 15000L, 10);

        // Update product
        service.updateProduct(p.id(), new StockpileService.UpdateProductRequest(
            "Wood Chisel", p.sku(), p.category(), 9000L, 16000L,
            p.minStockLevel(), p.targetStockLevel(), p.averageDailySales(), p.leadTimeDays()
        ));
        assertEquals("Wood Chisel", service.getProductById(p.id()).name());

        // Stock In
        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "IN", 5, "Restock"));
        assertEquals(15, service.getProductById(p.id()).quantity());

        // Stock Out
        service.recordMovement(new StockpileService.CreateMovementRequest(p.id(), "OUT", 3, "Sale"));
        assertEquals(12, service.getProductById(p.id()).quantity());

        // Dashboard & Intelligence
        assertNotNull(service.getDashboard());
        assertFalse(service.getInventoryIntelligence().isEmpty());
    }

    @Test
    @DisplayName("19. Verify Sales Management functionality unaffected")
    void testSalesManagementUnaffected() {
        StockpileService.Product p = createTestProduct("Screwdriver", "SD-01", "Tools", 5000L, 10000L, 20);
        StockpileService.Supplier s = createTestSupplier("Tool Corp", null, null, null, null, null);
        service.assignSupplierToProduct(p.id(), s.id());

        // Create Sale
        StockpileService.SaleDetails sale = service.createSale(new StockpileService.CreateSaleRequest(
            List.of(new StockpileService.SaleItemRequest(p.id(), 5)),
            500L,
            "UPI"
        ));
        assertEquals("COMPLETED", sale.status());
        assertEquals(15, service.getProductById(p.id()).quantity());

        // Cancel Sale
        StockpileService.SaleDetails cancelled = service.cancelSale(sale.id(), new StockpileService.CancelSaleRequest("Customer returned"));
        assertEquals("CANCELLED", cancelled.status());
        assertEquals(20, service.getProductById(p.id()).quantity()); // Restored
    }

    @Test
    @DisplayName("20. Verify supplier and association persistence in database")
    void testDataPersistenceInDatabase() {
        StockpileService.Supplier s = createTestSupplier("Persistent Vendor", "Amit", "9988776655", "amit@vendor.com", "Pune", "Trusted");
        StockpileService.Product p = createTestProduct("Nail Pack", "NP-01", "Hardware", 200L, 500L, 100);
        service.assignSupplierToProduct(p.id(), s.id());

        // Query direct SQLite tables using raw SQL
        Integer supplierCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM suppliers WHERE id = ? AND name = 'Persistent Vendor'",
            Integer.class,
            s.id()
        );
        assertEquals(1, supplierCount);

        Integer assocCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM product_suppliers WHERE product_id = ? AND supplier_id = ?",
            Integer.class,
            p.id(), s.id()
        );
        assertEquals(1, assocCount);
    }
}
