import { useState, useEffect, useMemo, useRef } from 'react';
import {
  getHealth,
  getDashboard,
  getProducts,
  getMovements,
  getIntelligence,
  getSalesIntelligence,
  getSales,
  getSalesMetricsSummary,
  getDailySalesTrend,
  getSuppliers,
  getPurchaseOrders,
  getStockAudits,
  getStockAuditSummary,
  getStockAuditById,
  getFinancialSummaryReport,
  getProfitLossReport,
  getSalesReport,
  getInventoryLossReport,
  getPurchasesReport,
  getExpenses,
  getSurplusSuggestions,
  getSurplusSummary,
  getSurplusListings
} from '../api';
import { formatPaise, getKolkataToday, formatDateTime } from '../utils/formatters';

export function useInventoryData({
  activeTab,
  overviewPeriod,
  overviewCustomFrom,
  overviewCustomTo,
  stockControlSubTab,
  triggerAlert
}) {
  // Engine Health
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Dashboard
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const productSearchAbortRef = useRef(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(20);

  // Movements
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementProductFilter, setMovementProductFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [movementDateFrom, setMovementDateFrom] = useState('');
  const [movementDateTo, setMovementDateTo] = useState('');
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPageSize, setMovementsPageSize] = useState(20);

  // Suppliers
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  // Sales
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesStatusFilter, setSalesStatusFilter] = useState('ALL');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(20);
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);

  // Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poSupplierFilter, setPoSupplierFilter] = useState('');
  const [poDateFrom, setPoDateFrom] = useState('');
  const [poDateTo, setPoDateTo] = useState('');
  const [poPage, setPoPage] = useState(1);
  const [poPageSize, setPoPageSize] = useState(20);

  // Intelligence
  const [salesIntelligence, setSalesIntelligence] = useState(null);
  const [, setLegacyIntelligence] = useState([]);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [intelFilter, setIntelFilter] = useState('ALL');

  // Audits
  const [audits, setAudits] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditsPage, setAuditsPage] = useState(1);
  const [auditsPageSize, setAuditsPageSize] = useState(20);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loadingSelectedAudit, setLoadingSelectedAudit] = useState(false);
  const [auditItemSearch, setAuditItemSearch] = useState('');
  const [auditItemFilter, setAuditItemFilter] = useState('ALL');

  // Reports & Expenses
  const [reportPeriod, setReportPeriod] = useState('MONTHLY');
  const [reportDate, setReportDate] = useState(() => getKolkataToday());
  const [reportMonth, setReportMonth] = useState(() => {
    try {
      return parseInt(getKolkataToday().split('-')[1], 10);
    } catch {
      return new Date().getMonth() + 1;
    }
  });
  const [reportYear, setReportYear] = useState(() => {
    try {
      return parseInt(getKolkataToday().split('-')[0], 10);
    } catch {
      return new Date().getFullYear();
    }
  });
  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    } catch {
      return d.toISOString().split('T')[0];
    }
  });
  const [reportTo, setReportTo] = useState(() => getKolkataToday());
  const [reportSubTab, setReportSubTab] = useState('overview');
  const [summaryReport, setSummaryReport] = useState(null);
  const [pnlReport, setPnlReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [lossReport, setLossReport] = useState(null);
  const [purchasesReport, setPurchasesReport] = useState(null);
  const [expensesList, setExpensesList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [expenseDateFrom, setExpenseDateFrom] = useState('');
  const [expenseDateTo, setExpenseDateTo] = useState('');
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesPageSize, setExpensesPageSize] = useState(20);

  // Surplus
  const [surplusSubTab, setSurplusSubTab] = useState('suggestions');
  const [surplusSummary, setSurplusSummary] = useState(null);
  const [surplusSuggestions, setSurplusSuggestions] = useState([]);
  const [surplusListings, setSurplusListings] = useState([]);
  const [surplusStatusFilter, setSurplusStatusFilter] = useState('');
  const [surplusSearch, setSurplusSearch] = useState('');
  const [surplusCategoryFilter, setSurplusCategoryFilter] = useState('ALL');
  const [loadingSurplus, setLoadingSurplus] = useState(false);
  const [surplusError, setSurplusError] = useState('');

  // Fetch Functions
  const fetchHealthData = async () => {
    setLoadingHealth(true);
    try {
      const data = await getHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'OFFLINE', tableCounts: {} });
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchDashboardData = async (
    period = overviewPeriod,
    from = overviewCustomFrom,
    to = overviewCustomTo
  ) => {
    setLoadingDashboard(true);
    try {
      const params = { period };
      if (period === 'CUSTOM') {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      const data = await getDashboard(params);
      setDashboard(data);
    } catch (err) {
      triggerAlert('error', 'Failed to load dashboard: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchProductsData = async (search = searchQuery, category = categoryFilter) => {
    if (productSearchAbortRef.current) {
      productSearchAbortRef.current.abort();
    }
    const controller = new AbortController();
    productSearchAbortRef.current = controller;
    setLoadingProducts(true);
    try {
      const data = await getProducts(search, category, { signal: controller.signal });
      setProducts(data || []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      triggerAlert('error', 'Failed to load products: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSuppliersData = async (search = supplierSearch) => {
    setLoadingSuppliers(true);
    try {
      const data = await getSuppliers(search);
      setSuppliers(data || []);
    } catch (err) {
      triggerAlert('error', 'Failed to load suppliers: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchSalesData = async (status = salesStatusFilter) => {
    setLoadingSales(true);
    try {
      const st = status === 'ALL' ? '' : status;
      const data = await getSales(st);
      setSales(data || []);
    } catch (err) {
      triggerAlert('error', 'Failed to load sales: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchSalesMetricsData = async () => {
    try {
      const data = await getSalesMetricsSummary();
      setSalesMetrics(data);
    } catch {}
  };

  const fetchSalesTrendData = async () => {
    try {
      const data = await getDailySalesTrend();
      setSalesTrend(data || []);
    } catch {}
  };

  const fetchPurchaseOrdersData = async (
    status = poStatusFilter,
    supplierId = poSupplierFilter
  ) => {
    setLoadingPurchaseOrders(true);
    try {
      const st = status === 'ALL' ? '' : status;
      const data = await getPurchaseOrders(st, supplierId || null);
      setPurchaseOrders(data || []);
    } catch (err) {
      triggerAlert('error', 'Failed to load purchase orders: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPurchaseOrders(false);
    }
  };

  const fetchMovementsData = async (
    productId = movementProductFilter,
    movementType = movementTypeFilter
  ) => {
    setLoadingMovements(true);
    try {
      const data = await getMovements(productId || null, movementType);
      setMovements(data || []);
    } catch (err) {
      triggerAlert('error', 'Failed to load stock movements: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingMovements(false);
    }
  };

  const fetchIntelligenceData = async () => {
    setLoadingIntelligence(true);
    try {
      const [salesIntel, legIntel] = await Promise.allSettled([
        getSalesIntelligence(),
        getIntelligence()
      ]);
      if (salesIntel.status === 'fulfilled') setSalesIntelligence(salesIntel.value);
      if (legIntel.status === 'fulfilled') setLegacyIntelligence(legIntel.value || []);
    } catch (err) {
      triggerAlert('error', 'Failed to load insights: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingIntelligence(false);
    }
  };

  const fetchSurplusData = async () => {
    setLoadingSurplus(true);
    setSurplusError('');
    try {
      const [summaryRes, suggestionsRes, listingsRes] = await Promise.all([
        getSurplusSummary(),
        getSurplusSuggestions(),
        getSurplusListings(surplusStatusFilter ? { status: surplusStatusFilter } : {})
      ]);
      setSurplusSummary(summaryRes);
      setSurplusSuggestions(suggestionsRes || []);
      setSurplusListings(listingsRes || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load surplus data.';
      setSurplusError(msg);
      triggerAlert('error', msg);
    } finally {
      setLoadingSurplus(false);
    }
  };

  const fetchSurplusListingsOnly = async (status = surplusStatusFilter) => {
    try {
      const listingsRes = await getSurplusListings(status ? { status } : {});
      setSurplusListings(listingsRes || []);
    } catch (err) {
      console.error('Failed to filter listings:', err);
    }
  };

  const fetchAuditsData = async () => {
    setLoadingAudits(true);
    try {
      const [data, sum] = await Promise.all([
        getStockAudits(),
        getStockAuditSummary().catch(() => null)
      ]);
      setAudits(data || []);
      if (sum) setAuditSummary(sum);
    } catch (err) {
      triggerAlert('error', 'Failed to load stock audits: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAudits(false);
    }
  };

  const fetchSelectedAuditDetail = async (id = selectedAuditId) => {
    if (!id) return;
    setLoadingSelectedAudit(true);
    try {
      const data = await getStockAuditById(id);
      setSelectedAudit(data);
    } catch (err) {
      triggerAlert('error', 'Failed to load audit details: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingSelectedAudit(false);
    }
  };

  const fetchAllReportData = async () => {
    if (reportPeriod === 'CUSTOM' && reportFrom && reportTo && reportFrom > reportTo) {
      setReportsError(`Start date (${reportFrom}) cannot be after end date (${reportTo}).`);
      return;
    }
    setLoadingReports(true);
    setReportsError('');
    const params = { period: reportPeriod };
    if (reportPeriod === 'DAILY') params.date = reportDate;
    else if (reportPeriod === 'MONTHLY') {
      params.month = Number(reportMonth);
      params.year = Number(reportYear);
    } else if (reportPeriod === 'YEARLY') params.year = Number(reportYear);
    else if (reportPeriod === 'CUSTOM') {
      params.from = reportFrom;
      params.to = reportTo;
    }

    try {
      const [sumRes, pnlRes, salesRes, lossRes, poRes, expRes] = await Promise.all([
        getFinancialSummaryReport(params),
        getProfitLossReport(params),
        getSalesReport(params),
        getInventoryLossReport(params),
        getPurchasesReport(params),
        getExpenses()
      ]);
      setSummaryReport(sumRes);
      setPnlReport(pnlRes);
      setSalesReport(salesRes);
      setLossReport(lossRes);
      setPurchasesReport(poRes);
      setExpensesList(expRes || []);
    } catch (err) {
      setReportsError(err.response?.data?.error || err.message || 'Failed to load report data');
    } finally {
      setLoadingReports(false);
    }
  };

  // Attention Items
  const attentionItems = useMemo(() => {
    const items = [];
    products.filter((p) => p.quantity === 0).forEach((p) => {
      items.push({
        id: `oos-${p.id}`,
        type: 'OUT_OF_STOCK',
        title: `${p.name} is completely out of stock`,
        subtitle: `SKU: ${p.sku} | Target: ${p.targetStockLevel || 10} units`,
        urgency: 'high',
        targetTab: 'purchasing',
        actionLabel: 'Reorder Stock',
        productId: p.id,
        preferredSupplierId: p.supplierId
      });
    });
    products.filter((p) => p.quantity > 0 && p.quantity <= p.minStockLevel).forEach((p) => {
      items.push({
        id: `low-${p.id}`,
        type: 'LOW_STOCK',
        title: `${p.name} reached low-stock threshold`,
        subtitle: `${p.quantity} units remaining (Alert level: ${p.minStockLevel})`,
        urgency: 'medium',
        targetTab: 'purchasing',
        actionLabel: 'Reorder Stock',
        productId: p.id,
        preferredSupplierId: p.supplierId
      });
    });
    purchaseOrders.filter((po) => po.status === 'ORDERED').forEach((po) => {
      items.push({
        id: `po-${po.id}`,
        type: 'PO_ORDERED',
        title: `PO #${po.id} from ${po.supplierName} awaiting delivery`,
        subtitle: `Ordered: ${po.totalQuantityOrdered} units | Placed on ${formatDateTime(po.placedAt)}`,
        urgency: 'medium',
        targetTab: 'purchasing',
        actionLabel: 'Receive Delivery',
        poId: po.id
      });
    });
    purchaseOrders.filter((po) => po.status === 'PARTIALLY_RECEIVED').forEach((po) => {
      items.push({
        id: `po-part-${po.id}`,
        type: 'PO_PARTIAL',
        title: `PO #${po.id} partially received (${po.totalQuantityReceived}/${po.totalQuantityOrdered} units)`,
        subtitle: `Supplier: ${po.supplierName} | Outstanding delivery remaining`,
        urgency: 'low',
        targetTab: 'purchasing',
        actionLabel: 'Receive Remaining',
        poId: po.id
      });
    });
    if (salesIntelligence?.products) {
      salesIntelligence.products.filter((p) => p.salesActivity === 'POTENTIAL_DEAD_STOCK').forEach((p) => {
        items.push({
          id: `dead-${p.productId}`,
          type: 'DEAD_STOCK',
          title: `Potential dead stock: ${p.productName}`,
          subtitle: `Last sold ${p.daysSinceLastSale} days ago | ${p.currentQuantity} units sitting in warehouse`,
          urgency: 'low',
          targetTab: 'surplus',
          actionLabel: 'List for Clearance',
          productId: p.productId
        });
      });
    }
    const activeSurplusCampaigns = surplusSummary ? (surplusSummary.activeListings ?? surplusSummary.activeListingsCount ?? 0) : 0;
    if (surplusSummary && activeSurplusCampaigns > 0) {
      const recoveredRev = surplusSummary.totalSurplusSalesRevenuePaise ?? surplusSummary.totalSurplusRevenuePaise ?? 0;
      items.push({
        id: 'surplus-active-campaigns',
        type: 'SURPLUS_CLEARANCE',
        title: `${activeSurplusCampaigns} active surplus clearance campaign${activeSurplusCampaigns > 1 ? 's' : ''}`,
        subtitle: `${surplusSummary.totalUnitsRemaining} units reserved | ${formatPaise(recoveredRev)} revenue recovered`,
        urgency: 'low',
        targetTab: 'surplus',
        actionLabel: 'Manage Surplus'
      });
    }
    return items.slice(0, 8);
  }, [products, purchaseOrders, salesIntelligence, surplusSummary]);

  // Initial Data Loads
  useEffect(() => {
    fetchHealthData();
    fetchProductsData('', '');
    fetchSuppliersData('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'dashboard') {
      fetchDashboardData();
      fetchSalesMetricsData();
      fetchSalesTrendData();
      fetchIntelligenceData();
      fetchPurchaseOrdersData('ALL', '');
      getSurplusSummary().then(setSurplusSummary).catch(() => {});
      if (products.length === 0) fetchProductsData('', '');
      if (suppliers.length === 0) fetchSuppliersData('');
    } else if (activeTab === 'products') {
      fetchProductsData(debouncedSearchQuery, categoryFilter);
      if (suppliers.length === 0) fetchSuppliersData('');
    } else if (activeTab === 'sales') {
      fetchSalesData(salesStatusFilter);
      fetchSalesMetricsData();
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'purchasing') {
      fetchPurchaseOrdersData(poStatusFilter, poSupplierFilter);
      fetchSuppliersData(supplierSearch);
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'stock-control') {
      fetchMovementsData(movementProductFilter, movementTypeFilter);
      if (stockControlSubTab === 'audits') fetchAuditsData();
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'insights') {
      fetchIntelligenceData();
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'surplus') {
      fetchSurplusData();
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'reports') {
      fetchAllReportData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'products') fetchProductsData(debouncedSearchQuery, categoryFilter);
  }, [debouncedSearchQuery, categoryFilter]);

  useEffect(() => {
    if (activeTab === 'surplus') fetchSurplusListingsOnly(surplusStatusFilter);
  }, [surplusStatusFilter]);

  useEffect(() => {
    if (activeTab === 'reports') fetchAllReportData();
  }, [reportPeriod, reportDate, reportMonth, reportYear, reportFrom, reportTo]);

  useEffect(() => {
    if (activeTab === 'stock-control' && stockControlSubTab === 'audits') fetchAuditsData();
  }, [stockControlSubTab]);

  useEffect(() => {
    if (selectedAuditId) fetchSelectedAuditDetail(selectedAuditId);
    else setSelectedAudit(null);
  }, [selectedAuditId]);

  return {
    health,
    loadingHealth,
    fetchHealthData,
    dashboard,
    loadingDashboard,
    fetchDashboardData,
    products,
    setProducts,
    loadingProducts,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    categoryFilter,
    setCategoryFilter,
    stockStatusFilter,
    setStockStatusFilter,
    productsPage,
    setProductsPage,
    productsPageSize,
    setProductsPageSize,
    fetchProductsData,
    movements,
    loadingMovements,
    movementProductFilter,
    setMovementProductFilter,
    movementTypeFilter,
    setMovementTypeFilter,
    movementDateFrom,
    setMovementDateFrom,
    movementDateTo,
    setMovementDateTo,
    movementsPage,
    setMovementsPage,
    movementsPageSize,
    setMovementsPageSize,
    fetchMovementsData,
    suppliers,
    setSuppliers,
    loadingSuppliers,
    supplierSearch,
    setSupplierSearch,
    fetchSuppliersData,
    sales,
    loadingSales,
    salesStatusFilter,
    setSalesStatusFilter,
    salesDateFrom,
    setSalesDateFrom,
    salesDateTo,
    setSalesDateTo,
    salesPage,
    setSalesPage,
    salesPageSize,
    setSalesPageSize,
    salesMetrics,
    salesTrend,
    fetchSalesData,
    fetchSalesMetricsData,
    fetchSalesTrendData,
    purchaseOrders,
    loadingPurchaseOrders,
    poStatusFilter,
    setPoStatusFilter,
    poSupplierFilter,
    setPoSupplierFilter,
    poDateFrom,
    setPoDateFrom,
    poDateTo,
    setPoDateTo,
    poPage,
    setPoPage,
    poPageSize,
    setPoPageSize,
    fetchPurchaseOrdersData,
    salesIntelligence,
    loadingIntelligence,
    intelFilter,
    setIntelFilter,
    fetchIntelligenceData,
    audits,
    auditSummary,
    loadingAudits,
    auditFilter,
    setAuditFilter,
    auditDateFrom,
    setAuditDateFrom,
    auditDateTo,
    setAuditDateTo,
    auditsPage,
    setAuditsPage,
    auditsPageSize,
    setAuditsPageSize,
    selectedAuditId,
    setSelectedAuditId,
    selectedAudit,
    setSelectedAudit,
    loadingSelectedAudit,
    auditItemSearch,
    setAuditItemSearch,
    auditItemFilter,
    setAuditItemFilter,
    fetchAuditsData,
    fetchSelectedAuditDetail,
    reportPeriod,
    setReportPeriod,
    reportDate,
    setReportDate,
    reportMonth,
    setReportMonth,
    reportYear,
    setReportYear,
    reportFrom,
    setReportFrom,
    reportTo,
    setReportTo,
    reportSubTab,
    setReportSubTab,
    summaryReport,
    pnlReport,
    salesReport,
    lossReport,
    purchasesReport,
    expensesList,
    loadingReports,
    reportsError,
    setReportsError,
    expenseCategoryFilter,
    setExpenseCategoryFilter,
    expenseDateFrom,
    setExpenseDateFrom,
    expenseDateTo,
    setExpenseDateTo,
    expensesPage,
    setExpensesPage,
    expensesPageSize,
    setExpensesPageSize,
    fetchAllReportData,
    surplusSubTab,
    setSurplusSubTab,
    surplusSummary,
    surplusSuggestions,
    surplusListings,
    surplusStatusFilter,
    setSurplusStatusFilter,
    surplusSearch,
    setSurplusSearch,
    surplusCategoryFilter,
    setSurplusCategoryFilter,
    loadingSurplus,
    surplusError,
    fetchSurplusData,
    attentionItems
  };
}
