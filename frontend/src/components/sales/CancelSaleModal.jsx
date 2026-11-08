import React from 'react';

export default function CancelSaleModal({
  isOpen,
  onClose,
  saleToCancel,
  cancelSaleReason,
  setCancelSaleReason,
  cancellingSale,
  handleCancelSale
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Cancel Sale #SO-{saleToCancel?.id}</h3>
            <p className="text-slate-500">
              Cancelling this sale will mark it as CANCELLED and restore the inventory quantities to warehouse stock immediately.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Reason for Cancellation</label>
              <input
                type="text"
                value={cancelSaleReason}
                onChange={(e) => setCancelSaleReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Keep Sale
              </button>
              <button
                type="button"
                disabled={cancellingSale}
                onClick={handleCancelSale}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {cancellingSale ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
  );
}
