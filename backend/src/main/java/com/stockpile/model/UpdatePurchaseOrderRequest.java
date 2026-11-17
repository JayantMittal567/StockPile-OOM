package com.stockpile.model;

import java.util.List;

public record UpdatePurchaseOrderRequest(
    Long supplierId,
    String notes,
    List<CreatePurchaseOrderItemRequest> items
) {}
