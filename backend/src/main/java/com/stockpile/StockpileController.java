package com.stockpile;

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

    @GetMapping("/health")
    public StockpileService.HealthStatus getHealth() {
        return stockpileService.checkHealth();
    }

    // --- Product Endpoints ---

    @GetMapping("/products")
    public List<StockpileService.Product> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        return stockpileService.getProducts(search, category);
    }

    @GetMapping("/products/{id}")
    public StockpileService.Product getProductById(@PathVariable Long id) {
        return stockpileService.getProductById(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.Product createProduct(@RequestBody StockpileService.CreateProductRequest req) {
        return stockpileService.createProduct(req);
    }

    @PutMapping("/products/{id}")
    public StockpileService.Product updateProduct(
            @PathVariable Long id,
            @RequestBody StockpileService.UpdateProductRequest req) {
        return stockpileService.updateProduct(id, req);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        stockpileService.deleteProduct(id);
    }

    // --- Inventory Movements ---

    @GetMapping("/movements")
    public List<StockpileService.RecentMovement> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String movementType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        return stockpileService.getMovements(productId, movementType, from, to, limit, offset);
    }

    @GetMapping("/products/{id}/movements")
    public List<StockpileService.RecentMovement> getProductMovements(@PathVariable Long id) {
        return stockpileService.getMovements(id, null);
    }

    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.RecentMovement recordMovement(@RequestBody StockpileService.CreateMovementRequest req) {
        return stockpileService.recordMovement(req);
    }

    @PostMapping("/inventory/stock-in")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.RecentMovement stockIn(@RequestBody StockpileService.CreateMovementRequest req) {
        return stockpileService.recordMovement(new StockpileService.CreateMovementRequest(
            req.productId(), "IN", req.quantity(), req.reason()
        ));
    }

    @PostMapping("/inventory/stock-out")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.RecentMovement stockOut(@RequestBody StockpileService.CreateMovementRequest req) {
        return stockpileService.recordMovement(new StockpileService.CreateMovementRequest(
            req.productId(), "OUT", req.quantity(), req.reason()
        ));
    }

    @PostMapping("/inventory/adjust")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.RecentMovement adjustStock(@RequestBody StockpileService.CreateMovementRequest req) {
        return stockpileService.recordMovement(new StockpileService.CreateMovementRequest(
            req.productId(), "ADJUSTMENT", req.quantity(), req.reason()
        ));
    }

    // --- Dashboard Endpoint ---

    @GetMapping("/dashboard")
    public StockpileService.DashboardResponse getDashboard(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return stockpileService.getDashboard(period, from, to);
    }

    // --- Inventory Intelligence Endpoints ---

    @GetMapping("/intelligence")
    public List<StockpileService.ProductIntelligence> getInventoryIntelligence() {
        return stockpileService.getInventoryIntelligence();
    }

    @GetMapping("/intelligence/sales")
    public StockpileService.SalesIntelligenceResponse getSalesIntelligence() {
        return stockpileService.getSalesIntelligence();
    }

    // --- Sales Management Endpoints ---

    @PostMapping("/sales")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.SaleDetails createSale(@RequestBody StockpileService.CreateSaleRequest req) {
        return stockpileService.createSale(req);
    }

    @GetMapping("/sales")
    public List<StockpileService.SaleSummary> getSales(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        return stockpileService.getSales(status, from, to, limit, offset);
    }

    @GetMapping("/sales/summary")
    public StockpileService.SalesMetricsSummary getSalesMetricsSummary() {
        return stockpileService.getSalesMetricsSummary();
    }

    @GetMapping("/sales/trend")
    public List<StockpileService.DailySalesTrend> getDailySalesTrend() {
        return stockpileService.getDailySalesTrend();
    }

    @GetMapping("/sales/{id}")
    public StockpileService.SaleDetails getSaleById(@PathVariable Long id) {
        return stockpileService.getSaleById(id);
    }

    @PostMapping("/sales/{id}/cancel")
    public StockpileService.SaleDetails cancelSale(
            @PathVariable Long id,
            @RequestBody StockpileService.CancelSaleRequest req) {
        return stockpileService.cancelSale(id, req);
    }

    // --- Supplier Management Endpoints ---

    @GetMapping("/suppliers")
    public List<StockpileService.Supplier> getSuppliers(
            @RequestParam(required = false) String search) {
        return stockpileService.getSuppliers(search);
    }

    @GetMapping("/suppliers/{id}")
    public StockpileService.Supplier getSupplierById(@PathVariable Long id) {
        return stockpileService.getSupplierById(id);
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.Supplier createSupplier(@RequestBody StockpileService.CreateSupplierRequest req) {
        return stockpileService.createSupplier(req);
    }

    @PutMapping("/suppliers/{id}")
    public StockpileService.Supplier updateSupplier(
            @PathVariable Long id,
            @RequestBody StockpileService.UpdateSupplierRequest req) {
        return stockpileService.updateSupplier(id, req);
    }

    @DeleteMapping("/suppliers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSupplier(@PathVariable Long id) {
        stockpileService.deleteSupplier(id);
    }

    @PutMapping("/products/{productId}/supplier")
    public StockpileService.Product assignSupplier(
            @PathVariable Long productId,
            @RequestBody StockpileService.AssignSupplierRequest req) {
        return stockpileService.assignSupplierToProduct(productId, req.supplierId());
    }

    @DeleteMapping("/products/{productId}/supplier")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeSupplier(@PathVariable Long productId) {
        stockpileService.removeSupplierFromProduct(productId);
    }

    @GetMapping("/suppliers/{id}/products")
    public List<StockpileService.SupplierProduct> getSupplierProducts(@PathVariable Long id) {
        return stockpileService.getProductsBySupplier(id);
    }

    // --- Purchase Order Management Endpoints ---

    @PostMapping("/purchase-orders")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.PurchaseOrderDetails createPurchaseOrder(@RequestBody StockpileService.CreatePurchaseOrderRequest req) {
        return stockpileService.createPurchaseOrder(req);
    }

    @GetMapping("/purchase-orders")
    public List<StockpileService.PurchaseOrderSummary> getPurchaseOrders(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        return stockpileService.getPurchaseOrders(supplierId, status, from, to, limit, offset);
    }

    @GetMapping("/purchase-orders/{id}")
    public StockpileService.PurchaseOrderDetails getPurchaseOrderById(@PathVariable Long id) {
        return stockpileService.getPurchaseOrderById(id);
    }

    @PutMapping("/purchase-orders/{id}")
    public StockpileService.PurchaseOrderDetails updatePurchaseOrder(
            @PathVariable Long id,
            @RequestBody StockpileService.UpdatePurchaseOrderRequest req) {
        return stockpileService.updatePurchaseOrder(id, req);
    }

    @PostMapping("/purchase-orders/{id}/place")
    public StockpileService.PurchaseOrderDetails placePurchaseOrder(@PathVariable Long id) {
        return stockpileService.placePurchaseOrder(id);
    }

    @PostMapping("/purchase-orders/{id}/receive")
    public StockpileService.PurchaseOrderDetails receivePurchaseOrder(
            @PathVariable Long id,
            @RequestBody StockpileService.ReceivePurchaseOrderRequest req) {
        return stockpileService.receivePurchaseOrder(id, req);
    }

    @PostMapping("/purchase-orders/{id}/cancel")
    public StockpileService.PurchaseOrderDetails cancelPurchaseOrder(
            @PathVariable Long id,
            @RequestBody StockpileService.CancelPurchaseOrderRequest req) {
        return stockpileService.cancelPurchaseOrder(id, req);
    }

    // --- Stock Auditing Endpoints ---

    @PostMapping("/stock-audits")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.StockAuditDetails createStockAudit(
            @RequestBody(required = false) StockpileService.CreateStockAuditRequest req) {
        return stockpileService.createStockAudit(req);
    }

    @GetMapping("/stock-audits/summary")
    public StockpileService.StockAuditMetricsSummary getStockAuditSummary() {
        return stockpileService.getStockAuditSummary();
    }

    @GetMapping("/stock-audits")
    public List<StockpileService.StockAuditSummary> getStockAudits(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return stockpileService.getStockAudits(status, from, to);
    }

    @GetMapping("/stock-audits/{id}")
    public StockpileService.StockAuditDetails getStockAuditById(@PathVariable Long id) {
        return stockpileService.getStockAuditById(id);
    }

    @PutMapping("/stock-audits/{auditId}/items/{itemId}")
    public StockpileService.StockAuditItemDetails enterCount(
            @PathVariable Long auditId,
            @PathVariable Long itemId,
            @RequestBody StockpileService.EnterCountRequest req) {
        return stockpileService.enterCount(auditId, itemId, req);
    }

    @PostMapping("/stock-audits/{id}/complete")
    public StockpileService.StockAuditCompletionSummary completeStockAudit(@PathVariable Long id) {
        return stockpileService.completeStockAudit(id);
    }

    @PostMapping("/stock-audits/{id}/cancel")
    public StockpileService.StockAuditDetails cancelStockAudit(
            @PathVariable Long id,
            @RequestBody StockpileService.CancelStockAuditRequest req) {
        return stockpileService.cancelStockAudit(id, req);
    }

    // --- Financial Reports Endpoints ---

    @GetMapping("/reports/summary")
    public StockpileService.FinancialSummaryReport getFinancialSummaryReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getFinancialSummaryReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/profit-loss")
    public StockpileService.ProfitLossReport getProfitLossReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getProfitLossReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/sales")
    public StockpileService.SalesReport getSalesReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getSalesReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/inventory-loss")
    public StockpileService.InventoryLossReport getInventoryLossReport(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return stockpileService.getInventoryLossReport(period, from, to, date, month, year);
    }

    @GetMapping("/reports/purchases")
    public StockpileService.PurchasesReport getPurchasesReport(
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
    public StockpileService.ExpenseRecord createExpense(@RequestBody StockpileService.CreateExpenseRequest req) {
        return stockpileService.createExpense(req);
    }

    @PutMapping("/expenses/{id}")
    public StockpileService.ExpenseRecord updateExpense(
            @PathVariable Long id,
            @RequestBody StockpileService.CreateExpenseRequest req) {
        return stockpileService.updateExpense(id, req);
    }

    @DeleteMapping("/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(@PathVariable Long id) {
        stockpileService.deleteExpense(id);
    }

    @GetMapping("/expenses")
    public List<StockpileService.ExpenseRecord> getExpenses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        return stockpileService.getExpenses(category, from, to, limit, offset);
    }

    public List<StockpileService.ExpenseRecord> getExpenses() {
        return getExpenses(null, null, null, null, null);
    }

    // --- Surplus Stock Management Endpoints ---

    @GetMapping("/surplus-listings/suggestions")
    public List<StockpileService.SurplusSuggestion> getSurplusSuggestions() {
        return stockpileService.getSurplusSuggestions();
    }

    @GetMapping("/surplus-listings/summary")
    public StockpileService.SurplusSummary getSurplusSummary() {
        return stockpileService.getSurplusSummary();
    }

    @GetMapping("/surplus-listings")
    public List<StockpileService.SurplusListingDetails> getSurplusListings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        return stockpileService.getSurplusListings(status, productId, category, search);
    }

    @GetMapping("/surplus-listings/{id}")
    public StockpileService.SurplusListingDetails getSurplusListingById(@PathVariable Long id) {
        return stockpileService.getSurplusListingById(id);
    }

    @PostMapping("/surplus-listings")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.SurplusListingDetails createSurplusListing(
            @RequestBody StockpileService.CreateSurplusListingRequest req) {
        return stockpileService.createSurplusListing(req);
    }

    @PostMapping("/surplus-listings/{id}/sell")
    @ResponseStatus(HttpStatus.CREATED)
    public StockpileService.SaleDetails recordSurplusSale(
            @PathVariable Long id,
            @RequestBody StockpileService.RecordSurplusSaleRequest req) {
        return stockpileService.recordSurplusSale(id, req);
    }

    @PutMapping("/surplus-listings/{id}")
    public StockpileService.SurplusListingDetails updateSurplusListing(
            @PathVariable Long id,
            @RequestBody StockpileService.UpdateSurplusListingRequest req) {
        return stockpileService.updateSurplusListing(id, req);
    }

    @PostMapping("/surplus-listings/{id}/cancel")
    public StockpileService.SurplusListingDetails cancelSurplusListing(
            @PathVariable Long id,
            @RequestBody StockpileService.CancelSurplusListingRequest req) {
        return stockpileService.cancelSurplusListing(id, req);
    }

    // --- Exception Handlers ---

    @ExceptionHandler({
        StockpileService.ProductNotFoundException.class,
        StockpileService.SaleNotFoundException.class,
        StockpileService.SupplierNotFoundException.class,
        StockpileService.PurchaseOrderNotFoundException.class,
        StockpileService.StockAuditNotFoundException.class,
        StockpileService.SurplusListingNotFoundException.class
    })
    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler({
        StockpileService.ProductConflictException.class,
        StockpileService.SaleConflictException.class,
        StockpileService.SupplierConflictException.class,
        StockpileService.PurchaseOrderConflictException.class,
        StockpileService.StockAuditConflictException.class,
        StockpileService.SurplusListingConflictException.class
    })
    public ResponseEntity<Map<String, String>> handleConflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
