package com.stockpile;

import com.stockpile.exception.*;
import com.stockpile.model.*;
import com.stockpile.service.*;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

// OO: Facade Pattern — ek hi simple entry point; andar ke 11 domain modules ka complex kaam chhupa hua hai.
@Service
public class StockpileService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;
    private final SupplierService supplierService;
    private final InventoryService inventoryService;
    private final DashboardService dashboardService;
    private final IntelligenceService intelligenceService;
    private final SalesService salesService;
    private final PurchaseOrderService purchaseOrderService;
    private final StockAuditService stockAuditService;
    private final ReportService reportService;
    private final ExpenseService expenseService;
    private final SurplusService surplusService;

    // OO: Constructor Injection — dependencies bahar se milti hain (Spring deta hai), class khud object nahi banati; loose coupling banti hai.
    public StockpileService(JdbcTemplate jdbcTemplate, ProductService productService, SupplierService supplierService, InventoryService inventoryService, DashboardService dashboardService, IntelligenceService intelligenceService, SalesService salesService, PurchaseOrderService purchaseOrderService, StockAuditService stockAuditService, ReportService reportService, ExpenseService expenseService, SurplusService surplusService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
        this.supplierService = supplierService;
        this.inventoryService = inventoryService;
        this.dashboardService = dashboardService;
        this.intelligenceService = intelligenceService;
        this.salesService = salesService;
        this.purchaseOrderService = purchaseOrderService;
        this.stockAuditService = stockAuditService;
        this.reportService = reportService;
        this.expenseService = expenseService;
        this.surplusService = surplusService;
    }

    @PostConstruct
    public void initDatabase() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS surplus_listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                product_name_snapshot TEXT NOT NULL,
                sku_snapshot TEXT NOT NULL,
                quantity_listed INTEGER NOT NULL CHECK (quantity_listed > 0),
                quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
                regular_unit_price_paise INTEGER NOT NULL CHECK (regular_unit_price_paise >= 0),
                discounted_unit_price_paise INTEGER NOT NULL CHECK (discounted_unit_price_paise > 0),
                unit_cost_paise_snapshot INTEGER NOT NULL CHECK (unit_cost_paise_snapshot >= 0),
                reason TEXT NOT NULL,
                notes TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTIALLY_SOLD', 'SOLD', 'CANCELLED')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cancelled_at TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id)
            );
        """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_product_id ON surplus_listings(product_id);");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_status ON surplus_listings(status);");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_created_at ON surplus_listings(created_at);");

        boolean hasSurplusListingId = false;
        try {
            List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(sale_items)");
            for (Map<String, Object> col : columns) {
                if ("surplus_listing_id".equalsIgnoreCase((String) col.get("name"))) {
                    hasSurplusListingId = true;
                    break;
                }
            }
        } catch (Exception ignored) {}

        if (!hasSurplusListingId) {
            try {
                jdbcTemplate.execute("ALTER TABLE sale_items ADD COLUMN surplus_listing_id INTEGER REFERENCES surplus_listings(id);");
            } catch (Exception ignored) {}
        }

        boolean hasDiscountPercentBasisPoints = false;
        try {
            List<Map<String, Object>> salesColumns = jdbcTemplate.queryForList("PRAGMA table_info(sales)");
            for (Map<String, Object> col : salesColumns) {
                if ("discount_percent_basis_points".equalsIgnoreCase((String) col.get("name"))) {
                    hasDiscountPercentBasisPoints = true;
                    break;
                }
            }
        } catch (Exception ignored) {}

        if (!hasDiscountPercentBasisPoints) {
            try {
                jdbcTemplate.execute("ALTER TABLE sales ADD COLUMN discount_percent_basis_points INTEGER;");
            } catch (Exception ignored) {}
        }
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_sale_items_surplus_listing_id ON sale_items(surplus_listing_id);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_stock_audits_completed_at ON stock_audits(completed_at);");

            // Performance Optimisation Composite & Expression Indexes
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_sales_created_at_expr ON sales(datetime(replace(created_at, 'T', ' ')));");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_sales_status_created ON sales(status, created_at);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_surplus_listings_status_created ON surplus_listings(status, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_po_status_created ON purchase_orders(status, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_created ON stock_movements(product_id, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_stock_audits_status_created ON stock_audits(status, created_at DESC);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_expenses_created_at_expr ON expenses(datetime(replace(created_at, 'T', ' ')));");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_expenses_category_created ON expenses(category, created_at DESC);");
        } catch (Exception ignored) {}
    }

    public HealthStatus checkHealth() {
        try {
            Integer ping = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            boolean dbConnected = ping != null && ping == 1;

            Integer productCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
            Integer movementCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM stock_movements", Integer.class);

            return new HealthStatus(
                "UP",
                dbConnected ? "CONNECTED" : "DISCONNECTED",
                "SQLite",
                productCount != null ? productCount : 0,
                movementCount != null ? movementCount : 0,
                Instant.now().toString()
            );
        } catch (Exception e) {
            return new HealthStatus(
                "DEGRADED",
                "ERROR: " + e.getMessage(),
                "SQLite",
                0,
                0,
                Instant.now().toString()
            );
        }
    }

    // OO: Modularity — pehle ka god-class ab patla facade hai; har call apne domain module ko delegate hoti hai, system chhote samajhne-layak tukdon mein bata hua.
    public List<Product> getProducts(String search, String category) {
        return productService.getProducts(search, category);
    }

    public Product getProductById(Long id) {
        return productService.getProductById(id);
    }

    public Product createProduct(CreateProductRequest req) {
        return productService.createProduct(req);
    }

    public Product updateProduct(Long id, UpdateProductRequest req) {
        return productService.updateProduct(id, req);
    }

    public void deleteProduct(Long id) {
        productService.deleteProduct(id);
    }

    public Product assignSupplierToProduct(Long productId, Long supplierId) {
        return productService.assignSupplierToProduct(productId, supplierId);
    }

    public void removeSupplierFromProduct(Long productId) {
        productService.removeSupplierFromProduct(productId);
    }

    public List<SupplierProduct> getProductsBySupplier(Long supplierId) {
        return productService.getProductsBySupplier(supplierId);
    }

    public List<Supplier> getSuppliers(String search) {
        return supplierService.getSuppliers(search);
    }

    public Supplier getSupplierById(Long id) {
        return supplierService.getSupplierById(id);
    }

    public Supplier createSupplier(CreateSupplierRequest req) {
        return supplierService.createSupplier(req);
    }

    public Supplier updateSupplier(Long id, UpdateSupplierRequest req) {
        return supplierService.updateSupplier(id, req);
    }

    public void deleteSupplier(Long id) {
        supplierService.deleteSupplier(id);
    }

    public RecentMovement recordMovement(CreateMovementRequest req) {
        return inventoryService.recordMovement(req);
    }

    public List<RecentMovement> getMovements(Long productId, String movementType) {
        return inventoryService.getMovements(productId, movementType);
    }

    public List<RecentMovement> getMovements(Long productId, String movementType, String fromStr, String toStr, Integer limit, Integer offset) {
        return inventoryService.getMovements(productId, movementType, fromStr, toStr, limit, offset);
    }

    public int getActiveReservedQuantity(Long productId) {
        return inventoryService.getActiveReservedQuantity(productId);
    }

    public DashboardResponse getDashboard() {
        return dashboardService.getDashboard();
    }

    public DashboardResponse getDashboard(String period, String fromStr, String toStr) {
        return dashboardService.getDashboard(period, fromStr, toStr);
    }

    public List<ProductIntelligence> getInventoryIntelligence() {
        return intelligenceService.getInventoryIntelligence();
    }

    public SalesIntelligenceResponse getSalesIntelligence() {
        return intelligenceService.getSalesIntelligence();
    }

    public SaleDetails createSale(CreateSaleRequest req) {
        return salesService.createSale(req);
    }

    public List<SaleSummary> getSales(String status) {
        return salesService.getSales(status);
    }

    public List<SaleSummary> getSales(String status, String fromStr, String toStr, Integer limit, Integer offset) {
        return salesService.getSales(status, fromStr, toStr, limit, offset);
    }

    public SalesMetricsSummary getSalesMetricsSummary() {
        return salesService.getSalesMetricsSummary();
    }

    public List<DailySalesTrend> getDailySalesTrend() {
        return salesService.getDailySalesTrend();
    }

    public SaleDetails getSaleById(Long id) {
        return salesService.getSaleById(id);
    }

    public SaleDetails cancelSale(Long id, CancelSaleRequest req) {
        return salesService.cancelSale(id, req);
    }

    public PurchaseOrderDetails createPurchaseOrder(CreatePurchaseOrderRequest req) {
        return purchaseOrderService.createPurchaseOrder(req);
    }

    public List<PurchaseOrderSummary> getPurchaseOrders(Long supplierId, String status) {
        return purchaseOrderService.getPurchaseOrders(supplierId, status);
    }

    public List<PurchaseOrderSummary> getPurchaseOrders(Long supplierId, String status, String fromStr, String toStr, Integer limit, Integer offset) {
        return purchaseOrderService.getPurchaseOrders(supplierId, status, fromStr, toStr, limit, offset);
    }

    public PurchaseOrderDetails getPurchaseOrderById(Long id) {
        return purchaseOrderService.getPurchaseOrderById(id);
    }

    public PurchaseOrderDetails updatePurchaseOrder(Long id, UpdatePurchaseOrderRequest req) {
        return purchaseOrderService.updatePurchaseOrder(id, req);
    }

    public PurchaseOrderDetails placePurchaseOrder(Long id) {
        return purchaseOrderService.placePurchaseOrder(id);
    }

    public PurchaseOrderDetails receivePurchaseOrder(Long id, ReceivePurchaseOrderRequest req) {
        return purchaseOrderService.receivePurchaseOrder(id, req);
    }

    public PurchaseOrderDetails cancelPurchaseOrder(Long id, CancelPurchaseOrderRequest req) {
        return purchaseOrderService.cancelPurchaseOrder(id, req);
    }

    public StockAuditDetails createStockAudit(CreateStockAuditRequest req) {
        return stockAuditService.createStockAudit(req);
    }

    public StockAuditMetricsSummary getStockAuditSummary() {
        return stockAuditService.getStockAuditSummary();
    }

    public List<StockAuditSummary> getStockAudits() {
        return stockAuditService.getStockAudits();
    }

    public List<StockAuditSummary> getStockAudits(String status, String fromStr, String toStr) {
        return stockAuditService.getStockAudits(status, fromStr, toStr);
    }

    public List<StockAuditSummary> getStockAudits(String status, String fromStr, String toStr, Integer limit, Integer offset) {
        return stockAuditService.getStockAudits(status, fromStr, toStr, limit, offset);
    }

    public StockAuditDetails getStockAuditById(Long id) {
        return stockAuditService.getStockAuditById(id);
    }

    public StockAuditItemDetails getStockAuditItemById(Long auditId, Long itemId) {
        return stockAuditService.getStockAuditItemById(auditId, itemId);
    }

    public StockAuditItemDetails enterCount(Long auditId, Long itemId, EnterCountRequest req) {
        return stockAuditService.enterCount(auditId, itemId, req);
    }

    public StockAuditCompletionSummary completeStockAudit(Long id) {
        return stockAuditService.completeStockAudit(id);
    }

    public StockAuditDetails cancelStockAudit(Long id, CancelStockAuditRequest req) {
        return stockAuditService.cancelStockAudit(id, req);
    }

    public DateRangeFilter resolveDateRange(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        return reportService.resolveDateRange(period, fromStr, toStr, dateStr, month, year);
    }

    public FinancialSummaryReport getFinancialSummaryReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        return reportService.getFinancialSummaryReport(period, fromStr, toStr, dateStr, month, year);
    }

    public ProfitLossReport getProfitLossReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        return reportService.getProfitLossReport(period, fromStr, toStr, dateStr, month, year);
    }

    public SalesReport getSalesReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        return reportService.getSalesReport(period, fromStr, toStr, dateStr, month, year);
    }

    public InventoryLossReport getInventoryLossReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        return reportService.getInventoryLossReport(period, fromStr, toStr, dateStr, month, year);
    }

    public PurchasesReport getPurchasesReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {
        return reportService.getPurchasesReport(period, fromStr, toStr, dateStr, month, year);
    }

    public ExpenseRecord createExpense(CreateExpenseRequest req) {
        return expenseService.createExpense(req);
    }

    public ExpenseRecord updateExpense(Long id, CreateExpenseRequest req) {
        return expenseService.updateExpense(id, req);
    }

    public void deleteExpense(Long id) {
        expenseService.deleteExpense(id);
    }

    public List<ExpenseRecord> getExpenses() {
        return expenseService.getExpenses();
    }

    public List<ExpenseRecord> getExpenses(String category, String fromStr, String toStr, Integer limit, Integer offset) {
        return expenseService.getExpenses(category, fromStr, toStr, limit, offset);
    }

    public List<SurplusSuggestion> getSurplusSuggestions() {
        return surplusService.getSurplusSuggestions();
    }

    public SurplusListingDetails createSurplusListing(CreateSurplusListingRequest req) {
        return surplusService.createSurplusListing(req);
    }

    public List<SurplusListingDetails> getSurplusListings(String status, Long productId, String category, String search) {
        return surplusService.getSurplusListings(status, productId, category, search);
    }

    public List<SurplusListingDetails> getSurplusListings(String status, Long productId, String category, String search, Integer limit, Integer offset) {
        return surplusService.getSurplusListings(status, productId, category, search, limit, offset);
    }

    public SurplusListingDetails getSurplusListingById(Long id) {
        return surplusService.getSurplusListingById(id);
    }

    public SurplusSummary getSurplusSummary() {
        return surplusService.getSurplusSummary();
    }

    public SaleDetails recordSurplusSale(Long id, RecordSurplusSaleRequest req) {
        return surplusService.recordSurplusSale(id, req);
    }

    public SurplusListingDetails updateSurplusListing(Long id, UpdateSurplusListingRequest req) {
        return surplusService.updateSurplusListing(id, req);
    }

    public SurplusListingDetails cancelSurplusListing(Long id, CancelSurplusListingRequest req) {
        return surplusService.cancelSurplusListing(id, req);
    }
}
