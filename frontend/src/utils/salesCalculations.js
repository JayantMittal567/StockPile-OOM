// Sales POS cart calculations and product filtering helpers

export function computeCartCalculations(saleCart, products = [], saleDiscountPercent = 0) {
  let subtotalPaise = 0;
  let estimatedCogsPaise = 0;
  let hasBelowCostItem = false;
  let anyPriceEdited = false;

  const items = saleCart.map((row) => {
    const prod = products.find((p) => p.id === Number(row.productId));
    const masterSellingPaise = prod ? prod.sellingPricePaise : 0;
    const masterCostPaise = prod ? prod.purchasePricePaise : 0;
    const qty = parseInt(row.quantity, 10) || 0;

    let unitSellingPaise = masterSellingPaise;
    let isCustomPrice = false;
    if (row.customPriceRupees !== null && row.customPriceRupees !== undefined && row.customPriceRupees !== '') {
      const parsed = parseFloat(row.customPriceRupees);
      if (!isNaN(parsed) && parsed >= 0) {
        unitSellingPaise = Math.round(parsed * 100);
        isCustomPrice = true;
      }
    }

    if (isCustomPrice && unitSellingPaise !== masterSellingPaise) {
      anyPriceEdited = true;
    }

    const lineTotal = qty * unitSellingPaise;
    const lineCost = qty * masterCostPaise;
    const isBelowCost = prod ? unitSellingPaise < masterCostPaise : false;
    if (isBelowCost) hasBelowCostItem = true;

    const unitLossPaise = isBelowCost ? (masterCostPaise - unitSellingPaise) : 0;
    const lineLossPaise = qty * unitLossPaise;

    subtotalPaise += lineTotal;
    estimatedCogsPaise += lineCost;

    return {
      ...row,
      product: prod,
      masterSellingPricePaise: masterSellingPaise,
      masterPurchasePricePaise: masterCostPaise,
      unitSellingPricePaise: unitSellingPaise,
      lineTotalPaise: lineTotal,
      lineCostPaise: lineCost,
      isPriceEdited: isCustomPrice && unitSellingPaise !== masterSellingPaise,
      isBelowCost,
      unitLossPaise,
      lineLossPaise,
      availableStock: prod ? prod.quantity : 0,
      isStockExceeded: prod ? qty > prod.quantity : false
    };
  });

  const parsedPercent = parseFloat(saleDiscountPercent);
  const discountPercentNum = (!isNaN(parsedPercent) && parsedPercent >= 0) ? Math.min(100, Math.round(parsedPercent * 100) / 100) : 0;
  const discountPaise = Math.round((subtotalPaise * discountPercentNum) / 100);
  const finalTotalPaise = Math.max(0, subtotalPaise - discountPaise);
  const estimatedGrossProfitPaise = finalTotalPaise - estimatedCogsPaise;

  return {
    items,
    subtotalPaise,
    discountPercent: discountPercentNum,
    discountPaise,
    finalTotalPaise,
    estimatedCogsPaise,
    estimatedGrossProfitPaise,
    hasBelowCostItem,
    anyPriceEdited,
    isNegativeProfit: estimatedGrossProfitPaise < 0,
    hasStockExceededItem: items.some((i) => i.isStockExceeded)
  };
}

export function filterSearchProducts(products = [], query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products
    .filter((p) => (p.name && p.name.toLowerCase().includes(q)) || (p.sku && p.sku.toLowerCase().includes(q)))
    .slice(0, 8);
}
