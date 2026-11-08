import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import {
  getHealth,
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getMovements,
  stockIn,
  adjustStock,
  getIntelligence,
  getSalesIntelligence,
  getSales,
  getSaleById,
  createSale,
  cancelSale,
  getSalesMetricsSummary,
  getDailySalesTrend,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  placePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getStockAudits,
  getStockAuditSummary,
  getStockAuditById,
  createStockAudit,
  enterAuditCount,
  completeStockAudit,
  cancelStockAudit,
  getFinancialSummaryReport,
  getProfitLossReport,
  getSalesReport,
  getInventoryLossReport,
  getPurchasesReport,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getSurplusSuggestions,
  getSurplusSummary,
  getSurplusListings,
  getSurplusListingById,
  createSurplusListing,
  recordSurplusSale,
  cancelSurplusListing
} from './api';
import {
  formatPaise,
  paiseToRupees,
  rupeesToPaise,
  getKolkataToday,
  formatDateTime,
  generateSuggestedSku
} from './utils/formatters';
import { computeCartCalculations, filterSearchProducts } from './utils/salesCalculations';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastAlert from './components/layout/ToastAlert';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-loaded Page Views (chart-heavy and modular views)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Sales = lazy(() => import('./pages/Sales'));
const Purchasing = lazy(() => import('./pages/Purchasing'));
const StockControl = lazy(() => import('./pages/StockControl'));
const Insights = lazy(() => import('./pages/Insights'));
const SurplusStock = lazy(() => import('./pages/SurplusStock'));
const Reports = lazy(() => import('./pages/Reports'));

// Modals
import ProductModal from './components/products/ProductModal';
import DeleteProductModal from './components/products/DeleteProductModal';
import SaleModal from './components/sales/SaleModal';
import SaleDetailModal from './components/sales/SaleDetailModal';
import CancelSaleModal from './components/sales/CancelSaleModal';
import PoModal from './components/purchasing/PoModal';
import ReceivePoModal from './components/purchasing/ReceivePoModal';
import CancelPoModal from './components/purchasing/CancelPoModal';
import PoDetailModal from './components/purchasing/PoDetailModal';
import SupplierModal from './components/purchasing/SupplierModal';
import DeleteSupplierModal from './components/purchasing/DeleteSupplierModal';
import SupplierProductsModal from './components/purchasing/SupplierProductsModal';
import QuickActionModal from './components/stock-control/QuickActionModal';
import StartAuditModal from './components/stock-control/StartAuditModal';
import CountModal from './components/stock-control/CountModal';
import CompleteAuditModal from './components/stock-control/CompleteAuditModal';
import CancelAuditModal from './components/stock-control/CancelAuditModal';
import ExpenseModal from './components/reports/ExpenseModal';
import DeleteExpenseModal from './components/reports/DeleteExpenseModal';
import CreateSurplusModal from './components/surplus/CreateSurplusModal';
import SurplusSaleModal from './components/surplus/SurplusSaleModal';
import CancelSurplusModal from './components/surplus/CancelSurplusModal';
import SurplusDetailModal from './components/surplus/SurplusDetailModal';

export default function App() {
  // Navigation: overview, products, sales, purchasing, stock-control, insights, surplus, reports
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Overview Period Activity Filter State
  const [overviewPeriod, setOverviewPeriod] = useState('TODAY'); // 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM'
  const [overviewCustomFrom, setOverviewCustomFrom] = useState(getKolkataToday());
  const [overviewCustomTo, setOverviewCustomTo] = useState(getKolkataToday());

  // Subsections
  const [purchasingSubTab, setPurchasingSubTab] = useState('orders'); // 'orders' | 'suppliers'
  const [stockControlSubTab, setStockControlSubTab] = useState('movements'); // 'movements' | 'adjustments' | 'audits'

  // Global Engine Health & Alerts
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Dashboard Data
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Products Data & Pagination
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const productSearchAbortRef = useRef(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(20);

  // Movements Data & Pagination
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementProductFilter, setMovementProductFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [movementDateFrom, setMovementDateFrom] = useState('');
  const [movementDateTo, setMovementDateTo] = useState('');
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPageSize, setMovementsPageSize] = useState(20);

  // Suppliers Data
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierProductsModalOpen, setSupplierProductsModalOpen] = useState(false);
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState(null);
  const [supplierProductsList, setSupplierProductsList] = useState([]);
  const [loadingSupplierProducts, setLoadingSupplierProducts] = useState(false);

  // Sales Data
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesStatusFilter, setSalesStatusFilter] = useState('ALL');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(20);
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);

  // Purchase Orders Data
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poSupplierFilter, setPoSupplierFilter] = useState('');
  const [poDateFrom, setPoDateFrom] = useState('');
  const [poDateTo, setPoDateTo] = useState('');
  const [poPage, setPoPage] = useState(1);
  const [poPageSize, setPoPageSize] = useState(20);

  // Sales Intelligence Data
  const [salesIntelligence, setSalesIntelligence] = useState(null);
  const [legacyIntelligence, setLegacyIntelligence] = useState([]);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [intelFilter, setIntelFilter] = useState('ALL');

  // --- MODALS STATE ---
  // 1. Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAdvancedProduct, setShowAdvancedProduct] = useState(false);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    purchasePriceRupees: '',
    sellingPriceRupees: '',
    quantity: 0,
    minStockLevel: 5,
    targetStockLevel: 20,
    supplierId: ''
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState('');

  // 2. Delete Product Modal
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // 3. Quick Action Modal (Simple Receive, Quick Sale, Adjust)
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [quickActionForm, setQuickActionForm] = useState({
    action: 'RECEIVE', // 'RECEIVE' | 'SALE' | 'ADJUST'
    productId: '',
    quantity: 1,
    reason: 'Inventory intake'
  });
  const [submittingQuickAction, setSubmittingQuickAction] = useState(false);
  const [quickActionError, setQuickActionError] = useState('');

  // 4. Sales POS Modal (Multi-item cart)
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleCart, setSaleCart] = useState([]); // [{ productId, quantity, customPriceRupees }]
  const [saleDiscountPercent, setSaleDiscountPercent] = useState(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState(() => {
    try {
      return sessionStorage.getItem('stockpile_last_payment_method') || 'CASH';
    } catch {
      return 'CASH';
    }
  });
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleFormError, setSaleFormError] = useState('');
  const [saleSuccessData, setSaleSuccessData] = useState(null);
  const [saleProductSearchQuery, setSaleProductSearchQuery] = useState('');
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [saleRequiresConfirm, setSaleRequiresConfirm] = useState(false);
  const saleSearchInputRef = useRef(null);

  // 5. Sale Details Modal
  const [saleDetailModalOpen, setSaleDetailModalOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);

  // 6. Cancel Sale Dialog
  const [cancelSaleModalOpen, setCancelSaleModalOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelSaleReason, setCancelSaleReason] = useState('Customer return / order cancelled');
  const [cancellingSale, setCancellingSale] = useState(false);

  // 7. Purchase Order Modal (Draft Creation / Edit)
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState(null);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    notes: '',
    items: [{ productId: '', quantity: 10, unitCostRupees: '' }]
  });
  const [savingPo, setSavingPo] = useState(false);
  const [poFormError, setPoFormError] = useState('');

  // 8. Purchase Order Details Modal
  const [poDetailModalOpen, setPoDetailModalOpen] = useState(false);
  const [selectedPoDetail, setSelectedPoDetail] = useState(null);
  const [loadingPoDetail, setLoadingPoDetail] = useState(false);

  // 9. Receive PO Goods Modal
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receivingPo, setReceivingPo] = useState(null);
  const [receiveItemQuantities, setReceiveItemQuantities] = useState({}); // { [poItemId]: qty }
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState('');

  // 10. Cancel PO Dialog
  const [cancelPoModalOpen, setCancelPoModalOpen] = useState(false);
  const [poToCancel, setPoToCancel] = useState(null);
  const [cancelPoReason, setCancelPoReason] = useState('Supplier out of stock');
  const [cancellingPo, setCancellingPo] = useState(false);

  // 11. Supplier Modal (Add / Edit)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierFormError, setSupplierFormError] = useState('');

  // 12. Delete Supplier Dialog
  const [deleteSupplierModalOpen, setDeleteSupplierModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

  // 13. Stock Audits State
  const [audits, setAudits] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL'); // 'ALL' (shows all historical audits default) | 'OPEN' | 'COMPLETED' | 'CANCELLED'
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditsPage, setAuditsPage] = useState(1);
  const [auditsPageSize, setAuditsPageSize] = useState(20);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loadingSelectedAudit, setLoadingSelectedAudit] = useState(false);
  const [auditItemSearch, setAuditItemSearch] = useState('');
  const [auditItemFilter, setAuditItemFilter] = useState('ALL'); // 'ALL' | 'UNCOUNTED' | 'DISCREPANCIES' | 'MATCHED'

  // 14. Start New Audit Modal
  const [startAuditModalOpen, setStartAuditModalOpen] = useState(false);
  const [auditMode, setAuditMode] = useState('ALL'); // 'ALL' | 'SELECT'
  const [selectedAuditProductIds, setSelectedAuditProductIds] = useState([]);
  const [auditProductSearch, setAuditProductSearch] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [submittingAudit, setSubmittingAudit] = useState(false);

  // 15. Enter / Edit Count Modal
  const [countingItem, setCountingItem] = useState(null);
  const [countQuantityInput, setCountQuantityInput] = useState('');
  const [countNotesInput, setCountNotesInput] = useState('');
  const [submittingCount, setSubmittingCount] = useState(false);

  // 16. Complete Audit Modal
  const [completeAuditModalOpen, setCompleteAuditModalOpen] = useState(false);
  const [submittingCompleteAudit, setSubmittingCompleteAudit] = useState(false);
  const [completeAuditError, setCompleteAuditError] = useState(null);

  // 17. Cancel Audit Modal
  const [cancelAuditModalOpen, setCancelAuditModalOpen] = useState(false);
  const [cancelAuditReason, setCancelAuditReason] = useState('Physical count interrupted / cancelled');
  const [submittingCancelAudit, setSubmittingCancelAudit] = useState(false);

  // 18. Financial Reports & Operating Expenses State
  const [reportPeriod, setReportPeriod] = useState('MONTHLY'); // 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'
  const [reportDate, setReportDate] = useState(() => getKolkataToday());
  const [reportMonth, setReportMonth] = useState(() => {
    try {
      const parts = getKolkataToday().split('-');
      return parseInt(parts[1], 10);
    } catch {
      return new Date().getMonth() + 1;
    }
  });
  const [reportYear, setReportYear] = useState(() => {
    try {
      const parts = getKolkataToday().split('-');
      return parseInt(parts[0], 10);
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

  const [reportSubTab, setReportSubTab] = useState('overview'); // 'overview' | 'pnl' | 'sales' | 'loss' | 'purchasing' | 'expenses'
  const [summaryReport, setSummaryReport] = useState(null);
  const [pnlReport, setPnlReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [lossReport, setLossReport] = useState(null);
  const [purchasesReport, setPurchasesReport] = useState(null);
  const [expensesList, setExpensesList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');

  // 19. Operating Expenses Modals State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Rent',
    description: '',
    amountRupees: '',
    date: '',
    notes: ''
  });
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseFormError, setExpenseFormError] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [expenseDateFrom, setExpenseDateFrom] = useState('');
  const [expenseDateTo, setExpenseDateTo] = useState('');
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesPageSize, setExpensesPageSize] = useState(20);
  const [deleteExpenseModalOpen, setDeleteExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(false);

  // 20. Surplus Stock Management State
  const [surplusSubTab, setSurplusSubTab] = useState('suggestions'); // 'suggestions' | 'listings'
  const [surplusSummary, setSurplusSummary] = useState(null);
  const [surplusSuggestions, setSurplusSuggestions] = useState([]);
  const [surplusListings, setSurplusListings] = useState([]);
  const [surplusStatusFilter, setSurplusStatusFilter] = useState(''); // '' (all) | 'ACTIVE' | 'PARTIALLY_SOLD' | 'SOLD_OUT' | 'CANCELLED'
  const [surplusSearch, setSurplusSearch] = useState('');
  const [surplusCategoryFilter, setSurplusCategoryFilter] = useState('ALL');
  const [loadingSurplus, setLoadingSurplus] = useState(false);
  const [surplusError, setSurplusError] = useState('');

  // Surplus Modals State
  // Modal: Create Surplus Listing
  const [createSurplusModalOpen, setCreateSurplusModalOpen] = useState(false);
  const [createSurplusForm, setCreateSurplusForm] = useState({
    productId: '',
    quantity: '',
    discountedPriceRupees: '',
    notes: ''
  });
  const [selectedProductForSurplus, setSelectedProductForSurplus] = useState(null);
  const [submittingCreateSurplus, setSubmittingCreateSurplus] = useState(false);
  const [createSurplusError, setCreateSurplusError] = useState('');

  // Modal: Record Surplus Sale
  const [surplusSaleModalOpen, setSurplusSaleModalOpen] = useState(false);
  const [surplusListingForSale, setSurplusListingForSale] = useState(null);
  const [surplusSaleForm, setSurplusSaleForm] = useState({
    quantity: 1,
    paymentMethod: 'CASH',
    notes: ''
  });
  const [submittingSurplusSale, setSubmittingSurplusSale] = useState(false);
  const [surplusSaleError, setSurplusSaleError] = useState('');

  // Modal: Cancel Surplus Listing
  const [cancelSurplusModalOpen, setCancelSurplusModalOpen] = useState(false);
  const [surplusListingToCancel, setSurplusListingToCancel] = useState(null);
  const [cancelSurplusReason, setCancelSurplusReason] = useState('Campaign ended / stock returned to regular pool');
  const [submittingCancelSurplus, setSubmittingCancelSurplus] = useState(false);

  // Modal: View Surplus Listing Details
  const [surplusDetailModalOpen, setSurplusDetailModalOpen] = useState(false);
  const [selectedSurplusDetail, setSelectedSurplusDetail] = useState(null);
  const [loadingSurplusDetail, setLoadingSurplusDetail] = useState(false);

  // Toast alert trigger
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // --- DATA FETCHING FUNCTIONS ---
  const fetchAllReportData = async () => {
    if (reportPeriod === 'CUSTOM' && reportFrom && reportTo && reportFrom > reportTo) {
      setReportsError(`Start date (${reportFrom}) cannot be after end date (${reportTo}).`);
      return;
    }

    setLoadingReports(true);
    setReportsError('');

    const params = { period: reportPeriod };
    if (reportPeriod === 'DAILY') {
      params.date = reportDate;
    } else if (reportPeriod === 'MONTHLY') {
      params.month = Number(reportMonth);
      params.year = Number(reportYear);
    } else if (reportPeriod === 'YEARLY') {
      params.year = Number(reportYear);
    } else if (reportPeriod === 'CUSTOM') {
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
      console.error('Failed to fetch reports data', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to load report data';
      setReportsError(errMsg);
    } finally {
      setLoadingReports(false);
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

  const fetchDashboardData = async (period = overviewPeriod, from = overviewCustomFrom, to = overviewCustomTo) => {
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
    } catch {
      // Optional metrics fallback
    }
  };

  const fetchSalesTrendData = async () => {
    try {
      const data = await getDailySalesTrend();
      setSalesTrend(data || []);
    } catch {
      // Optional trend fallback
    }
  };

  const fetchPurchaseOrdersData = async (status = poStatusFilter, supplierId = poSupplierFilter) => {
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

  const fetchMovementsData = async (productId = movementProductFilter, movementType = movementTypeFilter) => {
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
      if (salesIntel.status === 'fulfilled') {
        setSalesIntelligence(salesIntel.value);
      }
      if (legIntel.status === 'fulfilled') {
        setLegacyIntelligence(legIntel.value || []);
      }
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
      console.error('Failed to load surplus data:', err);
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

  const fetchSelectedSurplusDetail = async (id) => {
    setLoadingSurplusDetail(true);
    try {
      const detail = await getSurplusListingById(id);
      setSelectedSurplusDetail(detail);
    } catch (err) {
      console.error('Failed to load surplus listing detail:', err);
      triggerAlert('error', 'Failed to load listing details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingSurplusDetail(false);
    }
  };

  // Initial system health check
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Debounce product and SKU search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data specific to tab changes (without duplicate initial loads)
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'dashboard') {
      fetchDashboardData();
      fetchSalesMetricsData();
      fetchSalesTrendData();
      fetchIntelligenceData();
      fetchPurchaseOrdersData('ALL', '');
      getSurplusSummary().then(setSurplusSummary).catch(() => {});
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
      if (stockControlSubTab === 'audits') {
        fetchAuditsData();
      }
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

  // Refetch products when debounced search query or category filter changes
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProductsData(debouncedSearchQuery, categoryFilter);
    }
  }, [debouncedSearchQuery, categoryFilter]);

  useEffect(() => {
    if (activeTab === 'surplus') {
      fetchSurplusListingsOnly(surplusStatusFilter);
    }
  }, [surplusStatusFilter]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchAllReportData();
    }
  }, [reportPeriod, reportDate, reportMonth, reportYear, reportFrom, reportTo]);

  useEffect(() => {
    if (activeTab === 'stock-control' && stockControlSubTab === 'audits') {
      fetchAuditsData();
    }
  }, [stockControlSubTab]);

  useEffect(() => {
    if (selectedAuditId) {
      fetchSelectedAuditDetail(selectedAuditId);
    } else {
      setSelectedAudit(null);
    }
  }, [selectedAuditId]);

  // Derived: unique categories
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Derived: filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (stockStatusFilter === 'OUT_OF_STOCK' && p.quantity !== 0) return false;
      if (stockStatusFilter === 'LOW_STOCK' && (p.quantity === 0 || p.quantity > p.minStockLevel)) return false;
      if (stockStatusFilter === 'IN_STOCK' && p.quantity <= p.minStockLevel) return false;
      return true;
    });
  }, [products, stockStatusFilter]);

  // Derived: Attention Items for Dashboard
  const attentionItems = useMemo(() => {
    const items = [];
    // 1. Out of stock products
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

    // 2. Low stock products (quantity <= minStockLevel and > 0)
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

    // 3. Purchase Orders awaiting delivery (ORDERED)
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

    // 4. Partially received POs
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

    // 5. Potential dead stock from sales intelligence (> 45 days)
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

    // 6. Active Surplus Clearance Campaigns
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

    return items.slice(0, 8); // Top 8 most urgent items
  }, [products, purchaseOrders, salesIntelligence, surplusSummary]);

  // --- ACTIONS & MODAL HANDLERS ---

  // Product Add / Edit
  const openAddProductModal = (prefill = {}) => {
    setEditingProduct(null);
    setShowAdvancedProduct(false);
    setSkuManuallyEdited(false);
    const initialSku = generateSuggestedSku(prefill.name || '', prefill.category || 'General');
    setProductForm({
      name: prefill.name || '',
      sku: initialSku,
      category: prefill.category || '',
      purchasePriceRupees: prefill.purchasePriceRupees || '',
      sellingPriceRupees: prefill.sellingPriceRupees || '',
      quantity: 0,
      minStockLevel: prefill.minStockLevel || 5,
      targetStockLevel: prefill.targetStockLevel || 20,
      supplierId: prefill.supplierId || ''
    });
    setProductFormError('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setShowAdvancedProduct(false);
    setSkuManuallyEdited(true);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      purchasePriceRupees: paiseToRupees(prod.purchasePricePaise),
      sellingPriceRupees: paiseToRupees(prod.sellingPricePaise),
      quantity: prod.quantity,
      minStockLevel: prod.minStockLevel ?? 5,
      targetStockLevel: prod.targetStockLevel ?? 20,
      supplierId: prod.supplierId || ''
    });
    setProductFormError('');
    setProductModalOpen(true);
  };

  const handleProductNameChange = (val) => {
    const updated = { ...productForm, name: val };
    if (!editingProduct && !skuManuallyEdited) {
      updated.sku = generateSuggestedSku(val, productForm.category);
    }
    setProductForm(updated);
  };

  const handleProductCategoryChange = (val) => {
    const updated = { ...productForm, category: val };
    if (!editingProduct && !skuManuallyEdited) {
      updated.sku = generateSuggestedSku(productForm.name, val);
    }
    setProductForm(updated);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductFormError('');

    if (!productForm.name.trim()) {
      setProductFormError('Product Name is required.');
      return;
    }
    if (!productForm.sku.trim()) {
      setProductFormError('SKU is required.');
      return;
    }
    if (!productForm.category.trim()) {
      setProductFormError('Category is required.');
      return;
    }
    const sellPaise = rupeesToPaise(productForm.sellingPriceRupees);
    const purchPaise = rupeesToPaise(productForm.purchasePriceRupees);
    if (sellPaise < 0 || purchPaise < 0) {
      setProductFormError('Prices must be zero or positive.');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        // Update product
        await updateProduct(editingProduct.id, {
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          category: productForm.category.trim(),
          purchasePricePaise: purchPaise,
          sellingPricePaise: sellPaise,
          minStockLevel: parseInt(productForm.minStockLevel, 10) || 0,
          targetStockLevel: parseInt(productForm.targetStockLevel, 10) || 0,
          averageDailySales: editingProduct.averageDailySales ?? 0.0,
          leadTimeDays: editingProduct.leadTimeDays ?? 0,
          supplierId: productForm.supplierId ? parseInt(productForm.supplierId, 10) : null
        });
        triggerAlert('success', `Product "${productForm.name}" updated successfully.`);
      } else {
        // Create product
        await createProduct({
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          category: productForm.category.trim(),
          purchasePricePaise: purchPaise,
          sellingPricePaise: sellPaise,
          quantity: parseInt(productForm.quantity, 10) || 0,
          minStockLevel: parseInt(productForm.minStockLevel, 10) || 0,
          targetStockLevel: parseInt(productForm.targetStockLevel, 10) || 0,
          averageDailySales: 0.0,
          leadTimeDays: 0,
          supplierId: productForm.supplierId ? parseInt(productForm.supplierId, 10) : null
        });
        triggerAlert('success', `Product "${productForm.name}" registered successfully.`);
      }

      setProductModalOpen(false);
      fetchProductsData();
      fetchDashboardData();
    } catch (err) {
      setProductFormError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSavingProduct(false);
    }
  };

  const confirmDeleteProduct = (prod) => {
    setProductToDelete(prod);
    setDeleteProductModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      triggerAlert('success', `Product "${productToDelete.name}" deleted.`);
      setDeleteProductModalOpen(false);
      fetchProductsData();
      fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      triggerAlert('error', `Cannot delete product: ${msg}`);
      setDeleteProductModalOpen(false);
    } finally {
      setDeletingProduct(false);
    }
  };

  // Quick Action Modal (Fast Receive, Sale, Adjust)
  const openQuickActionModal = (action = 'RECEIVE', initialProductId = '') => {
    const pId = initialProductId || (products.length > 0 ? String(products[0].id) : '');
    setQuickActionForm({
      action,
      productId: pId,
      quantity: 1,
      reason: action === 'RECEIVE' ? 'Inventory intake' : action === 'SALE' ? 'Counter sale' : 'Count reconciliation'
    });
    setQuickActionError('');
    setQuickActionModalOpen(true);
  };

  const handleQuickActionSubmit = async (e) => {
    e.preventDefault();
    setQuickActionError('');
    const pId = parseInt(quickActionForm.productId, 10);
    const qty = parseInt(quickActionForm.quantity, 10);

    if (!pId) {
      setQuickActionError('Please select a product.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setQuickActionError('Quantity must be greater than zero.');
      return;
    }

    setSubmittingQuickAction(true);
    try {
      if (quickActionForm.action === 'RECEIVE') {
        await stockIn(pId, qty, quickActionForm.reason);
        triggerAlert('success', `Stock received successfully (+${qty} units).`);
      } else if (quickActionForm.action === 'SALE') {
        // Creates a real completed sale in backend
        await createSale({
          items: [{ productId: pId, quantity: qty }],
          discountPaise: 0,
          paymentMethod: 'CASH'
        });
        triggerAlert('success', `Sale recorded successfully (-${qty} units).`);
      } else {
        await adjustStock(pId, qty, quickActionForm.reason);
        triggerAlert('success', `Stock adjusted to ${qty} units.`);
      }

      setQuickActionModalOpen(false);
      fetchProductsData();
      fetchDashboardData();
      fetchMovementsData();
      fetchSalesMetricsData();
    } catch (err) {
      setQuickActionError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSubmittingQuickAction(false);
    }
  };

  // --- Stock Audit Handlers ---
  const openStartAuditModal = () => {
    setAuditMode('ALL');
    setSelectedAuditProductIds([]);
    setAuditNotes('');
    setStartAuditModalOpen(true);
  };

  const selectAuditForView = async (audit) => {
    setSelectedAuditId(audit.id);
    await fetchSelectedAuditDetail(audit.id);
  };

  const openCountModal = (item) => {
    setCountingItem(item);
    setCountQuantityInput(item.countedQuantity !== null ? item.countedQuantity : item.systemQuantity);
    setCountNotesInput(item.itemNotes || '');
  };

  const openCompleteAuditModal = () => {
    setCompleteAuditError(null);
    setCompleteAuditModalOpen(true);
  };

  const openCancelAuditModal = () => {
    setCancelAuditReason('');
    setCancelAuditModalOpen(true);
  };

  const handleStartAudit = async (e) => {
    if (e) e.preventDefault();
    setSubmittingAudit(true);
    try {
      const payload = {
        productIds: auditMode === 'ALL' ? null : selectedAuditProductIds,
        notes: auditNotes.trim() || null
      };
      const created = await createStockAudit(payload);
      triggerAlert('success', `Stock audit #AUD-${created.id} started successfully!`);
      setStartAuditModalOpen(false);
      setAuditNotes('');
      setSelectedAuditProductIds([]);
      await fetchAuditsData();
      setSelectedAuditId(created.id);
      setSelectedAudit(created);
    } catch (err) {
      triggerAlert('error', 'Failed to start audit: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingAudit(false);
    }
  };

  const handleRecordCount = async (e) => {
    if (e) e.preventDefault();
    if (countQuantityInput === '' || Number(countQuantityInput) < 0) {
      triggerAlert('error', 'Please enter a valid non-negative physical count');
      return;
    }
    setSubmittingCount(true);
    try {
      await enterAuditCount(selectedAudit.id, countingItem.id, {
        countedQuantity: Number(countQuantityInput),
        notes: countNotesInput.trim() || null
      });
      triggerAlert('success', `Count updated for ${countingItem.productNameSnapshot}`);
      setCountingItem(null);
      await fetchSelectedAuditDetail(selectedAudit.id);
      await fetchAuditsData();
    } catch (err) {
      triggerAlert('error', 'Failed to save count: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingCount(false);
    }
  };

  const handleCompleteAudit = async () => {
    setSubmittingCompleteAudit(true);
    setCompleteAuditError(null);
    try {
      const summary = await completeStockAudit(selectedAudit.id);
      triggerAlert(
        'success',
        `Stock audit #AUD-${selectedAudit.id} completed! ${summary.adjustedProducts || 0} product(s) adjusted.`
      );
      setCompleteAuditModalOpen(false);
      await fetchSelectedAuditDetail(selectedAudit.id);
      await fetchAuditsData();
      await fetchProductsData();
      await fetchMovementsData();
      await fetchDashboardData();
      await fetchIntelligenceData();
    } catch (err) {
      if (err.response?.status === 409) {
        setCompleteAuditError(
          err.response?.data?.error ||
            'Inventory changed during the audit. The audit must be cancelled and restarted.'
        );
      } else {
        triggerAlert('error', 'Failed to complete audit: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setSubmittingCompleteAudit(false);
    }
  };

  const handleCancelAudit = async (e) => {
    if (e) e.preventDefault();
    if (!cancelAuditReason.trim()) {
      triggerAlert('error', 'Cancellation reason is required');
      return;
    }
    setSubmittingCancelAudit(true);
    try {
      await cancelStockAudit(selectedAudit.id, cancelAuditReason.trim());
      triggerAlert('success', `Audit #AUD-${selectedAudit.id} has been cancelled.`);
      setCancelAuditModalOpen(false);
      setCancelAuditReason('');
      await fetchSelectedAuditDetail(selectedAudit.id);
      await fetchAuditsData();
    } catch (err) {
      triggerAlert('error', 'Failed to cancel audit: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingCancelAudit(false);
    }
  };

  // Sales Cart POS Modal
  const openNewSaleModal = () => {
    if (products.length === 0) {
      triggerAlert('error', 'Add products to your catalog before recording a sale.');
      return;
    }
    // If cart is empty, initialize with first product for convenience
    if (saleCart.length === 0 && products.length > 0) {
      setSaleCart([{ productId: products[0].id, quantity: 1, customPriceRupees: null }]);
    }
    setSaleDiscountPercent(0);
    setSaleFormError('');
    setSaleSuccessData(null);
    setSaleProductSearchQuery('');
    setShowClearCartConfirm(false);
    setSaleRequiresConfirm(false);
    setSaleModalOpen(true);
  };

  const handleAddToCart = (product) => {
    if (!product) return;
    const existingIndex = saleCart.findIndex((c) => Number(c.productId) === Number(product.id));
    if (existingIndex >= 0) {
      // Prevent duplicate product entries in the cart; increase existing cart quantity instead
      const updated = [...saleCart];
      const curQty = parseInt(updated[existingIndex].quantity, 10) || 0;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: curQty + 1
      };
      setSaleCart(updated);
    } else {
      setSaleCart([
        ...saleCart,
        {
          productId: product.id,
          quantity: 1,
          customPriceRupees: null
        }
      ]);
    }
    setSaleProductSearchQuery('');
  };

  const handleAddCartRow = () => {
    const available = products.find((p) => !saleCart.some((c) => c.productId === p.id));
    const p = available || products[0];
    if (p) handleAddToCart(p);
  };

  const handleRemoveCartRow = (idx) => {
    const updated = saleCart.filter((_, i) => i !== idx);
    setSaleCart(updated);
  };

  const handleUpdateQuantity = (idx, delta) => {
    const updated = [...saleCart];
    const curQty = parseInt(updated[idx].quantity, 10) || 1;
    const newQty = Math.max(1, curQty + delta);
    updated[idx] = { ...updated[idx], quantity: newQty };
    setSaleCart(updated);
  };

  const handleCartItemChange = (idx, field, val) => {
    const updated = [...saleCart];
    updated[idx] = { ...updated[idx], [field]: val };
    setSaleCart(updated);
  };

  const handleCustomPriceChange = (idx, val) => {
    const updated = [...saleCart];
    updated[idx] = { ...updated[idx], customPriceRupees: val };
    setSaleCart(updated);
  };

  const handleResetItemPrice = (idx) => {
    const updated = [...saleCart];
    updated[idx] = { ...updated[idx], customPriceRupees: null };
    setSaleCart(updated);
  };

  const handleClearCart = () => {
    setSaleCart([]);
    setShowClearCartConfirm(false);
    setSaleFormError('');
  };

  // Autofocus product search on modal open
  useEffect(() => {
    if (saleModalOpen && !saleSuccessData) {
      const t = setTimeout(() => {
        saleSearchInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(t);
    }
  }, [saleModalOpen, saleSuccessData]);

  const cartCalculations = useMemo(
    () => computeCartCalculations(saleCart, products, saleDiscountPercent),
    [saleCart, products, saleDiscountPercent]
  );

  const searchFilteredProducts = useMemo(
    () => filterSearchProducts(products, saleProductSearchQuery),
    [products, saleProductSearchQuery]
  );

  const handleCheckoutSale = async (e) => {
    if (e) e.preventDefault();
    setSaleFormError('');

    if (cartCalculations.items.length === 0) {
      setSaleFormError('Cart must contain at least one item.');
      return;
    }

    for (const item of cartCalculations.items) {
      if (!item.productId) {
        setSaleFormError('Please select a valid product for each line.');
        return;
      }
      if (item.quantity <= 0) {
        setSaleFormError('Quantity for all items must be greater than zero.');
        return;
      }
      if (item.product && item.quantity > item.product.quantity) {
        setSaleFormError(`Insufficient stock for "${item.product.name}" (only ${item.product.quantity} available).`);
        return;
      }
    }

    // Confirmation if selling below cost or large discount
    if ((cartCalculations.hasBelowCostItem || cartCalculations.discountPercent > 20 || cartCalculations.isNegativeProfit) && !saleRequiresConfirm) {
      setSaleRequiresConfirm(true);
      return;
    }

    setSubmittingSale(true);
    try {
      const payload = {
        items: cartCalculations.items.map((i) => {
          const itemReq = {
            productId: Number(i.productId),
            quantity: parseInt(i.quantity, 10)
          };
          if (i.isPriceEdited && i.customPriceRupees !== null && i.customPriceRupees !== '' && !isNaN(Number(i.customPriceRupees))) {
            itemReq.unitSellingPricePaise = Math.round(Number(i.customPriceRupees) * 100);
          }
          return itemReq;
        }),
        discountPercent: cartCalculations.discountPercent > 0 ? Number(cartCalculations.discountPercent.toFixed(2)) : null,
        paymentMethod: salePaymentMethod
      };

      const result = await createSale(payload);
      triggerAlert('success', `Sale #SO-${result.id} completed for ${formatPaise(result.totalPaise)}.`);

      try {
        sessionStorage.setItem('stockpile_last_payment_method', salePaymentMethod);
      } catch {}

      setSaleSuccessData(result);
      setSaleRequiresConfirm(false);

      fetchSalesData();
      fetchSalesMetricsData();
      fetchSalesTrendData();
      fetchProductsData();
      fetchDashboardData();
    } catch (err) {
      setSaleFormError(err.response?.data?.error || err.message || 'Checkout failed');
    } finally {
      setSubmittingSale(false);
    }
  };

  const viewSaleDetails = async (saleId) => {
    setLoadingSaleDetail(true);
    setSaleDetailModalOpen(true);
    try {
      const data = await getSaleById(saleId);
      setSelectedSaleDetail(data);
    } catch (err) {
      triggerAlert('error', 'Failed to load sale details: ' + (err.response?.data?.error || err.message));
      setSaleDetailModalOpen(false);
    } finally {
      setLoadingSaleDetail(false);
    }
  };

  const confirmCancelSale = (sale) => {
    setSaleToCancel(sale);
    setCancelSaleReason('Customer returned goods');
    setCancelSaleModalOpen(true);
  };

  const handleCancelSale = async () => {
    if (!saleToCancel) return;
    setCancellingSale(true);
    try {
      await cancelSale(saleToCancel.id, cancelSaleReason);
      triggerAlert('success', `Sale #SO-${saleToCancel.id} cancelled. Stock restored.`);
      setCancelSaleModalOpen(false);
      fetchSalesData();
      fetchSalesMetricsData();
      fetchProductsData();
      fetchDashboardData();
    } catch (err) {
      triggerAlert('error', 'Cancellation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setCancellingSale(false);
    }
  };

  // Purchase Order Handlers
  const openNewPoModal = (prefillProductId = null, prefillSupplierId = null, prefillQty = 10) => {
    if (suppliers.length === 0) {
      triggerAlert('error', 'Please create a supplier before drafting purchase orders.');
      setActiveTab('purchasing');
      setPurchasingSubTab('suppliers');
      return;
    }

    const targetSupplierId = prefillSupplierId || suppliers[0].id;
    let initialItems = [{ productId: products[0]?.id || '', quantity: prefillQty, unitCostRupees: '' }];
    if (prefillProductId) {
      const prod = products.find((p) => p.id === prefillProductId);
      initialItems = [{
        productId: prefillProductId,
        quantity: prefillQty,
        unitCostRupees: prod ? paiseToRupees(prod.purchasePricePaise) : ''
      }];
    }

    setEditingPo(null);
    setPoForm({
      supplierId: String(targetSupplierId),
      notes: 'Standard stock replenishment',
      items: initialItems
    });
    setPoFormError('');
    setPoModalOpen(true);
  };

  const handleAddPoItemRow = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { productId: products[0]?.id || '', quantity: 10, unitCostRupees: '' }]
    });
  };

  const handleRemovePoItemRow = (idx) => {
    const updated = poForm.items.filter((_, i) => i !== idx);
    setPoForm({ ...poForm, items: updated });
  };

  const handlePoItemChange = (idx, field, val) => {
    const updated = [...poForm.items];
    updated[idx] = { ...updated[idx], [field]: val };

    // Auto prefill default unit cost from product catalog if changed product
    if (field === 'productId') {
      const prod = products.find((p) => p.id === Number(val));
      if (prod) {
        updated[idx].unitCostRupees = paiseToRupees(prod.purchasePricePaise);
      }
    }
    setPoForm({ ...poForm, items: updated });
  };

  const poCalculations = useMemo(() => {
    let totalPaise = 0;
    const items = poForm.items.map((row) => {
      const prod = products.find((p) => p.id === Number(row.productId));
      const unitCostPaise = row.unitCostRupees !== ''
        ? rupeesToPaise(row.unitCostRupees)
        : (prod ? prod.purchasePricePaise : 0);
      const qty = parseInt(row.quantity, 10) || 0;
      const lineTotal = qty * unitCostPaise;
      totalPaise += lineTotal;
      return {
        ...row,
        product: prod,
        unitCostPaise,
        lineTotalPaise: lineTotal
      };
    });
    return { items, totalPaise };
  }, [poForm, products]);

  const handleSavePurchaseOrder = async (placeImmediately = false) => {
    setPoFormError('');
    if (!poForm.supplierId) {
      setPoFormError('Please select a supplier.');
      return;
    }
    if (poCalculations.items.length === 0) {
      setPoFormError('PO must contain at least one item line.');
      return;
    }

    for (const item of poCalculations.items) {
      if (!item.productId) {
        setPoFormError('Product is required on all lines.');
        return;
      }
      if (item.quantity <= 0) {
        setPoFormError('Quantity must be greater than zero.');
        return;
      }
    }

    setSavingPo(true);
    try {
      const payload = {
        supplierId: parseInt(poForm.supplierId, 10),
        notes: poForm.notes.trim(),
        items: poCalculations.items.map((i) => ({
          productId: Number(i.productId),
          quantity: parseInt(i.quantity, 10),
          unitCostPaise: i.unitCostPaise
        }))
      };

      let poResult;
      if (editingPo) {
        poResult = await updatePurchaseOrder(editingPo.id, payload);
        triggerAlert('success', `Draft PO #${editingPo.id} updated.`);
      } else {
        poResult = await createPurchaseOrder(payload);
        triggerAlert('success', `Draft PO #${poResult.id} created.`);
      }

      if (placeImmediately && poResult?.id) {
        await placePurchaseOrder(poResult.id);
        triggerAlert('success', `PO #${poResult.id} placed with vendor.`);
      }

      setPoModalOpen(false);
      fetchPurchaseOrdersData();
    } catch (err) {
      setPoFormError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSavingPo(false);
    }
  };

  const handlePlaceOrder = async (poId) => {
    try {
      await placePurchaseOrder(poId);
      triggerAlert('success', `Purchase order #${poId} placed with vendor.`);
      fetchPurchaseOrdersData();
    } catch (err) {
      triggerAlert('error', 'Failed to place PO: ' + (err.response?.data?.error || err.message));
    }
  };

  const viewPoDetails = async (poId) => {
    setLoadingPoDetail(true);
    setPoDetailModalOpen(true);
    try {
      const data = await getPurchaseOrderById(poId);
      setSelectedPoDetail(data);
    } catch (err) {
      triggerAlert('error', 'Failed to load PO details: ' + (err.response?.data?.error || err.message));
      setPoDetailModalOpen(false);
    } finally {
      setLoadingPoDetail(false);
    }
  };

  const openReceiveModal = async (poId) => {
    setReceiveError('');
    try {
      const data = await getPurchaseOrderById(poId);
      setReceivingPo(data);
      // Pre-fill quantities with remaining quantity
      const initQtys = {};
      data.items.forEach((item) => {
        initQtys[item.id] = item.remainingQuantity;
      });
      setReceiveItemQuantities(initQtys);
      setReceiveModalOpen(true);
    } catch (err) {
      triggerAlert('error', 'Failed to fetch PO: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmitReceive = async (e) => {
    e.preventDefault();
    setReceiveError('');

    if (!receivingPo) return;

    const receiptItems = [];
    for (const item of receivingPo.items) {
      const q = parseInt(receiveItemQuantities[item.id], 10) || 0;
      if (q > 0) {
        if (q > item.remainingQuantity) {
          setReceiveError(`Cannot receive ${q} for "${item.productNameSnapshot}" (only ${item.remainingQuantity} remaining).`);
          return;
        }
        receiptItems.push({
          purchaseOrderItemId: item.id,
          quantity: q
        });
      }
    }

    if (receiptItems.length === 0) {
      setReceiveError('Enter at least 1 unit to receive.');
      return;
    }

    setSubmittingReceive(true);
    try {
      const res = await receivePurchaseOrder(receivingPo.id, { items: receiptItems });
      triggerAlert('success', `Received stock for PO #${receivingPo.id}. Status is now ${res.status}.`);
      setReceiveModalOpen(false);
      fetchPurchaseOrdersData();
      fetchProductsData();
      fetchDashboardData();
      fetchMovementsData();
    } catch (err) {
      setReceiveError(err.response?.data?.error || err.message || 'Receipt failed');
    } finally {
      setSubmittingReceive(false);
    }
  };

  const confirmCancelPo = (po) => {
    setPoToCancel(po);
    setCancelPoReason('Vendor unavailable');
    setCancelPoModalOpen(true);
  };

  const handleCancelPo = async () => {
    if (!poToCancel) return;
    setCancellingPo(true);
    try {
      await cancelPurchaseOrder(poToCancel.id, cancelPoReason);
      triggerAlert('success', `PO #${poToCancel.id} has been cancelled.`);
      setCancelPoModalOpen(false);
      fetchPurchaseOrdersData();
    } catch (err) {
      triggerAlert('error', 'Cancellation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setCancellingPo(false);
    }
  };

  // Supplier CRUD Handlers
  const openAddSupplierModal = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setSupplierFormError('');
    setSupplierModalOpen(true);
  };

  const openEditSupplierModal = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      notes: sup.notes || ''
    });
    setSupplierFormError('');
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setSupplierFormError('');

    if (!supplierForm.name.trim()) {
      setSupplierFormError('Supplier Name is required.');
      return;
    }

    setSavingSupplier(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm);
        triggerAlert('success', `Supplier "${supplierForm.name}" updated.`);
      } else {
        await createSupplier(supplierForm);
        triggerAlert('success', `Supplier "${supplierForm.name}" added.`);
      }
      setSupplierModalOpen(false);
      fetchSuppliersData();
    } catch (err) {
      setSupplierFormError(err.response?.data?.error || err.message || 'Failed to save supplier');
    } finally {
      setSavingSupplier(false);
    }
  };

  const confirmDeleteSupplier = (sup) => {
    setSupplierToDelete(sup);
    setDeleteSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setDeletingSupplier(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      triggerAlert('success', `Supplier "${supplierToDelete.name}" deleted.`);
      setDeleteSupplierModalOpen(false);
      fetchSuppliersData();
    } catch (err) {
      triggerAlert('error', err.response?.data?.error || err.message || 'Failed to delete supplier');
      setDeleteSupplierModalOpen(false);
    } finally {
      setDeletingSupplier(false);
    }
  };

  const viewSupplierProducts = async (sup) => {
    setSelectedSupplierForProducts(sup);
    setSupplierProductsModalOpen(true);
    setLoadingSupplierProducts(true);
    try {
      const data = await getSupplierProducts(sup.id);
      setSupplierProductsList(data || []);
    } catch (err) {
      triggerAlert('error', 'Failed to load supplier products: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingSupplierProducts(false);
    }
  };

  // Operating Expense Actions
  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: 'Rent',
      description: '',
      amountRupees: '',
      date: reportDate || getKolkataToday(),
      notes: ''
    });
    setExpenseFormError('');
    setExpenseModalOpen(true);
  };

  const openEditExpenseModal = (exp) => {
    setEditingExpense(exp);
    const dateStr = exp.createdAt ? exp.createdAt.split('T')[0].split(' ')[0] : getKolkataToday();
    setExpenseForm({
      category: exp.category || 'Other',
      description: exp.description || '',
      amountRupees: paiseToRupees(exp.amountPaise),
      date: dateStr,
      notes: ''
    });
    setExpenseFormError('');
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setExpenseFormError('');

    if (!expenseForm.category?.trim()) {
      setExpenseFormError('Category is required.');
      return;
    }
    const rupees = parseFloat(expenseForm.amountRupees);
    if (isNaN(rupees) || rupees < 0) {
      setExpenseFormError('Amount must be a non-negative number.');
      return;
    }
    const amountPaise = rupeesToPaise(rupees);

    setSavingExpense(true);
    try {
      const payload = {
        category: expenseForm.category.trim(),
        amountPaise,
        description: expenseForm.description?.trim() || null,
        date: expenseForm.date?.trim() || null
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        triggerAlert('success', 'Expense updated successfully.');
      } else {
        await createExpense(payload);
        triggerAlert('success', `Expense of ${formatPaise(amountPaise)} recorded.`);
      }

      setExpenseModalOpen(false);
      fetchAllReportData();
    } catch (err) {
      setExpenseFormError(err.response?.data?.error || err.message || 'Failed to save expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const confirmDeleteExpense = (exp) => {
    setExpenseToDelete(exp);
    setDeleteExpenseModalOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setDeletingExpense(true);
    try {
      await deleteExpense(expenseToDelete.id);
      triggerAlert('success', `Expense #${expenseToDelete.id} deleted.`);
      setDeleteExpenseModalOpen(false);
      setExpenseToDelete(null);
      fetchAllReportData();
    } catch (err) {
      triggerAlert('error', err.response?.data?.error || err.message || 'Failed to delete expense');
    } finally {
      setDeletingExpense(false);
    }
  };

  // CSV Report Export Handler
  const handleExportCSV = () => {
    if (!summaryReport && !pnlReport) {
      triggerAlert('error', 'No report data available to export.');
      return;
    }

    const rows = [];
    rows.push(['STOCKPILE FINANCIAL & BUSINESS REPORT']);
    rows.push(['Generated At', new Date().toISOString()]);
    rows.push(['Period Type', summaryReport?.periodType || reportPeriod]);
    rows.push(['From Date', summaryReport?.from || '']);
    rows.push(['To Date', summaryReport?.to || '']);
    rows.push(['Currency', summaryReport?.currency || 'INR']);
    rows.push([]);

    rows.push(['1. EXECUTIVE FINANCIAL SUMMARY']);
    rows.push(['Metric', 'Amount (INR)', 'Paise']);
    rows.push(['Gross Sales', ((summaryReport?.grossSalesPaise || 0) / 100).toFixed(2), summaryReport?.grossSalesPaise || 0]);
    rows.push(['Discounts', ((summaryReport?.discountsPaise || 0) / 100).toFixed(2), summaryReport?.discountsPaise || 0]);
    rows.push(['Net Revenue', ((summaryReport?.netRevenuePaise || 0) / 100).toFixed(2), summaryReport?.netRevenuePaise || 0]);
    rows.push(['Cost of Goods Sold (COGS)', ((summaryReport?.cogsPaise || 0) / 100).toFixed(2), summaryReport?.cogsPaise || 0]);
    rows.push(['Gross Profit', ((summaryReport?.grossProfitPaise || 0) / 100).toFixed(2), summaryReport?.grossProfitPaise || 0]);
    rows.push(['Gross Margin %', `${pnlReport?.grossMarginPercentage ?? 0}%`, '']);
    rows.push(['Total Inventory Loss', ((summaryReport?.inventoryLossPaise || 0) / 100).toFixed(2), summaryReport?.inventoryLossPaise || 0]);
    rows.push(['Operating Expenses', ((summaryReport?.operatingExpensesPaise || 0) / 100).toFixed(2), summaryReport?.operatingExpensesPaise || 0]);
    rows.push(['Operating Result Before Tax', ((summaryReport?.operatingResultPaise || 0) / 100).toFixed(2), summaryReport?.operatingResultPaise || 0]);
    rows.push(['Net Margin %', `${pnlReport?.netMarginPercentage ?? 0}%`, '']);
    rows.push(['Total Purchases (Procurement)', ((summaryReport?.totalPurchasesPaise || 0) / 100).toFixed(2), summaryReport?.totalPurchasesPaise || 0]);
    rows.push(['Purchase Orders Count', summaryReport?.purchaseOrdersCount || 0, '']);
    rows.push(['Completed Sales Orders', summaryReport?.completedSalesCount || 0, '']);
    rows.push(['Total Items Sold', summaryReport?.unitsSold || 0, '']);
    rows.push([]);

    rows.push(['2. PERIOD BREAKDOWN']);
    rows.push(['Period', 'Gross Sales (INR)', 'Discounts (INR)', 'Net Revenue (INR)', 'COGS (INR)', 'Gross Profit (INR)', 'Loss (INR)', 'Expenses (INR)', 'Operating Result (INR)', 'Sales Count', 'Units Sold']);
    (summaryReport?.breakdown || []).forEach(b => {
      rows.push([
        b.period,
        (b.grossSalesPaise / 100).toFixed(2),
        (b.discountsPaise / 100).toFixed(2),
        (b.netRevenuePaise / 100).toFixed(2),
        (b.cogsPaise / 100).toFixed(2),
        (b.grossProfitPaise / 100).toFixed(2),
        (b.inventoryLossPaise / 100).toFixed(2),
        (b.operatingExpensesPaise / 100).toFixed(2),
        (b.operatingResultPaise / 100).toFixed(2),
        b.salesCount,
        b.unitsSold
      ]);
    });
    rows.push([]);

    if (salesReport?.topSellingProducts?.length) {
      rows.push(['3. TOP SELLING PRODUCTS']);
      rows.push(['Product Name', 'SKU', 'Category', 'Units Sold', 'Revenue (INR)', 'COGS (INR)', 'Gross Profit (INR)']);
      salesReport.topSellingProducts.forEach(tp => {
        rows.push([
          tp.productName,
          tp.sku,
          tp.category,
          tp.unitsSold,
          (tp.totalRevenuePaise / 100).toFixed(2),
          (tp.totalCostPaise / 100).toFixed(2),
          (tp.grossProfitPaise / 100).toFixed(2)
        ]);
      });
      rows.push([]);
    }

    if (lossReport?.incidents?.length) {
      rows.push(['4. INVENTORY LOSS INCIDENTS']);
      rows.push(['Movement ID', 'Product Name', 'SKU', 'Units Lost', 'Unit Cost (INR)', 'Total Loss (INR)', 'Reason', 'Created At']);
      lossReport.incidents.forEach(inc => {
        rows.push([
          inc.movementId,
          inc.productName,
          inc.sku,
          inc.unitsLost,
          (inc.unitCostPaise / 100).toFixed(2),
          (inc.totalLossPaise / 100).toFixed(2),
          inc.reason,
          inc.createdAt
        ]);
      });
      rows.push([]);
    }

    if (purchasesReport?.orders?.length) {
      rows.push(['5. PURCHASING ORDERS']);
      rows.push(['Order ID', 'Supplier', 'Status', 'Total Amount (INR)', 'Items', 'Ordered Qty', 'Received Qty', 'Created At']);
      purchasesReport.orders.forEach(po => {
        rows.push([
          po.id,
          po.supplierName,
          po.status,
          (po.totalAmountPaise / 100).toFixed(2),
          po.itemCount,
          po.totalQuantityOrdered,
          po.totalQuantityReceived,
          po.createdAt
        ]);
      });
      rows.push([]);
    }

    const csvContent = rows
      .map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    triggerAlert('success', 'Report exported to CSV successfully.');
  };

  // --- SURPLUS STOCK HANDLERS ---
  const handleOpenCreateSurplus = (product = null, suggestedQty = null) => {
    setCreateSurplusError('');
    if (product) {
      const prodId = product.productId || product.id;
      const full = surplusSuggestions.find((s) => String(s.productId) === String(prodId)) || product;
      setSelectedProductForSurplus(full);
      const avail = full.availableQuantity !== undefined
        ? full.availableQuantity
        : Math.max(0, (full.quantity || 0) - (full.reservedQuantity || 0));
      const qty = suggestedQty && suggestedQty > 0 ? Math.min(suggestedQty, avail) : (avail > 0 ? Math.min(avail, 5) : 1);
      const normalPricePaise = full.normalSellingPricePaise || full.sellingPricePaise || 0;
      // Default to 15% discount if normal price exists
      const discountedRupees = normalPricePaise > 0 ? Math.round((normalPricePaise * 0.85) / 100) : '';
      setCreateSurplusForm({
        productId: String(prodId),
        quantity: qty > 0 ? String(qty) : '1',
        discountedPriceRupees: discountedRupees ? String(discountedRupees) : '',
        notes: full.recommendationReason || 'Clearance promotional listing'
      });
    } else {
      setSelectedProductForSurplus(null);
      setCreateSurplusForm({
        productId: '',
        quantity: '1',
        discountedPriceRupees: '',
        notes: ''
      });
    }
    setCreateSurplusModalOpen(true);
  };

  const handleSelectProductForSurplus = (prodId) => {
    const full = surplusSuggestions.find((s) => String(s.productId) === String(prodId)) ||
                 products.find((p) => String(p.id) === String(prodId));
    setSelectedProductForSurplus(full || null);
    if (full) {
      const normalPricePaise = full.normalSellingPricePaise || full.sellingPricePaise || 0;
      const discountedRupees = normalPricePaise > 0 ? Math.round((normalPricePaise * 0.85) / 100) : '';
      const avail = full.availableQuantity !== undefined
        ? full.availableQuantity
        : Math.max(0, (full.quantity || 0) - (full.reservedQuantity || 0));
      const suggestedQty = full.suggestedSurplusQuantity > 0
        ? full.suggestedSurplusQuantity
        : (avail > 0 ? Math.min(avail, 5) : 1);
      setCreateSurplusForm((prev) => ({
        ...prev,
        productId: String(prodId),
        quantity: prev.quantity || String(suggestedQty),
        discountedPriceRupees: prev.discountedPriceRupees || (discountedRupees ? String(discountedRupees) : ''),
        notes: prev.notes || full.recommendationReason || 'Clearance promotional listing'
      }));
    }
  };

  const handleSubmitCreateSurplus = async (e) => {
    e.preventDefault();
    if (submittingCreateSurplus) return;
    setCreateSurplusError('');
    const prodId = Number(createSurplusForm.productId);
    const qty = parseInt(createSurplusForm.quantity, 10);
    const priceRupees = parseFloat(createSurplusForm.discountedPriceRupees);

    if (!prodId) {
      setCreateSurplusError('Please select a product for the clearance listing.');
      return;
    }
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(Number(createSurplusForm.quantity))) {
      setCreateSurplusError('Quantity to list must be a positive whole integer.');
      return;
    }

    // Validate available unreserved stock
    const avail = selectedProductForSurplus
      ? (selectedProductForSurplus.availableQuantity !== undefined
          ? selectedProductForSurplus.availableQuantity
          : Math.max(0, (selectedProductForSurplus.quantity || 0) - (selectedProductForSurplus.reservedQuantity || 0)))
      : Infinity;
    if (qty > avail) {
      setCreateSurplusError(`Quantity to list (${qty}) exceeds available unreserved stock (${avail} units).`);
      return;
    }

    if (isNaN(priceRupees) || priceRupees <= 0) {
      setCreateSurplusError('Discounted clearance selling price must be greater than ₹0.');
      return;
    }

    // Validate discounted price is lower than regular price
    const origPaise = selectedProductForSurplus
      ? (selectedProductForSurplus.normalSellingPricePaise || selectedProductForSurplus.sellingPricePaise || 0)
      : 0;
    const pricePaise = rupeesToPaise(priceRupees);
    if (origPaise > 0 && pricePaise >= origPaise) {
      setCreateSurplusError(`Discounted price (${formatPaise(pricePaise)}) must be lower than the regular selling price (${formatPaise(origPaise)}).`);
      return;
    }

    const reasonVal = createSurplusForm.notes?.trim() || 'Clearance promotional listing';

    setSubmittingCreateSurplus(true);
    try {
      await createSurplusListing({
        productId: prodId,
        quantity: qty,
        discountedPricePaise: pricePaise,
        reason: reasonVal,
        notes: reasonVal
      });
      triggerAlert('success', `Created surplus clearance listing for ${qty} units!`);
      setCreateSurplusModalOpen(false);
      setSurplusSubTab('listings');
      await fetchSurplusData();
      await fetchProductsData('', '');
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to create surplus listing:', err);
      setCreateSurplusError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create surplus listing.');
    } finally {
      setSubmittingCreateSurplus(false);
    }
  };

  const handleOpenSurplusSale = (listing) => {
    setSurplusListingForSale(listing);
    setSurplusSaleForm({
      quantity: 1,
      paymentMethod: 'CASH',
      notes: ''
    });
    setSurplusSaleError('');
    setSurplusSaleModalOpen(true);
  };

  const handleSubmitSurplusSale = async (e) => {
    e.preventDefault();
    if (!surplusListingForSale) return;
    setSurplusSaleError('');
    const qty = parseInt(surplusSaleForm.quantity, 10);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(Number(surplusSaleForm.quantity))) {
      setSurplusSaleError('Sale quantity must be a positive whole integer.');
      return;
    }
    if (qty > surplusListingForSale.quantityRemaining) {
      setSurplusSaleError(`Cannot sell more than remaining listed units (${surplusListingForSale.quantityRemaining}).`);
      return;
    }

    setSubmittingSurplusSale(true);
    try {
      await recordSurplusSale(surplusListingForSale.id, {
        quantity: qty,
        paymentMethod: surplusSaleForm.paymentMethod || 'CASH',
        notes: surplusSaleForm.notes?.trim() || 'Clearance sale'
      });
      triggerAlert('success', `Successfully sold ${qty} clearance unit${qty > 1 ? 's' : ''} of ${surplusListingForSale.productName}!`);
      setSurplusSaleModalOpen(false);
      await fetchSurplusData();
      await fetchProductsData('', '');
      await fetchSalesData(salesStatusFilter);
      await fetchSalesMetricsData();
      await fetchSalesTrendData();
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to record surplus sale:', err);
      setSurplusSaleError(err.response?.data?.message || err.message || 'Failed to record surplus sale.');
    } finally {
      setSubmittingSurplusSale(false);
    }
  };

  const handleOpenCancelSurplus = (listing) => {
    setSurplusListingToCancel(listing);
    setCancelSurplusReason('Clearance promo concluded / unsold stock restored');
    setCancelSurplusModalOpen(true);
  };

  const handleConfirmCancelSurplus = async () => {
    if (!surplusListingToCancel) return;
    setSubmittingCancelSurplus(true);
    try {
      await cancelSurplusListing(surplusListingToCancel.id, {
        reason: cancelSurplusReason || 'Cancelled by user'
      });
      triggerAlert('success', `Cancelled listing #${surplusListingToCancel.id}. Unsold units restored to available inventory.`);
      setCancelSurplusModalOpen(false);
      await fetchSurplusData();
      await fetchProductsData('', '');
    } catch (err) {
      console.error('Failed to cancel surplus listing:', err);
      triggerAlert('error', err.response?.data?.message || err.message || 'Failed to cancel listing.');
    } finally {
      setSubmittingCancelSurplus(false);
    }
  };

  const handleOpenSurplusDetail = async (listing) => {
    setSelectedSurplusDetail(listing);
    setSurplusDetailModalOpen(true);
    await fetchSelectedSurplusDetail(listing.id);
  };


  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* ================= FIXED DESKTOP & MOBILE SIDEBAR ================= */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        health={health}
        loadingHealth={loadingHealth}
        fetchHealthData={fetchHealthData}
      />

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative pb-16 lg:pb-0">
        {/* Global Toast Alert */}
        <ToastAlert alert={alert} onClose={() => setAlert(null)} />

        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setMobileMenuOpen={setMobileMenuOpen}
          openNewSaleModal={openNewSaleModal}
          openNewPoModal={() => openNewPoModal()}
        />

        {/* Content Container */}
        <main className="p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center p-12 min-h-[350px] space-y-3">
                  <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">Loading view...</span>
                </div>
              }
            >
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <Dashboard
              dashboard={dashboard}
              loadingDashboard={loadingDashboard}
              products={products}
              purchaseOrders={purchaseOrders}
              overviewPeriod={overviewPeriod}
              setOverviewPeriod={setOverviewPeriod}
              overviewCustomFrom={overviewCustomFrom}
              setOverviewCustomFrom={setOverviewCustomFrom}
              overviewCustomTo={overviewCustomTo}
              setOverviewCustomTo={setOverviewCustomTo}
              onPeriodChange={(period, from, to) => fetchDashboardData(period, from, to)}
              fetchDashboardData={fetchDashboardData}
              salesMetrics={salesMetrics}
              salesTrend={salesTrend}
              salesIntelligence={salesIntelligence}
              attentionItems={attentionItems}
              setActiveTab={setActiveTab}
              openAddProductModal={openAddProductModal}
              openNewSaleModal={openNewSaleModal}
              openNewPoModal={openNewPoModal}
              openReceiveModal={openReceiveModal}
              openQuickActionModal={openQuickActionModal}
            />
          )}

          {activeTab === 'products' && (
            <Products
              products={products}
              loadingProducts={loadingProducts}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              stockStatusFilter={stockStatusFilter}
              setStockStatusFilter={setStockStatusFilter}
              productsPage={productsPage}
              setProductsPage={setProductsPage}
              productsPageSize={productsPageSize}
              setProductsPageSize={setProductsPageSize}
              fetchProductsData={fetchProductsData}
              openAddProductModal={openAddProductModal}
              openEditProductModal={openEditProductModal}
              openDeleteProductModal={confirmDeleteProduct}
              openQuickActionModal={openQuickActionModal}
            />
          )}

          {activeTab === 'sales' && (
            <Sales
              sales={sales}
              loadingSales={loadingSales}
              salesStatusFilter={salesStatusFilter}
              setSalesStatusFilter={setSalesStatusFilter}
              salesDateFrom={salesDateFrom}
              setSalesDateFrom={setSalesDateFrom}
              salesDateTo={salesDateTo}
              setSalesDateTo={setSalesDateTo}
              salesPage={salesPage}
              setSalesPage={setSalesPage}
              salesPageSize={salesPageSize}
              setSalesPageSize={setSalesPageSize}
              salesMetrics={salesMetrics}
              openNewSaleModal={openNewSaleModal}
              viewSaleDetails={viewSaleDetails}
              confirmCancelSale={confirmCancelSale}
              fetchSalesData={fetchSalesData}
            />
          )}

          {activeTab === 'purchasing' && (
            <Purchasing
              purchasingSubTab={purchasingSubTab}
              setPurchasingSubTab={setPurchasingSubTab}
              purchaseOrders={purchaseOrders}
              loadingPurchaseOrders={loadingPurchaseOrders}
              poStatusFilter={poStatusFilter}
              setPoStatusFilter={setPoStatusFilter}
              poSupplierFilter={poSupplierFilter}
              setPoSupplierFilter={setPoSupplierFilter}
              poDateFrom={poDateFrom}
              setPoDateFrom={setPoDateFrom}
              poDateTo={poDateTo}
              setPoDateTo={setPoDateTo}
              poPage={poPage}
              setPoPage={setPoPage}
              poPageSize={poPageSize}
              setPoPageSize={setPoPageSize}
              suppliers={suppliers}
              loadingSuppliers={loadingSuppliers}
              supplierSearch={supplierSearch}
              setSupplierSearch={setSupplierSearch}
              openNewPoModal={openNewPoModal}
              handlePlaceOrder={handlePlaceOrder}
              openReceiveModal={openReceiveModal}
              confirmCancelPo={confirmCancelPo}
              viewPoDetails={viewPoDetails}
              openAddSupplierModal={openAddSupplierModal}
              openEditSupplierModal={openEditSupplierModal}
              confirmDeleteSupplier={confirmDeleteSupplier}
              viewSupplierProducts={viewSupplierProducts}
              fetchPurchaseOrdersData={fetchPurchaseOrdersData}
              fetchSuppliersData={fetchSuppliersData}
            />
          )}

          {activeTab === 'stock-control' && (
            <StockControl
              stockControlSubTab={stockControlSubTab}
              setStockControlSubTab={setStockControlSubTab}
              movements={movements}
              loadingMovements={loadingMovements}
              movementProductFilter={movementProductFilter}
              setMovementProductFilter={setMovementProductFilter}
              movementTypeFilter={movementTypeFilter}
              setMovementTypeFilter={setMovementTypeFilter}
              movementDateFrom={movementDateFrom}
              setMovementDateFrom={setMovementDateFrom}
              movementDateTo={movementDateTo}
              setMovementDateTo={setMovementDateTo}
              movementsPage={movementsPage}
              setMovementsPage={setMovementsPage}
              movementsPageSize={movementsPageSize}
              setMovementsPageSize={setMovementsPageSize}
              products={products}
              audits={audits}
              auditSummary={auditSummary}
              loadingAudits={loadingAudits}
              auditFilter={auditFilter}
              setAuditFilter={setAuditFilter}
              auditDateFrom={auditDateFrom}
              setAuditDateFrom={setAuditDateFrom}
              auditDateTo={auditDateTo}
              setAuditDateTo={setAuditDateTo}
              auditsPage={auditsPage}
              setAuditsPage={setAuditsPage}
              auditsPageSize={auditsPageSize}
              setAuditsPageSize={setAuditsPageSize}
              selectedAudit={selectedAudit}
              setSelectedAudit={setSelectedAudit}
              selectedAuditId={selectedAuditId}
              setSelectedAuditId={setSelectedAuditId}
              dashboard={dashboard}
              quickActionForm={quickActionForm}
              setQuickActionForm={setQuickActionForm}
              submittingQuickAction={submittingQuickAction}
              handleQuickActionSubmit={handleQuickActionSubmit}
              loadingSelectedAudit={loadingSelectedAudit}
              auditItemSearch={auditItemSearch}
              setAuditItemSearch={setAuditItemSearch}
              auditItemFilter={auditItemFilter}
              setAuditItemFilter={setAuditItemFilter}
              openQuickActionModal={openQuickActionModal}
              openStartAuditModal={openStartAuditModal}
              selectAuditForView={selectAuditForView}
              openCountModal={openCountModal}
              openCompleteAuditModal={openCompleteAuditModal}
              openCancelAuditModal={openCancelAuditModal}
              fetchMovementsData={fetchMovementsData}
              fetchAuditsData={fetchAuditsData}
            />
          )}

          {activeTab === 'insights' && (
            <Insights
              salesIntelligence={salesIntelligence}
              loadingIntelligence={loadingIntelligence}
              intelFilter={intelFilter}
              setIntelFilter={setIntelFilter}
              fetchIntelligenceData={fetchIntelligenceData}
              openNewPoModal={openNewPoModal}
            />
          )}

          {activeTab === 'surplus' && (
            <SurplusStock
              surplusSubTab={surplusSubTab}
              setSurplusSubTab={setSurplusSubTab}
              surplusSummary={surplusSummary}
              surplusSuggestions={surplusSuggestions}
              surplusListings={surplusListings}
              surplusStatusFilter={surplusStatusFilter}
              setSurplusStatusFilter={setSurplusStatusFilter}
              surplusSearch={surplusSearch}
              setSurplusSearch={setSurplusSearch}
              surplusCategoryFilter={surplusCategoryFilter}
              setSurplusCategoryFilter={setSurplusCategoryFilter}
              loadingSurplus={loadingSurplus}
              surplusError={surplusError}
              handleOpenCreateSurplus={handleOpenCreateSurplus}
              handleOpenSurplusSale={handleOpenSurplusSale}
              handleOpenCancelSurplus={handleOpenCancelSurplus}
              handleOpenSurplusDetail={handleOpenSurplusDetail}
              fetchSurplusData={fetchSurplusData}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              reportPeriod={reportPeriod}
              setReportPeriod={setReportPeriod}
              reportDate={reportDate}
              setReportDate={setReportDate}
              reportMonth={reportMonth}
              setReportMonth={setReportMonth}
              reportYear={reportYear}
              setReportYear={setReportYear}
              reportFrom={reportFrom}
              setReportFrom={setReportFrom}
              reportTo={reportTo}
              setReportTo={setReportTo}
              reportSubTab={reportSubTab}
              setReportSubTab={setReportSubTab}
              summaryReport={summaryReport}
              pnlReport={pnlReport}
              salesReport={salesReport}
              lossReport={lossReport}
              purchasesReport={purchasesReport}
              expensesList={expensesList}
              loadingReports={loadingReports}
              reportsError={reportsError}
              expenseCategoryFilter={expenseCategoryFilter}
              setExpenseCategoryFilter={setExpenseCategoryFilter}
              expenseDateFrom={expenseDateFrom}
              setExpenseDateFrom={setExpenseDateFrom}
              expenseDateTo={expenseDateTo}
              setExpenseDateTo={setExpenseDateTo}
              expensesPage={expensesPage}
              setExpensesPage={setExpensesPage}
              expensesPageSize={expensesPageSize}
              setExpensesPageSize={setExpensesPageSize}
              openAddExpenseModal={openAddExpenseModal}
              openEditExpenseModal={openEditExpenseModal}
              confirmDeleteExpense={confirmDeleteExpense}
              fetchAllReportData={fetchAllReportData}
              fetchReportsData={fetchAllReportData}
              setReportsError={setReportsError}
              handleExportCSV={handleExportCSV}
            />
          )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* ================= MODALS & DIALOGS SECTION ================= */}
      {/* 1. Product Modals */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        productFormError={productFormError}
        savingProduct={savingProduct}
        showAdvancedProduct={showAdvancedProduct}
        setShowAdvancedProduct={setShowAdvancedProduct}
        handleProductNameChange={handleProductNameChange}
        handleProductCategoryChange={handleProductCategoryChange}
        handleSaveProduct={handleSaveProduct}
        suppliers={suppliers}
        setSkuManuallyEdited={setSkuManuallyEdited}
      />
      <DeleteProductModal
        isOpen={deleteProductModalOpen}
        onClose={() => setDeleteProductModalOpen(false)}
        productToDelete={productToDelete}
        deletingProduct={deletingProduct}
        handleDeleteProduct={handleDeleteProduct}
      />

      {/* 2. Sales Modals (POS Checkout, Details, Cancellation) */}
      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        saleSuccessData={saleSuccessData}
        setSaleSuccessData={setSaleSuccessData}
        openNewSaleModal={openNewSaleModal}
        saleCart={saleCart}
        setSaleCart={setSaleCart}
        saleDiscountPercent={saleDiscountPercent}
        setSaleDiscountPercent={setSaleDiscountPercent}
        salePaymentMethod={salePaymentMethod}
        setSalePaymentMethod={setSalePaymentMethod}
        submittingSale={submittingSale}
        saleFormError={saleFormError}
        setSaleFormError={setSaleFormError}
        saleProductSearchQuery={saleProductSearchQuery}
        setSaleProductSearchQuery={setSaleProductSearchQuery}
        showClearCartConfirm={showClearCartConfirm}
        setShowClearCartConfirm={setShowClearCartConfirm}
        saleRequiresConfirm={saleRequiresConfirm}
        setSaleRequiresConfirm={setSaleRequiresConfirm}
        saleSearchInputRef={saleSearchInputRef}
        products={products}
        cartCalculations={cartCalculations}
        searchFilteredProducts={searchFilteredProducts}
        viewSaleDetails={viewSaleDetails}
        handleAddToCart={handleAddToCart}
        handleAddCartRow={handleAddCartRow}
        handleCartItemChange={handleCartItemChange}
        handleRemoveCartRow={handleRemoveCartRow}
        handleUpdateQuantity={handleUpdateQuantity}
        handleCustomPriceChange={handleCustomPriceChange}
        handleResetItemPrice={handleResetItemPrice}
        handleClearCart={handleClearCart}
        handleCheckoutSale={handleCheckoutSale}
      />
      <SaleDetailModal
        isOpen={saleDetailModalOpen}
        onClose={() => setSaleDetailModalOpen(false)}
        selectedSaleDetail={selectedSaleDetail}
        loadingSaleDetail={loadingSaleDetail}
      />
      <CancelSaleModal
        isOpen={cancelSaleModalOpen}
        onClose={() => setCancelSaleModalOpen(false)}
        saleToCancel={saleToCancel}
        cancelSaleReason={cancelSaleReason}
        setCancelSaleReason={setCancelSaleReason}
        cancellingSale={cancellingSale}
        handleCancelSale={handleCancelSale}
      />

      {/* 3. Purchasing & Supplier Modals */}
      <PoModal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        editingPo={editingPo}
        poForm={poForm}
        setPoForm={setPoForm}
        poFormError={poFormError}
        savingPo={savingPo}
        handleSavePurchaseOrder={handleSavePurchaseOrder}
        handleSavePo={handleSavePurchaseOrder}
        suppliers={suppliers}
        products={products}
        poCalculations={poCalculations}
        handlePoItemChange={handlePoItemChange}
        handleRemovePoItemRow={handleRemovePoItemRow}
        handleAddPoItemRow={handleAddPoItemRow}
      />
      <ReceivePoModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        receivingPo={receivingPo}
        receiveItemQuantities={receiveItemQuantities}
        setReceiveItemQuantities={setReceiveItemQuantities}
        submittingReceive={submittingReceive}
        receiveError={receiveError}
        handleSubmitReceive={handleSubmitReceive}
        handleReceiveGoods={handleSubmitReceive}
      />
      <CancelPoModal
        isOpen={cancelPoModalOpen}
        onClose={() => setCancelPoModalOpen(false)}
        poToCancel={poToCancel}
        cancelPoReason={cancelPoReason}
        setCancelPoReason={setCancelPoReason}
        cancellingPo={cancellingPo}
        handleCancelPo={handleCancelPo}
      />
      <PoDetailModal
        isOpen={poDetailModalOpen}
        onClose={() => setPoDetailModalOpen(false)}
        selectedPoDetail={selectedPoDetail}
        loadingPoDetail={loadingPoDetail}
      />
      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        editingSupplier={editingSupplier}
        supplierForm={supplierForm}
        setSupplierForm={setSupplierForm}
        supplierFormError={supplierFormError}
        savingSupplier={savingSupplier}
        handleSaveSupplier={handleSaveSupplier}
      />
      <DeleteSupplierModal
        isOpen={deleteSupplierModalOpen}
        onClose={() => setDeleteSupplierModalOpen(false)}
        supplierToDelete={supplierToDelete}
        deletingSupplier={deletingSupplier}
        handleDeleteSupplier={handleDeleteSupplier}
      />
      <SupplierProductsModal
        isOpen={supplierProductsModalOpen}
        onClose={() => setSupplierProductsModalOpen(false)}
        selectedSupplierForProducts={selectedSupplierForProducts}
        supplierProductsList={supplierProductsList}
        loadingSupplierProducts={loadingSupplierProducts}
      />

      {/* 4. Stock Control & Audit Modals */}
      <QuickActionModal
        isOpen={quickActionModalOpen}
        onClose={() => setQuickActionModalOpen(false)}
        quickActionForm={quickActionForm}
        setQuickActionForm={setQuickActionForm}
        submittingQuickAction={submittingQuickAction}
        quickActionError={quickActionError}
        handleQuickActionSubmit={handleQuickActionSubmit}
        products={products}
      />
      <StartAuditModal
        isOpen={startAuditModalOpen}
        onClose={() => setStartAuditModalOpen(false)}
        auditMode={auditMode}
        setAuditMode={setAuditMode}
        selectedAuditProductIds={selectedAuditProductIds}
        setSelectedAuditProductIds={setSelectedAuditProductIds}
        auditProductSearch={auditProductSearch}
        setAuditProductSearch={setAuditProductSearch}
        auditNotes={auditNotes}
        setAuditNotes={setAuditNotes}
        submittingAudit={submittingAudit}
        handleStartAudit={handleStartAudit}
        products={products}
      />
      <CountModal
        isOpen={Boolean(countingItem)}
        onClose={() => setCountingItem(null)}
        countingItem={countingItem}
        countQuantityInput={countQuantityInput}
        setCountQuantityInput={setCountQuantityInput}
        countNotesInput={countNotesInput}
        setCountNotesInput={setCountNotesInput}
        submittingCount={submittingCount}
        handleRecordCount={handleRecordCount}
      />
      <CompleteAuditModal
        isOpen={completeAuditModalOpen && Boolean(selectedAudit)}
        onClose={() => setCompleteAuditModalOpen(false)}
        selectedAudit={selectedAudit}
        submittingCompleteAudit={submittingCompleteAudit}
        completeAuditError={completeAuditError}
        handleCompleteAudit={handleCompleteAudit}
      />
      <CancelAuditModal
        isOpen={cancelAuditModalOpen && Boolean(selectedAudit)}
        onClose={() => setCancelAuditModalOpen(false)}
        selectedAudit={selectedAudit}
        cancelAuditReason={cancelAuditReason}
        setCancelAuditReason={setCancelAuditReason}
        submittingCancelAudit={submittingCancelAudit}
        handleCancelAudit={handleCancelAudit}
      />

      {/* 5. Expense Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        editingExpense={editingExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        expenseFormError={expenseFormError}
        savingExpense={savingExpense}
        handleSaveExpense={handleSaveExpense}
      />
      <DeleteExpenseModal
        isOpen={deleteExpenseModalOpen && Boolean(expenseToDelete)}
        onClose={() => setDeleteExpenseModalOpen(false)}
        expenseToDelete={expenseToDelete}
        deletingExpense={deletingExpense}
        handleDeleteExpense={handleDeleteExpense}
      />

      {/* 6. Surplus Clearance Modals */}
      <CreateSurplusModal
        isOpen={createSurplusModalOpen}
        onClose={() => setCreateSurplusModalOpen(false)}
        createSurplusForm={createSurplusForm}
        setCreateSurplusForm={setCreateSurplusForm}
        selectedProductForSurplus={selectedProductForSurplus}
        submittingCreateSurplus={submittingCreateSurplus}
        createSurplusError={createSurplusError}
        handleSubmitCreateSurplus={handleSubmitCreateSurplus}
        handleSelectProductForSurplus={handleSelectProductForSurplus}
        products={products}
      />
      <SurplusSaleModal
        isOpen={surplusSaleModalOpen && Boolean(surplusListingForSale)}
        onClose={() => setSurplusSaleModalOpen(false)}
        surplusListingForSale={surplusListingForSale}
        surplusSaleForm={surplusSaleForm}
        setSurplusSaleForm={setSurplusSaleForm}
        submittingSurplusSale={submittingSurplusSale}
        surplusSaleError={surplusSaleError}
        handleSubmitSurplusSale={handleSubmitSurplusSale}
      />
      <CancelSurplusModal
        isOpen={cancelSurplusModalOpen && Boolean(surplusListingToCancel)}
        onClose={() => setCancelSurplusModalOpen(false)}
        surplusListingToCancel={surplusListingToCancel}
        cancelSurplusReason={cancelSurplusReason}
        setCancelSurplusReason={setCancelSurplusReason}
        submittingCancelSurplus={submittingCancelSurplus}
        handleConfirmCancelSurplus={handleConfirmCancelSurplus}
      />
      <SurplusDetailModal
        isOpen={surplusDetailModalOpen && Boolean(selectedSurplusDetail)}
        onClose={() => setSurplusDetailModalOpen(false)}
        selectedSurplusDetail={selectedSurplusDetail}
        loadingSurplusDetail={loadingSurplusDetail}
        viewSaleDetails={viewSaleDetails}
      />
    </div>
  );
}