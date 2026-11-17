package com.stockpile.service.support;

import com.stockpile.model.*;
import org.springframework.jdbc.core.RowMapper;

// OO: DAO/Repository Pattern — row-to-object mapping ek jagah centralized; services SQL result ko domain objects ki tarah use karti hain.
public final class RowMappers {

    private RowMappers() {}

    // OO: Template Method — JdbcTemplate ka row-loop fixed algorithm hai; har row ko object mein badalna humara callback decide karta hai (hook).
    public static final RowMapper<Product> PRODUCT = (rs, rowNum) -> new Product(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("sku"),
        rs.getString("category"),
        rs.getLong("purchase_price_paise"),
        rs.getLong("selling_price_paise"),
        rs.getInt("quantity"),
        rs.getInt("min_stock_level"),
        rs.getInt("target_stock_level"),
        rs.getDouble("average_daily_sales"),
        rs.getInt("lead_time_days"),
        rs.getString("created_at"),
        rs.getString("updated_at"),
        QuerySupport.hasColumn(rs, "supplier_id") && rs.getObject("supplier_id") != null ? rs.getLong("supplier_id") : null,
        QuerySupport.hasColumn(rs, "supplier_name") ? rs.getString("supplier_name") : null
    );

    public static final RowMapper<Supplier> SUPPLIER = (rs, rowNum) -> new Supplier(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("contact_person"),
        rs.getString("phone"),
        rs.getString("email"),
        rs.getString("address"),
        rs.getString("notes"),
        rs.getString("created_at"),
        rs.getString("updated_at")
    );

    public static final RowMapper<RecentMovement> MOVEMENT = (rs, rowNum) -> new RecentMovement(
        rs.getLong("movement_id"),
        rs.getLong("product_id"),
        rs.getString("product_name"),
        rs.getString("movement_type"),
        rs.getInt("quantity"),
        rs.getInt("previous_quantity"),
        rs.getInt("new_quantity"),
        rs.getString("reason"),
        rs.getString("created_at")
    );

    // --- Purchase Order Management ---
    public static final RowMapper<PurchaseOrderItemDetails> PO_ITEM = (rs, rowNum) -> {
        int ordered = rs.getInt("quantity_ordered");
        int received = rs.getInt("quantity_received");
        return new PurchaseOrderItemDetails(
            rs.getLong("id"),
            rs.getLong("purchase_order_id"),
            rs.getLong("product_id"),
            rs.getString("product_name_snapshot"),
            rs.getString("sku_snapshot"),
            ordered,
            received,
            Math.max(0, ordered - received),
            rs.getLong("unit_cost_paise"),
            rs.getLong("line_total_paise")
        );
    };

    public static final RowMapper<PurchaseOrderSummary> PO_SUMMARY = (rs, rowNum) -> new PurchaseOrderSummary(
        rs.getLong("id"),
        rs.getLong("id"),
        rs.getLong("supplier_id"),
        rs.getString("supplier_name_snapshot"),
        rs.getString("status"),
        rs.getLong("total_amount_paise"),
        rs.getString("notes"),
        rs.getString("created_at"),
        rs.getString("updated_at"),
        rs.getString("placed_at"),
        rs.getString("received_at"),
        rs.getString("cancelled_at"),
        rs.getInt("item_count"),
        rs.getInt("total_quantity_ordered"),
        rs.getInt("total_quantity_received")
    );
}
