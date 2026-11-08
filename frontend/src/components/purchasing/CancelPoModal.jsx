import React from 'react';

export default function CancelPoModal({
  isOpen,
  onClose,
  poToCancel,
  cancelPoReason,
  setCancelPoReason,
  cancellingPo,
  handleCancelPo
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Cancel PO #{poToCancel?.id}</h3>
            <p className="text-slate-500">
              Cancelling will close outstanding quantities on this purchase order. Any stock already received will be retained.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Cancellation Reason</label>
              <input
                type="text"
                value={cancelPoReason}
                onChange={(e) => setCancelPoReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancellingPo}
                onClick={handleCancelPo}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {cancellingPo ? 'Cancelling...' : 'Confirm PO Cancellation'}
              </button>
            </div>
          </div>
        </div>

  );
}
