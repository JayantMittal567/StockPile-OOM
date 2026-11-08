import React from 'react';
import { X, Tag, AlertTriangle, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { formatPaise, rupeesToPaise } from '../../utils/formatters';

export default function CreateSurplusModal({
  isOpen,
  onClose,
  createSurplusForm = {},
  setCreateSurplusForm = () => {},
  selectedProductForSurplus = null,
  submittingCreateSurplus = false,
  createSurplusError = '',
  handleSubmitCreateSurplus = () => {},
  handleSelectProductForSurplus = () => {},
  products = []
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <Tag className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">Create Surplus Clearance Listing</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
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
                  onClick={onClose}
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

  );
}
