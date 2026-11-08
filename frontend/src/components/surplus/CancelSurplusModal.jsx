import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function CancelSurplusModal({
  isOpen,
  onClose,
  surplusListingToCancel,
  cancelSurplusReason,
  setCancelSurplusReason,
  submittingCancelSurplus,
  handleConfirmCancelSurplus
}) {
  if (!isOpen || !surplusListingToCancel) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Cancel Listing #{surplusListingToCancel.id}?</h3>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <p className="font-bold">Inventory Reservation Restoration Rule:</p>
              <p className="leading-relaxed">
                Cancelling will immediately release all <span className="font-bold">{surplusListingToCancel.quantityRemaining} remaining units</span> back to standard available stock.
                Past sales ({surplusListingToCancel.quantitySold} units) and revenue ({formatPaise(surplusListingToCancel.recoveredRevenuePaise ?? surplusListingToCancel.totalRealizedRevenuePaise ?? 0)}) already realized remain permanently recorded in your sales ledger. Physical stock is NOT altered.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelSurplusReason}
                onChange={(e) => setCancelSurplusReason(e.target.value)}
                placeholder="e.g. Promo ended, restocked standard inventory"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Keep Listing
              </button>
              <button
                type="button"
                disabled={submittingCancelSurplus}
                onClick={handleConfirmCancelSurplus}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submittingCancelSurplus ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>

  );
}
