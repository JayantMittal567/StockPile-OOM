import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { formatPaise, formatDateTime } from '../../utils/formatters';

export default function SaleDetailModal({
  isOpen,
  onClose,
  selectedSaleDetail,
  loadingSaleDetail
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Sale Order #SO-{selectedSaleDetail?.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSaleDetail?.status} on {formatDateTime(selectedSaleDetail?.createdAt)} • Payment: {selectedSaleDetail?.paymentMethod}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Purchased Items</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedSaleDetail?.items?.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.productNameSnapshot}</span>
                          {item.belowCost && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                              Below Cost
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">SKU: {item.skuSnapshot}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-bold text-slate-900">{formatPaise(item.lineTotalPaise)}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.quantity} × {formatPaise(item.unitSellingPricePaise)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPaise(selectedSaleDetail?.subtotalPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span>
                    -{formatPaise(selectedSaleDetail?.discountPaise)}
                    {selectedSaleDetail?.discountPercent ? ` (${selectedSaleDetail.discountPercent}%)` : ''}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total:</span>
                  <span>{formatPaise(selectedSaleDetail?.totalPaise)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold pt-1">
                  <span>Gross Profit Margin:</span>
                  <span>{formatPaise(selectedSaleDetail?.grossProfitPaise)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
