import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { formatPaise, formatDateTime } from '../../utils/formatters';

export default function PoDetailModal({
  isOpen,
  onClose,
  selectedPoDetail,
  loadingPoDetail
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Purchase Order #PO-{selectedPoDetail?.id}</h3>
                <p className="text-xs text-slate-500">
                  Vendor: {selectedPoDetail?.supplierName} | Status: {selectedPoDetail?.status}
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
                <h4 className="font-bold text-slate-800">Order Lines</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedPoDetail?.items?.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                        <p className="text-[10px] text-slate-400">
                          Ordered: {item.quantityOrdered} | Received: {item.quantityReceived} | Remaining: {item.remainingQuantity}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-bold text-slate-900">{formatPaise(item.lineTotalPaise)}</p>
                        <p className="text-[10px] text-slate-400">@ {formatPaise(item.unitCostPaise)} / unit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Order Amount:</span>
                  <span>{formatPaise(selectedPoDetail?.totalAmountPaise)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

  );
}
