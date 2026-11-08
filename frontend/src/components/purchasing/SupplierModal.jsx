import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function SupplierModal({
  isOpen,
  onClose,
  editingSupplier,
  supplierForm,
  setSupplierForm,
  supplierFormError,
  savingSupplier,
  handleSaveSupplier
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              {supplierFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
                  {supplierFormError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phone</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition"
                >
                  {savingSupplier ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
