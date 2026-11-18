package com.stockpile;

import com.stockpile.exception.*;
import com.stockpile.model.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StockpileController {

    private final StockpileService stockpileService;

    public StockpileController(StockpileService stockpileService) {
        this.stockpileService = stockpileService;
    }

    private static int[] resolvePagination(Integer limit, Integer offset, Integer page, Integer size) {
        if (size != null && size > 0) {
            int effectiveLimit = Math.min(100, Math.max(1, size));
            int p = (page != null && page >= 0) ? page : 0;
            return new int[]{effectiveLimit, p * effectiveLimit};
        }
        if (limit != null && limit > 0) {
            int effectiveLimit = Math.min(100, Math.max(1, limit));
            int off = (offset != null && offset > 0) ? offset : 0;
            return new int[]{effectiveLimit, off};
        }
        return null;
    }

    @GetMapping("/health")
    public HealthStatus getHealth() {
        return stockpileService.checkHealth();
    }

    // --- Product Endpoints ---

    @GetMapping("/products")
    public List<Product> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        return stockpileService.getProducts(search, category);
    }

    @GetMapping("/products/{id}")
    public Product getProductById(@PathVariable Long id) {
        return stockpileService.getProductById(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@RequestBody CreateProductRequest req) {
        return stockpileService.createProduct(req);
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(
            @PathVariable Long id,
            @RequestBody UpdateProductRequest req) {
        return stockpileService.updateProduct(id, req);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        stockpileService.deleteProduct(id);
    }

    // --- Inventory Movements ---

    @GetMapping("/movements")
    public List<RecentMovement> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String movementType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        int[] pag = resolvePagination(limit, offset, page, size);
        return stockpileService.getMovements(productId, movementType, from, to, pag != null ? pag[0] : null, pag != null ? pag[1] : null);
    }

    @GetMapping("/products/{id}/movements")
    public List<RecentMovement> getProductMovements(@PathVariable Long id) {
        return stockpileService.getMovements(id, null);
    }

    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public RecentMovement recordMovement(@RequestBody CreateMovementRequest req) {
        return stockpileService.recordMovement(req);
    }

    @PostMapping("/inventory/stock-in")
    @ResponseStatus(HttpStatus.CREATED)
    public RecentMovement stockIn(@RequestBody CreateMovementRequest req) {
        return stockpileService.recordMovement(new CreateMovementRequest(
            req.productId(), "IN", req.quantity(), req.reason()
        ));
    }

    @PostMapping("/inventory/stock-out")
    @ResponseStatus(HttpStatus.CREATED)
    public RecentMovement stockOut(@RequestBody CreateMovementRequest req) {
        return stockpileService.recordMovement(new CreateMovementRequest(
            req.productId(), "OUT", req.quantity(), req.reason()
        ));
    }

    @PostMapping("/inventory/adjust")
    @ResponseStatus(HttpStatus.CREATED)
    public RecentMovement adjustStock(@RequestBody CreateMovementRequest req) {
        return stockpileService.recordMovement(new CreateMovementRequest(
            req.productId(), "ADJUSTMENT", req.quantity(), req.reason()
        ));
    }

    // --- Dashboard Endpoint ---

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return stockpileService.getDashboard(period, from, to);
    }

    // --- Inventory Intelligence Endpoints ---

    @GetMapping("/intelligence")
    public List<ProductIntelligence> getInventoryIntelligence() {
        return stockpileService.getInventoryIntelligence();
    }

    @GetMapping("/intelligence/sales")
    public SalesIntelligenceResponse getSalesIntelligence() {
        return stockpileService.getSalesIntelligence();
    }

    // --- Sales Management Endpoints ---

    @PostMapping("/sales")
    @ResponseStatus(HttpStatus.CREATED)
    public SaleDetails createSale(@RequestBody CreateSaleRequest req) {
        return stockpileService.createSale(req);
    }

    @GetMapping("/sales")
    public List<SaleSummary> getSales(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        int[] pag = resolvePagination(limit, offset, page, size);
        return stockpileService.getSales(status, from, to, pag != null ? pag[0] : null, pag != null ? pag[1] : null);
    }

    @GetMapping("/sales/summary")
    public SalesMetricsSummary getSalesMetricsSummary() {
        return stockpileService.getSalesMetricsSummary();
    }

    @GetMapping("/sales/trend")
    public List<DailySalesTrend> getDailySalesTrend() {
        return stockpileService.getDailySalesTrend();
    }

    @GetMapping("/sales/{id}")
    public SaleDetails getSaleById(@PathVariable Long id) {
        return stockpileService.getSaleById(id);
    }

    @PostMapping("/sales/{id}/cancel")
    public SaleDetails cancelSale(
            @PathVariable Long id,
            @RequestBody CancelSaleRequest req) {
        return stockpileService.cancelSale(id, req);
    }

    // --- Supplier Management Endpoints ---

    @GetMapping("/suppliers")
    public List<Supplier> getSuppliers(
            @RequestParam(required = false) String search) {
        return stockpileService.getSuppliers(search);
    }

    @GetMapping("/suppliers/{id}")
    public Supplier getSupplierById(@PathVariable Long id) {
        return stockpileService.getSupplierById(id);
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    public Supplier createSupplier(@RequestBody CreateSupplierRequest req) {
        return stockpileService.createSupplier(req);
    }

    @PutMapping("/suppliers/{id}")
    public Supplier updateSupplier(
            @PathVariable Long id,
            @RequestBody UpdateSupplierRequest req) {
        return stockpileService.updateSupplier(id, req);
    }

    @DeleteMapping("/suppliers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSupplier(@PathVariable Long id) {
        stockpileService.deleteSupplier(id);
    }

    @PutMapping("/products/{productId}/supplier")
    public Product assignSupplier(
            @PathVariable Long productId,
            @RequestBody AssignSupplierRequest req) {
        return stockpileService.assignSupplierToProduct(productId, req.supplierId());
    }

    @DeleteMapping("/products/{productId}/supplier")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeSupplier(@PathVariable Long productId) {
        stockpileService.removeSupplierFromProduct(productId);
    }

    @GetMapping("/suppliers/{id}/products")
    public List<SupplierProduct> getSupplierProducts(@PathVariable Long id) {
        return stockpileService.getProductsBySupplier(id);
    }

    // --- Purchase Order Management Endpoints ---

    @PostMapping("/purchase-orders")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseOrderDetails createPurchaseOrder(@RequestBody CreatePurchaseOrderRequest req) {
        return stockpileService.createPurchaseOrder(req);
    }

    @GetMapping("/purchase-orders")
    public List<PurchaseOrderSummary> getPurchaseOrders(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        int[] pag = resolvePagination(limit, offset, page, size);
        return stockpileService.getPurchaseOrders(supplierId, status, from, to, pag != null ? pag[0] : null, pag != null ? pag[1] : null);
    }

    @GetMapping("/purchase-orders/{id}")
    public PurchaseOrderDetails getPurchaseOrderById(@PathVariable Long id) {
        return stockpileService.getPurchaseOrderById(id);
    }

    @PutMapping("/purchase-orders/{id}")
    public PurchaseOrderDetails updatePurchaseOrder(
            @PathVariable Long id,
            @RequestBody UpdatePurchaseOrderRequest req) {
        return stockpileService.updatePurchaseOrder(id, req);
    }

    @PostMapping("/purchase-orders/{id}/place")
    public PurchaseOrderDetails placePurchaseOrder(@PathVariable Long id) {
        return stockpileService.placePurchaseOrder(id);
    }

    @PostMapping("/purchase-orders/{id}/receive")
    public PurchaseOrderDetails receivePurchaseOrder(
            @PathVariable Long id,
            @RequestBody ReceivePurchaseOrderRequest req) {
        return stockpileService.receivePurchaseOrder(id, req);
    }

    @PostMapping("/purchase-orders/{id}/cancel")
    public PurchaseOrderDetails cancelPurchaseOrder(
            @PathVariable Long id,
            @RequestBody CancelPurchaseOrderRequest req) {
        return stockpileService.cancelPurchaseOrder(id, req);
    }

    // --- Stock Auditing Endpoints ---

    @PostMapping("/stock-audits")
    @ResponseStatus(HttpStatus.CREATED)
    public StockAuditDetails createStockAudit(
            @RequestBody(required = false) CreateStockAuditRequest req) {
        return stockpileService.createStockAudit(req);
    }

    @GetMapping("/stock-audits/summary")
    public StockAuditMetricsSummary getStockAuditSummary() {
        return stockpileService.getStockAuditSummary();
    }

    @GetMapping("/stock-audits")
    public List<StockAuditSummary> getStockAudits(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        int[] pag = resolvePagination(limit, offset, page, size);
        return stockpileService.getStockAudits(status, from, to, pag != null ? pag[0] : null, pag != null ? pag[1] : null);
    }

    @GetMapping("/stock-audits/{id}")
    public StockAuditDetails getStockAuditById(@PathVariable Long id) {
        return stockpileService.getStockAuditById(id);
    }

    @PutMapping("/stock-audits/{auditId}/items/{itemId}")
    public StockAuditItemDetails enterCount(
            @PathVariable Long auditId,
            @PathVariable Long itemId,
            @RequestBody EnterCountRequest req) {
        return stockpileService.enterCount(auditId, itemId, req);
    }

    @PostMapping("/stock-audits/{id}/complete")
    public StockAuditCompletionSummary completeStockAudit(@PathVariable Long id) {
        return stockpileService.completeStockAudit(id);
    }

    @PostMapping("/stock-audits/{id}/cancel")
    public StockAuditDetails cancelStockAudit(
            @PathVariable Long id,
            @RequestBody CancelStockAuditRequest req) {
        return stockpileService.cancelStockAudit(id, req);
    }

    // --- Financial Reports Endpoints ---

    @GetMapping("/reports/summary")
    public FinancialSummaryReport getFinancialSummaryReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getFinancialSummaryReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/profit-loss")
    public ProfitLossReport getProfitLossReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getProfitLossReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/sales")
    public SalesReport getSalesReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getSalesReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/inventory-loss")
    public InventoryLossReport getInventoryLossReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getInventoryLossReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/purchases")
    public PurchasesReport getPurchasesReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getPurchasesReport(period, from, to, date, month, year);
    }

    // --- Expenses Endpoints ---

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseRecord createExpense(@RequestBody CreateExpenseRequest req) {
        return stockpileService.createExpense(req);
    }

    @PutMapping("/expenses/{id}")
    public ExpenseRecord updateExpense(
            @PathVariable Long id,
            @RequestBody CreateExpenseRequest req) {
        return stockpileService.updateExpense(id, req);
    }

    @DeleteMapping("/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(@PathVariable Long id) {
        stockpileService.deleteExpense(id);
    }

    @GetMapping("/expenses")
    public List<ExpenseRecord> getExpenses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        int[] pag = resolvePagination(limit, offset, page, size);
        return stockpileService.getExpenses(category, from, to, pag != null ? pag[0] : null, pag != null ? pag[1] : null);
    }

    public List<ExpenseRecord> getExpenses() {
        return getExpenses(null, null, null, null, null, null, null);
    }

    // --- Surplus Stock Management Endpoints ---

    @GetMapping("/surplus-listings/suggestions")
    public List<SurplusSuggestion> getSurplusSuggestions() {
        return stockpileService.getSurplusSuggestions();
    }

    @GetMapping("/surplus-listings/summary")
    public SurplusSummary getSurplusSummary() {
        return stockpileService.getSurplusSummary();
    }

    @GetMapping("/surplus-listings")
    public List<SurplusListingDetails> getSurplusListings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        int[] pag = resolvePagination(limit, offset, page, size);
        return stockpileService.getSurplusListings(status, productId, category, search, pag != null ? pag[0] : null, pag != null ? pag[1] : null);
    }

    @GetMapping("/surplus-listings/{id}")
    public SurplusListingDetails getSurplusListingById(@PathVariable Long id) {
        return stockpileService.getSurplusListingById(id);
    }

    @PostMapping("/surplus-listings")
    @ResponseStatus(HttpStatus.CREATED)
    public SurplusListingDetails createSurplusListing(
            @RequestBody CreateSurplusListingRequest req) {
        return stockpileService.createSurplusListing(req);
    }

    @PostMapping("/surplus-listings/{id}/sell")
    @ResponseStatus(HttpStatus.CREATED)
    public SaleDetails recordSurplusSale(
            @PathVariable Long id,
            @RequestBody RecordSurplusSaleRequest req) {
        return stockpileService.recordSurplusSale(id, req);
    }

    @PutMapping("/surplus-listings/{id}")
    public SurplusListingDetails updateSurplusListing(
            @PathVariable Long id,
            @RequestBody UpdateSurplusListingRequest req) {
        return stockpileService.updateSurplusListing(id, req);
    }

    @PostMapping("/surplus-listings/{id}/cancel")
    public SurplusListingDetails cancelSurplusListing(
            @PathVariable Long id,
            @RequestBody CancelSurplusListingRequest req) {
        return stockpileService.cancelSurplusListing(id, req);
    }

    // --- Exception Handlers ---

    @ExceptionHandler({
        ProductNotFoundException.class,
        SaleNotFoundException.class,
        SupplierNotFoundException.class,
        PurchaseOrderNotFoundException.class,
        StockAuditNotFoundException.class,
        SurplusListingNotFoundException.class
    })
    // OO: Polymorphism (runtime) — parameter parent RuntimeException type ka, andar alag-alag child exception objects aate hain; ek hi handler sabko serve karta hai.
    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler({
        ProductConflictException.class,
        SaleConflictException.class,
        SupplierConflictException.class,
        PurchaseOrderConflictException.class,
        StockAuditConflictException.class,
        SurplusListingConflictException.class
    })
    public ResponseEntity<Map<String, String>> handleConflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
    }

    // OO: Exception Handling — business layer throw karti hai, boundary (controller) catch karke meaningful HTTP status + JSON error banata hai.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
