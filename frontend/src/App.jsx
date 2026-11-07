import React, { useState, useEffect, useMemo } from 'react';
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
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  cancelPurchaseOrder
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

export default function App() {
  // Navigation: overview, products, sales, purchasing, stock-control, insights, surplus, reports
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Products Data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  // Movements Data
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementProductFilter, setMovementProductFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

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
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);

  // Purchase Orders Data
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poSupplierFilter, setPoSupplierFilter] = useState('');

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
  const [saleCart, setSaleCart] = useState([]); // [{ productId, product, quantity }]
  const [saleDiscountRupees, setSaleDiscountRupees] = useState(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState('CASH');
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleFormError, setSaleFormError] = useState('');

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

  // Toast alert trigger
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // --- DATA FETCHING FUNCTIONS ---
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

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const data = await getDashboard();
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
  }, []);

  // Fetch data specific to tab changes
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'dashboard') {
      fetchDashboardData();
      fetchSalesMetricsData();
      fetchSalesTrendData();
      fetchIntelligenceData();
      fetchPurchaseOrdersData('ALL', '');
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
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'insights') {
      fetchIntelligenceData();
      if (products.length === 0) fetchProductsData('', '');
    } else if (activeTab === 'surplus') {
      fetchIntelligenceData();
    }
  }, [activeTab]);

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
          targetTab: 'insights',
          actionLabel: 'View in Insights',
          productId: p.productId
        });
      });
    }

    return items.slice(0, 8); // Top 8 most urgent items
  }, [products, purchaseOrders, salesIntelligence]);

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
    setSaleCart([{ productId: products[0].id, quantity: 1 }]);
    setSaleDiscountRupees(0);
    setSalePaymentMethod('CASH');
    setSaleFormError('');
    setSaleModalOpen(true);
  };

  const handleAddCartRow = () => {
    const available = products.find((p) => !saleCart.some((c) => c.productId === p.id));
    const pId = available ? available.id : products[0]?.id;
    setSaleCart([...saleCart, { productId: pId, quantity: 1 }]);
  };

  const handleRemoveCartRow = (idx) => {
    const updated = saleCart.filter((_, i) => i !== idx);
    setSaleCart(updated);
  };

  const handleCartItemChange = (idx, field, val) => {
    const updated = [...saleCart];
    updated[idx] = { ...updated[idx], [field]: val };
    setSaleCart(updated);
  };

  const cartCalculations = useMemo(() => {
    let subtotalPaise = 0;
    const items = saleCart.map((row) => {
      const prod = products.find((p) => p.id === Number(row.productId));
      const unitSelling = prod ? prod.sellingPricePaise : 0;
      const qty = parseInt(row.quantity, 10) || 0;
      const lineTotal = qty * unitSelling;
      subtotalPaise += lineTotal;
      return {
        ...row,
        product: prod,
        unitSellingPricePaise: unitSelling,
        lineTotalPaise: lineTotal
      };
    });

    const discountPaise = rupeesToPaise(saleDiscountRupees);
    const finalTotalPaise = Math.max(0, subtotalPaise - discountPaise);
    return { items, subtotalPaise, discountPaise, finalTotalPaise };
  }, [saleCart, products, saleDiscountRupees]);

  const handleCheckoutSale = async (e) => {
    e.preventDefault();
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

    setSubmittingSale(true);
    try {
      const payload = {
        items: cartCalculations.items.map((i) => ({
          productId: Number(i.productId),
          quantity: parseInt(i.quantity, 10)
        })),
        discountPaise: cartCalculations.discountPaise,
        paymentMethod: salePaymentMethod
      };

      const result = await createSale(payload);
      triggerAlert('success', `Sale #SO-${result.id} completed for ${formatPaise(result.totalPaise)}.`);
      setSaleModalOpen(false);

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

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
      {/* ================= DESKTOP SIDEBAR (>= 1024px) ================= */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800">
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
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
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

              {/* 5 Real Dashboard Statistics KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total Products</span>
                    <Package className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                    {dashboard?.totalProducts ?? products.length}
                  </div>
                  <p className="text-[10px] text-slate-500">Catalog items</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total Stock Units</span>
                    <Activity className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                    {dashboard?.totalQuantity ?? 0}
                  </div>
                  <p className="text-[10px] text-slate-500">Physical units</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Inventory Value</span>
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono truncate">
                    {formatPaise(dashboard?.inventoryValuePaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-500">Valued at cost</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Sales Today</span>
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono truncate">
                    {formatPaise(salesMetrics?.salesTodayPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {salesMetrics?.salesTodayCount ?? 0} orders today
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1 col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Low Stock Items</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono flex items-center gap-2">
                    <span>{(dashboard?.lowStockCount ?? 0) + (dashboard?.outOfStockCount ?? 0)}</span>
                    {(dashboard?.lowStockCount > 0 || dashboard?.outOfStockCount > 0) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                        Alert
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {dashboard?.outOfStockCount ?? 0} out of stock
                  </p>
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
                          {filteredProducts.map((p) => (
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
                      {filteredProducts.map((p) => (
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
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  {['ALL', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setSalesStatusFilter(st);
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

              {/* Sales History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Sales Transaction Ledger ({sales.length} records)
                  </span>
                  <button
                    onClick={() => fetchSalesData()}
                    className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSales ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {sales.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No sales transactions found</p>
                    <p className="text-[11px]">Record your first sale to start tracking business revenue.</p>
                  </div>
                ) : (
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
                        {sales.map((s) => (
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
                              {s.discountPaise > 0 ? `-${formatPaise(s.discountPaise)}` : '—'}
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
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-400 text-[10px] uppercase mr-1">Status:</span>
                      {['ALL', 'DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            setPoStatusFilter(st);
                            fetchPurchaseOrdersData(st, poSupplierFilter);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            poStatusFilter === st
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'ALL'
                            ? 'All'
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
                            fetchPurchaseOrdersData(poStatusFilter, e.target.value);
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

                  {/* Purchase Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {purchaseOrders.length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No purchase orders found</p>
                        <p className="text-[11px]">Draft a purchase order to replenish inventory with your suppliers.</p>
                      </div>
                    ) : (
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
                            {purchaseOrders.map((po) => (
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
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Type:</span>
                      {['', 'IN', 'OUT', 'ADJUSTMENT'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setMovementTypeFilter(type);
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

                  {/* Movements Ledger Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {movements.length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                        <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No stock movements recorded</p>
                        <p className="text-[11px]">Inbound receipts, customer sales, and count reconciliations appear here.</p>
                      </div>
                    ) : (
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
                            {movements.map((m) => (
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
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Full Cycle Stock Audits</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Scheduled cycle counts, blind barcode audits, and multi-location variance reporting will be enabled in an upcoming release.
                  </p>
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Roadmap Feature
                  </span>
                  <div className="pt-2">
                    <button
                      onClick={() => setStockControlSubTab('adjustments')}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Use Physical Adjustments Instead
                    </button>
                  </div>
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
              7. SURPLUS STOCK TAB (COMING SOON WITH REAL PREVIEW)
             ============================================================ */}
          {activeTab === 'surplus' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Boxes className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Surplus Stock Management</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Automated excess inventory clearance workflows, bulk liquidation bundling, and holding-cost analytics are scheduled for the next major release.
              </p>
              <div className="inline-block px-3.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Under Roadmap Development
              </div>

              {/* Real Surplus Data Preview from Legacy Intelligence */}
              <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-200/60 mt-4">
                <p className="text-xs font-bold text-slate-800 mb-2">Current Surplus Inventory Preview</p>
                {legacyIntelligence.filter((p) => p.surplusQuantity > 0).length === 0 ? (
                  <p className="text-xs text-slate-500">No surplus stock currently detected in warehouse.</p>
                ) : (
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {legacyIntelligence.filter((p) => p.surplusQuantity > 0).slice(0, 4).map((p) => (
                      <div key={p.productId} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold">{p.productName}</span>
                        <span className="font-mono text-amber-700 font-bold">+{p.surplusQuantity} surplus units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              8. REPORTS TAB (COMING SOON)
             ============================================================ */}
          {activeTab === 'reports' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Business & Financial Reports</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Automated monthly P&L summaries, stock valuation ledgers, CSV tax schedules, and vendor SLA performance reports are in active development.
              </p>
              <div className="inline-block px-3.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Under Roadmap Development
              </div>

              <div className="grid grid-cols-2 gap-3 text-left pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">Monthly P&L Audit</p>
                  <p className="text-[11px] text-slate-500">Scheduled for Q1</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">Tax Schedule Export</p>
                  <p className="text-[11px] text-slate-500">Scheduled for Q1</p>
                </div>
              </div>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Record Customer Sale (POS)</h3>
                  <p className="text-xs text-slate-500">Multi-item checkout with verified stock deduction</p>
                </div>
              </div>
              <button
                onClick={() => setSaleModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSale} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {saleFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saleFormError}</span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Order Items</label>
                {cartCalculations.items.map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <select
                        value={row.productId}
                        onChange={(e) => handleCartItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (In stock: {p.quantity}) — {formatPaise(p.sellingPricePaise)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleCartItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                      />
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-slate-900 shrink-0">
                      {formatPaise(row.lineTotalPaise)}
                    </div>

                    {cartCalculations.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCartRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddCartRow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Product</span>
                </button>
              </div>

              {/* Discount & Payment Method */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleDiscountRupees}
                    onChange={(e) => setSaleDiscountRupees(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Payment Method</label>
                  <select
                    value={salePaymentMethod}
                    onChange={(e) => setSalePaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Order Calculation Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 font-mono text-xs border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPaise(cartCalculations.subtotalPaise)}</span>
                </div>
                {cartCalculations.discountPaise > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatPaise(cartCalculations.discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="text-indigo-700">{formatPaise(cartCalculations.finalTotalPaise)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSale}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {submittingSale ? 'Processing...' : `Confirm & Pay ${formatPaise(cartCalculations.finalTotalPaise)}`}
                </button>
              </div>
            </form>
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
                  {selectedSaleDetail?.status} on {formatDateTime(selectedSaleDetail?.createdAt)}
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
                        <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
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
                  <span>-{formatPaise(selectedSaleDetail?.discountPaise)}</span>
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
    </div>
  );
}
