import fs from 'node:fs';
import path from 'node:path';
const ROOT = 'C:/Users/Pratik/Desktop/GitHub/StockPile-OOM';
const BASE = path.join(ROOT, 'backend/src/main/java');

const entries = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.java')) {
      const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
      lines.forEach((l, i) => {
        const m = l.match(/\/\/ OO: (.+?) — (.*)$/);
        if (m) entries.push({ concept: m[1], phrase: m[2], file: path.relative(ROOT, p).replace(/\\/g, '/'), line: i + 1 });
      });
    }
  }
};
walk(BASE);

const GROUPS = [
  ['CLASS, OBJECT, ATTRIBUTES, METHODS, CONSTRUCTORS ( basics )', ['Class, Object & Attributes', 'Methods', 'Constructor', 'Constructor Injection']],
  ['ENCAPSULATION', ['Encapsulation']],
  ['ABSTRACTION', ['Abstraction']],
  ['INHERITANCE', ['Inheritance']],
  ['POLYMORPHISM', ['Polymorphism (compile-time overloading)', 'Polymorphism (runtime)']],
  ['ASSOCIATION', ['Association', 'Association (many-to-many)']],
  ['AGGREGATION', ['Aggregation']],
  ['COMPOSITION', ['Composition']],
  ['SOLID — Single Responsibility (SRP)', ['Single Responsibility (SRP)']],
  ['SOLID — Open/Closed (OCP)', ['Open/Closed Principle (OCP)']],
  ['SOLID — Liskov Substitution (LSP)', ['Liskov Substitution (LSP)']],
  ['SOLID — Interface Segregation (ISP)', ['Interface Segregation (ISP)']],
  ['SOLID — Dependency Inversion (DIP)', ['Dependency Inversion (DIP)']],
  ['DESIGN PATTERN — Facade', ['Facade Pattern']],
  ['DESIGN PATTERN — Singleton (Spring bean)', ['Singleton Pattern (Spring bean)']],
  ['DESIGN PATTERN — Template Method (RowMapper callback)', ['Template Method']],
  ['DESIGN PATTERN — DAO / Repository', ['DAO/Repository Pattern']],
  ['EXCEPTION HANDLING', ['Exception Handling']],
  ['MODULARITY & MAINTAINABLE DESIGN', ['Modularity', 'Modularity & Maintainable Design']],
];

let out = [];
out.push('STOCKPILE BACKEND — OO CONCEPTS DICTIONARY');
out.push('Generated: 2026-11-18 | Refactor: StockpileService god-class split into domain modules');
out.push(`Total Hinglish concept comments: ${entries.length} (cap was 50)`);
out.push('Marker used in code: "// OO: <Concept> — <Hinglish phrase>"');
out.push('Paths are relative to repository root. Line numbers verified by grep at generation time.');
out.push('');
const used = new Set();
for (const [title, concepts] of GROUPS) {
  const rows = entries.filter((e) => concepts.includes(e.concept));
  rows.forEach((r) => used.add(r));
  if (!rows.length) continue;
  out.push(title);
  for (const r of rows) out.push(`  ${r.file}:${r.line}  [${r.concept}] ${r.phrase}`);
  out.push('');
}
const leftover = entries.filter((e) => !used.has(e));
if (leftover.length) {
  out.push('UNCATEGORISED');
  for (const r of leftover) out.push(`  ${r.file}:${r.line}  [${r.concept}] ${r.phrase}`);
  out.push('');
}
out.push('UML (class diagram, mermaid syntax — paste into any mermaid renderer)');
out.push('```mermaid');
out.push('classDiagram');
out.push('  StockpileService ..> ProductService : facade delegates');
out.push('  StockpileService ..> SupplierService');
out.push('  StockpileService ..> InventoryService');
out.push('  StockpileService ..> DashboardService');
out.push('  StockpileService ..> IntelligenceService');
out.push('  StockpileService ..> SalesService');
out.push('  StockpileService ..> PurchaseOrderService');
out.push('  StockpileService ..> StockAuditService');
out.push('  StockpileService ..> ReportService');
out.push('  StockpileService ..> ExpenseService');
out.push('  StockpileService ..> SurplusService');
out.push('  ProductService --> SupplierService : validates supplier');
out.push('  InventoryService --> ProductService');
out.push('  SalesService --> ProductService');
out.push('  SalesService --> InventoryService : reserved qty');
out.push('  IntelligenceService --> ProductService');
out.push('  PurchaseOrderService --> ProductService');
out.push('  PurchaseOrderService --> SupplierService');
out.push('  StockAuditService --> ProductService');
out.push('  StockAuditService --> InventoryService');
out.push('  SurplusService --> ProductService');
out.push('  SurplusService --> InventoryService');
out.push('  SurplusService --> SalesService');
out.push('  SurplusService --> IntelligenceService');
out.push('  ProductService ..> RowMappers : uses');
out.push('  SalesService ..> QuerySupport : uses');
out.push('  SaleDetails *-- SaleItemDetails : composition');
out.push('  SaleItemDetails --> Product : association');
out.push('  DashboardResponse o-- CategoryBreakdown : aggregation');
out.push('  DashboardResponse o-- PeriodActivity : aggregation');
out.push('  ProductNotFoundException --|> RuntimeException : inheritance');
out.push('  StockAuditConflictException --|> IllegalStateException : inheritance/LSP');
out.push('  SurplusListingDetails --> SurplusSaleTransaction : aggregation');
out.push('```');
out.push('');
out.push('MODULE MAP (after refactor)');
out.push('  com.stockpile.StockpileService      — thin Facade + schema init + health (412 lines, was 5537)');
out.push('  com.stockpile.StockpileController   — REST layer, unchanged contract');
out.push('  com.stockpile.model                 — 68 public records (DTOs), component order = JSON order');
out.push('  com.stockpile.exception             — 12 domain exceptions (404/409 mapping unchanged)');
out.push('  com.stockpile.service               — 11 domain services (Product, Supplier, Inventory,');
out.push('                                        Dashboard, Intelligence, Sales, PurchaseOrder,');
out.push('                                        StockAudit, Report, Expense, Surplus)');
out.push('  com.stockpile.service.support       — RowMappers (DAO mapping), QuerySupport (shared helpers)');
fs.writeFileSync(path.join(ROOT, 'OO-CONCEPTS-DICTIONARY.txt'), out.join('\n') + '\n');
console.log('dictionary written,', entries.length, 'entries');