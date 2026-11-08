import React from 'react';

export default function DeleteSupplierModal({
  isOpen,
  onClose,
  supplierToDelete,
  deletingSupplier,
  handleDeleteSupplier
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Delete Supplier "{supplierToDelete?.name}"?</h3>
            <p className="text-slate-500">
              Suppliers referenced by catalog products or purchase orders are protected by relational integrity guards and cannot be deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingSupplier}
                onClick={handleDeleteSupplier}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {deletingSupplier ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>

  );
}
