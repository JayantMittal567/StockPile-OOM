import React from 'react';
import { X, ShoppingCart, AlertTriangle, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function SurplusSaleModal({
  isOpen,
  onClose,
  surplusListingForSale,
  surplusSaleForm = { quantity: 1, paymentMethod: 'CASH', notes: '' },
  setSurplusSaleForm = () => {},
  submittingSurplusSale = false,
  surplusSaleError = '',
  handleSubmitSurplusSale = () => {}
}) {
  if (!isOpen || !surplusListingForSale) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <ShoppingCart className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">Record Clearance Sale</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
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
                  onClick={onClose}
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

  );
}
