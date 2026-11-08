import React from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function CompleteAuditModal({
  isOpen,
  onClose,
  selectedAudit,
  submittingCompleteAudit,
  completeAuditError,
  handleCompleteAudit
}) {
  if (!isOpen || !selectedAudit) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Complete Stock Audit & Reconcile</h3>
                  <p className="text-[11px] text-slate-500">Audit #AUD-{selectedAudit.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message, e.g. 409 Conflict */}
            {completeAuditError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Inventory Concurrency Conflict (HTTP 409)
                </p>
                <p className="text-[11px] leading-relaxed">{completeAuditError}</p>
                <p className="text-[11px] text-rose-700 font-medium pt-1">
                  Recommendation: Please cancel this audit and start a fresh count using current live inventory.
                </p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-500">Products Counted</p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedAudit.countedProducts} / {selectedAudit.totalProducts} (100%)
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-500">Products with Discrepancies</p>
                <p
                  className={`text-lg font-bold ${
                    selectedAudit.discrepancyCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedAudit.discrepancyCount}
                </p>
              </div>
            </div>

            {/* Discrepancies Preview */}
            {selectedAudit.discrepancyCount > 0 ? (
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">Products Requiring Inventory Correction:</p>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-2">
                  {selectedAudit.items
                    ?.filter((i) => i.variance !== 0 && i.countedQuantity !== null)
                    .map((item) => (
                      <div key={item.id} className="py-1.5 flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-bold text-slate-800">{item.productNameSnapshot}</p>
                          <p className="font-mono text-slate-400">{item.skuSnapshot}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="text-slate-600">
                            {item.systemQuantity} → <span className="font-bold text-slate-900">{item.countedQuantity}</span>
                          </p>
                          <p
                            className={`font-bold ${
                              item.variance < 0 ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          >
                            {item.variance > 0 ? `+${item.variance}` : item.variance} units
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>All physical counts perfectly match system records! No stock adjustments required.</span>
              </div>
            )}

            {/* Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Inventory Reconciliation Warning
              </p>
              <p className="leading-relaxed">
                Completing this audit will update your live product quantities to match the physical counts and record stock adjustment movements in your ledger.
              </p>
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
                type="button"
                disabled={submittingCompleteAudit}
                onClick={handleCompleteAudit}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingCompleteAudit ? 'Reconciling...' : 'Confirm & Complete Audit'}</span>
              </button>
            </div>
          </div>
        </div>

  );
}
