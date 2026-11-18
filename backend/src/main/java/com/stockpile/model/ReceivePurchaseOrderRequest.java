package com.stockpile.model;

import java.util.List;

public record ReceivePurchaseOrderRequest(
    List<ReceivePurchaseOrderItemRequest> items
) {}
