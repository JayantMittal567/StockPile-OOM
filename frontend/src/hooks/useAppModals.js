import { useState, useMemo, useRef, useEffect } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  stockIn,
  adjustStock,
  getSaleById,
  createSale,
  cancelSale,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  placePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getStockAuditById,
  createStockAudit,
  enterAuditCount,
  completeStockAudit,
  cancelStockAudit,
  createExpense,
  updateExpense,
  deleteExpense,
  getSurplusListingById,
  createSurplusListing,
  recordSurplusSale,
  cancelSurplusListing
} from '../api';
import {
  formatPaise,
  paiseToRupees,
  rupeesToPaise,
  getKolkataToday,
  generateSuggestedSku
} from '../utils/formatters';
import { computeCartCalculations, filterSearchProducts } from '../utils/salesCalculations';
import { exportReportToCSV } from '../utils/reportExport';

export function useAppModals({
  products,
  setProducts,
  suppliers,
  setSuppliers,
  purchaseOrders,
  selectedAudit,
  setSelectedAudit,
  selectedAuditId,
  setSelectedAuditId,
  fetchSelectedAuditDetail,
  surplusSuggestions,
  triggerAlert,
  setActiveTab,
  setPurchasingSubTab,
  setSurplusSubTab,
  fetchProductsData,
  fetchDashboardData,
  fetchMovementsData,
  fetchSalesData,
  fetchSalesMetricsData,
  fetchSalesTrendData,
  fetchPurchaseOrdersData,
  fetchSuppliersData,
  fetchAuditsData,
  fetchIntelligenceData,
  fetchAllReportData,
  fetchSurplusData,
  reportPeriod,
  reportDate,
  summaryReport,
  pnlReport,
  salesReport,
  lossReport,
  purchasesReport,
  expensesList,
  salesStatusFilter
}) {
  // --- 1. Product Modal State ---
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productRecordMode, setProductRecordMode] = useState('NEW');
  const [selectedExistingProductId, setSelectedExistingProductId] = useState('');
  const [existingProductIntakeQty, setExistingProductIntakeQty] = useState(1);
  const [existingProductIntakeReason, setExistingProductIntakeReason] = useState('Stock intake / restock');
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

  // Delete Product
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // --- 2. Quick Action Modal State ---
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [quickActionForm, setQuickActionForm] = useState({
    action: 'RECEIVE',
    productId: '',
    quantity: 1,
    reason: 'Inventory intake'
  });
  const [submittingQuickAction, setSubmittingQuickAction] = useState(false);
  const [quickActionError, setQuickActionError] = useState('');

  // --- 3. Sales POS Modal State ---
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleCart, setSaleCart] = useState([]);
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

  // Sale Details & Cancel
  const [saleDetailModalOpen, setSaleDetailModalOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);
  const [cancelSaleModalOpen, setCancelSaleModalOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelSaleReason, setCancelSaleReason] = useState('Customer return / order cancelled');
  const [cancellingSale, setCancellingSale] = useState(false);

  // --- 4. Purchase Order Modal State ---
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState(null);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    notes: '',
    items: [{ productId: '', quantity: 10, unitCostRupees: '' }]
  });
  const [savingPo, setSavingPo] = useState(false);
  const [poFormError, setPoFormError] = useState('');

  // PO Detail, Receive, Cancel
  const [poDetailModalOpen, setPoDetailModalOpen] = useState(false);
  const [selectedPoDetail, setSelectedPoDetail] = useState(null);
  const [loadingPoDetail, setLoadingPoDetail] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receivingPo, setReceivingPo] = useState(null);
  const [receiveItemQuantities, setReceiveItemQuantities] = useState({});
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState('');
  const [cancelPoModalOpen, setCancelPoModalOpen] = useState(false);
  const [poToCancel, setPoToCancel] = useState(null);
  const [cancelPoReason, setCancelPoReason] = useState('Supplier out of stock');
  const [cancellingPo, setCancellingPo] = useState(false);

  // --- 5. Supplier Modal State ---
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
  const [deleteSupplierModalOpen, setDeleteSupplierModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(false);
  const [supplierProductsModalOpen, setSupplierProductsModalOpen] = useState(false);
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState(null);
  const [supplierProductsList, setSupplierProductsList] = useState([]);
  const [loadingSupplierProducts, setLoadingSupplierProducts] = useState(false);

  // --- 6. Stock Audit Modals State ---
  const [startAuditModalOpen, setStartAuditModalOpen] = useState(false);
  const [auditMode, setAuditMode] = useState('ALL');
  const [selectedAuditProductIds, setSelectedAuditProductIds] = useState([]);
  const [auditProductSearch, setAuditProductSearch] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [submittingAudit, setSubmittingAudit] = useState(false);
  const [countingItem, setCountingItem] = useState(null);
  const [countQuantityInput, setCountQuantityInput] = useState('');
  const [countNotesInput, setCountNotesInput] = useState('');
  const [submittingCount, setSubmittingCount] = useState(false);
  const [completeAuditModalOpen, setCompleteAuditModalOpen] = useState(false);
  const [submittingCompleteAudit, setSubmittingCompleteAudit] = useState(false);
  const [completeAuditError, setCompleteAuditError] = useState(null);
  const [cancelAuditModalOpen, setCancelAuditModalOpen] = useState(false);
  const [cancelAuditReason, setCancelAuditReason] = useState('Physical count interrupted / cancelled');
  const [submittingCancelAudit, setSubmittingCancelAudit] = useState(false);

  // --- 7. Expense Modals State ---
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
  const [deleteExpenseModalOpen, setDeleteExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(false);

  // --- 8. Surplus Modals State ---
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
  const [surplusSaleModalOpen, setSurplusSaleModalOpen] = useState(false);
  const [surplusListingForSale, setSurplusListingForSale] = useState(null);
  const [surplusSaleForm, setSurplusSaleForm] = useState({
    quantity: 1,
    paymentMethod: 'CASH',
    notes: ''
  });
  const [submittingSurplusSale, setSubmittingSurplusSale] = useState(false);
  const [surplusSaleError, setSurplusSaleError] = useState('');
  const [cancelSurplusModalOpen, setCancelSurplusModalOpen] = useState(false);
  const [surplusListingToCancel, setSurplusListingToCancel] = useState(null);
  const [cancelSurplusReason, setCancelSurplusReason] = useState('Campaign ended / stock returned to regular pool');
  const [submittingCancelSurplus, setSubmittingCancelSurplus] = useState(false);
  const [surplusDetailModalOpen, setSurplusDetailModalOpen] = useState(false);
  const [selectedSurplusDetail, setSelectedSurplusDetail] = useState(null);
  const [loadingSurplusDetail, setLoadingSurplusDetail] = useState(false);

  // Focus search input on sale modal open
  useEffect(() => {
    if (saleModalOpen && !saleSuccessData) {
      const t = setTimeout(() => {
        saleSearchInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(t);
    }
  }, [saleModalOpen, saleSuccessData]);

  // Derived Calculations
  const cartCalculations = useMemo(
    () => computeCartCalculations(saleCart, products, saleDiscountPercent),
    [saleCart, products, saleDiscountPercent]
  );

  const searchFilteredProducts = useMemo(
    () => filterSearchProducts(products, saleProductSearchQuery),
    [products, saleProductSearchQuery]
  );

  const poCalculations = useMemo(() => {
    let totalPaise = 0;
    const items = poForm.items.map((row) => {
      const prod = products.find((p) => p.id === Number(row.productId));
      const unitCostPaise =
        row.unitCostRupees !== ''
          ? rupeesToPaise(row.unitCostRupees)
          : prod
          ? prod.purchasePricePaise
          : 0;
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

  // ================= ACTION HANDLERS =================
  // Product handlers
  const openAddProductModal = (prefill = {}, initialMode = null) => {
    setEditingProduct(null);
    setShowAdvancedProduct(false);
    setSkuManuallyEdited(false);
    setProductRecordMode(initialMode || (products.length > 0 ? 'EXISTING' : 'NEW'));
    setSelectedExistingProductId(products[0]?.id ? String(products[0].id) : '');
    setExistingProductIntakeQty(1);
    setExistingProductIntakeReason('Stock intake / restock');
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

    if (!editingProduct && productRecordMode === 'EXISTING') {
      const pId = parseInt(selectedExistingProductId, 10);
      const qty = parseInt(existingProductIntakeQty, 10);
      if (!pId) {
        setProductFormError('Please select an existing product from your catalog.');
        return;
      }
      if (isNaN(qty) || qty <= 0) {
        setProductFormError('Quantity must be greater than zero.');
        return;
      }
      setSavingProduct(true);
      try {
        await stockIn(pId, qty, existingProductIntakeReason || 'Stock intake');
        const prod = products.find((p) => p.id === pId);
        triggerAlert('success', `Stock record added for "${prod?.name || 'Product'}" (+${qty} units).`);
        setProductModalOpen(false);
        fetchProductsData();
        fetchDashboardData();
        fetchMovementsData();
      } catch (err) {
        setProductFormError(err.response?.data?.error || err.message || 'Failed to record stock');
      } finally {
        setSavingProduct(false);
      }
      return;
    }

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

  // Quick Action
  const openQuickActionModal = async (action = 'RECEIVE', initialProductId = '') => {
    let prods = products;
    if (prods.length === 0) {
      try {
        const fetched = await getProducts();
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
          prods = fetched;
        }
      } catch (err) {
        console.error('Failed to load products for quick action modal:', err);
      }
    }
    const pId = initialProductId || (prods.length > 0 ? String(prods[0].id) : '');
    setQuickActionForm({
      action,
      productId: pId,
      quantity: 1,
      reason:
        action === 'RECEIVE'
          ? 'Inventory intake'
          : action === 'SALE'
          ? 'Counter sale'
          : 'Count reconciliation'
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

  // Sales POS
  const openNewSaleModal = async () => {
    let prods = products;
    if (prods.length === 0) {
      try {
        const fetched = await getProducts();
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
          prods = fetched;
        }
      } catch (err) {
        console.error('Failed to load products for sale modal:', err);
      }
    }
    if (prods.length === 0) {
      triggerAlert('error', 'Add products to your catalog before recording a sale.');
      return;
    }
    if (saleCart.length === 0 && prods.length > 0) {
      setSaleCart([{ productId: prods[0].id, quantity: 1, customPriceRupees: null }]);
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
      const updated = [...saleCart];
      const curQty = parseInt(updated[existingIndex].quantity, 10) || 0;
      updated[existingIndex] = { ...updated[existingIndex], quantity: curQty + 1 };
      setSaleCart(updated);
    } else {
      setSaleCart([...saleCart, { productId: product.id, quantity: 1, customPriceRupees: null }]);
    }
    setSaleProductSearchQuery('');
  };

  const handleAddCartRow = () => {
    const available = products.find((p) => !saleCart.some((c) => c.productId === p.id));
    const p = available || products[0];
    if (p) handleAddToCart(p);
  };

  const handleRemoveCartRow = (idx) => {
    setSaleCart(saleCart.filter((_, i) => i !== idx));
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
        setSaleFormError(
          `Insufficient stock for "${item.product.name}" (only ${item.product.quantity} available).`
        );
        return;
      }
    }

    if (
      (cartCalculations.hasBelowCostItem ||
        cartCalculations.discountPercent > 20 ||
        cartCalculations.isNegativeProfit) &&
      !saleRequiresConfirm
    ) {
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
          if (
            i.isPriceEdited &&
            i.customPriceRupees !== null &&
            i.customPriceRupees !== '' &&
            !isNaN(Number(i.customPriceRupees))
          ) {
            itemReq.unitSellingPricePaise = Math.round(Number(i.customPriceRupees) * 100);
          }
          return itemReq;
        }),
        discountPercent:
          cartCalculations.discountPercent > 0
            ? Number(cartCalculations.discountPercent.toFixed(2))
            : null,
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
  const openNewPoModal = async (
    prefillProductId = null,
    prefillSupplierId = null,
    prefillQty = 10
  ) => {
    let supps = suppliers;
    if (supps.length === 0) {
      try {
        const fetchedSupps = await getSuppliers();
        if (fetchedSupps && fetchedSupps.length > 0) {
          setSuppliers(fetchedSupps);
          supps = fetchedSupps;
        }
      } catch (err) {
        console.error('Failed to load suppliers for PO modal:', err);
      }
    }
    let prods = products;
    if (prods.length === 0) {
      try {
        const fetchedProds = await getProducts();
        if (fetchedProds && fetchedProds.length > 0) {
          setProducts(fetchedProds);
          prods = fetchedProds;
        }
      } catch (err) {
        console.error('Failed to load products for PO modal:', err);
      }
    }

    if (supps.length === 0) {
      triggerAlert('error', 'Please create a supplier before drafting purchase orders.');
      setActiveTab('purchasing');
      setPurchasingSubTab('suppliers');
      return;
    }

    const targetSupplierId = prefillSupplierId || supps[0].id;
    const defaultProduct = prods[0];
    let initialItems = [
      {
        productId: defaultProduct?.id ? String(defaultProduct.id) : '',
        quantity: prefillQty,
        unitCostRupees: defaultProduct ? paiseToRupees(defaultProduct.purchasePricePaise) : ''
      }
    ];
    if (prefillProductId) {
      const prod = prods.find((p) => p.id === prefillProductId);
      initialItems = [
        {
          productId: String(prefillProductId),
          quantity: prefillQty,
          unitCostRupees: prod ? paiseToRupees(prod.purchasePricePaise) : ''
        }
      ];
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
    const firstProd = products[0];
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          productId: firstProd?.id ? String(firstProd.id) : '',
          quantity: 10,
          unitCostRupees: firstProd ? paiseToRupees(firstProd.purchasePricePaise) : ''
        }
      ]
    });
  };

  const handleRemovePoItemRow = (idx) => {
    setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== idx) });
  };

  const handlePoItemChange = (idx, field, val) => {
    const updated = [...poForm.items];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'productId') {
      const prod = products.find((p) => p.id === Number(val));
      if (prod) {
        updated[idx].unitCostRupees = paiseToRupees(prod.purchasePricePaise);
      }
    }
    setPoForm({ ...poForm, items: updated });
  };

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
          setReceiveError(
            `Cannot receive ${q} for "${item.productNameSnapshot}" (only ${item.remainingQuantity} remaining).`
          );
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
      triggerAlert(
        'success',
        `Received stock for PO #${receivingPo.id}. Status is now ${res.status}.`
      );
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

  // Supplier CRUD
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
      triggerAlert(
        'error',
        err.response?.data?.error || err.message || 'Failed to delete supplier'
      );
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
      triggerAlert(
        'error',
        'Failed to load supplier products: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoadingSupplierProducts(false);
    }
  };

  // Stock Audit
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
    setCountQuantityInput(
      item.countedQuantity !== null ? item.countedQuantity : item.systemQuantity
    );
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

  // Operating Expenses
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
    const dateStr = exp.createdAt
      ? exp.createdAt.split('T')[0].split(' ')[0]
      : getKolkataToday();
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
      triggerAlert(
        'error',
        err.response?.data?.error || err.message || 'Failed to delete expense'
      );
    } finally {
      setDeletingExpense(false);
    }
  };

  // CSV Report Export Handler
  const handleExportCSV = () => {
    try {
      exportReportToCSV({
        summaryReport,
        pnlReport,
        salesReport,
        lossReport,
        purchasesReport,
        expensesList,
        reportPeriod
      });
      triggerAlert('success', 'Report exported to CSV successfully.');
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to export CSV report.');
    }
  };

  // Surplus Stock Handlers
  const handleOpenCreateSurplus = (product = null, suggestedQty = null) => {
    setCreateSurplusError('');
    if (product) {
      const prodId = product.productId || product.id;
      const full =
        surplusSuggestions.find((s) => String(s.productId) === String(prodId)) || product;
      setSelectedProductForSurplus(full);
      const avail =
        full.availableQuantity !== undefined
          ? full.availableQuantity
          : Math.max(0, (full.quantity || 0) - (full.reservedQuantity || 0));
      const qty =
        suggestedQty && suggestedQty > 0
          ? Math.min(suggestedQty, avail)
          : avail > 0
          ? Math.min(avail, 5)
          : 1;
      const normalPricePaise = full.normalSellingPricePaise || full.sellingPricePaise || 0;
      const discountedRupees =
        normalPricePaise > 0 ? Math.round((normalPricePaise * 0.85) / 100) : '';
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
    const full =
      surplusSuggestions.find((s) => String(s.productId) === String(prodId)) ||
      products.find((p) => String(p.id) === String(prodId));
    setSelectedProductForSurplus(full || null);
    if (full) {
      const normalPricePaise = full.normalSellingPricePaise || full.sellingPricePaise || 0;
      const discountedRupees =
        normalPricePaise > 0 ? Math.round((normalPricePaise * 0.85) / 100) : '';
      const avail =
        full.availableQuantity !== undefined
          ? full.availableQuantity
          : Math.max(0, (full.quantity || 0) - (full.reservedQuantity || 0));
      const suggestedQty =
        full.suggestedSurplusQuantity > 0
          ? full.suggestedSurplusQuantity
          : avail > 0
          ? Math.min(avail, 5)
          : 1;
      setCreateSurplusForm((prev) => ({
        ...prev,
        productId: String(prodId),
        quantity: prev.quantity || String(suggestedQty),
        discountedPriceRupees:
          prev.discountedPriceRupees || (discountedRupees ? String(discountedRupees) : ''),
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

    const avail = selectedProductForSurplus
      ? selectedProductForSurplus.availableQuantity !== undefined
        ? selectedProductForSurplus.availableQuantity
        : Math.max(
            0,
            (selectedProductForSurplus.quantity || 0) -
              (selectedProductForSurplus.reservedQuantity || 0)
          )
      : Infinity;
    if (qty > avail) {
      setCreateSurplusError(
        `Quantity to list (${qty}) exceeds available unreserved stock (${avail} units).`
      );
      return;
    }

    if (isNaN(priceRupees) || priceRupees <= 0) {
      setCreateSurplusError('Discounted clearance selling price must be greater than ₹0.');
      return;
    }

    const origPaise = selectedProductForSurplus
      ? selectedProductForSurplus.normalSellingPricePaise ||
        selectedProductForSurplus.sellingPricePaise ||
        0
      : 0;
    const pricePaise = rupeesToPaise(priceRupees);
    if (origPaise > 0 && pricePaise >= origPaise) {
      setCreateSurplusError(
        `Discounted price (${formatPaise(pricePaise)}) must be lower than the regular selling price (${formatPaise(origPaise)}).`
      );
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
      setCreateSurplusError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to create surplus listing.'
      );
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
      setSurplusSaleError(
        `Cannot sell more than remaining listed units (${surplusListingForSale.quantityRemaining}).`
      );
      return;
    }

    setSubmittingSurplusSale(true);
    try {
      await recordSurplusSale(surplusListingForSale.id, {
        quantity: qty,
        paymentMethod: surplusSaleForm.paymentMethod || 'CASH',
        notes: surplusSaleForm.notes?.trim() || 'Clearance sale'
      });
      triggerAlert(
        'success',
        `Successfully sold ${qty} clearance unit${qty > 1 ? 's' : ''} of ${surplusListingForSale.productName}!`
      );
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
      triggerAlert(
        'success',
        `Cancelled listing #${surplusListingToCancel.id}. Unsold units restored to available inventory.`
      );
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
    setLoadingSurplusDetail(true);
    try {
      const detail = await getSurplusListingById(listing.id);
      setSelectedSurplusDetail(detail);
    } catch (err) {
      console.error('Failed to load surplus listing detail:', err);
      triggerAlert('error', 'Failed to load listing details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingSurplusDetail(false);
    }
  };

  return {
    handlers: {
      openAddProductModal,
      openEditProductModal,
      confirmDeleteProduct,
      openQuickActionModal,
      handleQuickActionSubmit,
      openNewSaleModal,
      viewSaleDetails,
      confirmCancelSale,
      openNewPoModal,
      handlePlaceOrder,
      openReceiveModal,
      confirmCancelPo,
      viewPoDetails,
      openAddSupplierModal,
      openEditSupplierModal,
      confirmDeleteSupplier,
      viewSupplierProducts,
      openStartAuditModal,
      selectAuditForView,
      openCountModal,
      openCompleteAuditModal,
      openCancelAuditModal,
      openAddExpenseModal,
      openEditExpenseModal,
      confirmDeleteExpense,
      handleExportCSV,
      handleOpenCreateSurplus,
      handleOpenSurplusSale,
      handleOpenCancelSurplus,
      handleOpenSurplusDetail
    },
    modalProps: {
      // Products
      productModalOpen,
      setProductModalOpen,
      editingProduct,
      productForm,
      setProductForm,
      productFormError,
      savingProduct,
      showAdvancedProduct,
      setShowAdvancedProduct,
      handleProductNameChange,
      handleProductCategoryChange,
      handleSaveProduct,
      suppliers,
      setSkuManuallyEdited,
      products,
      productRecordMode,
      setProductRecordMode,
      selectedExistingProductId,
      setSelectedExistingProductId,
      existingProductIntakeQty,
      setExistingProductIntakeQty,
      existingProductIntakeReason,
      setExistingProductIntakeReason,
      deleteProductModalOpen,
      setDeleteProductModalOpen,
      productToDelete,
      deletingProduct,
      handleDeleteProduct,
      // Quick Action
      quickActionModalOpen,
      setQuickActionModalOpen,
      quickActionForm,
      setQuickActionForm,
      submittingQuickAction,
      quickActionError,
      // Sales
      saleModalOpen,
      setSaleModalOpen,
      saleSuccessData,
      setSaleSuccessData,
      openNewSaleModal,
      saleCart,
      setSaleCart,
      saleDiscountPercent,
      setSaleDiscountPercent,
      salePaymentMethod,
      setSalePaymentMethod,
      submittingSale,
      saleFormError,
      setSaleFormError,
      saleProductSearchQuery,
      setSaleProductSearchQuery,
      showClearCartConfirm,
      setShowClearCartConfirm,
      saleRequiresConfirm,
      setSaleRequiresConfirm,
      saleSearchInputRef,
      cartCalculations,
      searchFilteredProducts,
      viewSaleDetails,
      handleAddToCart,
      handleAddCartRow,
      handleCartItemChange,
      handleRemoveCartRow,
      handleUpdateQuantity,
      handleCustomPriceChange,
      handleResetItemPrice,
      handleClearCart,
      handleCheckoutSale,
      saleDetailModalOpen,
      setSaleDetailModalOpen,
      selectedSaleDetail,
      loadingSaleDetail,
      cancelSaleModalOpen,
      setCancelSaleModalOpen,
      saleToCancel,
      cancelSaleReason,
      setCancelSaleReason,
      cancellingSale,
      handleCancelSale,
      // Purchasing
      poModalOpen,
      setPoModalOpen,
      editingPo,
      poForm,
      setPoForm,
      poFormError,
      savingPo,
      handleSavePurchaseOrder,
      poCalculations,
      handlePoItemChange,
      handleRemovePoItemRow,
      handleAddPoItemRow,
      receiveModalOpen,
      setReceiveModalOpen,
      receivingPo,
      receiveItemQuantities,
      setReceiveItemQuantities,
      submittingReceive,
      receiveError,
      handleSubmitReceive,
      cancelPoModalOpen,
      setCancelPoModalOpen,
      poToCancel,
      cancelPoReason,
      setCancelPoReason,
      cancellingPo,
      handleCancelPo,
      poDetailModalOpen,
      setPoDetailModalOpen,
      selectedPoDetail,
      loadingPoDetail,
      // Suppliers
      supplierModalOpen,
      setSupplierModalOpen,
      editingSupplier,
      supplierForm,
      setSupplierForm,
      supplierFormError,
      savingSupplier,
      handleSaveSupplier,
      deleteSupplierModalOpen,
      setDeleteSupplierModalOpen,
      supplierToDelete,
      deletingSupplier,
      handleDeleteSupplier,
      supplierProductsModalOpen,
      setSupplierProductsModalOpen,
      selectedSupplierForProducts,
      supplierProductsList,
      loadingSupplierProducts,
      // Audits
      startAuditModalOpen,
      setStartAuditModalOpen,
      auditMode,
      setAuditMode,
      selectedAuditProductIds,
      setSelectedAuditProductIds,
      auditProductSearch,
      setAuditProductSearch,
      auditNotes,
      setAuditNotes,
      submittingAudit,
      handleStartAudit,
      countingItem,
      setCountingItem,
      countQuantityInput,
      setCountQuantityInput,
      countNotesInput,
      setCountNotesInput,
      submittingCount,
      handleRecordCount,
      completeAuditModalOpen,
      setCompleteAuditModalOpen,
      selectedAudit,
      submittingCompleteAudit,
      completeAuditError,
      handleCompleteAudit,
      cancelAuditModalOpen,
      setCancelAuditModalOpen,
      cancelAuditReason,
      setCancelAuditReason,
      submittingCancelAudit,
      handleCancelAudit,
      // Expenses
      expenseModalOpen,
      setExpenseModalOpen,
      editingExpense,
      expenseForm,
      setExpenseForm,
      expenseFormError,
      savingExpense,
      handleSaveExpense,
      deleteExpenseModalOpen,
      setDeleteExpenseModalOpen,
      expenseToDelete,
      deletingExpense,
      handleDeleteExpense,
      // Surplus
      createSurplusModalOpen,
      setCreateSurplusModalOpen,
      createSurplusForm,
      setCreateSurplusForm,
      selectedProductForSurplus,
      submittingCreateSurplus,
      createSurplusError,
      handleSubmitCreateSurplus,
      handleSelectProductForSurplus,
      surplusSaleModalOpen,
      setSurplusSaleModalOpen,
      surplusListingForSale,
      surplusSaleForm,
      setSurplusSaleForm,
      submittingSurplusSale,
      surplusSaleError,
      handleSubmitSurplusSale,
      cancelSurplusModalOpen,
      setCancelSurplusModalOpen,
      surplusListingToCancel,
      cancelSurplusReason,
      setCancelSurplusReason,
      submittingCancelSurplus,
      handleConfirmCancelSurplus,
      surplusDetailModalOpen,
      setSurplusDetailModalOpen,
      selectedSurplusDetail,
      loadingSurplusDetail
    }
  };
}
