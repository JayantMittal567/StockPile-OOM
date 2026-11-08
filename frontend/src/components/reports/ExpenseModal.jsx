import React from 'react';
import { X, AlertCircle, Receipt, Check } from 'lucide-react';

export default function ExpenseModal({
  isOpen,
  onClose,
  editingExpense,
  expenseForm,
  setExpenseForm,
  expenseFormError,
  savingExpense,
  handleSaveExpense
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingExpense ? 'Edit Operating Expense' : 'Record Operating Expense'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {expenseFormError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{expenseFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                >
                  {['Rent', 'Salaries', 'Utilities', 'Transport', 'Maintenance', 'Marketing', 'Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount in Rupees (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 15000.00"
                    value={expenseForm.amountRupees}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amountRupees: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Monthly warehouse storage lease payment..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingExpense ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
