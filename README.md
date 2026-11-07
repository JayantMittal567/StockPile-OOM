# Stockpile — Inventory Management System

**Stockpile** is a simple, lightweight, and visually polished inventory management system designed for small and medium-sized businesses.

Built with an ultra-clean, minimal codebase, Stockpile avoids overengineering, bloated dependencies, and architectural debt while maintaining high visual quality and reliable operational functionality.

---

## 1. Technology Stack

### Backend
- **Java**: 21
- **Framework**: Spring Boot (v3.3.5)
- **Build Tool**: Maven
- **Database Access**: Spring JDBC (`JdbcTemplate`)
- **Database**: SQLite (`stockpile.db`)
- **Testing**: Spring Boot Starter Test

### Frontend
- **Library**: React 18
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS (official Vite integration)
- **HTTP Client**: Axios
- **Data Visualization**: Recharts
- **Icons**: Lucide React

---

## 2. Project Structure

```text
Stockpile/
│
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/stockpile/
│       │   ├── StockpileApplication.java
│       │   ├── StockpileController.java
│       │   └── StockpileService.java
│       │
│       └── resources/
│           ├── application.properties
│           └── schema.sql
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       └── index.css
│
├── README.md
└── .gitignore
```

---

## 3. Database Schema

All database operations use **SQLite** with tables initialized on application startup via `schema.sql`.

### Key Design Highlights
- **Currency Storage**: All monetary values (`purchase_price_paise`, `selling_price_paise`) are stored as **integer paise** (₹1 = 100 paise) to prevent floating-point calculation and rounding errors.
- **Relational Integrity**: Foreign key constraints enforce relationships with cascading deletes.
- **Audit Tracking**: Stock adjustments and history are captured in `stock_movements` with delta tracking (`previous_quantity` &rarr; `new_quantity`).

### Tables

#### `products`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `name` | `TEXT` | `NOT NULL` |
| `sku` | `TEXT` | `NOT NULL`, `UNIQUE` |
| `category` | `TEXT` | `NOT NULL` |
| `purchase_price_paise` | `INTEGER` | `NOT NULL`, `>= 0` |
| `selling_price_paise` | `INTEGER` | `NOT NULL`, `>= 0` |
| `quantity` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `>= 0` |
| `min_stock_level` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `>= 0` |
| `target_stock_level` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `>= 0` |
| `average_daily_sales` | `REAL` | `NOT NULL`, `DEFAULT 0.0`, `>= 0.0` |
| `lead_time_days` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `>= 0` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

*Indexes: `idx_products_sku`, `idx_products_category`*

#### `stock_movements`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `product_id` | `INTEGER` | Foreign Key (`products.id`), `ON DELETE CASCADE` |
| `movement_type` | `TEXT` | `CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT'))` |
| `quantity` | `INTEGER` | `NOT NULL`, `> 0` |
| `previous_quantity` | `INTEGER` | `NOT NULL`, `>= 0` |
| `new_quantity` | `INTEGER` | `NOT NULL`, `>= 0` |
| `reason` | `TEXT` | Optional adjustment notes |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

*Indexes: `idx_stock_movements_product_id`, `idx_stock_movements_created_at`*

#### `sales`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `subtotal_paise` | `INTEGER` | `NOT NULL`, `>= 0` |
| `discount_paise` | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `>= 0` |
| `total_paise` | `INTEGER` | `NOT NULL`, `>= 0` |
| `total_cost_paise` | `INTEGER` | `NOT NULL`, `>= 0` |
| `gross_profit_paise` | `INTEGER` | `NOT NULL` (supports loss scenarios) |
| `payment_method` | `TEXT` | `CHECK (payment_method IN ('CASH', 'UPI', 'CARD', 'OTHER'))` |
| `status` | `TEXT` | `DEFAULT 'COMPLETED'`, `CHECK (status IN ('COMPLETED', 'CANCELLED'))` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| `cancelled_at` | `TIMESTAMP` | Optional cancellation timestamp |

*Indexes: `idx_sales_created_at`, `idx_sales_status`*

#### `sale_items`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `sale_id` | `INTEGER` | Foreign Key (`sales.id`), `ON DELETE CASCADE` |
| `product_id` | `INTEGER` | Foreign Key (`products.id`) |
| `product_name_snapshot` | `TEXT` | `NOT NULL` (historical snapshot) |
| `sku_snapshot` | `TEXT` | `NOT NULL` (historical snapshot) |
| `quantity` | `INTEGER` | `NOT NULL`, `> 0` |
| `unit_selling_price_paise`| `INTEGER` | `NOT NULL`, `>= 0` (historical snapshot) |
| `unit_purchase_price_paise`| `INTEGER` | `NOT NULL`, `>= 0` (historical snapshot) |
| `line_total_paise` | `INTEGER` | `NOT NULL`, `>= 0` |
| `line_cost_paise` | `INTEGER` | `NOT NULL`, `>= 0` |

*Indexes: `idx_sale_items_sale_id`, `idx_sale_items_product_id`*

#### `suppliers`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `name` | `TEXT` | `NOT NULL` (validated non-empty) |
| `contact_person` | `TEXT` | Optional contact person name |
| `phone` | `TEXT` | Optional phone number (validated 7-15 digits, flexible formats) |
| `email` | `TEXT` | Optional contact email (validated RFC-compliant email) |
| `address` | `TEXT` | Optional physical / mailing address |
| `notes` | `TEXT` | Optional notes |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

*Indexes: `idx_suppliers_name`*

#### `product_suppliers`
| Column | Type | Constraints / Description |
|---|---|---|
| `product_id` | `INTEGER` | Primary Key, Foreign Key (`products.id`), `ON DELETE CASCADE` |
| `supplier_id` | `INTEGER` | `NOT NULL`, Foreign Key (`suppliers.id`) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

*Indexes: `idx_product_suppliers_supplier_id`*
*(Design: Each product has at most 1 preferred supplier; 1 supplier can supply multiple products).*

#### `purchase_orders`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `supplier_id` | `INTEGER` | `NOT NULL`, Foreign Key (`suppliers.id`) |
| `supplier_name_snapshot` | `TEXT` | `NOT NULL` (historical snapshot of supplier name) |
| `status` | `TEXT` | `NOT NULL DEFAULT 'DRAFT'`, `CHECK (status IN ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'))` |
| `total_amount_paise` | `INTEGER` | `NOT NULL`, `>= 0` (computed sum of line items in paise) |
| `notes` | `TEXT` | Optional notes / memo |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| `placed_at` | `TIMESTAMP` | Timestamp when order transitions from DRAFT to ORDERED |
| `received_at` | `TIMESTAMP` | Timestamp when order is completely received (RECEIVED) |
| `cancelled_at` | `TIMESTAMP` | Timestamp when order is cancelled |
| `cancellation_reason` | `TEXT` | Reason recorded upon cancellation |

*Indexes: `idx_po_supplier_id`, `idx_po_status`, `idx_po_created_at`*

#### `purchase_order_items`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `purchase_order_id` | `INTEGER` | `NOT NULL`, Foreign Key (`purchase_orders.id`), `ON DELETE CASCADE` |
| `product_id` | `INTEGER` | `NOT NULL`, Foreign Key (`products.id`) |
| `product_name_snapshot` | `TEXT` | `NOT NULL` (historical snapshot of product name) |
| `sku_snapshot` | `TEXT` | `NOT NULL` (historical snapshot of SKU) |
| `quantity_ordered` | `INTEGER` | `NOT NULL`, `> 0` |
| `quantity_received` | `INTEGER` | `NOT NULL DEFAULT 0`, `>= 0` |
| `unit_cost_paise` | `INTEGER` | `NOT NULL`, `>= 0` (point-in-time unit cost) |
| `line_total_paise` | `INTEGER` | `NOT NULL`, `>= 0` (`quantity_ordered * unit_cost_paise`) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

*Indexes: `idx_po_items_po_id`, `idx_po_items_product_id`*

---

## 4. API Endpoints Reference

### A. Health & System
- `GET /api/health` — Returns SQLite connectivity and table counts.

### B. Product CRUD
- `GET /api/products` — Retrieve all products. Query parameters: `search` (name or SKU) and `category`.
- `GET /api/products/{id}` — Retrieve single product by ID (404 if not found).
- `POST /api/products` — Register a new product with money stored in paise. If `quantity > 0`, records an opening stock movement.
- `PUT /api/products/{id}` — Update product attributes (SKU, name, category, prices, thresholds, ADS, lead time). Does not alter `quantity`.
- `DELETE /api/products/{id}` — Safe product deletion. Rejects with 409 Conflict if stock movement history, sales records, or purchase orders exist for the product.

### C. Inventory Operations & Ledger
- `POST /api/inventory/stock-in` — Receive stock (`{ productId, quantity, reason }`).
- `POST /api/inventory/stock-out` — Dispatch stock (`{ productId, quantity, reason }`). Rejects if insufficient stock.
- `POST /api/inventory/adjust` — Physical count reconciliation (`{ productId, quantity, reason }`).
- `GET /api/movements` — Chronological movement ledger. Query parameters: `productId`, `movementType`.

### D. Dashboard & Analytics
- `GET /api/dashboard` — Returns summary KPIs (`totalProducts`, `totalQuantity`, `inventoryValuePaise`, `lowStockCount`, `outOfStockCount`), `categoryBreakdown`, and recent 5 movements.

### E. Inventory Intelligence
- `GET /api/intelligence` — Deterministic replenishment calculations:
  - $\text{Reorder Point} = (\text{Average Daily Sales} \times \text{Lead Time Days}) + \text{min\_stock\_level}$
  - $\text{Reorder Quantity} = \max(0, \text{Target Stock} - \text{Current Stock})$
  - $\text{Surplus Quantity} = \max(0, \text{Current Stock} - \text{Target Stock})$
  - Prioritized statuses: `OUT_OF_STOCK`, `LOW_STOCK`, `OVERSTOCKED`, `HEALTHY`.
- `GET /api/intelligence/sales` — Sales-based inventory intelligence calculated from actual completed sales history:
  - **Summary**: `totalProducts`, `fastSellingProducts` (top products ranked by 30-day unit sales), `slowMovingProducts`, `potentialDeadStockProducts`, `noSalesHistoryProducts`, `outOfStockProducts`, and `productsNeedingRestock`.
  - **Product Metrics**: `productId`, `productName`, `sku`, `category`, `currentQuantity`, `lowStockLevel`, `preferredStockLevel`, `unitsSoldLast30Days`, `unitsSoldPrevious30Days`, `averageDailySalesLast30Days`, `lastSoldAt`, `daysSinceLastSale`.
  - **Operational Classifications** (strict priority): `OUT_OF_STOCK`, `NO_SALES_HISTORY`, `POTENTIAL_DEAD_STOCK` (>45 days since sale), `SLOW_MOVING` (>30 days since sale), `ACTIVE` (<=30 days since sale).
  - **Sales Trends**: `INCREASING` (>+10%), `DECREASING` (<-10%), `STABLE`, `NEW_SALES`, `NO_RECENT_SALES`, `INSUFFICIENT_DATA`.
  - **Restock Recommendations**: $\text{Recommended Restock Quantity} = \max(0, \text{Preferred Stock Level} - \text{Current Quantity})$ when current quantity $\le$ low-stock level. Clearly flags unconfigured preferred stock level.
  - Excludes cancelled sales and runs in a single aggregated SQL query without N+1 overhead.

### F. Sales Management
- `POST /api/sales` — Atomically records a sale (`{ items, discountPaise, paymentMethod }`), stores point-in-time price and cost snapshots, conditionally deducts stock, and creates `OUT` movements.
- `GET /api/sales` — Retrieves sales ordered newest first (`LIMIT 50`). Supports `?status=COMPLETED` or `?status=CANCELLED`.
- `GET /api/sales/{id}` — Returns complete sale accounting (subtotal, discount, total, purchase cost, gross profit) and line items with snapshots.
- `POST /api/sales/{id}/cancel` — Atomically cancels a sale (`{ reason }`), restores inventory levels, and creates `IN` movements (rejects already-cancelled sales with 409 Conflict).

### G. Supplier Management & Preferred Supplier Links
- `GET /api/suppliers` — Retrieve all suppliers with optional search parameter `?search=term` (searches name, phone, email case-insensitively).
- `GET /api/suppliers/{id}` — Retrieve supplier details (404 if not found).
- `POST /api/suppliers` — Create a new supplier (`{ name, contactPerson, phone, email, address, notes }`). Validates non-empty name, email format, and phone format.
- `PUT /api/suppliers/{id}` — Update supplier information (404 if not found).
- `DELETE /api/suppliers/{id}` — Safe supplier deletion. Blocks deletion with 409 Conflict if products or purchase orders are associated.
- `PUT /api/products/{productId}/supplier` — Assign or replace preferred supplier for a product (`{ supplierId }`). Validates both product and supplier exist.
- `DELETE /api/products/{productId}/supplier` — Unlink preferred supplier from product without deleting product or affecting stock.
- `GET /api/suppliers/{id}/products` — Retrieve all products associated with a supplier with full details (quantity, prices, thresholds).
- **Product Integration**: Product responses (`GET /api/products`, `GET /api/products/{id}`, `POST /api/products`, `PUT /api/products/{id}`) seamlessly include `supplierId` and `supplierName` (null when unassociated) via non-breaking LEFT JOINs.

### H. Purchase Order Management
- `POST /api/purchase-orders` — Create a draft purchase order (`{ supplierId, notes, items: [{ productId, quantity, unitCostPaise }] }`). Automatically computes line totals and captures supplier and product snapshot values. Does not affect inventory stock.
- `GET /api/purchase-orders` — List purchase orders ordered newest first. Supports query filters `?status=...` and `?supplierId=...`.
- `GET /api/purchase-orders/{id}` — Retrieve full purchase order details, order timestamps, and item snapshots (`quantityOrdered`, `quantityReceived`, `remainingQuantity`, `unitCostPaise`, `lineTotalPaise`).
- `PUT /api/purchase-orders/{id}` — Modify a draft purchase order. Restricted exclusively to orders in `DRAFT` status; recalculates line totals and total order amount.
- `POST /api/purchase-orders/{id}/place` — Place the order, transitioning status from `DRAFT` to `ORDERED` and stamping `placed_at`. Stock remains unchanged until goods are received.
- `POST /api/purchase-orders/{id}/receive` — Receive incoming goods against the order (`{ items: [{ purchaseOrderItemId, quantity }] }`).
  - Supports partial receiving: transitions order to `PARTIALLY_RECEIVED` or `RECEIVED` (when all ordered items are fully fulfilled).
  - Atomically increases product inventory stock and records `IN` audit entries in `stock_movements` referencing the PO ID.
  - Rejects over-receiving beyond outstanding quantities with atomic rollback.
  - Automatically records `received_at` timestamp upon full order fulfillment.
- `POST /api/purchase-orders/{id}/cancel` — Cancel a purchase order (`{ reason }`). Allowed for `DRAFT`, `ORDERED`, or `PARTIALLY_RECEIVED` orders (partially received inventory is preserved; unreceived quantities are cancelled).
- **Deletion Protection**: Products referenced by purchase order items cannot be deleted (`409 Conflict`). Suppliers referenced by purchase orders cannot be deleted (`409 Conflict`).

---

## 5. Getting Started & Local Execution

### Prerequisites
- Java 21 JDK installed
- Maven 3.9+
- Node.js 18+ and npm

### A. Run Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Build the backend:
   ```bash
   mvn clean package -DskipTests
   ```
3. Run the Spring Boot application:
   ```bash
   java -jar target/stockpile-backend-0.0.1-SNAPSHOT.jar
   ```
   *The backend starts on port 8080 and automatically initializes `stockpile.db`.*

### B. Run Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open http://localhost:5173 to access the Stockpile UI.*

4. Build frontend for production:
   ```bash
   npm run build
   ```

---

## 6. UI Navigation & Mobile-First Features

1. **Dashboard**: Action-oriented everyday quick actions bar (`Receive Stock`, `Record Sale`, `Adjust Stock`, `Add Product`), 4 focused KPI cards, category stock distribution with Recharts, actionable restock alerts with 1-click reorder, and real-time activity ledger.
2. **Inventory**: Full product catalog, real-time search & category filter, simplified Add/Edit modals (with auto-generated SKU suggestions, category chips, and collapsed advanced thresholds), and safe product deletion protection.
3. **Stock Movements**: Fast everyday operations (Receive Stock, Record Customer Sale, and Stock Count Reconciliation) with touch-friendly quantity steppers (`[-] / [+]`), quick presets, predefined reason dropdowns, live stock impact calculations, and chronological audit trail.
4. **Insights**: Actionable intelligence table & mobile card view displaying reorder points, suggested reorder amounts, surplus indicators, and 1-click reorder actions.
5. **Responsive & Mobile Adaptations**: Seamless layout across 360px, 390px, 768px, 1024px, and 1440px with off-canvas mobile drawer, bottom thumb-navigation bar, mobile-first card views for tables, and sticky modal submit actions.
