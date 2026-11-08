import React from 'react';
import { X, Package, RefreshCw } from 'lucide-react';
import { formatPaise } from '../../utils/formatters';

export default function SupplierProductsModal({
  isOpen,
  onClose,
  selectedSupplierForProducts,
  supplierProductsList = [],
  loadingSupplierProducts
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Products Supplied by {selectedSupplierForProducts?.name}
                </h3>
                <p className="text-[11px] text-slate-400">Linked as preferred vendor</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {supplierProductsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No catalog products currently designate this supplier as preferred vendor.
                </div>
              ) : (
                supplierProductsList.map((p) => (
                  <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400">SKU: {p.sku} | In Stock: {p.quantity}</p>
                    </div>
                    <span className="font-mono text-slate-800 font-bold">{formatPaise(p.purchasePricePaise)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

  );
}
