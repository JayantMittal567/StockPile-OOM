import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// System & Health
export const getHealth = () => api.get('/health').then(res => res.data);

// Dashboard
export const getDashboard = (params = {}) => api.get('/dashboard', { params }).then(res => res.data);

// Products
export const getProducts = (search = '', category = '') => {
  const params = {};
  if (search && search.trim()) params.search = search.trim();
  if (category && category.trim()) params.category = category.trim();
  return api.get('/products', { params }).then(res => res.data);
};

export const getProductById = (id) => api.get(`/products/${id}`).then(res => res.data);

export const createProduct = (productData) => api.post('/products', productData).then(res => res.data);

export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData).then(res => res.data);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Inventory Operations & Ledger
export const getMovements = (productId = null, movementType = '', extraParams = {}) => {
  const params = { ...extraParams };
  if (productId) params.productId = productId;
  if (movementType && movementType.trim()) params.movementType = movementType.trim();
  return api.get('/movements', { params }).then(res => res.data);
};

export const stockIn = (productId, quantity, reason = '') =>
  api.post('/inventory/stock-in', { productId, quantity, reason }).then(res => res.data);

export const stockOut = (productId, quantity, reason = '') =>
  api.post('/inventory/stock-out', { productId, quantity, reason }).then(res => res.data);

export const adjustStock = (productId, quantity, reason = '') =>
  api.post('/inventory/adjust', { productId, quantity, reason }).then(res => res.data);

// Legacy Deterministic Inventory Intelligence
export const getIntelligence = () => api.get('/intelligence').then(res => res.data);

// Sales-Based Inventory Intelligence
export const getSalesIntelligence = () => api.get('/intelligence/sales').then(res => res.data);

// Sales Management
export const getSales = (status = '', extraParams = {}) => {
  const params = { ...extraParams };
  if (status && status.trim()) params.status = status.trim();
  return api.get('/sales', { params }).then(res => res.data);
};

export const getSaleById = (id) => api.get(`/sales/${id}`).then(res => res.data);

export const createSale = (saleData) => api.post('/sales', saleData).then(res => res.data);

export const cancelSale = (id, reason = '') =>
  api.post(`/sales/${id}/cancel`, { reason }).then(res => res.data);

export const getSalesMetricsSummary = () => api.get('/sales/summary').then(res => res.data);

export const getDailySalesTrend = () => api.get('/sales/trend').then(res => res.data);

// Supplier Management
export const getSuppliers = (search = '') => {
  const params = {};
  if (search && search.trim()) params.search = search.trim();
  return api.get('/suppliers', { params }).then(res => res.data);
};

export const getSupplierById = (id) => api.get(`/suppliers/${id}`).then(res => res.data);

export const createSupplier = (supplierData) => api.post('/suppliers', supplierData).then(res => res.data);

export const updateSupplier = (id, supplierData) => api.put(`/suppliers/${id}`, supplierData).then(res => res.data);

export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

export const assignProductSupplier = (productId, supplierId) =>
  api.put(`/products/${productId}/supplier`, { supplierId }).then(res => res.data);

export const removeProductSupplier = (productId) =>
  api.delete(`/products/${productId}/supplier`);

export const getSupplierProducts = (id) => api.get(`/suppliers/${id}/products`).then(res => res.data);

// Purchase Order Management
export const getPurchaseOrders = (status = '', supplierId = null, extraParams = {}) => {
  const params = { ...extraParams };
  if (status && status.trim()) params.status = status.trim();
  if (supplierId) params.supplierId = supplierId;
  return api.get('/purchase-orders', { params }).then(res => res.data);
};

export const getPurchaseOrderById = (id) => api.get(`/purchase-orders/${id}`).then(res => res.data);

export const createPurchaseOrder = (orderData) =>
  api.post('/purchase-orders', orderData).then(res => res.data);

export const updatePurchaseOrder = (id, orderData) =>
  api.put(`/purchase-orders/${id}`, orderData).then(res => res.data);

export const placePurchaseOrder = (id) =>
  api.post(`/purchase-orders/${id}/place`).then(res => res.data);

export const receivePurchaseOrder = (id, receiptData) =>
  api.post(`/purchase-orders/${id}/receive`, receiptData).then(res => res.data);

export const cancelPurchaseOrder = (id, reason = '') =>
  api.post(`/purchase-orders/${id}/cancel`, { reason }).then(res => res.data);

// Stock Auditing
export const getStockAuditSummary = () => api.get('/stock-audits/summary').then(res => res.data);

export const getStockAudits = (params = {}) => api.get('/stock-audits', { params }).then(res => res.data);

export const getStockAuditById = (id) => api.get(`/stock-audits/${id}`).then(res => res.data);

export const createStockAudit = (auditData) =>
  api.post('/stock-audits', auditData).then(res => res.data);

export const enterAuditCount = (auditId, itemId, countData) =>
  api.put(`/stock-audits/${auditId}/items/${itemId}`, countData).then(res => res.data);

export const completeStockAudit = (id) =>
  api.post(`/stock-audits/${id}/complete`).then(res => res.data);

export const cancelStockAudit = (id, reason = '') =>
  api.post(`/stock-audits/${id}/cancel`, { reason }).then(res => res.data);

// Financial Reports & Analytics
export const getFinancialSummaryReport = (params = {}) =>
  api.get('/reports/summary', { params }).then(res => res.data);

export const getProfitLossReport = (params = {}) =>
  api.get('/reports/profit-loss', { params }).then(res => res.data);

export const getSalesReport = (params = {}) =>
  api.get('/reports/sales', { params }).then(res => res.data);

export const getInventoryLossReport = (params = {}) =>
  api.get('/reports/inventory-loss', { params }).then(res => res.data);

export const getPurchasesReport = (params = {}) =>
  api.get('/reports/purchases', { params }).then(res => res.data);

// Operating Expenses
export const getExpenses = (params = {}) => api.get('/expenses', { params }).then(res => res.data);

export const createExpense = (expenseData) =>
  api.post('/expenses', expenseData).then(res => res.data);

export const updateExpense = (id, expenseData) =>
  api.put(`/expenses/${id}`, expenseData).then(res => res.data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);

// Surplus Stock Management
export const getSurplusSuggestions = () =>
  api.get('/surplus-listings/suggestions').then(res => res.data);

export const getSurplusSummary = () =>
  api.get('/surplus-listings/summary').then(res => res.data);

export const getSurplusListings = (params = {}) =>
  api.get('/surplus-listings', { params }).then(res => res.data);

export const getSurplusListingById = (id) =>
  api.get(`/surplus-listings/${id}`).then(res => res.data);

export const createSurplusListing = (listingData) =>
  api.post('/surplus-listings', listingData).then(res => res.data);

export const updateSurplusListing = (id, listingData) =>
  api.put(`/surplus-listings/${id}`, listingData).then(res => res.data);

export const recordSurplusSale = (id, saleData) =>
  api.post(`/surplus-listings/${id}/sell`, saleData).then(res => res.data);

export const cancelSurplusListing = (id, cancelData = {}) =>
  api.post(`/surplus-listings/${id}/cancel`, cancelData).then(res => res.data);

export default api;
