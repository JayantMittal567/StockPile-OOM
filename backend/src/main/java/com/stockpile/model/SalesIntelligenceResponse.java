package com.stockpile.model;

import java.util.List;

public record SalesIntelligenceResponse(
    SalesIntelligenceSummary summary,
    List<ProductSalesIntelligence> products
) {}
