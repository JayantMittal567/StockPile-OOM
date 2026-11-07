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
            @RequestParam(required = false) String movementType) {
        return stockpileService.getMovements(productId, movementType);
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
    public StockpileService.DashboardResponse getDashboard() {
        return stockpileService.getDashboard();
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
    public List<StockpileService.SaleSummary> getSales(@RequestParam(required = false) String status) {
        return stockpileService.getSales(status);
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
            @RequestParam(required = false) String status) {
        return stockpileService.getPurchaseOrders(supplierId, status);
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

    // --- Exception Handlers ---

    @ExceptionHandler({
        StockpileService.ProductNotFoundException.class,
        StockpileService.SaleNotFoundException.class,
        StockpileService.SupplierNotFoundException.class,
        StockpileService.PurchaseOrderNotFoundException.class
    })
    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler({
        StockpileService.ProductConflictException.class,
        StockpileService.SaleConflictException.class,
        StockpileService.SupplierConflictException.class,
        StockpileService.PurchaseOrderConflictException.class
    })
    public ResponseEntity<Map<String, String>> handleConflict(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
