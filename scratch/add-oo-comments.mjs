import fs from 'node:fs';
const B = 'C:/Users/Pratik/Desktop/GitHub/StockPile-OOM/backend/src/main/java/com/stockpile/';

// [file, anchor substring (unique), comment]
const C = [
  ['StockpileService.java', '@Service\npublic class StockpileService {', '// OO: Facade Pattern — ek hi simple entry point; andar ke 11 domain modules ka complex kaam chhupa hua hai.'],
  ['StockpileService.java', '    public StockpileService(JdbcTemplate jdbcTemplate, ProductService productService,', '// OO: Constructor Injection — dependencies bahar se milti hain (Spring deta hai), class khud object nahi banati; loose coupling banti hai.'],
  ['StockpileService.java', '    public List<Product> getProducts(String search, String category) {', '// OO: Modularity — pehle ka god-class ab patla facade hai; har call apne domain module ko delegate hoti hai, system chhote samajhne-layak tukdon mein bata hua.'],
  ['model/Product.java', 'public record Product(', '// OO: Class, Object & Attributes — Product ek class hai; har DB row iska object; record components uske attributes (state) hain.'],
  ['model/Product.java', '    Long id,', '// OO: Encapsulation — components private final hain; bahar wale sirf accessor methods se value padh sakte hain, direct chhed-chhad nahi.'],
  ['model/SaleDetails.java', 'public record SaleDetails(', '// OO: Composition — SaleItemDetails sale ka apna hissa hai; sale khatam to items bhi khatam (strong owns-a, shared lifecycle).'],
  ['model/SaleItemDetails.java', 'public record SaleItemDetails(', '// OO: Association — item product ko reference karta hai (uses-a); product sale ke bina bhi independently exist karta hai.'],
  ['model/DashboardResponse.java', 'public record DashboardResponse(', '// OO: Aggregation — response breakdowns ko collect karta hai (has-a); ye parts alag se bhi ban sakte hain, weak ownership.'],
  ['model/CreateSaleRequest.java', '    public CreateSaleRequest(List<SaleItemRequest> items, Long discountPaise, String paymentMethod) {', '// OO: Open/Closed Principle (OCP) — naye convenience constructors se extension kiya, purane callers ka code chhede bina; existing behaviour band, extension khula.'],
  ['model/UpdateSurplusListingRequest.java', '    public UpdateSurplusListingRequest(Long discountedPricePaise, String reason, String notes) {', '// OO: Polymorphism (compile-time overloading) — same constructor naam, alag parameter list; call site pe compiler decide karta hai kaunsa version chalega.'],
  ['model/CreateSurplusListingRequest.java', '    public CreateSurplusListingRequest(Long productId, Integer quantity, Long discountedPricePaise, String reason) {', '// OO: Constructor — object bante hi state initialize hoti hai; chhota constructor optional fields ki default value bhar deta hai.'],
  ['model/SurplusListingDetails.java', '        public long getTotalPotentialRevenuePaise() {', '// OO: Methods — object ka behaviour; attributes se derive karke result deta hai, caller ko calculation nahi karni padti.'],
  ['exception/ProductNotFoundException.java', 'public class ProductNotFoundException extends RuntimeException {', '// OO: Inheritance — RuntimeException se derive (is-a); parent type ke catch/handler is child ko bhi pakad lete hain.'],
  ['exception/StockAuditConflictException.java', 'public class StockAuditConflictException extends IllegalStateException {', '// OO: Liskov Substitution (LSP) — IllegalStateException ki jagah ye child bina contract tode use ho sakta hai; parent ke rules ye bhi nibhata hai.'],
  ['StockpileController.java', '    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException ex) {', '// OO: Polymorphism (runtime) — parameter parent RuntimeException type ka, andar alag-alag child exception objects aate hain; ek hi handler sabko serve karta hai.'],
  ['StockpileController.java', '    @ExceptionHandler(IllegalArgumentException.class)', '// OO: Exception Handling — business layer throw karti hai, boundary (controller) catch karke meaningful HTTP status + JSON error banata hai.'],
  ['service/ProductService.java', '@Service\npublic class ProductService {', '// OO: Single Responsibility (SRP) — ye module sirf product catalog aur supplier-link ka kaam karta hai; sales/stock ka bojh nahi.'],
  ['service/ProductService.java', '    public Product assignSupplierToProduct(Long productId, Long supplierId) {', '// OO: Association (many-to-many) — product_suppliers link table products aur suppliers ko jodti hai; dono sides independent exist karti hain.'],
  ['service/SupplierService.java', '@Service\npublic class SupplierService {', '// OO: Abstraction — SQL queries aur validation andar chhupi hain; bahar sirf clean business methods dikhte hain.'],
  ['service/InventoryService.java', '    public InventoryService(JdbcTemplate jdbcTemplate, ProductService productService) {', '// OO: Dependency Inversion (DIP) — concrete DB driver par nahi, JdbcTemplate abstraction par depend; driver badle to service nahi badalti.'],
  ['service/InventoryService.java', '    public int getActiveReservedQuantity(Long productId) {', '// OO: Association — products aur surplus_listings alag entities hain, product_id foreign key se jude (uses-a); reservation ka hisaab yahan milta hai.'],
  ['service/support/RowMappers.java', '    public static final RowMapper<Product> PRODUCT =', '// OO: Template Method — JdbcTemplate ka row-loop fixed algorithm hai; har row ko object mein badalna humara callback decide karta hai (hook).'],
  ['service/support/RowMappers.java', 'public final class RowMappers {', '// OO: DAO/Repository Pattern — row-to-object mapping ek jagah centralized; services SQL result ko domain objects ki tarah use karti hain.'],
  ['service/support/QuerySupport.java', 'public final class QuerySupport {', '// OO: Modularity & Maintainable Design — shared helpers ek hi jagah; duplication nahi, ek fix sab jagah lagta hai.'],
  ['service/ExpenseService.java', '@Service\npublic class ExpenseService {', '// OO: Interface Segregation (ISP) — chhota focused API; client ko sirf expenses ke methods milte hain, poora god-service nahi.'],
  ['service/ReportService.java', '    public FinancialSummaryReport getFinancialSummaryReport(String period, String fromStr, String toStr, String dateStr, Integer month, Integer year) {', '// OO: Abstraction — bhaari SQL aggregation ek method ke peeche chhupi; caller ko sirf ready report milti hai, complexity nahi.'],
  ['service/DashboardService.java', '@Service\npublic class DashboardService {', '// OO: Singleton Pattern (Spring bean) — container is class ka ek hi instance banata hai; sab clients wahi instance share karte hain.'],
];

let n = 0;
for (const [file, anchor, comment] of C) {
  const p = B + file;
  let src = fs.readFileSync(p, 'utf8');
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const a = anchor.replace(/\n/g, nl);
  const idx = src.indexOf(a);
  if (idx < 0) { console.log('!! anchor not found:', file, anchor.slice(0, 60)); continue; }
  if (src.indexOf(a, idx + 1) >= 0) { console.log('!! anchor not unique:', file, anchor.slice(0, 60)); continue; }
  const lineStart = src.lastIndexOf(nl, idx) + nl.length;
  const indent = (anchor.match(/^\s*/) || [''])[0];
  src = src.slice(0, lineStart) + indent + comment + nl + src.slice(lineStart);
  fs.writeFileSync(p, src);
  n++;
}
console.log('inserted', n, 'of', C.length);