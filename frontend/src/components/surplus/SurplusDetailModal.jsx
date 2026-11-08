import React from 'react';
import { X, CheckCircle2, ShoppingCart, Tag, AlertCircle, Receipt, RefreshCw, ExternalLink } from 'lucide-react';
import { formatPaise, formatDateTime } from '../../utils/formatters';

export default function SurplusDetailModal({
  isOpen,
  onClose,
  selectedSurplusDetail,
  loadingSurplusDetail,
  viewSaleDetails = () => {}
}) {
  if (!isOpen || !selectedSurplusDetail) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Listing #{selectedSurplusDetail.id} — {selectedSurplusDetail.productName}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    SKU: {selectedSurplusDetail.sku} • {selectedSurplusDetail.category || 'General'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Snapshot KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 border ${
                  selectedSurplusDetail.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedSurplusDetail.status === 'PARTIALLY_SOLD'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : selectedSurplusDetail.status === 'SOLD_OUT'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {selectedSurplusDetail.status?.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Created {formatDateTime(selectedSurplusDetail.createdAt)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Clearance Price</span>
                <span className="font-mono font-bold text-teal-700 text-sm">
                  {formatPaise(selectedSurplusDetail.discountedUnitPricePaise ?? selectedSurplusDetail.discountedSellingPricePaise)}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(selectedSurplusDetail.regularUnitPricePaise ?? selectedSurplusDetail.originalSellingPricePaise) && (
                    <span className="font-mono line-through text-[10px] text-slate-400">
                      {formatPaise(selectedSurplusDetail.regularUnitPricePaise ?? selectedSurplusDetail.originalSellingPricePaise)}
                    </span>
                  )}
                  {selectedSurplusDetail.discountPercentage != null && (
                    <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded">
                      {Math.round(selectedSurplusDetail.discountPercentage)}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Units Breakdown</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {selectedSurplusDetail.quantitySold} / {selectedSurplusDetail.quantityListed} sold
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  {selectedSurplusDetail.quantityRemaining} units remaining
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Financial Results</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatPaise(selectedSurplusDetail.recoveredRevenuePaise ?? selectedSurplusDetail.totalRealizedRevenuePaise ?? 0)}
                </span>
                <div className="text-[10px] space-y-0.5 mt-0.5">
                  <span className="text-slate-500 block">
                    Cost: {formatPaise(selectedSurplusDetail.quantitySold * (selectedSurplusDetail.unitCostPaiseSnapshot ?? selectedSurplusDetail.originalPurchasePricePaise ?? 0))}
                  </span>
                  <span className="text-emerald-600 font-bold block">
                    +{formatPaise(selectedSurplusDetail.grossProfitPaise ?? selectedSurplusDetail.totalRealizedGrossProfitPaise ?? 0)} profit
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Notice if Cancelled */}
            {selectedSurplusDetail.status === 'CANCELLED' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Listing Cancelled</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This clearance listing was cancelled on <span className="font-mono font-semibold">{formatDateTime(selectedSurplusDetail.updatedAt)}</span>. All <span className="font-bold">{selectedSurplusDetail.quantityRemaining} remaining units</span> were released back to standard warehouse stock.
                  {selectedSurplusDetail.notes && <span> Reason: "{selectedSurplusDetail.notes}".</span>}
                </p>
              </div>
            )}

            {selectedSurplusDetail.notes && selectedSurplusDetail.status !== 'CANCELLED' && (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-xs">
                <strong className="text-slate-800">Campaign Notes:</strong> {selectedSurplusDetail.notes}
              </div>
            )}

            {/* Associated Sales Transactions */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Associated Clearance Sales ({selectedSurplusDetail.sales?.length || 0})</span>
              </h4>

              {loadingSurplusDetail ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-teal-600" />
                  <p>Loading sales history...</p>
                </div>
              ) : !selectedSurplusDetail.sales || selectedSurplusDetail.sales.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  No sales recorded against this clearance listing yet.
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Sale ID</th>
                        <th className="py-2.5 px-3 text-center">Units Sold</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Realized Profit</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSurplusDetail.sales.map((sale) => (
                        <tr key={sale.saleId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            #{sale.saleId}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                            {sale.quantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {formatPaise(sale.unitSellingPricePaise)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {formatPaise(sale.lineTotalPaise)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">
                            +{formatPaise(sale.grossProfitPaise ?? ((sale.lineTotalPaise || 0) - (sale.lineCostPaise || 0)))}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                              {sale.paymentMethod || 'CASH'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {formatDateTime(sale.saleDate)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                onClose();
                                viewSaleDetails(sale.saleId);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1"
                              title="View full sale receipt"
                            >
                              <span>Receipt</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
  );
}
