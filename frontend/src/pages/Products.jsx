import React, { useMemo } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  ArrowDown,
  Layers,
  RefreshCw,
  Truck
} from 'lucide-react';
import PaginationBar from '../components/common/PaginationBar';
import { formatPaise } from '../utils/formatters';

export default function Products({
  products = [],
  loadingProducts,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  stockStatusFilter,
  setStockStatusFilter,
  productsPage,
  setProductsPage,
  productsPageSize,
  setProductsPageSize,
  fetchProductsData,
  openAddProductModal,
  openEditProductModal,
  openDeleteProductModal,
  confirmDeleteProduct = openDeleteProductModal,
  openQuickActionModal
}) {
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
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

  return (
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
  );
}