import React from 'react';
import {
  CheckCircle2,
  X,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Percent,
  RefreshCw,
  Printer,
  Receipt,
  AlertCircle,
  Tag,
  RotateCcw,
  AlertOctagon,
  Banknote,
  Wallet,
  CreditCard
} from 'lucide-react';
import { formatPaise, formatDateTime, paiseToRupees } from '../../utils/formatters';

export default function SaleModal({
  isOpen,
  onClose,
  saleSuccessData,
  setSaleSuccessData = () => {},
  openNewSaleModal,
  saleCart,
  setSaleCart = () => {},
  saleDiscountPercent,
  setSaleDiscountPercent,
  salePaymentMethod,
  setSalePaymentMethod,
  submittingSale,
  saleFormError,
  setSaleFormError = () => {},
  saleProductSearchQuery,
  setSaleProductSearchQuery,
  showClearCartConfirm,
  setShowClearCartConfirm,
  saleRequiresConfirm,
  setSaleRequiresConfirm = () => {},
  saleSearchInputRef,
  products = [],
  cartCalculations,
  searchFilteredProducts = [],
  viewSaleDetails = () => {},
  handleAddToCart = () => {},
  handleAddCartRow = () => {},
  handleCartItemChange = () => {},
  handleRemoveCartRow = () => {},
  handleUpdateQuantity = () => {},
  handleCustomPriceChange = () => {},
  handleResetItemPrice = () => {},
  handleClearCart = () => {},
  handleCheckoutSale = () => {}
}) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {saleSuccessData ? (
              <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Sale Completed Successfully!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Order <span className="font-mono font-semibold text-slate-800">#SO-{saleSuccessData.id}</span> has been processed and inventory updated.
                  </p>
                </div>

                {/* Receipt Card Summary */}
                <div className="w-full bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 text-left text-xs space-y-3 font-mono">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Date & Time</span>
                    <span className="text-slate-800">{formatDateTime(saleSuccessData.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Payment Method</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-sans font-bold text-[11px] uppercase">
                      {saleSuccessData.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Subtotal</span>
                    <span className="text-slate-800">{formatPaise(saleSuccessData.subtotalPaise)}</span>
                  </div>
                  {saleSuccessData.discountPaise > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-rose-600 font-semibold">
                      <span className="font-sans">Discount {saleSuccessData.discountPercent ? `(${saleSuccessData.discountPercent}%)` : ''}</span>
                      <span>-{formatPaise(saleSuccessData.discountPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 text-sm font-bold text-slate-900">
                    <span className="font-sans">Total Paid</span>
                    <span className="text-indigo-700">{formatPaise(saleSuccessData.totalPaise)}</span>
                  </div>
                  {saleSuccessData.grossProfitPaise !== undefined && (
                    <div className="flex justify-between items-center pt-1 text-xs text-emerald-700 font-semibold">
                      <span className="font-sans">Gross Profit</span>
                      <span>{formatPaise(saleSuccessData.grossProfitPaise)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sid = saleSuccessData.id;
                      onClose();
                      viewSaleDetails(sid);
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleSuccessData(null);
                      setSaleCart(products.length > 0 ? [{ productId: products[0].id, quantity: 1, customPriceRupees: null }] : []);
                      setSaleDiscountPercent(0);
                      setSaleFormError('');
                      setSaleRequiresConfirm(false);
                      setSaleProductSearchQuery('');
                      setTimeout(() => saleSearchInputRef.current?.focus(), 100);
                    }}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Sale</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* POS Cart Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <ShoppingCart className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">Record Customer Sale (POS)</h3>
                      <p className="text-xs text-slate-500">Multi-item checkout with editable selling prices & verified stock</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {saleCart.length > 0 && (
                      showClearCartConfirm ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl text-xs">
                          <span className="text-rose-700 font-medium">Clear cart?</span>
                          <button
                            type="button"
                            onClick={handleClearCart}
                            className="font-bold text-rose-700 hover:text-rose-900 underline ml-1"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowClearCartConfirm(false)}
                            className="text-slate-500 hover:text-slate-700 ml-1"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowClearCartConfirm(true)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 font-medium"
                          title="Clear Cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Clear Cart</span>
                        </button>
                      )
                    )}
                    <button
                      onClick={onClose}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCheckoutSale} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                  {saleFormError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{saleFormError}</span>
                    </div>
                  )}

                  {/* Product Search & Quick Add */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          ref={saleSearchInputRef}
                          type="text"
                          value={saleProductSearchQuery}
                          onChange={(e) => setSaleProductSearchQuery(e.target.value)}
                          placeholder="Search product by name or SKU to quick-add..."
                          className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                        {saleProductSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSaleProductSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCartRow}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition shrink-0 flex items-center gap-1"
                        title="Add first available product"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Row</span>
                      </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {saleProductSearchQuery.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {searchFilteredProducts.length === 0 ? (
                          <div className="p-3 text-center text-slate-400">
                            No products matching &ldquo;{saleProductSearchQuery}&rdquo;
                          </div>
                        ) : (
                          searchFilteredProducts.map((p) => {
                            const isOut = p.quantity <= 0;
                            const inCart = saleCart.some((c) => Number(c.productId) === Number(p.id));
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition ${
                                  isOut ? 'opacity-60' : ''
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {inCart && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-semibold">
                                        In Cart
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">SKU: {p.sku || 'N/A'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-900">{formatPaise(p.sellingPricePaise)}</div>
                                  <div className={`text-[10px] font-semibold ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                                    {isOut ? 'Out of Stock' : `Stock: ${p.quantity}`}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">
                        Cart Items ({cartCalculations.items.length})
                      </label>
                      {cartCalculations.anyPriceEdited && (
                        <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Custom prices active
                        </span>
                      )}
                    </div>

                    {cartCalculations.items.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">Your cart is empty</p>
                          <p className="text-slate-400 text-xs">Search for products above or choose a quick option to start.</p>
                        </div>
                        {products.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                            {products.slice(0, 4).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-700 text-xs transition"
                              >
                                + {p.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      cartCalculations.items.map((row, idx) => (
                        <div
                          key={idx}
                          className={`p-3 sm:p-3.5 rounded-xl border transition space-y-2.5 ${
                            row.isBelowCost
                              ? 'bg-rose-50/40 border-rose-200'
                              : row.isPriceEdited
                              ? 'bg-indigo-50/30 border-indigo-200'
                              : 'bg-slate-50/80 border-slate-200/80'
                          }`}
                        >
                          {/* Row Top: Product Select & Remove */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <select
                                value={row.productId}
                                onChange={(e) => handleCartItemChange(idx, 'productId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-indigo-500"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.quantity}) — Reg: {formatPaise(p.sellingPricePaise)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Row Middle: Quantity, Editable Price, Line Total */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            {/* Quantity Controls (4 cols) */}
                            <div className="sm:col-span-4 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, -1)}
                                disabled={row.quantity <= 1}
                                className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 rounded-lg flex items-center justify-center text-slate-600 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={row.availableStock}
                                value={row.quantity}
                                onChange={(e) => handleCartItemChange(idx, 'quantity', e.target.value)}
                                className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, 1)}
                                className="w-7 h-7 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <span className={`text-[10px] ml-1.5 font-medium ${row.isStockExceeded ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                / {row.availableStock}
                              </span>
                            </div>

                            {/* Editable Unit Price (5 cols) */}
                            <div className="sm:col-span-5">
                              <div className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.customPriceRupees !== null && row.customPriceRupees !== undefined ? row.customPriceRupees : (row.masterSellingPricePaise / 100).toFixed(2)}
                                    onChange={(e) => handleCustomPriceChange(idx, e.target.value)}
                                    placeholder={(row.masterSellingPricePaise / 100).toFixed(2)}
                                    className={`w-full pl-6 pr-2 py-1 bg-white border rounded-lg text-xs font-mono font-semibold transition ${
                                      row.isBelowCost
                                        ? 'border-rose-300 text-rose-700 bg-rose-50/20'
                                        : row.isPriceEdited
                                        ? 'border-indigo-300 text-indigo-900 bg-indigo-50/20'
                                        : 'border-slate-200 text-slate-800'
                                    }`}
                                  />
                                </div>
                                {row.isPriceEdited && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetItemPrice(idx)}
                                    className="px-1.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition flex items-center gap-0.5 shrink-0"
                                    title={`Reset to original price: ${formatPaise(row.masterSellingPricePaise)}`}
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>Reset</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                <span className="text-slate-400">Reg: {formatPaise(row.masterSellingPricePaise)}</span>
                                {row.isPriceEdited && (
                                  <span className="px-1 py-0.2 rounded text-[9px] bg-indigo-100 text-indigo-700 font-semibold">
                                    Custom
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Line Total (3 cols) */}
                            <div className="sm:col-span-3 text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-mono">Line Total</div>
                              <div className="font-mono font-bold text-sm text-slate-900">
                                {formatPaise(row.lineTotalPaise)}
                              </div>
                            </div>
                          </div>

                          {/* Below-Cost Warning Banner */}
                          {row.isBelowCost && (
                            <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 flex items-start gap-1.5 text-[11px] leading-tight">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Warning: Selling below purchase cost.</span> Expected loss: <span className="font-mono font-bold">₹{(row.lineLossPaise / 100).toFixed(2)}</span> ({formatPaise(row.unitLossPaise)} / unit).
                              </div>
                            </div>
                          )}

                          {/* Stock Exceeded Warning Banner */}
                          {row.isStockExceeded && (
                            <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 flex items-start gap-1.5 text-[11px] leading-tight">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Insufficient stock:</span> Requested {row.quantity} units, but only {row.availableStock} in stock.
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Percentage Discount Selector */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-teal-600" />
                        <span>Order Discount (%)</span>
                      </label>
                      {cartCalculations.discountPaise > 0 && (
                        <span className="font-mono font-bold text-rose-600 text-xs">
                          Saves {formatPaise(cartCalculations.discountPaise)} ({cartCalculations.discountPercent}%)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[0, 5, 10, 15, 20].map((preset) => {
                        const isActive = Number(saleDiscountPercent) === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setSaleDiscountPercent(preset);
                              if (saleRequiresConfirm) setSaleRequiresConfirm(false);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              isActive
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {preset === 0 ? 'None (0%)' : `${preset}%`}
                          </button>
                        );
                      })}
                      <div className="relative w-28 ml-auto">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={saleDiscountPercent}
                          onChange={(e) => {
                            setSaleDiscountPercent(e.target.value);
                            if (saleRequiresConfirm) setSaleRequiresConfirm(false);
                          }}
                          placeholder="Custom %"
                          className="w-full pr-6 pl-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="font-bold text-slate-800">Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash', icon: Banknote },
                        { id: 'UPI', label: 'UPI / Digital', icon: Wallet },
                        { id: 'CARD', label: 'Card', icon: CreditCard },
                        { id: 'OTHER', label: 'Other', icon: Receipt }
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = salePaymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => {
                              setSalePaymentMethod(pm.id);
                              try {
                                sessionStorage.setItem('stockpile_last_payment_method', pm.id);
                              } catch {}
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="font-semibold text-xs">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bill Financial Summary */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-600 font-sans">
                      <span>Subtotal ({cartCalculations.items.length} items):</span>
                      <span className="font-mono font-semibold">{formatPaise(cartCalculations.subtotalPaise)}</span>
                    </div>
                    {cartCalculations.discountPaise > 0 && (
                      <div className="flex justify-between text-rose-600 font-sans font-semibold">
                        <span>Discount ({cartCalculations.discountPercent}%):</span>
                        <span className="font-mono">-{formatPaise(cartCalculations.discountPaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold text-base pt-1.5 border-t border-slate-200 font-sans">
                      <span>Final Payable:</span>
                      <span className="font-mono text-indigo-700">{formatPaise(cartCalculations.finalTotalPaise)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] font-sans">
                      <div>
                        <span className="text-slate-400 block">Est. Cost of Goods (COGS)</span>
                        <span className="font-mono font-semibold text-slate-700">{formatPaise(cartCalculations.estimatedCogsPaise)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Est. Gross Profit</span>
                        <span className={`font-mono font-bold ${cartCalculations.estimatedGrossProfitPaise >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatPaise(cartCalculations.estimatedGrossProfitPaise)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Negative Gross Profit Banner */}
                  {cartCalculations.isNegativeProfit && (
                    <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        Warning: This sale will result in an estimated net loss of ₹{Math.abs(cartCalculations.estimatedGrossProfitPaise / 100).toFixed(2)}.
                      </span>
                    </div>
                  )}

                  {/* Confirmation Notice Step */}
                  {saleRequiresConfirm && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Confirmation Required:</span> This sale contains items priced below cost or discounts exceeding 20%. Click &ldquo;Confirm & Complete Sale&rdquo; below to confirm this transaction.
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submittingSale ||
                        cartCalculations.items.length === 0 ||
                        cartCalculations.hasStockExceededItem
                      }
                      className={`px-5 py-2.5 rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 ${
                        saleRequiresConfirm
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : cartCalculations.isNegativeProfit
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {submittingSale ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : saleRequiresConfirm ? (
                        <span>Confirm & Complete Sale</span>
                      ) : (
                        `Confirm & Pay ${formatPaise(cartCalculations.finalTotalPaise)}`
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
  );
}
