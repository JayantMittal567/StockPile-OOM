import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  TrendingUp,
  Database,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Boxes,
  Activity,
  ArrowUpRight,
  SlidersHorizontal,
  Edit3,
  Trash2,
  X,
  ArrowDown,
  ArrowUp,
  Check,
  Info,
  Menu,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Minus,
  AlertOctagon,
  Truck,
  Users,
  ShoppingBag,
  FileText,
  BarChart3,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  DollarSign,
  Calendar,
  Percent,
  ShieldAlert,
  Sparkles,
  Filter,
  ClipboardCheck,
  Lock,
  CheckSquare,
  Square,
  ArrowLeft,
  Download,
  TrendingDown,
  Receipt,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  Briefcase,
  CalendarRange,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  getHealth,
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getMovements,
  stockIn,
  stockOut,
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
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  assignProductSupplier,
  removeProductSupplier,
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
  updateSurplusListing,
  recordSurplusSale,
  cancelSurplusListing
} from './api';

// Format integer paise into Indian Rupee currency (₹)
function formatPaise(paise = 0) {
  const rupees = (Number(paise) || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
}

// Convert paise to raw rupees number for input editing
function paiseToRupees(paise = 0) {
  return (Number(paise) || 0) / 100;
}

// Convert rupees to paise integer
function rupeesToPaise(rupees = 0) {
  return Math.round((Number(rupees) || 0) * 100);
}

// Get current date string in Asia/Kolkata timezone (YYYY-MM-DD)
function getKolkataToday() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Format SQLite timestamp string cleanly
function formatDateTime(ts) {
  if (!ts) return '—';
  try {
    const clean = ts.replace('T', ' ').split('.')[0];
    return clean;
  } catch {
    return ts;
  }
}

// Helper to auto-generate suggested SKU based on name and category
function generateSuggestedSku(name = '', category = '') {
  const cat = (category.trim().slice(0, 3) || 'PRD').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const nm = (name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 3) || 'ITM').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${cat || 'PRD'}-${nm || 'ITM'}-${rand}`;
}

// Reusable Pagination Controls Component
function PaginationBar({ currentPage, totalRecords, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  if (totalRecords === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200/80 rounded-b-2xl text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-800">{startRecord}</strong> to{' '}
          <strong className="text-slate-800">{endRecord}</strong> of{' '}
          <strong className="text-slate-800">{totalRecords}</strong> records
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto font-medium">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition font-semibold"
        >
          Previous
        </button>
        <span className="px-2 font-bold text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  );
}

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
    setLoadingProducts(true);
    try {
      const data = await getProducts(search, category);
      setProducts(data || []);
    } catch (err) {
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

  // Initial load
  useEffect(() => {
    fetchHealthData();
    fetchDashboardData();
    fetchProductsData('', '');
    fetchSuppliersData('');
    fetchSalesMetricsData();
    fetchSalesTrendData();
    fetchIntelligenceData();
    fetchPurchaseOrdersData('ALL', '');
    getSurplusSummary().then(setSurplusSummary).catch(() => {});
  }, []);

  // Fetch data specific to tab changes
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'dashboard') {
      fetchDashboardData();
      fetchSalesMetricsData();
      fetchSalesTrendData();
      fetchIntelligenceData();
      fetchPurchaseOrdersData('ALL', '');
      getSurplusSummary().then(setSurplusSummary).catch(() => {});
    } else if (activeTab === 'products') {
      fetchProductsData(searchQuery, categoryFilter);
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

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'purchasing', label: 'Purchasing', icon: Truck },
    { id: 'stock-control', label: 'Stock Control', icon: SlidersHorizontal },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'surplus', label: 'Surplus Stock', icon: Boxes },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

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

  const cartCalculations = useMemo(() => {
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
        unitSellingPricePaise,
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
  }, [saleCart, products, saleDiscountPercent]);

  const searchFilteredProducts = useMemo(() => {
    const q = saleProductSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => (p.name && p.name.toLowerCase().includes(q)) || (p.sku && p.sku.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [products, saleProductSearchQuery]);

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
      {/* ================= DESKTOP SIDEBAR (>= 1024px) ================= */}
      <aside className="hidden lg:flex w-64 h-full bg-slate-950 text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800 overflow-y-auto z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">Stockpile</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400">Inventory & Operations</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database & Engine Status Card */}
        <div className="p-4 m-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              SQLite Database
            </span>
            <button
              onClick={fetchHealthData}
              disabled={loadingHealth}
              title="Refresh database connection status"
              className="text-slate-500 hover:text-slate-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {health?.status === 'UP' ? 'Connected & Synced' : 'Database Offline'}
            </span>
          </div>
          {health?.tableCounts && (
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
              <div>Products: {health.tableCounts.products ?? 0}</div>
              <div>Sales: {health.tableCounts.sales ?? 0}</div>
              <div>Suppliers: {health.tableCounts.suppliers ?? 0}</div>
              <div>POs: {health.tableCounts.purchase_orders ?? 0}</div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-950 text-slate-300 flex flex-col justify-between p-5 z-10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <span className="font-bold text-white text-base">Stockpile</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Stockpile Suite v2.0</p>
              <p>Active SQLite storage. 100% verified transactional ledger.</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative pb-16 lg:pb-0">
        {/* Global Toast Alert */}
        {alert && (
          <div className="fixed top-4 right-4 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-3">
            <div
              className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 ${
                alert.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs font-medium">{alert.message}</div>
              <button
                onClick={() => setAlert(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight capitalize">
                {activeTab === 'overview' || activeTab === 'dashboard'
                  ? 'Business Overview'
                  : activeTab === 'products'
                  ? 'Product Catalog'
                  : activeTab === 'sales'
                  ? 'Sales & Orders'
                  : activeTab === 'purchasing'
                  ? 'Purchasing & Suppliers'
                  : activeTab === 'stock-control'
                  ? 'Stock Control & Movements'
                  : activeTab === 'insights'
                  ? 'Inventory Intelligence & Insights'
                  : activeTab === 'surplus'
                  ? 'Surplus Stock Clearance'
                  : 'Business Reports'}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Lightweight inventory & business operations for small businesses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick POS Trigger in Header */}
            <button
              onClick={openNewSaleModal}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Record Sale</span>
            </button>
            {/* Quick PO Trigger in Header */}
            <button
              onClick={() => openNewPoModal()}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New PO</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* ============================================================
              1. OVERVIEW / DASHBOARD TAB
             ============================================================ */}
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
                  <h2 className="text-sm font-bold text-slate-900">Dashboard Quick Actions</h2>
                  <p className="text-xs text-slate-500">Everyday operations at your fingertips</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                  <button
                    onClick={() => openAddProductModal()}
                    className="p-3 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-teal-600 text-white rounded-lg w-fit">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-teal-950">Add Product</p>
                      <p className="text-[10px] text-teal-700">Catalog entry</p>
                    </div>
                  </button>

                  <button
                    onClick={openNewSaleModal}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-indigo-600 text-white rounded-lg w-fit">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-indigo-950">Record Sale</p>
                      <p className="text-[10px] text-indigo-700">Customer POS</p>
                    </div>
                  </button>

                  <button
                    onClick={() => openNewPoModal()}
                    className="p-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-blue-600 text-white rounded-lg w-fit">
                      <Truck className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-blue-950">Create PO</p>
                      <p className="text-[10px] text-blue-700">Restock draft</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // If there is an ordered PO, open receive for it, else open fast intake
                      const pendingPo = purchaseOrders.find((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED');
                      if (pendingPo) {
                        openReceiveModal(pendingPo.id);
                      } else {
                        openQuickActionModal('RECEIVE');
                      }
                    }}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg w-fit">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">Receive Stock</p>
                      <p className="text-[10px] text-emerald-700">Inbound intake</p>
                    </div>
                  </button>

                  <button
                    onClick={() => openQuickActionModal('ADJUST')}
                    className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px] col-span-2 sm:col-span-1"
                  >
                    <span className="p-1.5 bg-amber-600 text-white rounded-lg w-fit">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-amber-950">Adjust Stock</p>
                      <p className="text-[10px] text-amber-700">Count audit</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 1: LIVE BUSINESS STATE (Always Reflects Current Database State) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-600" />
                      Live Business State
                    </h3>
                    <p className="text-xs text-slate-500">Real-time status of catalog, stock levels, orders, and audits</p>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                    Live State
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Total Products */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Total Products</span>
                      <Package className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                      {dashboard?.liveState?.totalProducts ?? dashboard?.totalProducts ?? products.length}
                    </div>
                    <p className="text-[10px] text-slate-500">Catalog items</p>
                  </div>

                  {/* Total Physical Stock */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Total Physical Stock</span>
                      <Boxes className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                      {dashboard?.liveState?.totalQuantity ?? dashboard?.totalQuantity ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Physical units on hand</p>
                  </div>

                  {/* Current Inventory Value */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Current Inventory Value</span>
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono truncate">
                      {formatPaise(dashboard?.liveState?.inventoryValuePaise ?? dashboard?.inventoryValuePaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Valued at purchase cost</p>
                  </div>

                  {/* Low Stock Items */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Low-Stock Products</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <span>{dashboard?.liveState?.lowStockCount ?? dashboard?.lowStockCount ?? 0}</span>
                      {(dashboard?.liveState?.lowStockCount > 0 || dashboard?.lowStockCount > 0) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded">
                          Low
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">At or below minimum level</p>
                  </div>

                  {/* Out of Stock Products */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Out-of-Stock Products</span>
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <span>{dashboard?.liveState?.outOfStockCount ?? dashboard?.outOfStockCount ?? 0}</span>
                      {(dashboard?.liveState?.outOfStockCount > 0 || dashboard?.outOfStockCount > 0) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                          Stockout
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Zero physical units</p>
                  </div>

                  {/* Active Surplus Listings */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Active Surplus Listings</span>
                      <Percent className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                      {dashboard?.liveState?.activeSurplusListings ?? dashboard?.summary?.activeSurplusListings ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Clearance listings</p>
                  </div>

                  {/* Pending Purchase Orders */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Pending Purchase Orders</span>
                      <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                      {dashboard?.liveState?.pendingPurchaseOrders ?? dashboard?.summary?.pendingPurchaseOrders ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Inbound restock orders</p>
                  </div>

                  {/* Open Stock Audits */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Open Stock Audits</span>
                      <ShieldAlert className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                      {dashboard?.liveState?.openStockAudits ?? dashboard?.summary?.openStockAudits ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Counts in progress</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERIOD-BASED ACTIVITY (Date-Based Operational Activity) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Period Activity
                    </h3>
                    <p className="text-xs text-slate-500">Operational performance calculated from actual transaction timestamps (Asia/Kolkata)</p>
                  </div>

                  {/* Period Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    {[
                      { id: 'TODAY', label: 'Today' },
                      { id: 'THIS_WEEK', label: 'This Week' },
                      { id: 'THIS_MONTH', label: 'This Month' },
                      { id: 'THIS_YEAR', label: 'This Year' },
                      { id: 'CUSTOM', label: 'Custom' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setOverviewPeriod(p.id);
                          if (p.id !== 'CUSTOM') {
                            fetchDashboardData(p.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          overviewPeriod === p.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Period Date Range Inputs */}
                {overviewPeriod === 'CUSTOM' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-600">Select Date Range:</span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">From:</label>
                      <input
                        type="date"
                        value={overviewCustomFrom}
                        onChange={(e) => setOverviewCustomFrom(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">To:</label>
                      <input
                        type="date"
                        value={overviewCustomTo}
                        onChange={(e) => setOverviewCustomTo(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                      />
                    </div>
                    <button
                      onClick={() => fetchDashboardData('CUSTOM', overviewCustomFrom, overviewCustomTo)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs transition"
                    >
                      Apply Range
                    </button>
                  </div>
                )}

                {/* 6 Period Activity Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Sales */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Sales</span>
                      <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono truncate">
                      {formatPaise(dashboard?.periodActivity?.salesPaise ?? salesMetrics?.salesTodayPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {dashboard?.periodActivity?.completedSalesCount ?? salesMetrics?.salesTodayCount ?? 0} orders
                    </p>
                  </div>

                  {/* Gross Profit */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Gross Profit</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono truncate">
                      {formatPaise(dashboard?.periodActivity?.grossProfitPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Revenue minus COGS</p>
                  </div>

                  {/* Units Sold */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Units Sold</span>
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                      {dashboard?.periodActivity?.unitsSold ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Quantity delivered</p>
                  </div>

                  {/* Expenses */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Expenses</span>
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-amber-800 font-mono truncate">
                      {formatPaise(dashboard?.periodActivity?.expensesPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Operating costs</p>
                  </div>

                  {/* Discovered Losses */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Loss Discovered</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-rose-700 font-mono truncate">
                      {formatPaise(dashboard?.periodActivity?.inventoryLossPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Audits & write-downs</p>
                  </div>

                  {/* Discrepancies Discovered */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Discrepancies</span>
                      <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                      {dashboard?.periodActivity?.discrepanciesCount ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Variances identified</p>
                  </div>
                </div>
              </div>

              {/* Needs Your Attention (Actionable Alerts Section) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">Needs Your Attention</h3>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {attentionItems.length} items
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Click to action immediately</span>
                </div>

                {attentionItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700">All Operations Clear</p>
                    <p className="text-[11px] text-slate-400">No stockouts, overdue POs, or dead stock detected.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {attentionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          item.urgency === 'high'
                            ? 'bg-rose-50/70 border-rose-200'
                            : item.urgency === 'medium'
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (item.type === 'PO_ORDERED' || item.type === 'PO_PARTIAL') {
                              openReceiveModal(item.poId);
                            } else if (item.type === 'OUT_OF_STOCK' || item.type === 'LOW_STOCK') {
                              openNewPoModal(item.productId, item.preferredSupplierId);
                            } else {
                              setActiveTab('insights');
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] shrink-0 transition flex items-center gap-1 shadow-2xs ${
                            item.urgency === 'high'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : item.urgency === 'medium'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-slate-800 hover:bg-slate-900 text-white'
                          }`}
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales Summary & Trend Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart (2 columns) */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        Sales Performance (Last 14 Days)
                      </h3>
                      <p className="text-xs text-slate-500">Real transaction volume by day</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">
                        Month: {formatPaise(salesMetrics?.salesMonthPaise ?? 0)}
                      </span>
                      <p className="text-[10px] text-slate-400">{salesMetrics?.salesMonthCount ?? 0} total sales</p>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-2">
                    {salesTrend.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-slate-300 mb-1" />
                        <span>No completed sales in the last 14 days</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="saleDate"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={(v) => `₹${v / 100}`}
                          />
                          <Tooltip
                            formatter={(val) => [formatPaise(val), 'Revenue']}
                            labelFormatter={(lbl) => `Date: ${lbl}`}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          />
                          <Bar dataKey="totalPaise" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Sales Snapshot Card (1 column) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Sales Snapshot</h3>
                    <p className="text-xs text-slate-500 mb-3">Live verified financial analytics</p>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">Today's Revenue</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatPaise(salesMetrics?.salesTodayPaise ?? 0)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">This Month's Revenue</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatPaise(salesMetrics?.salesMonthPaise ?? 0)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                        <span className="text-emerald-800 font-medium">Cumulative Gross Profit</span>
                        <span className="font-bold text-emerald-900 font-mono">
                          {formatPaise(salesMetrics?.totalProfitPaise ?? 0)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">Completed Orders</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {salesMetrics?.totalSalesCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('sales')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition text-center"
                  >
                    View Sales & Orders Table &rarr;
                  </button>
                </div>
              </div>

              {/* Category Breakdown & Top Selling Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Bar Chart */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Inventory by Category</h3>
                      <p className="text-xs text-slate-500">Unit stock distribution</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {dashboard?.categoryBreakdown?.length || 0} categories
                    </span>
                  </div>

                  <div className="h-56 w-full pt-2">
                    {dashboard?.categoryBreakdown?.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No categories found
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboard?.categoryBreakdown || []}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip
                            formatter={(value) => [`${value} units`, 'Quantity']}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          />
                          <Bar dataKey="totalQuantity" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Top-Selling Products (Last 30 Days)
                      </h3>
                      <p className="text-xs text-slate-500">Ranked by actual unit sales</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('insights')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      All Insights &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {salesIntelligence?.summary?.fastSellingProducts?.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No sales recorded during the last 30 days
                      </div>
                    ) : (
                      salesIntelligence?.summary?.fastSellingProducts?.map((prod, idx) => (
                        <div
                          key={prod.productId}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{prod.productName}</p>
                              <p className="text-[10px] text-slate-400">
                                SKU: {prod.sku} | In Stock: {prod.currentQuantity} units
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-indigo-700 font-mono">
                              {prod.unitsSoldLast30Days} sold
                            </span>
                            <p className="text-[10px] text-slate-400">{prod.averageDailySalesLast30Days} / day</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Pending Purchase Orders & Products Needing Restock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending POs */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pending Purchase Orders</h3>
                      <p className="text-xs text-slate-500">Orders placed or awaiting arrival</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('purchasing')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Manage Orders &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {purchaseOrders.filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED').length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No pending purchase orders awaiting delivery
                      </div>
                    ) : (
                      purchaseOrders
                        .filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')
                        .slice(0, 4)
                        .map((po) => (
                          <div
                            key={po.id}
                            className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">PO #{po.id}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    po.status === 'ORDERED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {po.status === 'ORDERED' ? 'Placed' : 'Partially Recv'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">Vendor: {po.supplierName}</p>
                              <p className="text-[10px] text-slate-400">
                                {po.totalQuantityReceived}/{po.totalQuantityOrdered} units | {formatPaise(po.totalAmountPaise)}
                              </p>
                            </div>
                            <button
                              onClick={() => openReceiveModal(po.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition"
                            >
                              Receive
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Restock Recommendations */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Restock Recommendations</h3>
                      <p className="text-xs text-slate-500">Products at or below low-stock limit</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('insights')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Insights &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {salesIntelligence?.products?.filter((p) => p.currentQuantity <= p.lowStockLevel).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        All product inventory is comfortably stocked
                      </div>
                    ) : (
                      salesIntelligence?.products
                        ?.filter((p) => p.currentQuantity <= p.lowStockLevel)
                        .slice(0, 4)
                        .map((prod) => (
                          <div
                            key={prod.productId}
                            className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{prod.productName}</p>
                              <p className="text-[11px] text-slate-600">
                                Stock: <span className="font-bold text-rose-700">{prod.currentQuantity}</span> / Alert: {prod.lowStockLevel}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Preferred Target: {prod.preferredStockLevel || 'Not set'}
                              </p>
                            </div>
                            <button
                              onClick={() => openNewPoModal(prod.productId, null, prod.recommendedRestockQuantity || 10)}
                              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Order {prod.recommendedRestockQuantity || 10}</span>
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity Ledger */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Inventory Movements</h3>
                    <p className="text-xs text-slate-500">Live transaction history</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('stock-control')}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Full Ledger &rarr;
                  </button>
                </div>

                <div className="space-y-2">
                  {dashboard?.recentMovements?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No recent inventory movements
                    </div>
                  ) : (
                    dashboard?.recentMovements?.map((m) => (
                      <div
                        key={m.id || m.movementId}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`p-1.5 rounded-lg text-white shrink-0 ${
                              m.movementType === 'IN'
                                ? 'bg-emerald-600'
                                : m.movementType === 'OUT'
                                ? 'bg-indigo-600'
                                : 'bg-amber-600'
                            }`}
                          >
                            {m.movementType === 'IN' ? (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ) : m.movementType === 'OUT' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{m.productName}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {m.reason || 'Routine movement'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold ${
                              m.movementType === 'IN'
                                ? 'text-emerald-700'
                                : m.movementType === 'OUT'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {m.movementType === 'IN' ? `+${m.quantity}` : m.movementType === 'OUT' ? `-${m.quantity}` : `=${m.newQuantity}`}
                          </span>
                          <p className="text-[10px] text-slate-400">{formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              2. PRODUCTS TAB
             ============================================================ */}
          {activeTab === 'products' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Filter & Search Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchProductsData();
                    }}
                    className="relative flex-1 max-w-md"
                  >
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by product name, SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </form>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAddProductModal()}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Status:</span>
                  {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStockStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        stockStatusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL'
                        ? 'All'
                        : st === 'IN_STOCK'
                        ? 'In Stock'
                        : st === 'LOW_STOCK'
                        ? 'Low Stock'
                        : 'Out of Stock'}
                    </button>
                  ))}

                  {uniqueCategories.length > 0 && (
                    <>
                      <span className="text-[11px] font-semibold text-slate-400 ml-2 mr-1">Category:</span>
                      <button
                        onClick={() => {
                          setCategoryFilter('');
                          fetchProductsData(searchQuery, '');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          !categoryFilter ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      {uniqueCategories.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCategoryFilter(c);
                            fetchProductsData(searchQuery, c);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            categoryFilter === c ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Products Table (Desktop) & Cards (Mobile) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Showing {filteredProducts.length} of {products.length} Products
                  </span>
                  <button
                    onClick={() => fetchProductsData()}
                    className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No products found</p>
                    <p className="text-[11px]">Try adjusting your search query or filters.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Product / SKU</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 text-right">Selling Price</th>
                            <th className="py-3 px-4 text-right">Purchase Price</th>
                            <th className="py-3 px-4 text-center">Stock</th>
                            <th className="py-3 px-4">Preferred Vendor</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts
                            .slice((productsPage - 1) * productsPageSize, productsPage * productsPageSize)
                            .map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                  {p.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {formatPaise(p.sellingPricePaise)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-500">
                                {formatPaise(p.purchasePricePaise)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                                    p.quantity === 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : p.quantity <= p.minStockLevel
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {p.quantity} units
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {p.supplierName ? (
                                  <span className="flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-fit">
                                    <Truck className="w-3 h-3 text-teal-600" />
                                    {p.supplierName}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  title="Edit Product"
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => confirmDeleteProduct(p)}
                                  title="Delete Product"
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {filteredProducts
                        .slice((productsPage - 1) * productsPageSize, productsPage * productsPageSize)
                        .map((p) => (
                        <div key={p.id} className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.sku}</p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                p.quantity === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : p.quantity <= p.minStockLevel
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.quantity} units
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Selling</span>
                              <span className="font-mono font-bold text-slate-900">{formatPaise(p.sellingPricePaise)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Purchase</span>
                              <span className="font-mono text-slate-600">{formatPaise(p.purchasePricePaise)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-[11px] text-slate-500">
                              Vendor: {p.supplierName || 'None'}
                            </span>
                            <div className="space-x-2">
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDeleteProduct(p)}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationBar
                      currentPage={productsPage}
                      totalRecords={filteredProducts.length}
                      pageSize={productsPageSize}
                      onPageChange={setProductsPage}
                      onPageSizeChange={(newSize) => {
                        setProductsPageSize(newSize);
                        setProductsPage(1);
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              3. SALES TAB
             ============================================================ */}
          {activeTab === 'sales' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Top Sales KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Today's Sales</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                    {formatPaise(salesMetrics?.salesTodayPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{salesMetrics?.salesTodayCount ?? 0} orders today</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-slate-500 text-xs font-medium">This Month</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                    {formatPaise(salesMetrics?.salesMonthPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{salesMetrics?.salesMonthCount ?? 0} orders this month</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Total Lifetime Sales</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                    {formatPaise(salesMetrics?.totalSalesPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{salesMetrics?.totalSalesCount ?? 0} total sales</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-emerald-700 text-xs font-medium">Gross Profit</span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-800 font-mono">
                    {formatPaise(salesMetrics?.totalProfitPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-emerald-600">Total margin</p>
                </div>
              </div>

              {/* Action Bar & Status Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    {['ALL', 'COMPLETED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setSalesStatusFilter(st);
                          setSalesPage(1);
                          fetchSalesData(st);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          salesStatusFilter === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'ALL' ? 'All Sales' : st === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={openNewSaleModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs w-fit"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Record Customer Sale</span>
                  </button>
                </div>

                {/* Sales Date Filter */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Order Date:</span>
                  <input
                    type="date"
                    value={salesDateFrom}
                    onChange={(e) => {
                      setSalesDateFrom(e.target.value);
                      setSalesPage(1);
                    }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={salesDateTo}
                    onChange={(e) => {
                      setSalesDateTo(e.target.value);
                      setSalesPage(1);
                    }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  {(salesDateFrom || salesDateTo) && (
                    <button
                      onClick={() => {
                        setSalesDateFrom('');
                        setSalesDateTo('');
                        setSalesPage(1);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              </div>

              {/* Sales History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Sales Transaction Ledger ({sales.filter((s) => {
                      const d = (s.createdAt || s.created_at || '').slice(0, 10);
                      if (salesDateFrom && d && d < salesDateFrom) return false;
                      if (salesDateTo && d && d > salesDateTo) return false;
                      return true;
                    }).length} records)
                  </span>
                  <button
                    onClick={() => fetchSalesData()}
                    className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSales ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {sales.filter((s) => {
                  const d = (s.createdAt || s.created_at || '').slice(0, 10);
                  if (salesDateFrom && d && d < salesDateFrom) return false;
                  if (salesDateTo && d && d > salesDateTo) return false;
                  return true;
                }).length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No sales transactions found</p>
                    <p className="text-[11px]">Record your first sale to start tracking business revenue.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Items / Units</th>
                            <th className="py-3 px-4 text-right">Subtotal</th>
                            <th className="py-3 px-4 text-right">Discount</th>
                            <th className="py-3 px-4 text-right">Total Paid</th>
                            <th className="py-3 px-4 text-center">Payment</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sales
                            .filter((s) => {
                              const d = (s.createdAt || s.created_at || '').slice(0, 10);
                              if (salesDateFrom && d && d < salesDateFrom) return false;
                              if (salesDateTo && d && d > salesDateTo) return false;
                              return true;
                            })
                            .slice((salesPage - 1) * salesPageSize, salesPage * salesPageSize)
                            .map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                #SO-{s.id}
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {formatDateTime(s.createdAt)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-800">{s.itemCount} items</span>
                                <span className="text-[10px] text-slate-400 block">({s.totalQuantity} units)</span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-500">
                                {formatPaise(s.subtotalPaise)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-400">
                                {s.discountPaise > 0 ? (
                                  <span>
                                    -{formatPaise(s.discountPaise)}
                                    {s.discountPercent ? <span className="text-[10px] text-slate-400 block font-sans">({s.discountPercent}%)</span> : null}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {formatPaise(s.totalPaise)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {s.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    s.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800 line-through'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                <button
                                  onClick={() => viewSaleDetails(s.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition"
                                >
                                  Details
                                </button>
                                {s.status === 'COMPLETED' && (
                                  <button
                                    onClick={() => confirmCancelSale(s)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <PaginationBar
                      currentPage={salesPage}
                      totalRecords={
                        sales.filter((s) => {
                          const d = (s.createdAt || s.created_at || '').slice(0, 10);
                          if (salesDateFrom && d && d < salesDateFrom) return false;
                          if (salesDateTo && d && d > salesDateTo) return false;
                          return true;
                        }).length
                      }
                      pageSize={salesPageSize}
                      onPageChange={setSalesPage}
                      onPageSizeChange={(newSize) => {
                        setSalesPageSize(newSize);
                        setSalesPage(1);
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              4. PURCHASING TAB (PURCHASE ORDERS & SUPPLIERS)
             ============================================================ */}
          {activeTab === 'purchasing' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Subsection Selector */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPurchasingSubTab('orders')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      purchasingSubTab === 'orders'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Purchase Orders ({purchaseOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setPurchasingSubTab('suppliers')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      purchasingSubTab === 'suppliers'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Suppliers Directory ({suppliers.length})</span>
                  </button>
                </div>

                {purchasingSubTab === 'orders' ? (
                  <button
                    onClick={() => openNewPoModal()}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Purchase Order</span>
                  </button>
                ) : (
                  <button
                    onClick={openAddSupplierModal}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Supplier</span>
                  </button>
                )}
              </div>

              {/* SUBSECTION A: PURCHASE ORDERS */}
              {purchasingSubTab === 'orders' && (
                <div className="space-y-4">
                  {/* Status Filters Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-400 text-[10px] uppercase mr-1">Status:</span>
                        {['ALL', 'ACTIVE', 'DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              setPoStatusFilter(st);
                              setPoPage(1);
                              fetchPurchaseOrdersData(st === 'ACTIVE' ? '' : st, poSupplierFilter);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              poStatusFilter === st
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st === 'ALL'
                              ? 'All'
                              : st === 'ACTIVE'
                              ? 'Active Only'
                              : st === 'DRAFT'
                              ? 'Drafts'
                              : st === 'ORDERED'
                              ? 'Ordered'
                              : st === 'PARTIALLY_RECEIVED'
                              ? 'Partial'
                              : st === 'RECEIVED'
                              ? 'Received'
                              : 'Cancelled'}
                          </button>
                        ))}
                      </div>

                      {suppliers.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">Vendor:</span>
                          <select
                            value={poSupplierFilter}
                            onChange={(e) => {
                              setPoSupplierFilter(e.target.value);
                              setPoPage(1);
                              fetchPurchaseOrdersData(poStatusFilter === 'ACTIVE' ? '' : poStatusFilter, e.target.value);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="">All Suppliers</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* PO Date Range Filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Order Date:</span>
                      <input
                        type="date"
                        value={poDateFrom}
                        onChange={(e) => {
                          setPoDateFrom(e.target.value);
                          setPoPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={poDateTo}
                        onChange={(e) => {
                          setPoDateTo(e.target.value);
                          setPoPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {(poDateFrom || poDateTo) && (
                        <button
                          onClick={() => {
                            setPoDateFrom('');
                            setPoDateTo('');
                            setPoPage(1);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Purchase Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {purchaseOrders.filter((po) => {
                      if (poStatusFilter === 'ACTIVE' && (po.status === 'RECEIVED' || po.status === 'CANCELLED')) return false;
                      const d = (po.createdAt || po.created_at || '').slice(0, 10);
                      if (poDateFrom && d && d < poDateFrom) return false;
                      if (poDateTo && d && d > poDateTo) return false;
                      return true;
                    }).length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No purchase orders found</p>
                        <p className="text-[11px]">Draft a purchase order to replenish inventory with your suppliers.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">PO Number</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Total Amount</th>
                                <th className="py-3 px-4 text-center">Fulfillment</th>
                                <th className="py-3 px-4">Timeline</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {purchaseOrders
                                .filter((po) => {
                                  if (poStatusFilter === 'ACTIVE' && (po.status === 'RECEIVED' || po.status === 'CANCELLED')) return false;
                                  const d = (po.createdAt || po.created_at || '').slice(0, 10);
                                  if (poDateFrom && d && d < poDateFrom) return false;
                                  if (poDateTo && d && d > poDateTo) return false;
                                  return true;
                                })
                                .slice((poPage - 1) * poPageSize, poPage * poPageSize)
                                .map((po) => (
                                <tr key={po.id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                    #PO-{po.id}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-800">
                                    {po.supplierName}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        po.status === 'DRAFT'
                                          ? 'bg-slate-100 text-slate-700'
                                          : po.status === 'ORDERED'
                                          ? 'bg-blue-100 text-blue-800'
                                          : po.status === 'PARTIALLY_RECEIVED'
                                          ? 'bg-amber-100 text-amber-800'
                                          : po.status === 'RECEIVED'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800 line-through'
                                      }`}
                                    >
                                      {po.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                    {formatPaise(po.totalAmountPaise)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="font-mono text-[11px] font-bold text-slate-800">
                                        {po.totalQuantityReceived} / {po.totalQuantityOrdered} units
                                      </span>
                                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                        <div
                                          className="bg-teal-600 h-1.5 rounded-full"
                                          style={{
                                            width: `${
                                              po.totalQuantityOrdered > 0
                                                ? (po.totalQuantityReceived / po.totalQuantityOrdered) * 100
                                                : 0
                                            }%`
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[10px] text-slate-400">
                                    <div>Created: {formatDateTime(po.createdAt)}</div>
                                    {po.placedAt && <div>Placed: {formatDateTime(po.placedAt)}</div>}
                                    {po.receivedAt && <div>Received: {formatDateTime(po.receivedAt)}</div>}
                                  </td>
                                  <td className="py-3 px-4 text-right space-x-1">
                                    <button
                                      onClick={() => viewPoDetails(po.id)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                                    >
                                      Details
                                    </button>

                                    {po.status === 'DRAFT' && (
                                      <>
                                        <button
                                          onClick={() => handlePlaceOrder(po.id)}
                                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition"
                                        >
                                          Place
                                        </button>
                                        <button
                                          onClick={() => confirmCancelPo(po)}
                                          className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    )}

                                    {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                                      <>
                                        <button
                                          onClick={() => openReceiveModal(po.id)}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                                        >
                                          Receive
                                        </button>
                                        <button
                                          onClick={() => confirmCancelPo(po)}
                                          className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <PaginationBar
                          currentPage={poPage}
                          totalRecords={
                            purchaseOrders.filter((po) => {
                              if (poStatusFilter === 'ACTIVE' && (po.status === 'RECEIVED' || po.status === 'CANCELLED')) return false;
                              const d = (po.createdAt || po.created_at || '').slice(0, 10);
                              if (poDateFrom && d && d < poDateFrom) return false;
                              if (poDateTo && d && d > poDateTo) return false;
                              return true;
                            }).length
                          }
                          pageSize={poPageSize}
                          onPageChange={setPoPage}
                          onPageSizeChange={(newSize) => {
                            setPoPageSize(newSize);
                            setPoPage(1);
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SUBSECTION B: SUPPLIERS DIRECTORY */}
              {purchasingSubTab === 'suppliers' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search suppliers by name, phone, email..."
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          fetchSuppliersData(e.target.value);
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                              <p className="text-[11px] text-slate-400">Vendor #{s.id}</p>
                            </div>
                            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                              <Truck className="w-4 h-4" />
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            {s.contactPerson && (
                              <p className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{s.contactPerson}</span>
                              </p>
                            )}
                            {s.phone && (
                              <p className="flex items-center gap-1.5 font-mono">
                                <span className="text-slate-400">📞</span>
                                <span>{s.phone}</span>
                              </p>
                            )}
                            {s.email && (
                              <p className="flex items-center gap-1.5 font-mono text-teal-700 truncate">
                                <span className="text-slate-400">✉</span>
                                <span>{s.email}</span>
                              </p>
                            )}
                            {s.address && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                📍 {s.address}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => viewSupplierProducts(s)}
                            className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                          >
                            <span>Products</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <div className="space-x-1">
                            <button
                              onClick={() => openEditSupplierModal(s)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDeleteSupplier(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              5. STOCK CONTROL TAB
             ============================================================ */}
          {activeTab === 'stock-control' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Subsection Selector */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockControlSubTab('movements')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      stockControlSubTab === 'movements'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Movement Ledger</span>
                  </button>

                  <button
                    onClick={() => setStockControlSubTab('adjustments')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      stockControlSubTab === 'adjustments'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Physical Adjustments</span>
                  </button>

                  <button
                    onClick={() => setStockControlSubTab('audits')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      stockControlSubTab === 'audits'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Stock Audits</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openQuickActionModal('RECEIVE')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Receive</span>
                  </button>
                  <button
                    onClick={() => openQuickActionModal('ADJUST')}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Adjust Count</span>
                  </button>
                </div>
              </div>

              {stockControlSubTab === 'movements' && (
                <div className="space-y-4">
                  {/* Movement Filters Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Type:</span>
                        {['', 'IN', 'OUT', 'ADJUSTMENT'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setMovementTypeFilter(type);
                              setMovementsPage(1);
                              fetchMovementsData(movementProductFilter, type);
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                              movementTypeFilter === type
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {type === '' ? 'All Types' : type === 'IN' ? 'Stock In' : type === 'OUT' ? 'Stock Out' : 'Adjustment'}
                          </button>
                        ))}
                      </div>

                      {products.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px] font-medium">Product:</span>
                          <select
                            value={movementProductFilter}
                            onChange={(e) => {
                              setMovementProductFilter(e.target.value);
                              setMovementsPage(1);
                              fetchMovementsData(e.target.value, movementTypeFilter);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="">All Catalog Products</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Movement Date Filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Movement Date:</span>
                      <input
                        type="date"
                        value={movementDateFrom}
                        onChange={(e) => {
                          setMovementDateFrom(e.target.value);
                          setMovementsPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={movementDateTo}
                        onChange={(e) => {
                          setMovementDateTo(e.target.value);
                          setMovementsPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {(movementDateFrom || movementDateTo) && (
                        <button
                          onClick={() => {
                            setMovementDateFrom('');
                            setMovementDateTo('');
                            setMovementsPage(1);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Movements Ledger Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {movements.filter((m) => {
                      const d = (m.createdAt || m.created_at || '').slice(0, 10);
                      if (movementDateFrom && d && d < movementDateFrom) return false;
                      if (movementDateTo && d && d > movementDateTo) return false;
                      return true;
                    }).length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                        <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No stock movements recorded</p>
                        <p className="text-[11px]">Inbound receipts, customer sales, and count reconciliations appear here.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">Log ID</th>
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4">Product</th>
                                <th className="py-3 px-4 text-center">Type</th>
                                <th className="py-3 px-4 text-right">Delta</th>
                                <th className="py-3 px-4 text-center">Stock Change</th>
                                <th className="py-3 px-4">Reason / Audit Trail</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {movements
                                .filter((m) => {
                                  const d = (m.createdAt || m.created_at || '').slice(0, 10);
                                  if (movementDateFrom && d && d < movementDateFrom) return false;
                                  if (movementDateTo && d && d > movementDateTo) return false;
                                  return true;
                                })
                                .slice((movementsPage - 1) * movementsPageSize, movementsPage * movementsPageSize)
                                .map((m) => (
                                <tr key={m.id || m.movementId} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-500">
                                    #{m.id || m.movementId}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500">
                                    {formatDateTime(m.createdAt)}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    {m.productName}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        m.movementType === 'IN'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : m.movementType === 'OUT'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {m.movementType}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold">
                                    <span
                                      className={
                                        m.movementType === 'IN'
                                          ? 'text-emerald-700'
                                          : m.movementType === 'OUT'
                                          ? 'text-rose-700'
                                          : 'text-amber-700'
                                      }
                                    >
                                      {m.movementType === 'IN' ? `+${m.quantity}` : m.movementType === 'OUT' ? `-${m.quantity}` : `=${m.newQuantity}`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                                    {m.previousQuantity} &rarr; <span className="font-bold text-slate-900">{m.newQuantity}</span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                                    {m.reason || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <PaginationBar
                          currentPage={movementsPage}
                          totalRecords={
                            movements.filter((m) => {
                              const d = (m.createdAt || m.created_at || '').slice(0, 10);
                              if (movementDateFrom && d && d < movementDateFrom) return false;
                              if (movementDateTo && d && d > movementDateTo) return false;
                              return true;
                            }).length
                          }
                          pageSize={movementsPageSize}
                          onPageChange={setMovementsPage}
                          onPageSizeChange={(newSize) => {
                            setMovementsPageSize(newSize);
                            setMovementsPage(1);
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {stockControlSubTab === 'adjustments' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Physical Stock Count Adjustment</h3>
                    <p className="text-xs text-slate-500">Reconcile physical inventory counts against system records</p>
                  </div>

                  <form onSubmit={handleQuickActionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Select Product</label>
                      <select
                        value={quickActionForm.productId}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, productId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Current: {p.quantity} units)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">New Physical Count</label>
                      <input
                        type="number"
                        min="0"
                        value={quickActionForm.quantity}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Adjustment Reason</label>
                      <select
                        value={quickActionForm.reason}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, reason: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Physical count reconciliation">Physical count reconciliation</option>
                        <option value="Damaged / broken goods">Damaged / broken goods</option>
                        <option value="Internal theft / shrinkage">Internal theft / shrinkage</option>
                        <option value="Discovered excess inventory">Discovered excess inventory</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuickAction}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>{submittingQuickAction ? 'Reconciling...' : 'Confirm Count Reconciliation'}</span>
                    </button>
                  </form>
                </div>
              )}

              {stockControlSubTab === 'audits' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* If an audit is selected, show AUDIT DETAILS VIEW */}
                  {selectedAuditId && selectedAudit ? (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Top Action Bar */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedAuditId(null);
                              setSelectedAudit(null);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-bold border border-slate-200"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Audits</span>
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                                Audit #AUD-{selectedAudit.id}
                              </h2>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  selectedAudit.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : selectedAudit.status === 'CANCELLED'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                }`}
                              >
                                {selectedAudit.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Created on {formatDateTime(selectedAudit.createdAt)}
                              {selectedAudit.completedAt && ` • Completed ${formatDateTime(selectedAudit.completedAt)}`}
                              {selectedAudit.cancelledAt && ` • Cancelled ${formatDateTime(selectedAudit.cancelledAt)}`}
                            </p>
                          </div>
                        </div>

                        {selectedAudit.status === 'OPEN' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setCancelAuditModalOpen(true);
                                setCancelAuditReason('');
                              }}
                              className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel Audit</span>
                            </button>

                            <button
                              onClick={() => {
                                setCompleteAuditModalOpen(true);
                                setCompleteAuditError(null);
                              }}
                              disabled={selectedAudit.countedProducts < selectedAudit.totalProducts}
                              title={
                                selectedAudit.countedProducts < selectedAudit.totalProducts
                                  ? 'All products must have physical counts before completing'
                                  : 'Apply stock corrections and complete audit'
                              }
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                                selectedAudit.countedProducts >= selectedAudit.totalProducts
                                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Complete Audit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Audit Progress & Discrepancy KPI Bar */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Catalog Scope</p>
                          <p className="text-xl sm:text-2xl font-bold text-slate-900">{selectedAudit.totalProducts}</p>
                          <p className="text-[11px] text-slate-400">Total products in count</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Physical Progress</p>
                          <p className="text-xl sm:text-2xl font-bold text-teal-600">
                            {selectedAudit.countedProducts} / {selectedAudit.totalProducts}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {Math.round((selectedAudit.countedProducts / (selectedAudit.totalProducts || 1)) * 100)}% counted
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Discrepancies</p>
                          <p
                            className={`text-xl sm:text-2xl font-bold ${
                              selectedAudit.discrepancyCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {selectedAudit.discrepancyCount}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {selectedAudit.discrepancyCount > 0 ? 'Products with variances' : 'Zero variances'}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Audit Status</p>
                          <p className="text-xl sm:text-2xl font-bold text-slate-900 capitalize">
                            {selectedAudit.status.toLowerCase()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {selectedAudit.status === 'OPEN'
                              ? 'Counting in progress'
                              : selectedAudit.status === 'COMPLETED'
                              ? 'Reconciled & closed'
                              : 'Cancelled'}
                          </p>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <ClipboardCheck className="w-4 h-4 text-teal-600" />
                            Counting Progress
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedAudit.countedProducts} of {selectedAudit.totalProducts} items recorded (
                            {Math.round((selectedAudit.countedProducts / (selectedAudit.totalProducts || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round(
                                (selectedAudit.countedProducts / (selectedAudit.totalProducts || 1)) * 100
                              )}%`
                            }}
                          />
                        </div>

                        {selectedAudit.notes && (
                          <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-slate-700">Audit Notes:</span> {selectedAudit.notes}
                          </p>
                        )}
                        {selectedAudit.cancellationReason && (
                          <p className="text-xs text-rose-600 pt-1 border-t border-slate-100 font-medium">
                            <span className="font-semibold">Cancellation Reason:</span> {selectedAudit.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Items Filter & Search Bar */}
                      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
                          <button
                            onClick={() => setAuditItemFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'ALL'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All ({selectedAudit.items?.length || 0})
                          </button>
                          <button
                            onClick={() => setAuditItemFilter('UNCOUNTED')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'UNCOUNTED'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Uncounted ({selectedAudit.items?.filter((i) => i.countedQuantity === null).length || 0})
                          </button>
                          <button
                            onClick={() => setAuditItemFilter('DISCREPANCIES')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'DISCREPANCIES'
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            Discrepancies ({selectedAudit.discrepancyCount || 0})
                          </button>
                          <button
                            onClick={() => setAuditItemFilter('MATCHED')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'MATCHED'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            Matched (
                            {selectedAudit.items?.filter(
                              (i) => i.countedQuantity !== null && i.variance === 0
                            ).length || 0}
                            )
                          </button>
                        </div>

                        <div className="relative min-w-[240px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search product or SKU..."
                            value={auditItemSearch}
                            onChange={(e) => setAuditItemSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Items List Table */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3 text-center">System Stock</th>
                                <th className="px-4 py-3 text-center">Physical Count</th>
                                <th className="px-4 py-3 text-center">Variance (Diff)</th>
                                <th className="px-4 py-3">Item Notes</th>
                                <th className="px-4 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {(selectedAudit.items || [])
                                .filter((item) => {
                                  const matchesSearch =
                                    !auditItemSearch.trim() ||
                                    item.productNameSnapshot
                                      .toLowerCase()
                                      .includes(auditItemSearch.toLowerCase()) ||
                                    item.skuSnapshot
                                      .toLowerCase()
                                      .includes(auditItemSearch.toLowerCase());
                                  if (!matchesSearch) return false;
                                  if (auditItemFilter === 'UNCOUNTED') return item.countedQuantity === null;
                                  if (auditItemFilter === 'DISCREPANCIES')
                                    return item.countedQuantity !== null && item.variance !== 0;
                                  if (auditItemFilter === 'MATCHED')
                                    return item.countedQuantity !== null && item.variance === 0;
                                  return true;
                                })
                                .map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                                      <p className="font-mono text-[11px] text-slate-500">{item.skuSnapshot}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-700">
                                      {item.systemQuantity} units
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">
                                      {item.countedQuantity !== null ? (
                                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                                          {item.countedQuantity} units
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                          Not Counted
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {item.countedQuantity === null ? (
                                        <span className="text-slate-400 font-medium">—</span>
                                      ) : item.variance === 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <Check className="w-3.5 h-3.5" />
                                          Match (0)
                                        </span>
                                      ) : item.variance < 0 ? (
                                        <span
                                          title={`${Math.abs(item.variance)} unit(s) missing during count`}
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                          -{Math.abs(item.variance)} Missing
                                        </span>
                                      ) : (
                                        <span
                                          title={`+${item.variance} extra unit(s) found during count`}
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                          +{item.variance} Extra
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                                      {item.itemNotes || <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {selectedAudit.status === 'OPEN' ? (
                                        <button
                                          onClick={() => {
                                            setCountingItem(item);
                                            setCountQuantityInput(
                                              item.countedQuantity !== null
                                                ? item.countedQuantity
                                                : item.systemQuantity
                                            );
                                            setCountNotesInput(item.itemNotes || '');
                                          }}
                                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                                          <span>{item.countedQuantity !== null ? 'Edit Count' : 'Count'}</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 font-medium">
                                          <Lock className="w-3 h-3" />
                                          Locked
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* AUDIT OVERVIEW & HISTORY TABLE */
                    <div className="space-y-4 sm:space-y-6">
                      {/* Summary Statistics Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Open Audits</p>
                            <p className="text-xl sm:text-2xl font-bold text-teal-600">
                              {auditSummary?.openAudits ?? audits.filter((a) => a.status === 'OPEN').length}
                            </p>
                            <p className="text-[11px] text-slate-400">Active stock cycle counts</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Pending Discrepancies</p>
                            <p className="text-xl sm:text-2xl font-bold text-amber-600">
                              {auditSummary?.pendingDiscrepancies ??
                                audits
                                  .filter((a) => a.status === 'OPEN')
                                  .reduce((acc, a) => acc + (Number(a.productsWithDiscrepancies) || 0), 0)}
                            </p>
                            <p className="text-[11px] text-slate-400">In open audits awaiting count</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Loss Discovered Today</p>
                            <p className="text-xl sm:text-2xl font-bold text-rose-600">
                              {formatPaise(auditSummary?.inventoryLossTodayPaise ?? dashboard?.periodActivity?.inventoryLossPaise ?? 0)}
                            </p>
                            <p className="text-[11px] text-slate-400">From audits finalized today</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Completed This Month</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                              {auditSummary?.completedAuditsThisMonth ??
                                audits.filter(
                                  (a) =>
                                    a.status === 'COMPLETED' &&
                                    (a.completedAt || a.completed_at || '').startsWith(getKolkataToday().slice(0, 7))
                                ).length}
                            </p>
                            <p className="text-[11px] text-slate-400">Reconciled in current month</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Header with Status Filters, Date Filters & Actions */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
                            <button
                              onClick={() => {
                                setAuditFilter('OPEN');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'OPEN'
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Active Open ({audits.filter((a) => a.status === 'OPEN').length})
                            </button>
                            <button
                              onClick={() => {
                                setAuditFilter('COMPLETED');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'COMPLETED'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Completed ({audits.filter((a) => a.status === 'COMPLETED').length})
                            </button>
                            <button
                              onClick={() => {
                                setAuditFilter('CANCELLED');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'CANCELLED'
                                  ? 'bg-slate-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Cancelled ({audits.filter((a) => a.status === 'CANCELLED').length})
                            </button>
                            <button
                              onClick={() => {
                                setAuditFilter('ALL');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'ALL'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              All Records ({audits.length})
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={fetchAuditsData}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                              title="Refresh Audits"
                            >
                              <RefreshCw className={`w-4 h-4 ${loadingAudits ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                              onClick={() => {
                                setStartAuditModalOpen(true);
                                setAuditMode('ALL');
                                setSelectedAuditProductIds([]);
                                setAuditProductSearch('');
                                setAuditNotes('');
                              }}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Start New Audit</span>
                            </button>
                          </div>
                        </div>

                        {/* Date Range Filter Bar for Audit History */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                          <span className="text-[11px] font-semibold text-slate-400">Created Date:</span>
                          <input
                            type="date"
                            value={auditDateFrom}
                            onChange={(e) => {
                              setAuditDateFrom(e.target.value);
                              setAuditsPage(1);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="date"
                            value={auditDateTo}
                            onChange={(e) => {
                              setAuditDateTo(e.target.value);
                              setAuditsPage(1);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          {(auditDateFrom || auditDateTo) && (
                            <button
                              onClick={() => {
                                setAuditDateFrom('');
                                setAuditDateTo('');
                                setAuditsPage(1);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                            >
                              Clear Dates
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Audits History Table */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Physical Stock Audits Ledger</h3>
                            <p className="text-xs text-slate-500">History of cycle counts, discrepancy analyses, and reconciliation runs</p>
                          </div>
                        </div>

                        {loadingAudits ? (
                          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600" />
                            <p>Loading audit ledger records...</p>
                          </div>
                        ) : audits.filter((a) => {
                            if (auditFilter !== 'ALL' && a.status !== auditFilter) return false;
                            const d = (a.createdAt || a.created_at || '').slice(0, 10);
                            if (auditDateFrom && d && d < auditDateFrom) return false;
                            if (auditDateTo && d && d > auditDateTo) return false;
                            return true;
                          }).length === 0 ? (
                          <div className="p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                              <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">No Stock Audits Found</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              {auditFilter !== 'ALL'
                                ? `No audits found with status "${auditFilter}".`
                                : 'Start a physical count to verify on-hand warehouse inventory against system stock.'}
                            </p>
                            {auditFilter === 'ALL' && (
                              <button
                                onClick={() => {
                                  setStartAuditModalOpen(true);
                                  setAuditMode('ALL');
                                  setSelectedAuditProductIds([]);
                                  setAuditNotes('');
                                }}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Start First Audit</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Audit ID</th>
                                    <th className="px-4 py-3">Created Date</th>
                                    <th className="px-4 py-3 text-center">Catalog Scope</th>
                                    <th className="px-4 py-3">Count Progress</th>
                                    <th className="px-4 py-3 text-center">Discrepancies</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {audits
                                    .filter((a) => {
                                      if (auditFilter !== 'ALL' && a.status !== auditFilter) return false;
                                      const d = (a.createdAt || a.created_at || '').slice(0, 10);
                                      if (auditDateFrom && d && d < auditDateFrom) return false;
                                      if (auditDateTo && d && d > auditDateTo) return false;
                                      return true;
                                    })
                                    .slice((auditsPage - 1) * auditsPageSize, auditsPage * auditsPageSize)
                                    .map((audit) => (
                                      <tr key={audit.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                          #AUD-{audit.id}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                          {formatDateTime(audit.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-slate-700">
                                          {audit.totalProducts} products
                                        </td>
                                        <td className="px-4 py-3 min-w-[140px]">
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                              <span>
                                                {audit.productsCounted} / {audit.totalProducts}
                                              </span>
                                              <span className="font-mono">
                                                {Math.round(
                                                  (audit.productsCounted / (audit.totalProducts || 1)) * 100
                                                )}
                                                %
                                              </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                              <div
                                                className="bg-teal-600 h-1.5 rounded-full"
                                                style={{
                                                  width: `${Math.round(
                                                    (audit.productsCounted / (audit.totalProducts || 1)) * 100
                                                  )}%`
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {audit.productsWithDiscrepancies > 0 ? (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                              {audit.productsWithDiscrepancies} variance
                                              {audit.productsWithDiscrepancies > 1 ? 's' : ''}
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50">
                                              0
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                              audit.status === 'COMPLETED'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : audit.status === 'CANCELLED'
                                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                : 'bg-teal-50 text-teal-700 border-teal-200'
                                            }`}
                                          >
                                            {audit.status}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <button
                                            onClick={() => {
                                              setSelectedAuditId(audit.id);
                                            }}
                                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
                                          >
                                            <ClipboardCheck className="w-3.5 h-3.5 text-teal-400" />
                                            <span>View Details</span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>

                            <PaginationBar
                              currentPage={auditsPage}
                              totalRecords={
                                audits.filter((a) => {
                                  if (auditFilter !== 'ALL' && a.status !== auditFilter) return false;
                                  const d = (a.createdAt || a.created_at || '').slice(0, 10);
                                  if (auditDateFrom && d && d < auditDateFrom) return false;
                                  if (auditDateTo && d && d > auditDateTo) return false;
                                  return true;
                                }).length
                              }
                              pageSize={auditsPageSize}
                              onPageChange={setAuditsPage}
                              onPageSizeChange={(newSize) => {
                                setAuditsPageSize(newSize);
                                setAuditsPage(1);
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              6. INSIGHTS & INVENTORY INTELLIGENCE TAB
             ============================================================ */}
          {activeTab === 'insights' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Box */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Sales-Based Inventory Intelligence
                  </h2>
                  <p className="text-xs text-slate-500">
                    Velocity analytics, dead stock detection, and calculated restock recommendations based on real completed sales
                  </p>
                </div>

                <button
                  onClick={fetchIntelligenceData}
                  disabled={loadingIntelligence}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 w-fit"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingIntelligence ? 'animate-spin' : ''}`} />
                  <span>Refresh Insights</span>
                </button>
              </div>

              {/* 5 Real Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => setIntelFilter('FAST_SELLING')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'FAST_SELLING'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Fast Selling
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.fastSellingProducts?.length ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">Top sellers</span>
                </button>

                <button
                  onClick={() => setIntelFilter('SLOW_MOVING')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'SLOW_MOVING'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Slow Moving
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.slowMovingProducts ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">&gt; 30d since sale</span>
                </button>

                <button
                  onClick={() => setIntelFilter('POTENTIAL_DEAD_STOCK')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'POTENTIAL_DEAD_STOCK'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Dead Stock
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.potentialDeadStockProducts ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">&gt; 45d without sales</span>
                </button>

                <button
                  onClick={() => setIntelFilter('OUT_OF_STOCK')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Out of Stock
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.outOfStockProducts ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">0 stock left</span>
                </button>

                <button
                  onClick={() => setIntelFilter('NEEDING_RESTOCK')}
                  className={`p-3.5 rounded-2xl border text-left transition col-span-2 sm:col-span-1 ${
                    intelFilter === 'NEEDING_RESTOCK'
                      ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Need Restock
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.productsNeedingRestock ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">Below alert level</span>
                </button>
              </div>

              {/* Intelligence Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Product Intelligence Portfolio ({salesIntelligence?.products?.length ?? 0} items)
                    </span>
                    {intelFilter !== 'ALL' && (
                      <button
                        onClick={() => setIntelFilter('ALL')}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700"
                      >
                        (Clear Filter)
                      </button>
                    )}
                  </div>
                </div>

                {!salesIntelligence?.products || salesIntelligence.products.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No intelligence records available. Add products to catalog.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4 text-center">Stock / Thresholds</th>
                          <th className="py-3 px-4 text-center">Velocity (30d)</th>
                          <th className="py-3 px-4 text-center">Activity</th>
                          <th className="py-3 px-4 text-center">Sales Trend</th>
                          <th className="py-3 px-4">Recommendation</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesIntelligence.products
                          .filter((p) => {
                            if (intelFilter === 'FAST_SELLING') return p.unitsSoldLast30Days > 0;
                            if (intelFilter === 'SLOW_MOVING') return p.salesActivity === 'SLOW_MOVING';
                            if (intelFilter === 'POTENTIAL_DEAD_STOCK') return p.salesActivity === 'POTENTIAL_DEAD_STOCK';
                            if (intelFilter === 'OUT_OF_STOCK') return p.salesActivity === 'OUT_OF_STOCK';
                            if (intelFilter === 'NEEDING_RESTOCK') return p.currentQuantity <= p.lowStockLevel;
                            return true;
                          })
                          .map((p) => (
                            <tr key={p.productId} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{p.productName}</p>
                                <span className="font-mono text-[10px] text-slate-400">{p.sku} | {p.category}</span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-[11px]">
                                <span className={`font-bold ${p.currentQuantity === 0 ? 'text-rose-600' : p.currentQuantity <= p.lowStockLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {p.currentQuantity} units
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Alert: {p.lowStockLevel} | Target: {p.preferredStockLevel || '—'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold text-indigo-700 font-mono">
                                  {p.unitsSoldLast30Days} units
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  ({p.averageDailySalesLast30Days} / day)
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.salesActivity === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.salesActivity === 'OUT_OF_STOCK'
                                      ? 'bg-rose-100 text-rose-800'
                                      : p.salesActivity === 'SLOW_MOVING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : p.salesActivity === 'POTENTIAL_DEAD_STOCK'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {p.salesActivity}
                                </span>
                                {p.daysSinceLastSale != null && (
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    {p.daysSinceLastSale}d since sale
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.salesTrend === 'INCREASING'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.salesTrend === 'DECREASING'
                                      ? 'bg-rose-100 text-rose-800'
                                      : p.salesTrend === 'NEW_SALES'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {p.salesTrend}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs">
                                {p.recommendation}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {p.currentQuantity <= p.lowStockLevel ? (
                                  <button
                                    onClick={() => openNewPoModal(p.productId, null, p.recommendedRestockQuantity || 10)}
                                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Create PO</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-700 font-semibold">Healthy</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              7. SURPLUS STOCK MANAGEMENT TAB
             ============================================================ */}
          {activeTab === 'surplus' && (
            <div className="space-y-6">
              {/* Top Banner & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Boxes className="w-6 h-6 text-teal-600" />
                    <span>Surplus Stock Clearance</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Detect excess inventory, reserve stock for clearance deals, and track recovered capital without skewing regular sales margins.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCreateSurplus()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Clearance Listing</span>
                  </button>
                  <button
                    onClick={fetchSurplusData}
                    disabled={loadingSurplus}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition disabled:opacity-50"
                    title="Refresh Surplus Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingSurplus ? 'animate-spin text-teal-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Error banner if any */}
              {surplusError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{surplusError}</span>
                </div>
              )}

              {/* 6 Summary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Active Listings */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Listings</span>
                    <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {surplusSummary ? (surplusSummary.activeListings ?? surplusSummary.activeListingsCount ?? 0) : 0}
                    </div>
                    <span className="text-[10px] text-teal-600 font-medium">Live clearance campaigns</span>
                  </div>
                </div>

                {/* 2. Units Listed */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Units Listed</span>
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {surplusSummary ? surplusSummary.totalUnitsListed : 0}
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium">Total units committed</span>
                  </div>
                </div>

                {/* 3. Units Sold */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Units Sold</span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {surplusSummary ? surplusSummary.totalUnitsSold : 0}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Cleared to buyers</span>
                  </div>
                </div>

                {/* 4. Units Remaining */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Units Remaining</span>
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {surplusSummary ? surplusSummary.totalUnitsRemaining : 0}
                    </div>
                    <span className="text-[10px] text-amber-600 font-medium">Reserved in warehouse</span>
                  </div>
                </div>

                {/* 5. Recovered Revenue */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recovered Revenue</span>
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Banknote className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {formatPaise(surplusSummary ? (surplusSummary.totalSurplusSalesRevenuePaise ?? surplusSummary.totalSurplusRevenuePaise ?? 0) : 0)}
                    </div>
                    <span className="text-[10px] text-indigo-600 font-medium">Capital recovered</span>
                  </div>
                </div>

                {/* 6. Recovered Gross Profit */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Surplus Profit</span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className={`text-xl font-black ${
                      (surplusSummary?.totalSurplusGrossProfitPaise || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {formatPaise(surplusSummary ? surplusSummary.totalSurplusGrossProfitPaise : 0)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Profit above cost</span>
                  </div>
                </div>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  onClick={() => setSurplusSubTab('suggestions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    surplusSubTab === 'suggestions'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Surplus Suggestions</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    surplusSubTab === 'suggestions' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {surplusSuggestions.filter((s) => s.suggestedSurplusQuantity > 0 || s.salesActivity === 'SLOW_MOVING' || s.salesActivity === 'POTENTIAL_DEAD_STOCK').length}
                  </span>
                </button>

                <button
                  onClick={() => setSurplusSubTab('listings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    surplusSubTab === 'listings'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Clearance Listings</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    surplusSubTab === 'listings' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {surplusListings.length}
                  </span>
                </button>
              </div>

              {/* SUBTAB 1: SUGGESTIONS */}
              {surplusSubTab === 'suggestions' && (
                <div className="space-y-4">
                  {/* Informational Guidance Box */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
                    <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-teal-950">How Surplus Suggestions Work</p>
                      <p className="text-teal-800 leading-relaxed">
                        Surplus stock is determined by comparing physical on-hand inventory with configured preferred stock levels and 30-day sales velocity. Units exceeding target stock or items classified as <span className="font-bold">Slow-Moving</span> or <span className="font-bold">Potential Dead Stock</span> can be listed for clearance. When you create a clearance listing, those units are reserved so regular operations cannot oversell them.
                      </p>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Category:</span>
                      <select
                        value={surplusCategoryFilter}
                        onChange={(e) => setSurplusCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="ALL">All Categories</option>
                        {uniqueCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search product or SKU..."
                          value={surplusSearch}
                          onChange={(e) => setSurplusSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 sm:w-64"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Suggestions Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">Product & SKU</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 text-center">Physical Stock</th>
                            <th className="py-3 px-4 text-center">Reserved</th>
                            <th className="py-3 px-4 text-center">Available</th>
                            <th className="py-3 px-4 text-center">Target Stock</th>
                            <th className="py-3 px-4 text-center">Suggested Surplus</th>
                            <th className="py-3 px-4">Velocity / Activity</th>
                            <th className="py-3 px-4">Recommendation</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {surplusSuggestions
                            .filter((s) => {
                              if (surplusCategoryFilter !== 'ALL' && s.category !== surplusCategoryFilter) return false;
                              if (surplusSearch.trim()) {
                                const q = surplusSearch.toLowerCase();
                                return (s.productName || '').toLowerCase().includes(q) || (s.sku || '').toLowerCase().includes(q);
                              }
                              return true;
                            })
                            .map((s) => (
                              <tr key={s.productId} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{s.productName}</div>
                                  <div className="text-[11px] font-mono text-slate-400">{s.sku}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-medium">
                                  {s.category || 'General'}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                                  {s.currentQuantity}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-medium text-amber-700">
                                  {s.reservedQuantity > 0 ? `${s.reservedQuantity} reserved` : '—'}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                                  {s.availableQuantity}
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-slate-500">
                                  {s.preferredStockLevel != null ? s.preferredStockLevel : '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {s.suggestedSurplusQuantity > 0 ? (
                                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg font-mono font-bold text-xs">
                                      +{s.suggestedSurplusQuantity} units
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    s.salesActivity === 'HIGH_VELOCITY'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : s.salesActivity === 'REGULAR'
                                      ? 'bg-blue-100 text-blue-800'
                                      : s.salesActivity === 'SLOW_MOVING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : s.salesActivity === 'POTENTIAL_DEAD_STOCK'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {s.salesActivity?.replace(/_/g, ' ') || 'NO SALES'}
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                    {s.unitsSoldLast30Days} sold in 30d
                                  </div>
                                </td>
                                <td className="py-3 px-4 max-w-xs text-slate-600 leading-snug">
                                  {s.recommendationReason}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleOpenCreateSurplus(s, s.suggestedSurplusQuantity > 0 ? s.suggestedSurplusQuantity : s.availableQuantity)}
                                    disabled={s.availableQuantity <= 0}
                                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 font-bold rounded-xl transition text-[11px] disabled:opacity-40 disabled:hover:bg-teal-50 disabled:hover:text-teal-700"
                                  >
                                    List Clearance
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {surplusSuggestions.length === 0 && (
                            <tr>
                              <td colSpan={10} className="py-12 text-center text-slate-400">
                                <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-medium text-xs">No products currently available for surplus suggestions.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: CLEARANCE LISTINGS */}
              {surplusSubTab === 'listings' && (
                <div className="space-y-4">
                  {/* Listings Filter Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-400 text-[10px] uppercase mr-1">Status:</span>
                      {[
                        { id: '', label: 'All Listings' },
                        { id: 'ACTIVE', label: 'Active' },
                        { id: 'PARTIALLY_SOLD', label: 'Partially Sold' },
                        { id: 'SOLD_OUT', label: 'Sold Out' },
                        { id: 'CANCELLED', label: 'Cancelled' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSurplusStatusFilter(tab.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                            surplusStatusFilter === tab.id
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search listing by product..."
                          value={surplusSearch}
                          onChange={(e) => setSurplusSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 sm:w-64"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Listings Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">Listing & Product</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-center">Listed / Sold / Remaining</th>
                            <th className="py-3 px-4">Pricing & Discount</th>
                            <th className="py-3 px-4">Revenue Recovered</th>
                            <th className="py-3 px-4">Created Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {surplusListings
                            .filter((l) => {
                              if (surplusSearch.trim()) {
                                const q = surplusSearch.toLowerCase();
                                return (l.productName || '').toLowerCase().includes(q) || (l.sku || '').toLowerCase().includes(q);
                              }
                              return true;
                            })
                            .map((l) => {
                              const pctSold = l.quantityListed > 0 ? Math.round((l.quantitySold / l.quantityListed) * 100) : 0;
                              return (
                                <tr key={l.id} className="hover:bg-slate-50/60 transition">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-400 text-[11px]">#{l.id}</span>
                                      <span className="font-bold text-slate-900">{l.productName}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                      {l.sku} • {l.category || 'General'}
                                    </div>
                                    {l.notes && (
                                      <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                                        "{l.notes}"
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                      l.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : l.status === 'PARTIALLY_SOLD'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : l.status === 'SOLD_OUT'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {l.status?.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="font-mono text-xs font-bold text-slate-800">
                                      <span className="text-emerald-700">{l.quantitySold}</span> / {l.quantityListed}
                                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                                        ({l.quantityRemaining} remaining)
                                      </span>
                                    </div>
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full mx-auto mt-1.5 overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full rounded-full"
                                        style={{ width: `${pctSold}%` }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-teal-700 text-sm">
                                        {formatPaise(l.discountedUnitPricePaise ?? l.discountedSellingPricePaise)}
                                      </span>
                                      {(() => {
                                        const origPrice = l.regularUnitPricePaise ?? l.originalSellingPricePaise;
                                        const discPrice = l.discountedUnitPricePaise ?? l.discountedSellingPricePaise;
                                        return origPrice && origPrice > discPrice ? (
                                          <span className="font-mono line-through text-[11px] text-slate-400">
                                            {formatPaise(origPrice)}
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                    {l.discountPercentage != null && l.discountPercentage > 0 && (
                                      <span className="inline-block px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-[9px] rounded-md mt-0.5 border border-rose-100">
                                        {Math.round(l.discountPercentage)}% OFF
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-mono font-bold text-slate-900">
                                      {formatPaise(l.recoveredRevenuePaise ?? l.totalRealizedRevenuePaise ?? 0)}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium">
                                      +{formatPaise(l.grossProfitPaise ?? l.totalRealizedGrossProfitPaise ?? 0)} profit
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Potential: {formatPaise(
                                        l.totalPotentialRevenuePaise ??
                                        ((l.quantityListed || 0) * (l.discountedUnitPricePaise ?? l.discountedSellingPricePaise ?? 0))
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                                    {formatDateTime(l.createdAt)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Record Sale button */}
                                      {l.quantityRemaining > 0 && (l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD') && (
                                        <button
                                          onClick={() => handleOpenSurplusSale(l)}
                                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[11px] shadow-xs transition flex items-center gap-1"
                                        >
                                          <ShoppingCart className="w-3.5 h-3.5" />
                                          <span>Sell</span>
                                        </button>
                                      )}

                                      {/* Details button */}
                                      <button
                                        onClick={() => handleOpenSurplusDetail(l)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition"
                                      >
                                        Details
                                      </button>

                                      {/* Cancel button */}
                                      {(l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD') && (
                                        <button
                                          onClick={() => handleOpenCancelSurplus(l)}
                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-[11px] transition"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {surplusListings.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-medium text-xs">No clearance listings match this filter.</p>
                                <button
                                  onClick={() => handleOpenCreateSurplus()}
                                  className="mt-3 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition"
                                >
                                  Create First Clearance Listing
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              8. REPORTS TAB (FINANCIAL & BUSINESS MANAGEMENT)
             ============================================================ */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Top Banner & Primary Actions */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Financial Reports & Business Analytics</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 tracking-wider uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Authoritative P&L statements, sales margins, inventory losses, operating expenses, and procurement ledger.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={openAddExpenseModal}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={!summaryReport || loadingReports}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={fetchAllReportData}
                    disabled={loadingReports}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Refresh reports"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin text-teal-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* REPORT PERIOD SELECTOR TOOLBAR */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Segmented Control */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-fit">
                    {[
                      { id: 'DAILY', label: 'Daily' },
                      { id: 'MONTHLY', label: 'Monthly' },
                      { id: 'YEARLY', label: 'Yearly' },
                      { id: 'CUSTOM', label: 'Custom' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setReportPeriod(p.id);
                          setReportsError('');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reportPeriod === p.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Contextual Date Selectors */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {reportPeriod === 'DAILY' && (
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>Select Date:</span>
                        </label>
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {reportPeriod === 'MONTHLY' && (
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>Month & Year:</span>
                        </label>
                        <select
                          value={reportMonth}
                          onChange={(e) => setReportMonth(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {reportPeriod === 'YEARLY' && (
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>Calendar Year:</span>
                        </label>
                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {reportPeriod === 'CUSTOM' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">From:</span>
                          <input
                            type="date"
                            value={reportFrom}
                            onChange={(e) => setReportFrom(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">To:</span>
                          <input
                            type="date"
                            value={reportTo}
                            onChange={(e) => setReportTo(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Period & Timezone Summary Pill */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Period Window:</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 rounded-md font-mono text-slate-800 font-semibold">
                      {summaryReport?.from || '—'} to {summaryReport?.to || '—'}
                    </span>
                    <span className="text-slate-400">({summaryReport?.periodType || reportPeriod})</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3 h-3 text-teal-600" />
                      Asia/Kolkata (UTC+05:30)
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-600">Currency: INR (₹)</span>
                  </div>
                </div>

                {/* Error Banner */}
                {reportsError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{reportsError}</span>
                    </div>
                    <button
                      onClick={fetchAllReportData}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px]"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* 8 EXECUTIVE FINANCIAL METRIC CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Gross Sales */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Gross Sales
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 truncate">
                    {formatPaise(summaryReport?.grossSalesPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Pre-discount catalog total</p>
                </div>

                {/* 2. Discounts */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">
                    Discounts Given
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-amber-900 truncate">
                    {formatPaise(summaryReport?.discountsPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Promotions & customer savings</p>
                </div>

                {/* 3. Net Revenue */}
                <div className="p-4 bg-white rounded-2xl border border-teal-200/90 bg-teal-50/20 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-teal-800 font-bold uppercase tracking-wider">
                      Net Revenue
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                      Authoritative
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-teal-950 truncate">
                    {formatPaise(summaryReport?.netRevenuePaise || 0)}
                  </div>
                  <p className="text-[10px] text-teal-700">{summaryReport?.completedSalesCount || 0} completed orders</p>
                </div>

                {/* 4. Cost of Goods Sold */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Cost of Goods (COGS)
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 truncate">
                    {formatPaise(summaryReport?.cogsPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Procurement cost of sold items</p>
                </div>

                {/* 5. Gross Profit */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-wider">
                      Gross Profit
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      (summaryReport?.grossProfitPaise || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pnlReport?.grossMarginPercentage ?? '0.0'}% Margin
                    </span>
                  </div>
                  <div className={`text-lg sm:text-xl font-bold font-mono truncate ${
                    (summaryReport?.grossProfitPaise || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatPaise(summaryReport?.grossProfitPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Revenue minus product COGS</p>
                </div>

                {/* 6. Inventory Losses */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-rose-600 font-bold uppercase tracking-wider">
                    Inventory Losses
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 truncate">
                    {formatPaise(summaryReport?.inventoryLossPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{lossReport?.totalUnitsLost || 0} units lost / damaged</p>
                </div>

                {/* 7. Operating Expenses */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider">
                    Operating Expenses
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-purple-900 truncate">
                    {formatPaise(summaryReport?.operatingExpensesPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Rent, salaries & overheads</p>
                </div>

                {/* 8. Operating Result Before Tax */}
                <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                  (summaryReport?.operatingResultPaise || 0) >= 0
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Operating Result
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      (summaryReport?.operatingResultPaise || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pnlReport?.netMarginPercentage ?? '0.0'}% Net
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono truncate">
                    {formatPaise(summaryReport?.operatingResultPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-500">Gross profit - losses - expenses</p>
                </div>
              </div>

              {/* REPORT SUB-TABS NAVIGATION */}
              <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs pb-1">
                {[
                  { id: 'overview', label: 'Executive P&L Statement', icon: FileText },
                  { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
                  { id: 'loss', label: 'Inventory Loss', icon: TrendingDown },
                  { id: 'purchasing', label: 'Purchasing & Procurement', icon: ShoppingBag },
                  { id: 'expenses', label: 'Operating Expenses', icon: Receipt }
                ].map((st) => {
                  const Icon = st.icon;
                  const active = reportSubTab === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setReportSubTab(st.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ========================================================
                  SUB-TAB 1: EXECUTIVE OVERVIEW & P&L STATEMENT
                 ======================================================== */}
              {reportSubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Financial Breakdown Performance Chart */}
                  {summaryReport?.breakdown && summaryReport.breakdown.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Performance Trend</h3>
                          <p className="text-xs text-slate-500">
                            {summaryReport.periodType === 'YEARLY'
                              ? '12-Month Fiscal Distribution'
                              : summaryReport.periodType === 'MONTHLY'
                              ? 'Daily Financial Progression'
                              : 'Period Comparison Timeline'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Net Revenue
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Gross Profit
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Expenses
                          </span>
                        </div>
                      </div>

                      <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={summaryReport.breakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                              dataKey="period"
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              tickLine={false}
                              axisLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(val) => `₹${(val / 100).toLocaleString('en-IN')}`}
                            />
                            <Tooltip
                              formatter={(val, name) => [formatPaise(val), name]}
                              labelFormatter={(lbl) => `Period: ${lbl}`}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                            />
                            <Bar dataKey="netRevenuePaise" name="Net Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="grossProfitPaise" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="operatingExpensesPaise" name="Operating Expenses" fill="#9333ea" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* FORMAL PROFIT & LOSS STATEMENT */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Profit & Loss Statement (Operating)</h3>
                        <p className="text-xs text-slate-500">
                          Structured income & expenditure summary for {summaryReport?.from || '—'} to {summaryReport?.to || '—'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
                        Management Accounting
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
                      {/* 1. REVENUE SECTION */}
                      <div className="space-y-2 border-l-2 border-teal-500 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>1. Revenue</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 pl-2 text-xs">
                          <span>Gross Sales (Catalog Price)</span>
                          <span className="font-mono">{formatPaise(summaryReport?.grossSalesPaise || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-700 pl-2 text-xs">
                          <span>Less: Sales Discounts & Reductions</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.discountsPaise || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-teal-800 pt-1.5 border-t border-slate-100 pl-2">
                          <span>Net Revenue</span>
                          <span className="font-mono">{formatPaise(summaryReport?.netRevenuePaise || 0)}</span>
                        </div>
                      </div>

                      {/* 2. COST OF GOODS SOLD */}
                      <div className="space-y-2 border-l-2 border-slate-400 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>2. Cost of Goods Sold (COGS)</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 pl-2 text-xs">
                          <span>Direct Procurement Cost of Sold Inventory</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.cogsPaise || 0)}</span>
                        </div>
                      </div>

                      {/* 3. GROSS PROFIT */}
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between font-bold text-emerald-950">
                        <div>
                          <span>3. Gross Profit (Net Revenue − COGS)</span>
                          <span className="ml-2 px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-md text-[10px]">
                            {pnlReport?.grossMarginPercentage ?? '0.0'}% Gross Margin
                          </span>
                        </div>
                        <span className="font-mono text-base">{formatPaise(summaryReport?.grossProfitPaise || 0)}</span>
                      </div>

                      {/* 4. INVENTORY LOSSES */}
                      <div className="space-y-2 border-l-2 border-rose-400 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>4. Inventory Losses</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-rose-700 pl-2 text-xs">
                          <span>Physical Audit Discrepancies & Stock Adjustments</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.inventoryLossPaise || 0)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-2">
                          Derived strictly from negative adjustment logs and non-sale outflows.
                        </p>
                      </div>

                      {/* 5. OPERATING EXPENSES */}
                      <div className="space-y-2 border-l-2 border-purple-400 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>5. Operating Expenses (OPEX)</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-900 pl-2 text-xs">
                          <span>Total Recorded Overhead & Operating Expenses</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.operatingExpensesPaise || 0)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-2">
                          Includes warehouse rent, staff salaries, utility bills, maintenance and other registered expenses.
                        </p>
                      </div>

                      {/* 6. FINAL OPERATING RESULT */}
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        (summaryReport?.operatingResultPaise || 0) >= 0
                          ? 'bg-emerald-100/70 border-emerald-200 text-emerald-950'
                          : 'bg-rose-100/70 border-rose-200 text-rose-950'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold">Operating Result Before Tax</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (summaryReport?.operatingResultPaise || 0) >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                            }`}>
                              {pnlReport?.netMarginPercentage ?? '0.0'}% Net Margin
                            </span>
                          </div>
                          <p className="text-xs opacity-80 mt-0.5">
                            Gross Profit ({formatPaise(summaryReport?.grossProfitPaise || 0)}) − Inventory Loss ({formatPaise(summaryReport?.inventoryLossPaise || 0)}) − Operating Expenses ({formatPaise(summaryReport?.operatingExpensesPaise || 0)})
                          </p>
                        </div>
                        <div className="font-mono text-xl sm:text-2xl font-bold">
                          {formatPaise(summaryReport?.operatingResultPaise || 0)}
                        </div>
                      </div>

                      {/* 7. PROCUREMENT CAPITALIZATION NOTE */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900">Procurement & Inventory Balance Note: </span>
                          <span>
                            Total purchases of {formatPaise(summaryReport?.totalPurchasesPaise || 0)} ({summaryReport?.purchaseOrdersCount || 0} purchase orders) occurred in this period. As per standard inventory accounting, purchase orders increase warehouse balance sheet assets and are not deducted as operating expenses.
                          </span>
                        </div>
                      </div>

                      {/* DISCLAIMER FOOTER */}
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center italic">
                        Note: This is a management-level operating report calculated from recorded system transactions. It does not constitute an audited statutory or tax statement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 2: SALES ANALYTICS
                 ======================================================== */}
              {reportSubTab === 'sales' && (
                <div className="space-y-6">
                  {/* Sales Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Average Order Value</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {formatPaise(salesReport?.averageOrderValuePaise || 0)}
                      </div>
                      <p className="text-[10px] text-slate-400">Net revenue / completed orders</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Completed Orders</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {salesReport?.completedSalesCount || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Excludes cancelled transactions</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Units Sold</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {salesReport?.unitsSold || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Across all product lines</p>
                    </div>
                  </div>

                  {/* Payment Method Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Payment Methods Breakdown</h3>
                    {salesReport?.paymentMethods && salesReport.paymentMethods.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {salesReport.paymentMethods.map((pm) => (
                          <div key={pm.paymentMethod} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 border border-slate-200 uppercase">
                                {pm.paymentMethod}
                              </span>
                              <p className="text-xs text-slate-500 mt-1">{pm.orderCount} transaction(s)</p>
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {formatPaise(pm.totalPaise)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No completed sales recorded in this period.</p>
                    )}
                  </div>

                  {/* Top Selling Products Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Top-Selling Products by Revenue</h3>
                      <span className="text-xs text-slate-500">Ranked by net sales volume</span>
                    </div>

                    {salesReport?.topSellingProducts && salesReport.topSellingProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">Product Name</th>
                              <th className="py-3 px-4">SKU</th>
                              <th className="py-3 px-4">Category</th>
                              <th className="py-3 px-4 text-center">Units Sold</th>
                              <th className="py-3 px-4 text-right">Revenue</th>
                              <th className="py-3 px-4 text-right">COGS</th>
                              <th className="py-3 px-4 text-right">Gross Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {salesReport.topSellingProducts.map((p, idx) => (
                              <tr key={p.productId || idx} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">{p.productName}</td>
                                <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-bold font-mono">{p.unitsSold}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatPaise(p.totalRevenuePaise)}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatPaise(p.totalCostPaise)}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatPaise(p.grossProfitPaise)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No product sales recorded in the selected period.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 3: INVENTORY LOSS ANALYSIS
                 ======================================================== */}
              {reportSubTab === 'loss' && (
                <div className="space-y-6">
                  {/* Loss Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
                      <span className="text-xs text-rose-700 font-bold uppercase tracking-wider">Total Loss Value</span>
                      <div className="text-2xl font-bold font-mono text-rose-800">
                        {formatPaise(lossReport?.totalLossPaise || 0)}
                      </div>
                      <p className="text-[10px] text-slate-500">Valued at product purchase cost</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Units Lost</span>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {lossReport?.totalUnitsLost || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Missing, damaged, or expired stock</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Loss Incidents</span>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {lossReport?.incidentCount || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Recorded adjustment events</p>
                    </div>
                  </div>

                  {/* Accounting Policy Alert */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Loss Derivation & Surplus Accounting Rule:</p>
                      <p className="mt-0.5 text-amber-800">
                        Inventory losses are derived strictly from downward adjustments and non-sale outflows. Upward stock count reconciliations from physical audits are tracked separately as "Additional Inventory Found" and are never counted as revenue or operating profit.
                      </p>
                    </div>
                  </div>

                  {/* Incidents Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Inventory Loss Incidents</h3>
                      <span className="text-xs text-slate-500">{lossReport?.incidents?.length || 0} registered incidents</span>
                    </div>

                    {lossReport?.incidents && lossReport.incidents.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">ID</th>
                              <th className="py-3 px-4">Product Name</th>
                              <th className="py-3 px-4">SKU</th>
                              <th className="py-3 px-4 text-center">Units Lost</th>
                              <th className="py-3 px-4 text-right">Unit Cost</th>
                              <th className="py-3 px-4 text-right">Total Loss</th>
                              <th className="py-3 px-4">Reason / Audit Details</th>
                              <th className="py-3 px-4 text-right">Recorded Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lossReport.incidents.map((inc) => (
                              <tr key={inc.movementId} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 px-4 font-mono text-slate-500">#{inc.movementId}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">{inc.productName}</td>
                                <td className="py-3 px-4 font-mono text-slate-600">{inc.sku}</td>
                                <td className="py-3 px-4 text-center font-bold font-mono text-rose-700">-{inc.unitsLost}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatPaise(inc.unitCostPaise)}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatPaise(inc.totalLossPaise)}</td>
                                <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{inc.reason || 'Manual Adjustment'}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-500">{formatDateTime(inc.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No inventory loss incidents registered in this period.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 4: PURCHASING & PROCUREMENT ANALYSIS
                 ======================================================== */}
              {reportSubTab === 'purchasing' && (
                <div className="space-y-6">
                  {/* Purchasing Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total POs Created</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {purchasesReport?.totalOrdersCount || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Excludes cancelled POs</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Procurement Spend</span>
                      <div className="text-xl font-bold font-mono text-teal-800">
                        {formatPaise(purchasesReport?.totalSpendPaise || 0)}
                      </div>
                      <p className="text-[10px] text-slate-400">Committed purchase value</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Units Ordered</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {purchasesReport?.totalUnitsOrdered || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Gross purchase units</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Units Received</span>
                      <div className="text-xl font-bold font-mono text-emerald-700">
                        {purchasesReport?.totalUnitsReceived || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Delivered to warehouse</p>
                    </div>
                  </div>

                  {/* Supplier Spend Breakdown Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Supplier Procurement Breakdown</h3>
                      <span className="text-xs text-slate-500">Spend allocated per supplier</span>
                    </div>

                    {purchasesReport?.supplierBreakdown && purchasesReport.supplierBreakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">Supplier Name</th>
                              <th className="py-3 px-4 text-center">Orders Placed</th>
                              <th className="py-3 px-4 text-right">Total Procurement Spend</th>
                              <th className="py-3 px-4 text-right">Spend Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {purchasesReport.supplierBreakdown.map((s) => {
                              const share = purchasesReport.totalSpendPaise > 0
                                ? ((s.totalSpendPaise / purchasesReport.totalSpendPaise) * 100).toFixed(1)
                                : '0.0';
                              return (
                                <tr key={s.supplierId} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3 px-4 font-bold text-slate-900">{s.supplierName}</td>
                                  <td className="py-3 px-4 text-center font-bold font-mono">{s.orderCount}</td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatPaise(s.totalSpendPaise)}</td>
                                  <td className="py-3 px-4 text-right font-mono text-teal-700 font-semibold">{share}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No purchase orders registered in this reporting period.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 5: OPERATING EXPENSES (CRUD)
                 ======================================================== */}
              {reportSubTab === 'expenses' && (
                <div className="space-y-6">
                  {/* Expenses Action Header */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Filter by Category:</span>
                        <select
                          value={expenseCategoryFilter}
                          onChange={(e) => {
                            setExpenseCategoryFilter(e.target.value);
                            setExpensesPage(1);
                          }}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="ALL">All Categories</option>
                          {['Rent', 'Salaries', 'Utilities', 'Transport', 'Maintenance', 'Marketing', 'Other'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={openAddExpenseModal}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Expense</span>
                      </button>
                    </div>

                    {/* Expense Date Filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Expense Date:</span>
                      <input
                        type="date"
                        value={expenseDateFrom}
                        onChange={(e) => {
                          setExpenseDateFrom(e.target.value);
                          setExpensesPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={expenseDateTo}
                        onChange={(e) => {
                          setExpenseDateTo(e.target.value);
                          setExpensesPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {(expenseDateFrom || expenseDateTo) && (
                        <button
                          onClick={() => {
                            setExpenseDateFrom('');
                            setExpenseDateTo('');
                            setExpensesPage(1);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expenses Ledger Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Operating Expenses Ledger</h3>
                      <span className="text-xs text-slate-500">
                        {expensesList.filter(e => {
                          if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                          const d = (e.createdAt || e.created_at || '').slice(0, 10);
                          if (expenseDateFrom && d && d < expenseDateFrom) return false;
                          if (expenseDateTo && d && d > expenseDateTo) return false;
                          return true;
                        }).length} recorded items
                      </span>
                    </div>

                    {expensesList.filter(e => {
                      if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                      const d = (e.createdAt || e.created_at || '').slice(0, 10);
                      if (expenseDateFrom && d && d < expenseDateFrom) return false;
                      if (expenseDateTo && d && d > expenseDateTo) return false;
                      return true;
                    }).length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">ID</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {expensesList
                                .filter(e => {
                                  if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                                  const d = (e.createdAt || e.created_at || '').slice(0, 10);
                                  if (expenseDateFrom && d && d < expenseDateFrom) return false;
                                  if (expenseDateTo && d && d > expenseDateTo) return false;
                                  return true;
                                })
                                .slice((expensesPage - 1) * expensesPageSize, expensesPage * expensesPageSize)
                                .map((exp) => (
                                  <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                                    <td className="py-3 px-4 font-mono text-slate-500">#{exp.id}</td>
                                    <td className="py-3 px-4">
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                                        {exp.category}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-900">{exp.description || '—'}</td>
                                    <td className="py-3 px-4 font-mono text-slate-600">{formatDateTime(exp.createdAt)}</td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatPaise(exp.amountPaise)}</td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => openEditExpenseModal(exp)}
                                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                                          title="Edit Expense"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => confirmDeleteExpense(exp)}
                                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition"
                                          title="Delete Expense"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        <PaginationBar
                          currentPage={expensesPage}
                          totalRecords={
                            expensesList.filter(e => {
                              if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                              const d = (e.createdAt || e.created_at || '').slice(0, 10);
                              if (expenseDateFrom && d && d < expenseDateFrom) return false;
                              if (expenseDateTo && d && d > expenseDateTo) return false;
                              return true;
                            }).length
                          }
                          pageSize={expensesPageSize}
                          onPageChange={setExpensesPage}
                          onPageSizeChange={(newSize) => {
                            setExpensesPageSize(newSize);
                            setExpensesPage(1);
                          }}
                        />
                      </>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No operating expenses found for the selected category.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-around px-2 py-1 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition flex-1 ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="text-[9px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ============================================================
          MODALS & DIALOGS SECTION
         ============================================================ */}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProduct ? `Catalog SKU: ${productForm.sku}` : 'Register an item in your inventory'}
                </p>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {productFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  placeholder="e.g. Bosch Impact Drill 18V"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.category}
                  onChange={(e) => handleProductCategoryChange(e.target.value)}
                  placeholder="e.g. Power Tools"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.sellingPriceRupees}
                    onChange={(e) => setProductForm({ ...productForm, sellingPriceRupees: e.target.value })}
                    placeholder="6500.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Purchase Cost (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.purchasePriceRupees}
                    onChange={(e) => setProductForm({ ...productForm, purchasePriceRupees: e.target.value })}
                    placeholder="4000.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Preferred Supplier Selector */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Preferred Supplier</label>
                <select
                  value={productForm.supplierId}
                  onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">No Preferred Supplier (Unassigned)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson || 'Vendor'})
                    </option>
                  ))}
                </select>
              </div>

              {!editingProduct && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Opening Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              )}

              {/* Collapsed Advanced Fields */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvancedProduct(!showAdvancedProduct)}
                  className="text-xs font-semibold text-teal-700 flex items-center gap-1.5"
                >
                  <span>Advanced Settings (SKU & Thresholds)</span>
                  {showAdvancedProduct ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedProduct && (
                  <div className="space-y-3 pt-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => {
                          setSkuManuallyEdited(true);
                          setProductForm({ ...productForm, sku: e.target.value });
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Low-Stock Alert Level</label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.minStockLevel}
                          onChange={(e) => setProductForm({ ...productForm, minStockLevel: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Preferred Target Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.targetStockLevel}
                          onChange={(e) => setProductForm({ ...productForm, targetStockLevel: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition"
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD SALE (POS CART) */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {saleSuccessData ? (
              <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Sale Completed Successfully!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Order <span className="font-mono font-semibold text-slate-800">#SO-{saleSuccessData.id}</span> has been processed and inventory updated.
                  </p>
                </div>

                {/* Receipt Card Summary */}
                <div className="w-full bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 text-left text-xs space-y-3 font-mono">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Date & Time</span>
                    <span className="text-slate-800">{formatDateTime(saleSuccessData.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Payment Method</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-sans font-bold text-[11px] uppercase">
                      {saleSuccessData.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Subtotal</span>
                    <span className="text-slate-800">{formatPaise(saleSuccessData.subtotalPaise)}</span>
                  </div>
                  {saleSuccessData.discountPaise > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-rose-600 font-semibold">
                      <span className="font-sans">Discount {saleSuccessData.discountPercent ? `(${saleSuccessData.discountPercent}%)` : ''}</span>
                      <span>-{formatPaise(saleSuccessData.discountPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 text-sm font-bold text-slate-900">
                    <span className="font-sans">Total Paid</span>
                    <span className="text-indigo-700">{formatPaise(saleSuccessData.totalPaise)}</span>
                  </div>
                  {saleSuccessData.grossProfitPaise !== undefined && (
                    <div className="flex justify-between items-center pt-1 text-xs text-emerald-700 font-semibold">
                      <span className="font-sans">Gross Profit</span>
                      <span>{formatPaise(saleSuccessData.grossProfitPaise)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sid = saleSuccessData.id;
                      setSaleModalOpen(false);
                      viewSaleDetails(sid);
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleSuccessData(null);
                      setSaleCart(products.length > 0 ? [{ productId: products[0].id, quantity: 1, customPriceRupees: null }] : []);
                      setSaleDiscountPercent(0);
                      setSaleFormError('');
                      setSaleRequiresConfirm(false);
                      setSaleProductSearchQuery('');
                      setTimeout(() => saleSearchInputRef.current?.focus(), 100);
                    }}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Sale</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleModalOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* POS Cart Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <ShoppingCart className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">Record Customer Sale (POS)</h3>
                      <p className="text-xs text-slate-500">Multi-item checkout with editable selling prices & verified stock</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {saleCart.length > 0 && (
                      showClearCartConfirm ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl text-xs">
                          <span className="text-rose-700 font-medium">Clear cart?</span>
                          <button
                            type="button"
                            onClick={handleClearCart}
                            className="font-bold text-rose-700 hover:text-rose-900 underline ml-1"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowClearCartConfirm(false)}
                            className="text-slate-500 hover:text-slate-700 ml-1"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowClearCartConfirm(true)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 font-medium"
                          title="Clear Cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Clear Cart</span>
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setSaleModalOpen(false)}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCheckoutSale} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                  {saleFormError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{saleFormError}</span>
                    </div>
                  )}

                  {/* Product Search & Quick Add */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          ref={saleSearchInputRef}
                          type="text"
                          value={saleProductSearchQuery}
                          onChange={(e) => setSaleProductSearchQuery(e.target.value)}
                          placeholder="Search product by name or SKU to quick-add..."
                          className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                        {saleProductSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSaleProductSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCartRow}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition shrink-0 flex items-center gap-1"
                        title="Add first available product"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Row</span>
                      </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {saleProductSearchQuery.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {searchFilteredProducts.length === 0 ? (
                          <div className="p-3 text-center text-slate-400">
                            No products matching &ldquo;{saleProductSearchQuery}&rdquo;
                          </div>
                        ) : (
                          searchFilteredProducts.map((p) => {
                            const isOut = p.quantity <= 0;
                            const inCart = saleCart.some((c) => Number(c.productId) === Number(p.id));
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition ${
                                  isOut ? 'opacity-60' : ''
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {inCart && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-semibold">
                                        In Cart
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">SKU: {p.sku || 'N/A'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-900">{formatPaise(p.sellingPricePaise)}</div>
                                  <div className={`text-[10px] font-semibold ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                                    {isOut ? 'Out of Stock' : `Stock: ${p.quantity}`}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">
                        Cart Items ({cartCalculations.items.length})
                      </label>
                      {cartCalculations.anyPriceEdited && (
                        <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Custom prices active
                        </span>
                      )}
                    </div>

                    {cartCalculations.items.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">Your cart is empty</p>
                          <p className="text-slate-400 text-xs">Search for products above or choose a quick option to start.</p>
                        </div>
                        {products.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                            {products.slice(0, 4).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-700 text-xs transition"
                              >
                                + {p.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      cartCalculations.items.map((row, idx) => (
                        <div
                          key={idx}
                          className={`p-3 sm:p-3.5 rounded-xl border transition space-y-2.5 ${
                            row.isBelowCost
                              ? 'bg-rose-50/40 border-rose-200'
                              : row.isPriceEdited
                              ? 'bg-indigo-50/30 border-indigo-200'
                              : 'bg-slate-50/80 border-slate-200/80'
                          }`}
                        >
                          {/* Row Top: Product Select & Remove */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <select
                                value={row.productId}
                                onChange={(e) => handleCartItemChange(idx, 'productId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-indigo-500"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.quantity}) — Reg: {formatPaise(p.sellingPricePaise)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Row Middle: Quantity, Editable Price, Line Total */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            {/* Quantity Controls (4 cols) */}
                            <div className="sm:col-span-4 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, -1)}
                                disabled={row.quantity <= 1}
                                className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 rounded-lg flex items-center justify-center text-slate-600 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={row.availableStock}
                                value={row.quantity}
                                onChange={(e) => handleCartItemChange(idx, 'quantity', e.target.value)}
                                className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, 1)}
                                className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <span className={`text-[10px] ml-1.5 font-medium ${row.isStockExceeded ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                / {row.availableStock}
                              </span>
                            </div>

                            {/* Editable Unit Price (5 cols) */}
                            <div className="sm:col-span-5">
                              <div className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.customPriceRupees !== null && row.customPriceRupees !== undefined ? row.customPriceRupees : (row.masterSellingPricePaise / 100).toFixed(2)}
                                    onChange={(e) => handleCustomPriceChange(idx, e.target.value)}
                                    placeholder={(row.masterSellingPricePaise / 100).toFixed(2)}
                                    className={`w-full pl-6 pr-2 py-1 bg-white border rounded-lg text-xs font-mono font-semibold transition ${
                                      row.isBelowCost
                                        ? 'border-rose-300 text-rose-700 bg-rose-50/20'
                                        : row.isPriceEdited
                                        ? 'border-indigo-300 text-indigo-900 bg-indigo-50/20'
                                        : 'border-slate-200 text-slate-800'
                                    }`}
                                  />
                                </div>
                                {row.isPriceEdited && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetItemPrice(idx)}
                                    className="px-1.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition flex items-center gap-0.5 shrink-0"
                                    title={`Reset to original price: ${formatPaise(row.masterSellingPricePaise)}`}
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>Reset</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                <span className="text-slate-400">Reg: {formatPaise(row.masterSellingPricePaise)}</span>
                                {row.isPriceEdited && (
                                  <span className="px-1 py-0.2 rounded text-[9px] bg-indigo-100 text-indigo-700 font-semibold">
                                    Custom
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Line Total (3 cols) */}
                            <div className="sm:col-span-3 text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-mono">Line Total</div>
                              <div className="font-mono font-bold text-sm text-slate-900">
                                {formatPaise(row.lineTotalPaise)}
                              </div>
                            </div>
                          </div>

                          {/* Below-Cost Warning Banner */}
                          {row.isBelowCost && (
                            <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 flex items-start gap-1.5 text-[11px] leading-tight">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Warning: Selling below purchase cost.</span> Expected loss: <span className="font-mono font-bold">₹{(row.lineLossPaise / 100).toFixed(2)}</span> ({formatPaise(row.unitLossPaise)} / unit).
                              </div>
                            </div>
                          )}

                          {/* Stock Exceeded Warning Banner */}
                          {row.isStockExceeded && (
                            <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 flex items-start gap-1.5 text-[11px] leading-tight">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Insufficient stock:</span> Requested {row.quantity} units, but only {row.availableStock} in stock.
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Percentage Discount Selector */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-teal-600" />
                        <span>Order Discount (%)</span>
                      </label>
                      {cartCalculations.discountPaise > 0 && (
                        <span className="font-mono font-bold text-rose-600 text-xs">
                          Saves {formatPaise(cartCalculations.discountPaise)} ({cartCalculations.discountPercent}%)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[0, 5, 10, 15, 20].map((preset) => {
                        const isActive = Number(saleDiscountPercent) === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setSaleDiscountPercent(preset);
                              if (saleRequiresConfirm) setSaleRequiresConfirm(false);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              isActive
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {preset === 0 ? 'None (0%)' : `${preset}%`}
                          </button>
                        );
                      })}
                      <div className="relative w-28 ml-auto">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={saleDiscountPercent}
                          onChange={(e) => {
                            setSaleDiscountPercent(e.target.value);
                            if (saleRequiresConfirm) setSaleRequiresConfirm(false);
                          }}
                          placeholder="Custom %"
                          className="w-full pr-6 pl-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="font-bold text-slate-800">Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash', icon: Banknote },
                        { id: 'UPI', label: 'UPI / Digital', icon: Wallet },
                        { id: 'CARD', label: 'Card', icon: CreditCard },
                        { id: 'OTHER', label: 'Other', icon: Receipt }
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = salePaymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => {
                              setSalePaymentMethod(pm.id);
                              try {
                                sessionStorage.setItem('stockpile_last_payment_method', pm.id);
                              } catch {}
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="font-semibold text-xs">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bill Financial Summary */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-600 font-sans">
                      <span>Subtotal ({cartCalculations.items.length} items):</span>
                      <span className="font-mono font-semibold">{formatPaise(cartCalculations.subtotalPaise)}</span>
                    </div>
                    {cartCalculations.discountPaise > 0 && (
                      <div className="flex justify-between text-rose-600 font-sans font-semibold">
                        <span>Discount ({cartCalculations.discountPercent}%):</span>
                        <span className="font-mono">-{formatPaise(cartCalculations.discountPaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold text-base pt-1.5 border-t border-slate-200 font-sans">
                      <span>Final Payable:</span>
                      <span className="font-mono text-indigo-700">{formatPaise(cartCalculations.finalTotalPaise)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] font-sans">
                      <div>
                        <span className="text-slate-400 block">Est. Cost of Goods (COGS)</span>
                        <span className="font-mono font-semibold text-slate-700">{formatPaise(cartCalculations.estimatedCogsPaise)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Est. Gross Profit</span>
                        <span className={`font-mono font-bold ${cartCalculations.estimatedGrossProfitPaise >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatPaise(cartCalculations.estimatedGrossProfitPaise)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Negative Gross Profit Banner */}
                  {cartCalculations.isNegativeProfit && (
                    <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        Warning: This sale will result in an estimated net loss of ₹{Math.abs(cartCalculations.estimatedGrossProfitPaise / 100).toFixed(2)}.
                      </span>
                    </div>
                  )}

                  {/* Confirmation Notice Step */}
                  {saleRequiresConfirm && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Confirmation Required:</span> This sale contains items priced below cost or discounts exceeding 20%. Click &ldquo;Confirm & Complete Sale&rdquo; below to confirm this transaction.
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSaleModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submittingSale ||
                        cartCalculations.items.length === 0 ||
                        cartCalculations.hasStockExceededItem
                      }
                      className={`px-5 py-2.5 rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 ${
                        saleRequiresConfirm
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : cartCalculations.isNegativeProfit
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {submittingSale ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : saleRequiresConfirm ? (
                        <span>Confirm & Complete Sale</span>
                      ) : (
                        `Confirm & Pay ${formatPaise(cartCalculations.finalTotalPaise)}`
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: SALE DETAILS MODAL */}
      {saleDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Sale Order #SO-{selectedSaleDetail?.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSaleDetail?.status} on {formatDateTime(selectedSaleDetail?.createdAt)} • Payment: {selectedSaleDetail?.paymentMethod}
                </p>
              </div>
              <button
                onClick={() => setSaleDetailModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Purchased Items</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedSaleDetail?.items?.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.productNameSnapshot}</span>
                          {item.belowCost && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                              Below Cost
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">SKU: {item.skuSnapshot}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-bold text-slate-900">{formatPaise(item.lineTotalPaise)}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.quantity} × {formatPaise(item.unitSellingPricePaise)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPaise(selectedSaleDetail?.subtotalPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span>
                    -{formatPaise(selectedSaleDetail?.discountPaise)}
                    {selectedSaleDetail?.discountPercent ? ` (${selectedSaleDetail.discountPercent}%)` : ''}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total:</span>
                  <span>{formatPaise(selectedSaleDetail?.totalPaise)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold pt-1">
                  <span>Gross Profit Margin:</span>
                  <span>{formatPaise(selectedSaleDetail?.grossProfitPaise)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CANCEL SALE DIALOG */}
      {cancelSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Cancel Sale #SO-{saleToCancel?.id}</h3>
            <p className="text-slate-500">
              Cancelling this sale will mark it as CANCELLED and restore the inventory quantities to warehouse stock immediately.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Reason for Cancellation</label>
              <input
                type="text"
                value={cancelSaleReason}
                onChange={(e) => setCancelSaleReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelSaleModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Keep Sale
              </button>
              <button
                type="button"
                disabled={cancellingSale}
                onClick={handleCancelSale}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {cancellingSale ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CREATE / EDIT PURCHASE ORDER */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-600 text-white rounded-lg">
                  <Truck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingPo ? `Edit Draft PO #${editingPo.id}` : 'Create Purchase Order'}
                  </h3>
                  <p className="text-xs text-slate-500">Draft inbound restock order with preferred vendor</p>
                </div>
              </div>
              <button
                onClick={() => setPoModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePurchaseOrder(false);
              }}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
            >
              {poFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{poFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Select Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={poForm.supplierId}
                  onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select a vendor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson || 'Vendor'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Order Notes / Memo</label>
                <input
                  type="text"
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  placeholder="e.g. Warehouse Q4 replenishment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Order Item Lines</label>
                {poCalculations.items.map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <select
                        value={row.productId}
                        onChange={(e) => handlePoItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-16 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center text-xs"
                      />
                    </div>

                    <div className="w-20 shrink-0">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCostRupees}
                        onChange={(e) => handlePoItemChange(idx, 'unitCostRupees', e.target.value)}
                        placeholder="Cost ₹"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div className="w-20 text-right font-mono font-bold text-slate-900 shrink-0 text-xs">
                      {formatPaise(row.lineTotalPaise)}
                    </div>

                    {poCalculations.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePoItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPoItemRow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-mono font-bold text-xs">
                <span>Calculated Total Amount:</span>
                <span className="text-teal-700 text-sm">{formatPaise(poCalculations.totalPaise)}</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPo}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={savingPo}
                  onClick={() => handleSavePurchaseOrder(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition"
                >
                  Save & Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RECEIVE PO GOODS */}
      {receiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Receive PO Goods #{receivingPo?.id}</h3>
                <p className="text-xs text-slate-500">Supplier: {receivingPo?.supplierName}</p>
              </div>
              <button
                onClick={() => setReceiveModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceive} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {receiveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{receiveError}</span>
                </div>
              )}

              <p className="text-slate-600 text-xs">
                Specify quantities received in this shipment. Warehouse stock will automatically increment and log audit entries.
              </p>

              <div className="space-y-2">
                {receivingPo?.items?.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                        <p className="text-[10px] text-slate-400">SKU: {item.skuSnapshot}</p>
                      </div>
                      <span className="font-mono text-xs text-slate-600">
                        Remaining: <span className="font-bold text-teal-700">{item.remainingQuantity}</span> units
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Receive Quantity:</label>
                      <input
                        type="number"
                        min="0"
                        max={item.remainingQuantity}
                        value={receiveItemQuantities[item.id] ?? item.remainingQuantity}
                        onChange={(e) =>
                          setReceiveItemQuantities({
                            ...receiveItemQuantities,
                            [item.id]: e.target.value
                          })
                        }
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReceive}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition"
                >
                  {submittingReceive ? 'Receiving...' : 'Confirm Delivery Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: CANCEL PO DIALOG */}
      {cancelPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Cancel PO #{poToCancel?.id}</h3>
            <p className="text-slate-500">
              Cancelling will close outstanding quantities on this purchase order. Any stock already received will be retained.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Cancellation Reason</label>
              <input
                type="text"
                value={cancelPoReason}
                onChange={(e) => setCancelPoReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelPoModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancellingPo}
                onClick={handleCancelPo}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {cancellingPo ? 'Cancelling...' : 'Confirm PO Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: PO DETAILS MODAL */}
      {poDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Purchase Order #PO-{selectedPoDetail?.id}</h3>
                <p className="text-xs text-slate-500">
                  Vendor: {selectedPoDetail?.supplierName} | Status: {selectedPoDetail?.status}
                </p>
              </div>
              <button
                onClick={() => setPoDetailModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Order Lines</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedPoDetail?.items?.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                        <p className="text-[10px] text-slate-400">
                          Ordered: {item.quantityOrdered} | Received: {item.quantityReceived} | Remaining: {item.remainingQuantity}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-bold text-slate-900">{formatPaise(item.lineTotalPaise)}</p>
                        <p className="text-[10px] text-slate-400">@ {formatPaise(item.unitCostPaise)} / unit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Order Amount:</span>
                  <span>{formatPaise(selectedPoDetail?.totalAmountPaise)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: ADD / EDIT SUPPLIER */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h3>
              <button
                onClick={() => setSupplierModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              {supplierFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
                  {supplierFormError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phone</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition"
                >
                  {savingSupplier ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10: DELETE SUPPLIER CONFIRMATION */}
      {deleteSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Delete Supplier "{supplierToDelete?.name}"?</h3>
            <p className="text-slate-500">
              Suppliers referenced by catalog products or purchase orders are protected by relational integrity guards and cannot be deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteSupplierModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingSupplier}
                onClick={handleDeleteSupplier}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {deletingSupplier ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: SUPPLIER PRODUCTS LIST */}
      {supplierProductsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Products Supplied by {selectedSupplierForProducts?.name}
                </h3>
                <p className="text-[11px] text-slate-400">Linked as preferred vendor</p>
              </div>
              <button
                onClick={() => setSupplierProductsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {supplierProductsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No catalog products currently designate this supplier as preferred vendor.
                </div>
              ) : (
                supplierProductsList.map((p) => (
                  <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400">SKU: {p.sku} | In Stock: {p.quantity}</p>
                    </div>
                    <span className="font-mono text-slate-800 font-bold">{formatPaise(p.purchasePricePaise)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 12: DELETE PRODUCT CONFIRMATION */}
      {deleteProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Delete Product "{productToDelete?.name}"?</h3>
            <p className="text-slate-500">
              Products with stock movement history, sales records, or purchase orders cannot be deleted in order to preserve relational accounting integrity.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProductModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProduct}
                onClick={handleDeleteProduct}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {deletingProduct ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 13: QUICK ACTION MODAL (FAST INTAKE / QUICK SALE / ADJUST) */}
      {quickActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`p-1.5 rounded-lg text-white ${
                    quickActionForm.action === 'RECEIVE'
                      ? 'bg-emerald-600'
                      : quickActionForm.action === 'SALE'
                      ? 'bg-indigo-600'
                      : 'bg-amber-600'
                  }`}
                >
                  {quickActionForm.action === 'RECEIVE' ? (
                    <ArrowDown className="w-4 h-4" />
                  ) : quickActionForm.action === 'SALE' ? (
                    <ShoppingCart className="w-4 h-4" />
                  ) : (
                    <SlidersHorizontal className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {quickActionForm.action === 'RECEIVE'
                      ? 'Receive Stock Intake'
                      : quickActionForm.action === 'SALE'
                      ? 'Fast Customer Sale'
                      : 'Stock Count Adjustment'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Quick everyday single-product transaction</p>
                </div>
              </div>
              <button
                onClick={() => setQuickActionModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickActionSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {quickActionError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
                  {quickActionError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Product</label>
                <select
                  value={quickActionForm.productId}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.quantity} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {quickActionForm.action === 'ADJUST' ? 'New Target Stock Quantity' : 'Quantity Units'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quickActionForm.quantity}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={quickActionForm.reason}
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickActionModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuickAction}
                  className={`px-4 py-1.5 text-white rounded-xl font-bold transition ${
                    quickActionForm.action === 'RECEIVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : quickActionForm.action === 'SALE'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {submittingQuickAction ? 'Submitting...' : 'Confirm Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 14: START NEW STOCK AUDIT
         ============================================================ */}
      {startAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Start New Stock Audit</h3>
                  <p className="text-[11px] text-slate-500">Initialize a physical count session across catalog inventory</p>
                </div>
              </div>
              <button
                onClick={() => setStartAuditModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
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
              }}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
            >
              {/* Scope Selector Tabs */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Audit Scope Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuditMode('ALL')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      auditMode === 'ALL'
                        ? 'border-teal-600 bg-teal-50/50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-teal-600" />
                      All Products
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Audit complete catalog ({products.length} products)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditMode('SELECT')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      auditMode === 'SELECT'
                        ? 'border-teal-600 bg-teal-50/50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                      Specific Products
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Choose selected products manually
                    </span>
                  </button>
                </div>
              </div>

              {/* Mode: SELECT products specific picker */}
              {auditMode === 'SELECT' && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter products by name or SKU..."
                        value={auditProductSearch}
                        onChange={(e) => setAuditProductSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const matching = products
                          .filter(
                            (p) =>
                              !auditProductSearch.trim() ||
                              p.name.toLowerCase().includes(auditProductSearch.toLowerCase()) ||
                              p.sku.toLowerCase().includes(auditProductSearch.toLowerCase())
                          )
                          .map((p) => p.id);
                        const allSelected = matching.every((id) => selectedAuditProductIds.includes(id));
                        if (allSelected) {
                          setSelectedAuditProductIds(
                            selectedAuditProductIds.filter((id) => !matching.includes(id))
                          );
                        } else {
                          setSelectedAuditProductIds(Array.from(new Set([...selectedAuditProductIds, ...matching])));
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-bold text-slate-700 whitespace-nowrap"
                    >
                      Toggle All
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                    {products
                      .filter(
                        (p) =>
                          !auditProductSearch.trim() ||
                          p.name.toLowerCase().includes(auditProductSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(auditProductSearch.toLowerCase())
                      )
                      .map((p) => {
                        const isSelected = selectedAuditProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                              isSelected ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAuditProductIds([...selectedAuditProductIds, p.id]);
                                  } else {
                                    setSelectedAuditProductIds(selectedAuditProductIds.filter((id) => id !== p.id));
                                  }
                                }}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="font-mono text-[10px] text-slate-400">{p.sku} • {p.category}</p>
                              </div>
                            </div>
                            <span className="font-mono font-medium text-slate-600 text-[11px]">
                              {p.quantity} on hand
                            </span>
                          </label>
                        );
                      })}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedAuditProductIds.length} product(s) selected for audit
                  </p>
                </div>
              )}

              {/* Audit Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Audit Notes / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. End of month warehouse count, High-shrinkage tools cycle count..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStartAuditModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAudit || (auditMode === 'SELECT' && selectedAuditProductIds.length === 0)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>{submittingAudit ? 'Starting...' : 'Start Audit Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 15: ENTER / EDIT PHYSICAL COUNT
         ============================================================ */}
      {countingItem && selectedAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Record Physical Count</h3>
                <p className="text-[11px] text-slate-500">
                  {countingItem.productNameSnapshot} ({countingItem.skuSnapshot})
                </p>
              </div>
              <button
                onClick={() => setCountingItem(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
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
              }}
              className="space-y-4"
            >
              {/* Snapshot reference */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[11px]">System Quantity (Snapshot)</p>
                  <p className="text-sm font-bold text-slate-800 font-mono">{countingItem.systemQuantity} units</p>
                </div>
                {countingItem.countedQuantity !== null && (
                  <div className="text-right">
                    <p className="text-slate-500 text-[11px]">Previous Count</p>
                    <p className="text-sm font-bold text-teal-700 font-mono">{countingItem.countedQuantity} units</p>
                  </div>
                )}
              </div>

              {/* Physical Count with Stepper */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Physically Counted Units
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCountQuantityInput(Math.max(0, (Number(countQuantityInput) || 0) - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={countQuantityInput}
                    onChange={(e) => setCountQuantityInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold text-base focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCountQuantityInput((Number(countQuantityInput) || 0) + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Live Variance Calculation Explanation */}
              {countQuantityInput !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    Number(countQuantityInput) - countingItem.systemQuantity === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : Number(countQuantityInput) - countingItem.systemQuantity < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <span className="font-semibold">Calculated Variance:</span>
                  <span className="font-mono font-bold flex items-center gap-1">
                    {Number(countQuantityInput) - countingItem.systemQuantity === 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        0 Match (No discrepancy)
                      </>
                    ) : Number(countQuantityInput) - countingItem.systemQuantity < 0 ? (
                      <>
                        <ArrowDown className="w-3.5 h-3.5" />
                        -{Math.abs(Number(countQuantityInput) - countingItem.systemQuantity)} Missing from stock
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-3.5 h-3.5" />
                        +{Number(countQuantityInput) - countingItem.systemQuantity} Extra stock found
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Item Count Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 damaged units discarded, located extra box in back..."
                  value={countNotesInput}
                  onChange={(e) => setCountNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCountingItem(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCount}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingCount ? 'Saving...' : 'Save Physical Count'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 16: COMPLETE STOCK AUDIT & RECONCILE
         ============================================================ */}
      {completeAuditModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Complete Stock Audit & Reconcile</h3>
                  <p className="text-[11px] text-slate-500">Audit #AUD-{selectedAudit.id}</p>
                </div>
              </div>
              <button
                onClick={() => setCompleteAuditModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message, e.g. 409 Conflict */}
            {completeAuditError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Inventory Concurrency Conflict (HTTP 409)
                </p>
                <p className="text-[11px] leading-relaxed">{completeAuditError}</p>
                <p className="text-[11px] text-rose-700 font-medium pt-1">
                  Recommendation: Please cancel this audit and start a fresh count using current live inventory.
                </p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-500">Products Counted</p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedAudit.countedProducts} / {selectedAudit.totalProducts} (100%)
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-500">Products with Discrepancies</p>
                <p
                  className={`text-lg font-bold ${
                    selectedAudit.discrepancyCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedAudit.discrepancyCount}
                </p>
              </div>
            </div>

            {/* Discrepancies Preview */}
            {selectedAudit.discrepancyCount > 0 ? (
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">Products Requiring Inventory Correction:</p>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-2">
                  {selectedAudit.items
                    ?.filter((i) => i.variance !== 0 && i.countedQuantity !== null)
                    .map((item) => (
                      <div key={item.id} className="py-1.5 flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-bold text-slate-800">{item.productNameSnapshot}</p>
                          <p className="font-mono text-slate-400">{item.skuSnapshot}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="text-slate-600">
                            {item.systemQuantity} → <span className="font-bold text-slate-900">{item.countedQuantity}</span>
                          </p>
                          <p
                            className={`font-bold ${
                              item.variance < 0 ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          >
                            {item.variance > 0 ? `+${item.variance}` : item.variance} units
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>All physical counts perfectly match system records! No stock adjustments required.</span>
              </div>
            )}

            {/* Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Inventory Reconciliation Warning
              </p>
              <p className="leading-relaxed">
                Completing this audit will update your live product quantities to match the physical counts and record stock adjustment movements in your ledger.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompleteAuditModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingCompleteAudit}
                onClick={async () => {
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
                    await fetchProductsData('', '');
                    await fetchMovementsData('', '');
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
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingCompleteAudit ? 'Reconciling...' : 'Confirm & Complete Audit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 17: CANCEL STOCK AUDIT
         ============================================================ */}
      {cancelAuditModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancel Stock Audit</h3>
                  <p className="text-[11px] text-slate-500">Audit #AUD-{selectedAudit.id}</p>
                </div>
              </div>
              <button
                onClick={() => setCancelAuditModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to cancel this audit? The audit history and physical counts recorded so far will be preserved, and no stock quantities will be modified.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
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
              }}
              className="space-y-4"
            >
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Physical counting interrupted, shift ended, recount needed..."
                  value={cancelAuditReason}
                  onChange={(e) => setCancelAuditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelAuditModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Keep Open
                </button>
                <button
                  type="submit"
                  disabled={submittingCancelAudit}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <X className="w-4 h-4" />
                  <span>{submittingCancelAudit ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT OPERATING EXPENSE */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingExpense ? 'Edit Operating Expense' : 'Record Operating Expense'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpenseModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {expenseFormError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{expenseFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                >
                  {['Rent', 'Salaries', 'Utilities', 'Transport', 'Maintenance', 'Marketing', 'Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount in Rupees (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 15000.00"
                    value={expenseForm.amountRupees}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amountRupees: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Monthly warehouse storage lease payment..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingExpense ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE OPERATING EXPENSE CONFIRMATION */}
      {deleteExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Delete Expense #{expenseToDelete?.id}?</h3>
            </div>
            <p className="text-slate-600">
              Are you sure you want to delete this <span className="font-bold text-slate-900">{expenseToDelete?.category}</span> expense of <span className="font-mono font-bold text-slate-900">{formatPaise(expenseToDelete?.amountPaise)}</span>? This will immediately recalculate period operating results.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteExpenseModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingExpense}
                onClick={handleDeleteExpense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingExpense ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: CREATE SURPLUS CLEARANCE LISTING
         ============================================================ */}
      {createSurplusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <Tag className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">Create Surplus Clearance Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateSurplusModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createSurplusError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createSurplusError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreateSurplus} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Select Product *
                </label>
                <select
                  value={createSurplusForm.productId}
                  onChange={(e) => handleSelectProductForSurplus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                  required
                >
                  <option value="">-- Choose a Product --</option>
                  {products.map((p) => {
                    const reserved = p.reservedQuantity || 0;
                    const avail = Math.max(0, (p.quantity || 0) - reserved);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Available: {avail} units (Total: {p.quantity})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Product Snapshot Info Box (8 KPI auto-display) */}
              {selectedProductForSurplus && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Physical Stock</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {selectedProductForSurplus.currentQuantity !== undefined ? selectedProductForSurplus.currentQuantity : selectedProductForSurplus.quantity}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Reserved</span>
                      <span className="font-mono font-bold text-amber-700 text-xs">
                        {selectedProductForSurplus.reservedQuantity !== undefined ? selectedProductForSurplus.reservedQuantity : 0}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Available unreserved</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {selectedProductForSurplus.availableQuantity !== undefined
                          ? selectedProductForSurplus.availableQuantity
                          : Math.max(0, (selectedProductForSurplus.quantity || 0) - (selectedProductForSurplus.reservedQuantity || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between px-3">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Preferred Stock:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {(selectedProductForSurplus.preferredStockLevel != null && selectedProductForSurplus.preferredStockLevel > 0)
                          ? `${selectedProductForSurplus.preferredStockLevel} units`
                          : (selectedProductForSurplus.targetStockLevel > 0 ? `${selectedProductForSurplus.targetStockLevel} units` : 'Not configured')}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between px-3">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Suggested Surplus:</span>
                      <span className="font-mono font-bold text-amber-700">
                        {selectedProductForSurplus.suggestedSurplusQuantity > 0
                          ? `+${selectedProductForSurplus.suggestedSurplusQuantity} units`
                          : '0 units'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-200/60">
                    <span>
                      Original Price: <strong className="text-slate-700 font-mono">{formatPaise(selectedProductForSurplus.normalSellingPricePaise || selectedProductForSurplus.sellingPricePaise || 0)}</strong>
                    </span>
                    <span>
                      Unit Cost: <strong className="text-slate-700 font-mono">{formatPaise(selectedProductForSurplus.normalPurchasePricePaise || selectedProductForSurplus.purchasePricePaise || 0)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity to List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Quantity to List *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={createSurplusForm.quantity}
                    onChange={(e) => setCreateSurplusForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Will be reserved exclusively for clearance
                  </span>
                </div>

                {/* Discounted Selling Price */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Clearance Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 450"
                    value={createSurplusForm.discountedPriceRupees}
                    onChange={(e) => setCreateSurplusForm((prev) => ({ ...prev, discountedPriceRupees: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                  {/* Auto discount display */}
                  {selectedProductForSurplus && createSurplusForm.discountedPriceRupees && (
                    <span className="text-[10px] text-teal-600 font-bold mt-0.5 block">
                      {(() => {
                        const origPaise = selectedProductForSurplus.normalSellingPricePaise || selectedProductForSurplus.sellingPricePaise || 0;
                        const discPaise = rupeesToPaise(createSurplusForm.discountedPriceRupees);
                        if (origPaise > 0 && discPaise < origPaise) {
                          const pct = Math.round(((origPaise - discPaise) / origPaise) * 100);
                          return `${pct}% discount off normal price`;
                        } else if (discPaise >= origPaise) {
                          return 'Price is at or above normal price';
                        }
                        return '';
                      })()}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Potential Revenue calculation */}
              {createSurplusForm.quantity && createSurplusForm.discountedPriceRupees && (
                <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-900">Total Potential Clearance Revenue:</span>
                  <span className="font-mono font-bold text-teal-800 text-sm">
                    {formatPaise(rupeesToPaise(Number(createSurplusForm.quantity) * Number(createSurplusForm.discountedPriceRupees)))}
                  </span>
                </div>
              )}

              {/* Notes / Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Clearance Campaign Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excess stock clearance, seasonal promo, end-of-line liquidation"
                  value={createSurplusForm.notes}
                  onChange={(e) => setCreateSurplusForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateSurplusModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreateSurplus}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingCreateSurplus ? 'Listing...' : 'Confirm & Create Listing'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: RECORD SURPLUS CLEARANCE SALE
         ============================================================ */}
      {surplusSaleModalOpen && surplusListingForSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <ShoppingCart className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">Record Clearance Sale</h3>
              </div>
              <button
                type="button"
                onClick={() => setSurplusSaleModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {surplusSaleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{surplusSaleError}</span>
              </div>
            )}

            {/* Listing Details Header */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{surplusListingForSale.productName}</span>
                <span className="font-mono font-bold text-teal-700 text-sm">
                  {formatPaise(surplusListingForSale.discountedUnitPricePaise ?? surplusListingForSale.discountedSellingPricePaise)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>SKU: {surplusListingForSale.sku}</span>
                <span className="text-amber-700 font-semibold">{surplusListingForSale.quantityRemaining} units remaining</span>
              </div>
            </div>

            <form onSubmit={handleSubmitSurplusSale} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Quantity to Sell *
                </label>
                <input
                  type="number"
                  min="1"
                  max={surplusListingForSale.quantityRemaining}
                  value={surplusSaleForm.quantity}
                  onChange={(e) => setSurplusSaleForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Max: {surplusListingForSale.quantityRemaining} units
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={surplusSaleForm.paymentMethod}
                  onChange={(e) => setSurplusSaleForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other / Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Sale Notes / Customer Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bulk clearance buyer / walk-in customer"
                  value={surplusSaleForm.notes}
                  onChange={(e) => setSurplusSaleForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Live Calculations: Revenue, Cost, Gross Profit */}
              {surplusSaleForm.quantity > 0 && (() => {
                const discPrice = surplusListingForSale.discountedUnitPricePaise ?? surplusListingForSale.discountedSellingPricePaise ?? 0;
                const costPrice = surplusListingForSale.unitCostPaiseSnapshot ?? surplusListingForSale.originalPurchasePricePaise ?? 0;
                const saleQty = Number(surplusSaleForm.quantity) || 0;
                return (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5 text-xs text-emerald-950">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Sale Revenue:</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {formatPaise(saleQty * discPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>Purchase Cost:</span>
                      <span className="font-mono font-semibold">
                        {formatPaise(saleQty * costPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                      <span className="font-bold">Gross Profit:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPaise(saleQty * (discPrice - costPrice))}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSurplusSaleModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSurplusSale}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingSurplusSale ? 'Processing...' : 'Complete Clearance Sale'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: CANCEL SURPLUS LISTING CONFIRMATION
         ============================================================ */}
      {cancelSurplusModalOpen && surplusListingToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Cancel Listing #{surplusListingToCancel.id}?</h3>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <p className="font-bold">Inventory Reservation Restoration Rule:</p>
              <p className="leading-relaxed">
                Cancelling will immediately release all <span className="font-bold">{surplusListingToCancel.quantityRemaining} remaining units</span> back to standard available stock.
                Past sales ({surplusListingToCancel.quantitySold} units) and revenue ({formatPaise(surplusListingToCancel.recoveredRevenuePaise ?? surplusListingToCancel.totalRealizedRevenuePaise ?? 0)}) already realized remain permanently recorded in your sales ledger. Physical stock is NOT altered.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelSurplusReason}
                onChange={(e) => setCancelSurplusReason(e.target.value)}
                placeholder="e.g. Promo ended, restocked standard inventory"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelSurplusModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Keep Listing
              </button>
              <button
                type="button"
                disabled={submittingCancelSurplus}
                onClick={handleConfirmCancelSurplus}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submittingCancelSurplus ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: SURPLUS LISTING DETAILS & ASSOCIATED SALES HISTORY
         ============================================================ */}
      {surplusDetailModalOpen && selectedSurplusDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Listing #{selectedSurplusDetail.id} — {selectedSurplusDetail.productName}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    SKU: {selectedSurplusDetail.sku} • {selectedSurplusDetail.category || 'General'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSurplusDetailModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Snapshot KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 border ${
                  selectedSurplusDetail.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedSurplusDetail.status === 'PARTIALLY_SOLD'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : selectedSurplusDetail.status === 'SOLD_OUT'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {selectedSurplusDetail.status?.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Created {formatDateTime(selectedSurplusDetail.createdAt)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Clearance Price</span>
                <span className="font-mono font-bold text-teal-700 text-sm">
                  {formatPaise(selectedSurplusDetail.discountedUnitPricePaise ?? selectedSurplusDetail.discountedSellingPricePaise)}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(selectedSurplusDetail.regularUnitPricePaise ?? selectedSurplusDetail.originalSellingPricePaise) && (
                    <span className="font-mono line-through text-[10px] text-slate-400">
                      {formatPaise(selectedSurplusDetail.regularUnitPricePaise ?? selectedSurplusDetail.originalSellingPricePaise)}
                    </span>
                  )}
                  {selectedSurplusDetail.discountPercentage != null && (
                    <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded">
                      {Math.round(selectedSurplusDetail.discountPercentage)}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Units Breakdown</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {selectedSurplusDetail.quantitySold} / {selectedSurplusDetail.quantityListed} sold
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  {selectedSurplusDetail.quantityRemaining} units remaining
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Financial Results</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatPaise(selectedSurplusDetail.recoveredRevenuePaise ?? selectedSurplusDetail.totalRealizedRevenuePaise ?? 0)}
                </span>
                <div className="text-[10px] space-y-0.5 mt-0.5">
                  <span className="text-slate-500 block">
                    Cost: {formatPaise(selectedSurplusDetail.quantitySold * (selectedSurplusDetail.unitCostPaiseSnapshot ?? selectedSurplusDetail.originalPurchasePricePaise ?? 0))}
                  </span>
                  <span className="text-emerald-600 font-bold block">
                    +{formatPaise(selectedSurplusDetail.grossProfitPaise ?? selectedSurplusDetail.totalRealizedGrossProfitPaise ?? 0)} profit
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Notice if Cancelled */}
            {selectedSurplusDetail.status === 'CANCELLED' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Listing Cancelled</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This clearance listing was cancelled on <span className="font-mono font-semibold">{formatDateTime(selectedSurplusDetail.updatedAt)}</span>. All <span className="font-bold">{selectedSurplusDetail.quantityRemaining} remaining units</span> were released back to standard warehouse stock.
                  {selectedSurplusDetail.notes && <span> Reason: "{selectedSurplusDetail.notes}".</span>}
                </p>
              </div>
            )}

            {selectedSurplusDetail.notes && selectedSurplusDetail.status !== 'CANCELLED' && (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-xs">
                <strong className="text-slate-800">Campaign Notes:</strong> {selectedSurplusDetail.notes}
              </div>
            )}

            {/* Associated Sales Transactions */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Associated Clearance Sales ({selectedSurplusDetail.sales?.length || 0})</span>
              </h4>

              {loadingSurplusDetail ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-teal-600" />
                  <p>Loading sales history...</p>
                </div>
              ) : !selectedSurplusDetail.sales || selectedSurplusDetail.sales.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  No sales recorded against this clearance listing yet.
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Sale ID</th>
                        <th className="py-2.5 px-3 text-center">Units Sold</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Realized Profit</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSurplusDetail.sales.map((sale) => (
                        <tr key={sale.saleId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            #{sale.saleId}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                            {sale.quantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {formatPaise(sale.unitSellingPricePaise)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {formatPaise(sale.lineTotalPaise)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">
                            +{formatPaise(sale.grossProfitPaise ?? ((sale.lineTotalPaise || 0) - (sale.lineCostPaise || 0)))}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                              {sale.paymentMethod || 'CASH'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {formatDateTime(sale.saleDate)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSurplusDetailModalOpen(false);
                                viewSaleDetails(sale.saleId);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1"
                              title="View full sale receipt"
                            >
                              <span>Receipt</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSurplusDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
