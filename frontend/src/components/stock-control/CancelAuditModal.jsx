import React from 'react';
import { X } from 'lucide-react';

export default function CancelAuditModal({
  isOpen,
  onClose,
  selectedAudit,
  cancelAuditReason,
  setCancelAuditReason,
  submittingCancelAudit,
  handleCancelAudit
}) {
  if (!isOpen || !selectedAudit) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancel Stock Audit</h3>
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

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to cancel this audit? The audit history and physical counts recorded so far will be preserved, and no stock quantities will be modified.
            </p>

            <form
              onSubmit={handleCancelAudit}
              className="space-y-4"
            >
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Physical counting interrupted, shift ended, recount needed..."
                  value={cancelAuditReason}
                  onChange={(e) => setCancelAuditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Keep Open
                </button>
                <button
                  type="submit"
                  disabled={submittingCancelAudit}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <X className="w-4 h-4" />
                  <span>{submittingCancelAudit ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
