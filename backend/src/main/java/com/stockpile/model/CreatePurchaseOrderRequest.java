package com.stockpile.model;

import java.util.List;

public record CreatePurchaseOrderRequest(
    Long supplierId,
    String notes,
    List<CreatePurchaseOrderItemRequest> items
) {}
