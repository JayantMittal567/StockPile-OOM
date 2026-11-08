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
export const getProducts = (search = '', category = '', config = {}) => {
  const params = { ...(config.params || {}) };
  if (search && search.trim()) params.search = search.trim();
  if (category && category.trim()) params.category = category.trim();
  return api.get('/products', { ...config, params }).then(res => res.data);
};

export const getProductById = (id, config = {}) => api.get(`/products/${id}`, config).then(res => res.data);

export const createProduct = (productData) => api.post('/products', productData).then(res => res.data);

export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData).then(res => res.data);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Inventory Operations & Ledger
export const getMovements = (productId = null, movementType = '', extraParams = {}, config = {}) => {
  const params = { ...extraParams, ...(config.params || {}) };
  if (productId) params.productId = productId;
  if (movementType && movementType.trim()) params.movementType = movementType.trim();
  return api.get('/movements', { ...config, params }).then(res => res.data);
};

export const stockIn = (productId, quantity, reason = '') =>
  api.post('/inventory/stock-in', { productId, quantity, reason }).then(res => res.data);

export const stockOut = (productId, quantity, reason = '') =>
  api.post('/inventory/stock-out', { productId, quantity, reason }).then(res => res.data);

export const adjustStock = (productId, quantity, reason = '') =>
  api.post('/inventory/adjust', { productId, quantity, reason }).then(res => res.data);

// Legacy Deterministic Inventory Intelligence
export const getIntelligence = (config = {}) => api.get('/intelligence', config).then(res => res.data);

// Sales-Based Inventory Intelligence
export const getSalesIntelligence = (config = {}) => api.get('/intelligence/sales', config).then(res => res.data);

// Sales Management
export const getSales = (status = '', extraParams = {}, config = {}) => {
  const params = { ...extraParams, ...(config.params || {}) };
  if (status && status.trim()) params.status = status.trim();
  return api.get('/sales', { ...config, params }).then(res => res.data);
};

export const getSaleById = (id, config = {}) => api.get(`/sales/${id}`, config).then(res => res.data);

export const createSale = (saleData) => api.post('/sales', saleData).then(res => res.data);

export const cancelSale = (id, reason = '') =>
  api.post(`/sales/${id}/cancel`, { reason }).then(res => res.data);

export const getSalesMetricsSummary = (config = {}) => api.get('/sales/summary', config).then(res => res.data);

export const getDailySalesTrend = (config = {}) => api.get('/sales/trend', config).then(res => res.data);

// Supplier Management
export const getSuppliers = (search = '', config = {}) => {
  const params = { ...(config.params || {}) };
  if (search && search.trim()) params.search = search.trim();
  return api.get('/suppliers', { ...config, params }).then(res => res.data);
};

export const getSupplierById = (id, config = {}) => api.get(`/suppliers/${id}`, config).then(res => res.data);

export const createSupplier = (supplierData) => api.post('/suppliers', supplierData).then(res => res.data);

export const updateSupplier = (id, supplierData) => api.put(`/suppliers/${id}`, supplierData).then(res => res.data);

export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

export const assignProductSupplier = (productId, supplierId) =>
  api.put(`/products/${productId}/supplier`, { supplierId }).then(res => res.data);

export const removeProductSupplier = (productId) =>
  api.delete(`/products/${productId}/supplier`);

export const getSupplierProducts = (id, config = {}) => api.get(`/suppliers/${id}/products`, config).then(res => res.data);

// Purchase Order Management
export const getPurchaseOrders = (status = '', supplierId = null, extraParams = {}, config = {}) => {
  const params = { ...extraParams, ...(config.params || {}) };
  if (status && status.trim()) params.status = status.trim();
  if (supplierId) params.supplierId = supplierId;
  return api.get('/purchase-orders', { ...config, params }).then(res => res.data);
};

export const getPurchaseOrderById = (id, config = {}) => api.get(`/purchase-orders/${id}`, config).then(res => res.data);

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
export const getStockAuditSummary = (config = {}) => api.get('/stock-audits/summary', config).then(res => res.data);

export const getStockAudits = (params = {}, config = {}) => api.get('/stock-audits', { ...config, params }).then(res => res.data);

export const getStockAuditById = (id, config = {}) => api.get(`/stock-audits/${id}`, config).then(res => res.data);

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
export const getExpenses = (params = {}, config = {}) => api.get('/expenses', { ...config, params }).then(res => res.data);

export const createExpense = (expenseData) =>
  api.post('/expenses', expenseData).then(res => res.data);

export const updateExpense = (id, expenseData) =>
  api.put(`/expenses/${id}`, expenseData).then(res => res.data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);

// Surplus Stock Management
export const getSurplusSuggestions = (config = {}) =>
  api.get('/surplus-listings/suggestions', config).then(res => res.data);

export const getSurplusSummary = (config = {}) =>
  api.get('/surplus-listings/summary', config).then(res => res.data);

export const getSurplusListings = (params = {}, config = {}) =>
  api.get('/surplus-listings', { ...config, params }).then(res => res.data);

export const getSurplusListingById = (id, config = {}) =>
  api.get(`/surplus-listings/${id}`, config).then(res => res.data);

export const createSurplusListing = (listingData) =>
  api.post('/surplus-listings', listingData).then(res => res.data);

export const updateSurplusListing = (id, listingData) =>
  api.put(`/surplus-listings/${id}`, listingData).then(res => res.data);

export const recordSurplusSale = (id, saleData) =>
  api.post(`/surplus-listings/${id}/sell`, saleData).then(res => res.data);

export const cancelSurplusListing = (id, cancelData = {}) =>
  api.post(`/surplus-listings/${id}/cancel`, cancelData).then(res => res.data);

export default api;
