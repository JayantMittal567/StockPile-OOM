import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ReceivePoModal({
  isOpen,
  onClose,
  receivingPo,
  receiveItemQuantities,
  setReceiveItemQuantities,
  submittingReceive,
  receiveError,
  handleSubmitReceive = () => {},
  handleReceiveGoods = handleSubmitReceive
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Receive PO Goods #{receivingPo?.id}</h3>
                <p className="text-xs text-slate-500">Supplier: {receivingPo?.supplierName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceive} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {receiveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{receiveError}</span>
                </div>
              )}

              <p className="text-slate-600 text-xs">
                Specify quantities received in this shipment. Warehouse stock will automatically increment and log audit entries.
              </p>

              <div className="space-y-2">
                {receivingPo?.items?.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                        <p className="text-[10px] text-slate-400">SKU: {item.skuSnapshot}</p>
                      </div>
                      <span className="font-mono text-xs text-slate-600">
                        Remaining: <span className="font-bold text-teal-700">{item.remainingQuantity}</span> units
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Receive Quantity:</label>
                      <input
                        type="number"
                        min="0"
                        max={item.remainingQuantity}
                        value={receiveItemQuantities[item.id] ?? item.remainingQuantity}
                        onChange={(e) =>
                          setReceiveItemQuantities({
                            ...receiveItemQuantities,
                            [item.id]: e.target.value
                          })
                        }
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs text-center"
                      />
                    </div>
                  </div>
                ))}
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
                  disabled={submittingReceive}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition"
                >
                  {submittingReceive ? 'Receiving...' : 'Confirm Delivery Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
