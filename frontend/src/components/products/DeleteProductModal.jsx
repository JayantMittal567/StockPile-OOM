import React from 'react';

export default function DeleteProductModal({
  isOpen,
  onClose,
  productToDelete,
  deletingProduct,
  handleDeleteProduct
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Delete Product "{productToDelete?.name}"?</h3>
            <p className="text-slate-500">
              Products with stock movement history, sales records, or purchase orders cannot be deleted in order to preserve relational accounting integrity.
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
                disabled={deletingProduct}
                onClick={handleDeleteProduct}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition"
              >
                {deletingProduct ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
  );
}
