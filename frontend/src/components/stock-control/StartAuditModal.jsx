import React from 'react';
import { X, Search, CheckCircle2, AlertCircle, ClipboardCheck, Boxes, CheckSquare } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function StartAuditModal({
  isOpen,
  onClose,
  auditMode,
  setAuditMode,
  selectedAuditProductIds,
  setSelectedAuditProductIds,
  auditProductSearch,
  setAuditProductSearch,
  auditNotes,
  setAuditNotes,
  submittingAudit,
  handleStartAudit,
  products = []
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Start New Stock Audit</h3>
                  <p className="text-[11px] text-slate-500">Initialize a physical count session across catalog inventory</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleStartAudit}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
            >
              {/* Scope Selector Tabs */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Audit Scope Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuditMode('ALL')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      auditMode === 'ALL'
                        ? 'border-teal-600 bg-teal-50/50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-teal-600" />
                      All Products
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Audit complete catalog ({products.length} products)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditMode('SELECT')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      auditMode === 'SELECT'
                        ? 'border-teal-600 bg-teal-50/50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                      Specific Products
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Choose selected products manually
                    </span>
                  </button>
                </div>
              </div>

              {/* Mode: SELECT products specific picker */}
              {auditMode === 'SELECT' && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter products by name or SKU..."
                        value={auditProductSearch}
                        onChange={(e) => setAuditProductSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const matching = products
                          .filter(
                            (p) =>
                              !auditProductSearch.trim() ||
                              p.name.toLowerCase().includes(auditProductSearch.toLowerCase()) ||
                              p.sku.toLowerCase().includes(auditProductSearch.toLowerCase())
                          )
                          .map((p) => p.id);
                        const allSelected = matching.every((id) => selectedAuditProductIds.includes(id));
                        if (allSelected) {
                          setSelectedAuditProductIds(
                            selectedAuditProductIds.filter((id) => !matching.includes(id))
                          );
                        } else {
                          setSelectedAuditProductIds(Array.from(new Set([...selectedAuditProductIds, ...matching])));
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-[11px] font-bold text-slate-700 whitespace-nowrap"
                    >
                      Toggle All
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                    {products
                      .filter(
                        (p) =>
                          !auditProductSearch.trim() ||
                          p.name.toLowerCase().includes(auditProductSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(auditProductSearch.toLowerCase())
                      )
                      .map((p) => {
                        const isSelected = selectedAuditProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                              isSelected ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAuditProductIds([...selectedAuditProductIds, p.id]);
                                  } else {
                                    setSelectedAuditProductIds(selectedAuditProductIds.filter((id) => id !== p.id));
                                  }
                                }}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="font-mono text-[10px] text-slate-400">{p.sku} • {p.category}</p>
                              </div>
                            </div>
                            <span className="font-mono font-medium text-slate-600 text-[11px]">
                              {p.quantity} on hand
                            </span>
                          </label>
                        );
                      })}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedAuditProductIds.length} product(s) selected for audit
                  </p>
                </div>
              )}

              {/* Audit Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Audit Notes / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. End of month warehouse count, High-shrinkage tools cycle count..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAudit || (auditMode === 'SELECT' && selectedAuditProductIds.length === 0)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>{submittingAudit ? 'Starting...' : 'Start Audit Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
