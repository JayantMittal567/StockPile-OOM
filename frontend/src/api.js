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
export const getDashboard = () => api.get('/dashboard').then(res => res.data);

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
export const getMovements = (productId = null, movementType = '') => {
  const params = {};
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
export const getSales = (status = '') => {
  const params = {};
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
export const getPurchaseOrders = (status = '', supplierId = null) => {
  const params = {};
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

export default api;
