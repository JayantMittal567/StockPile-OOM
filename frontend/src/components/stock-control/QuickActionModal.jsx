import React from 'react';
import { X, ArrowDown, ShoppingCart, SlidersHorizontal, AlertCircle } from 'lucide-react';

export default function QuickActionModal({
  isOpen,
  onClose,
  quickActionForm,
  setQuickActionForm,
  submittingQuickAction,
  quickActionError,
  handleQuickActionSubmit,
  products = []
}) {
  if (!isOpen) return null;

  return (
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
                onClick={onClose}
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
                  onClick={onClose}
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

  );
}
