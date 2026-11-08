import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function DeleteExpenseModal({
  isOpen,
  onClose,
  expenseToDelete,
  deletingExpense,
  handleDeleteExpense
}) {
  if (!isOpen || !expenseToDelete) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Delete Expense #{expenseToDelete?.id}?</h3>
            </div>
            <p className="text-slate-600">
              Are you sure you want to delete this <span className="font-bold text-slate-900">{expenseToDelete?.category}</span> expense of <span className="font-mono font-bold text-slate-900">{formatPaise(expenseToDelete?.amountPaise)}</span>? This will immediately recalculate period operating results.
            </p>
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
                disabled={deletingExpense}
                onClick={handleDeleteExpense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingExpense ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>

  );
}
