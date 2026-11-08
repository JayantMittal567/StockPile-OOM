import React from 'react';
import { X, AlertCircle, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export default function ProductModal({
  isOpen,
  onClose,
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
  suppliers = [],
  setSkuManuallyEdited = () => {}
}) {
  if (!isOpen) return null;

  return (
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
                onClick={onClose}
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
                  onClick={onClose}
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
  );
}
