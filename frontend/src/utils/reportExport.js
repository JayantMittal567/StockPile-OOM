import { formatDateTime } from './formatters';

/**
 * Exports financial and business reports to an RFC 4180 compliant CSV file
 * with UTF-8 BOM for Microsoft Excel compatibility.
 */
export function exportReportToCSV({
  summaryReport,
  pnlReport,
  salesReport,
  lossReport,
  purchasesReport,
  expensesList = [],
  reportPeriod = 'MONTHLY'
}) {
  if (!summaryReport && !pnlReport) {
    throw new Error('No report data available to export.');
  }

  const rows = [];
  rows.push(['STOCKPILE FINANCIAL & BUSINESS REPORT']);
  rows.push(['Generated At', new Date().toISOString()]);
  rows.push(['Period Type', summaryReport?.periodType || reportPeriod]);
  rows.push(['From Date', summaryReport?.from || '']);
  rows.push(['To Date', summaryReport?.to || '']);
  rows.push(['Currency', summaryReport?.currency || 'INR']);
  rows.push([]);

  // 1. Executive Financial Summary
  rows.push(['1. EXECUTIVE FINANCIAL SUMMARY']);
  rows.push(['Metric', 'Amount (INR)', 'Paise']);
  rows.push(['Gross Sales', ((summaryReport?.grossSalesPaise || 0) / 100).toFixed(2), summaryReport?.grossSalesPaise || 0]);
  rows.push(['Discounts', ((summaryReport?.discountsPaise || 0) / 100).toFixed(2), summaryReport?.discountsPaise || 0]);
  rows.push(['Net Revenue', ((summaryReport?.netRevenuePaise || 0) / 100).toFixed(2), summaryReport?.netRevenuePaise || 0]);
  rows.push(['Cost of Goods Sold (COGS)', ((summaryReport?.cogsPaise || 0) / 100).toFixed(2), summaryReport?.cogsPaise || 0]);
  rows.push(['Gross Profit', ((summaryReport?.grossProfitPaise || 0) / 100).toFixed(2), summaryReport?.grossProfitPaise || 0]);
  rows.push(['Gross Margin %', `${Number(pnlReport?.grossMarginPercentage || 0).toFixed(2)}%`, '']);
  rows.push(['Total Inventory Loss', ((summaryReport?.inventoryLossPaise || 0) / 100).toFixed(2), summaryReport?.inventoryLossPaise || 0]);
  rows.push(['Operating Expenses', ((summaryReport?.operatingExpensesPaise || 0) / 100).toFixed(2), summaryReport?.operatingExpensesPaise || 0]);
  rows.push(['Operating Result Before Tax', ((summaryReport?.operatingResultPaise || 0) / 100).toFixed(2), summaryReport?.operatingResultPaise || 0]);
  rows.push(['Net Margin %', `${Number(pnlReport?.netMarginPercentage || 0).toFixed(2)}%`, '']);
  rows.push(['Total Purchases (Procurement)', ((summaryReport?.totalPurchasesPaise || 0) / 100).toFixed(2), summaryReport?.totalPurchasesPaise || 0]);
  rows.push(['Purchase Orders Count', summaryReport?.purchaseOrdersCount || 0, '']);
  rows.push(['Completed Sales Orders', summaryReport?.completedSalesCount || 0, '']);
  rows.push(['Total Items Sold', summaryReport?.unitsSold || 0, '']);
  rows.push([]);

  // 2. Period Breakdown
  rows.push(['2. PERIOD BREAKDOWN']);
  rows.push([
    'Period',
    'Gross Sales (INR)',
    'Discounts (INR)',
    'Net Revenue (INR)',
    'COGS (INR)',
    'Gross Profit (INR)',
    'Loss (INR)',
    'Expenses (INR)',
    'Operating Result (INR)',
    'Sales Count',
    'Units Sold'
  ]);
  (summaryReport?.breakdown || []).forEach((b) => {
    rows.push([
      b.period || '',
      ((b.grossSalesPaise || 0) / 100).toFixed(2),
      ((b.discountsPaise || 0) / 100).toFixed(2),
      ((b.netRevenuePaise || 0) / 100).toFixed(2),
      ((b.cogsPaise || 0) / 100).toFixed(2),
      ((b.grossProfitPaise || 0) / 100).toFixed(2),
      ((b.inventoryLossPaise || 0) / 100).toFixed(2),
      ((b.operatingExpensesPaise || 0) / 100).toFixed(2),
      ((b.operatingResultPaise || 0) / 100).toFixed(2),
      b.salesCount ?? 0,
      b.unitsSold ?? 0
    ]);
  });
  rows.push([]);

  // 3. Top Selling Products
  if (salesReport?.topSellingProducts?.length) {
    rows.push(['3. TOP SELLING PRODUCTS']);
    rows.push(['Product Name', 'SKU', 'Category', 'Units Sold', 'Revenue (INR)', 'COGS (INR)', 'Gross Profit (INR)']);
    salesReport.topSellingProducts.forEach((tp) => {
      rows.push([
        tp.productName || '',
        tp.sku || '',
        tp.category || '',
        tp.unitsSold ?? 0,
        ((tp.totalRevenuePaise || 0) / 100).toFixed(2),
        ((tp.totalCostPaise || 0) / 100).toFixed(2),
        ((tp.grossProfitPaise || 0) / 100).toFixed(2)
      ]);
    });
    rows.push([]);
  }

  // 4. Inventory Loss Incidents
  if (lossReport?.incidents?.length) {
    rows.push(['4. INVENTORY LOSS INCIDENTS']);
    rows.push(['Movement ID', 'Product Name', 'SKU', 'Units Lost', 'Unit Cost (INR)', 'Total Loss (INR)', 'Reason', 'Created At']);
    lossReport.incidents.forEach((inc) => {
      rows.push([
        inc.movementId || '',
        inc.productName || '',
        inc.sku || '',
        inc.unitsLost ?? 0,
        ((inc.unitCostPaise || 0) / 100).toFixed(2),
        ((inc.totalLossPaise || 0) / 100).toFixed(2),
        inc.reason || '',
        formatDateTime(inc.createdAt)
      ]);
    });
    rows.push([]);
  }

  // 5. Purchasing Orders
  if (purchasesReport?.orders?.length) {
    rows.push(['5. PURCHASING ORDERS']);
    rows.push(['Order ID', 'Supplier', 'Status', 'Total Amount (INR)', 'Items', 'Ordered Qty', 'Received Qty', 'Created At']);
    purchasesReport.orders.forEach((po) => {
      rows.push([
        po.id || '',
        po.supplierName || '',
        po.status || '',
        ((po.totalAmountPaise || 0) / 100).toFixed(2),
        po.itemCount ?? 0,
        po.totalQuantityOrdered ?? 0,
        po.totalQuantityReceived ?? 0,
        formatDateTime(po.createdAt)
      ]);
    });
    rows.push([]);
  }

  // 6. Operating Expenses
  if (expensesList?.length) {
    rows.push(['6. OPERATING EXPENSES']);
    rows.push(['Expense ID', 'Category', 'Description', 'Amount (INR)', 'Expense Date', 'Recorded At']);
    expensesList.forEach((exp) => {
      rows.push([
        exp.id || '',
        exp.category || '',
        exp.description || '',
        ((exp.amountPaise || 0) / 100).toFixed(2),
        (exp.createdAt || '').slice(0, 10),
        formatDateTime(exp.createdAt)
      ]);
    });
    rows.push([]);
  }

  // Normalize rows with padding and RFC 4180 escaping
  const maxCols = Math.max(...rows.map((r) => r.length), 1);
  const normalizedRows = rows.map((row) => {
    const padding = maxCols - row.length;
    const fullRow = padding > 0 ? [...row, ...Array(padding).fill('')] : row;
    return fullRow
      .map((val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = normalizedRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const periodLabel = (summaryReport?.periodType || reportPeriod).toLowerCase();
  const fromStr = summaryReport?.from || 'start';
  const toStr = summaryReport?.to || 'end';
  link.setAttribute('download', `stockpile-financial-report-${periodLabel}-${fromStr}-to-${toStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
