import React from 'react';
import { X, Plus, Trash2, AlertCircle, Truck } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function PoModal({
  isOpen,
  onClose,
  editingPo,
  poForm,
  setPoForm,
  poFormError,
  savingPo,
  handleSavePurchaseOrder = () => {},
  handleSavePo = handleSavePurchaseOrder,
  suppliers = [],
  products = [],
  poCalculations = { items: [], totalPaise: 0 },
  handlePoItemChange = () => {},
  handleRemovePoItemRow = () => {},
  handleAddPoItemRow = () => {}
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-600 text-white rounded-lg">
                  <Truck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingPo ? `Edit Draft PO #${editingPo.id}` : 'Create Purchase Order'}
                  </h3>
                  <p className="text-xs text-slate-500">Draft inbound restock order with preferred vendor</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePurchaseOrder(false);
              }}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
            >
              {poFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{poFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Select Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={poForm.supplierId}
                  onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select a vendor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson || 'Vendor'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Order Notes / Memo</label>
                <input
                  type="text"
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  placeholder="e.g. Warehouse Q4 replenishment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Order Item Lines</label>
                {poCalculations.items.map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <select
                        value={row.productId}
                        onChange={(e) => handlePoItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-16 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center text-xs"
                      />
                    </div>

                    <div className="w-20 shrink-0">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.unitCostRupees}
                        onChange={(e) => handlePoItemChange(idx, 'unitCostRupees', e.target.value)}
                        placeholder="Cost ₹"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div className="w-20 text-right font-mono font-bold text-slate-900 shrink-0 text-xs">
                      {formatPaise(row.lineTotalPaise)}
                    </div>

                    {poCalculations.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePoItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPoItemRow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-mono font-bold text-xs">
                <span>Calculated Total Amount:</span>
                <span className="text-teal-700 text-sm">{formatPaise(poCalculations.totalPaise)}</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPo}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={savingPo}
                  onClick={() => handleSavePurchaseOrder(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition"
                >
                  Save & Place
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
