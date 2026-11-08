import React from 'react';
import { X, CheckCircle2, AlertTriangle, Scale, Check, ArrowDown, ArrowUp } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function CountModal({
  isOpen,
  onClose,
  countingItem,
  countQuantityInput,
  setCountQuantityInput,
  countNotesInput,
  setCountNotesInput,
  submittingCount,
  handleRecordCount
}) {
  if (!isOpen || !countingItem) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Record Physical Count</h3>
                <p className="text-[11px] text-slate-500">
                  {countingItem.productNameSnapshot} ({countingItem.skuSnapshot})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleRecordCount}
              className="space-y-4"
            >
              {/* Snapshot reference */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[11px]">System Quantity (Snapshot)</p>
                  <p className="text-sm font-bold text-slate-800 font-mono">{countingItem.systemQuantity} units</p>
                </div>
                {countingItem.countedQuantity !== null && (
                  <div className="text-right">
                    <p className="text-slate-500 text-[11px]">Previous Count</p>
                    <p className="text-sm font-bold text-teal-700 font-mono">{countingItem.countedQuantity} units</p>
                  </div>
                )}
              </div>

              {/* Physical Count with Stepper */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Physically Counted Units
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCountQuantityInput(Math.max(0, (Number(countQuantityInput) || 0) - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={countQuantityInput}
                    onChange={(e) => setCountQuantityInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold text-base focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCountQuantityInput((Number(countQuantityInput) || 0) + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Live Variance Calculation Explanation */}
              {countQuantityInput !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    Number(countQuantityInput) - countingItem.systemQuantity === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : Number(countQuantityInput) - countingItem.systemQuantity < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <span className="font-semibold">Calculated Variance:</span>
                  <span className="font-mono font-bold flex items-center gap-1">
                    {Number(countQuantityInput) - countingItem.systemQuantity === 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        0 Match (No discrepancy)
                      </>
                    ) : Number(countQuantityInput) - countingItem.systemQuantity < 0 ? (
                      <>
                        <ArrowDown className="w-3.5 h-3.5" />
                        -{Math.abs(Number(countQuantityInput) - countingItem.systemQuantity)} Missing from stock
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-3.5 h-3.5" />
                        +{Number(countQuantityInput) - countingItem.systemQuantity} Extra stock found
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Item Count Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 damaged units discarded, located extra box in back..."
                  value={countNotesInput}
                  onChange={(e) => setCountNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCount}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingCount ? 'Saving...' : 'Save Physical Count'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
