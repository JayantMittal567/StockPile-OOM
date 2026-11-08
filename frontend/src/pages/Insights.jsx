import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Package,
  Plus,
  Clock,
  ArrowUpRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { formatPaise } from '../utils/formatters';

export default function Insights({
  salesIntelligence,
  loadingIntelligence,
  intelFilter,
  setIntelFilter,
  fetchIntelligenceData,
  openNewPoModal
}) {
  return (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Box */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Sales-Based Inventory Intelligence
                  </h2>
                  <p className="text-xs text-slate-500">
                    Velocity analytics, dead stock detection, and calculated restock recommendations based on real completed sales
                  </p>
                </div>

                <button
                  onClick={fetchIntelligenceData}
                  disabled={loadingIntelligence}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 w-fit"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingIntelligence ? 'animate-spin' : ''}`} />
                  <span>Refresh Insights</span>
                </button>
              </div>

              {/* 5 Real Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => setIntelFilter('FAST_SELLING')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'FAST_SELLING'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Fast Selling
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.fastSellingProducts?.length ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">Top sellers</span>
                </button>

                <button
                  onClick={() => setIntelFilter('SLOW_MOVING')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'SLOW_MOVING'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Slow Moving
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.slowMovingProducts ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">&gt; 30d since sale</span>
                </button>

                <button
                  onClick={() => setIntelFilter('POTENTIAL_DEAD_STOCK')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'POTENTIAL_DEAD_STOCK'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Dead Stock
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.potentialDeadStockProducts ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">&gt; 45d without sales</span>
                </button>

                <button
                  onClick={() => setIntelFilter('OUT_OF_STOCK')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    intelFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Out of Stock
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.outOfStockProducts ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">0 stock left</span>
                </button>

                <button
                  onClick={() => setIntelFilter('NEEDING_RESTOCK')}
                  className={`p-3.5 rounded-2xl border text-left transition col-span-2 sm:col-span-1 ${
                    intelFilter === 'NEEDING_RESTOCK'
                      ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                    Need Restock
                  </span>
                  <span className="text-xl font-bold font-mono">
                    {salesIntelligence?.summary?.productsNeedingRestock ?? 0}
                  </span>
                  <span className="text-[10px] block opacity-75">Below alert level</span>
                </button>
              </div>

              {/* Intelligence Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Product Intelligence Portfolio ({salesIntelligence?.products?.length ?? 0} items)
                    </span>
                    {intelFilter !== 'ALL' && (
                      <button
                        onClick={() => setIntelFilter('ALL')}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700"
                      >
                        (Clear Filter)
                      </button>
                    )}
                  </div>
                </div>

                {!salesIntelligence?.products || salesIntelligence.products.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No intelligence records available. Add products to catalog.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4 text-center">Stock / Thresholds</th>
                          <th className="py-3 px-4 text-center">Velocity (30d)</th>
                          <th className="py-3 px-4 text-center">Activity</th>
                          <th className="py-3 px-4 text-center">Sales Trend</th>
                          <th className="py-3 px-4">Recommendation</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesIntelligence.products
                          .filter((p) => {
                            if (intelFilter === 'FAST_SELLING') return p.unitsSoldLast30Days > 0;
                            if (intelFilter === 'SLOW_MOVING') return p.salesActivity === 'SLOW_MOVING';
                            if (intelFilter === 'POTENTIAL_DEAD_STOCK') return p.salesActivity === 'POTENTIAL_DEAD_STOCK';
                            if (intelFilter === 'OUT_OF_STOCK') return p.salesActivity === 'OUT_OF_STOCK';
                            if (intelFilter === 'NEEDING_RESTOCK') return p.currentQuantity <= p.lowStockLevel;
                            return true;
                          })
                          .map((p) => (
                            <tr key={p.productId} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{p.productName}</p>
                                <span className="font-mono text-[10px] text-slate-400">{p.sku} | {p.category}</span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-[11px]">
                                <span className={`font-bold ${p.currentQuantity === 0 ? 'text-rose-600' : p.currentQuantity <= p.lowStockLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {p.currentQuantity} units
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Alert: {p.lowStockLevel} | Target: {p.preferredStockLevel || '—'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold text-indigo-700 font-mono">
                                  {p.unitsSoldLast30Days} units
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  ({p.averageDailySalesLast30Days} / day)
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.salesActivity === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.salesActivity === 'OUT_OF_STOCK'
                                      ? 'bg-rose-100 text-rose-800'
                                      : p.salesActivity === 'SLOW_MOVING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : p.salesActivity === 'POTENTIAL_DEAD_STOCK'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {p.salesActivity}
                                </span>
                                {p.daysSinceLastSale != null && (
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    {p.daysSinceLastSale}d since sale
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.salesTrend === 'INCREASING'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.salesTrend === 'DECREASING'
                                      ? 'bg-rose-100 text-rose-800'
                                      : p.salesTrend === 'NEW_SALES'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {p.salesTrend}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs">
                                {p.recommendation}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {p.currentQuantity <= p.lowStockLevel ? (
                                  <button
                                    onClick={() => openNewPoModal(p.productId, null, p.recommendedRestockQuantity || 10)}
                                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Create PO</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-700 font-semibold">Healthy</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
  );
}