import React from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag,
  Search,
  Eye,
  ShoppingCart,
  XCircle,
  AlertCircle,
  Banknote,
  Info
} from 'lucide-react';
import { formatPaise, formatDateTime } from '../utils/formatters';

export default function SurplusStock({
  surplusSubTab,
  setSurplusSubTab,
  surplusSummary,
  surplusSuggestions = [],
  surplusListings = [],
  surplusStatusFilter,
  setSurplusStatusFilter,
  surplusSearch,
  setSurplusSearch,
  surplusCategoryFilter,
  setSurplusCategoryFilter,
  loadingSurplus,
  surplusError,
  handleOpenCreateSurplus,
  handleOpenSurplusSale,
  handleOpenCancelSurplus,
  handleOpenSurplusDetail,
  fetchSurplusData
}) {
  const uniqueCategories = React.useMemo(() => {
    return Array.from(new Set(surplusSuggestions.map((s) => s.category).filter(Boolean))).sort();
  }, [surplusSuggestions]);
  return (
            <div className="space-y-6">
              {/* Top Banner & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Boxes className="w-6 h-6 text-teal-600" />
                    <span>Surplus Stock Clearance</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Detect excess inventory, reserve stock for clearance deals, and track recovered capital without skewing regular sales margins.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCreateSurplus()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Clearance Listing</span>
                  </button>
                  <button
                    onClick={fetchSurplusData}
                    disabled={loadingSurplus}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition disabled:opacity-50"
                    title="Refresh Surplus Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingSurplus ? 'animate-spin text-teal-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Error banner if any */}
              {surplusError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{surplusError}</span>
                </div>
              )}

              {/* 6 Summary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Active Listings */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-300">Active Listings</span>
                    <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {surplusSummary ? (surplusSummary.activeListings ?? surplusSummary.activeListingsCount ?? 0) : 0}
                    </div>
                    <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">Live clearance campaigns</span>
                  </div>
                </div>

                {/* 2. Units Listed */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-300">Units Listed</span>
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {surplusSummary ? surplusSummary.totalUnitsListed : 0}
                    </div>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Total units committed</span>
                  </div>
                </div>

                {/* 3. Units Sold */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-300">Units Sold</span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {surplusSummary ? surplusSummary.totalUnitsSold : 0}
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Cleared to buyers</span>
                  </div>
                </div>

                {/* 4. Units Remaining */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-300">Units Remaining</span>
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {surplusSummary ? surplusSummary.totalUnitsRemaining : 0}
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Reserved in warehouse</span>
                  </div>
                </div>

                {/* 5. Recovered Revenue */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-300">Recovered Revenue</span>
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Banknote className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {formatPaise(surplusSummary ? (surplusSummary.totalSurplusSalesRevenuePaise ?? surplusSummary.totalSurplusRevenuePaise ?? 0) : 0)}
                    </div>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">Capital recovered</span>
                  </div>
                </div>

                {/* 6. Recovered Gross Profit */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-300">Surplus Profit</span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className={`text-xl font-black ${
                      (surplusSummary?.totalSurplusGrossProfitPaise || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatPaise(surplusSummary ? surplusSummary.totalSurplusGrossProfitPaise : 0)}
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-stone-300 font-semibold">Profit above cost</span>
                  </div>
                </div>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-stone-800 pb-3">
                <button
                  onClick={() => setSurplusSubTab('suggestions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    surplusSubTab === 'suggestions'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Surplus Suggestions</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    surplusSubTab === 'suggestions' ? 'bg-teal-700 text-white' : 'bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-stone-200 border border-slate-200 dark:border-stone-700'
                  }`}>
                    {surplusSuggestions.filter((s) => s.suggestedSurplusQuantity > 0 || s.salesActivity === 'SLOW_MOVING' || s.salesActivity === 'POTENTIAL_DEAD_STOCK').length}
                  </span>
                </button>

                <button
                  onClick={() => setSurplusSubTab('listings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    surplusSubTab === 'listings'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Clearance Listings</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    surplusSubTab === 'listings' ? 'bg-teal-700 text-white' : 'bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-stone-200 border border-slate-200 dark:border-stone-700'
                  }`}>
                    {surplusListings.length}
                  </span>
                </button>
              </div>

              {/* SUBTAB 1: SUGGESTIONS */}
              {surplusSubTab === 'suggestions' && (
                <div className="space-y-4">
                  {/* Informational Guidance Box */}
                  <div className="p-4 bg-teal-50 border border-teal-200 dark:bg-stone-900/90 dark:border-teal-800/80 rounded-2xl flex items-start gap-3 text-xs text-teal-950 dark:text-teal-100 shadow-xs">
                    <Info className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-teal-950 dark:text-teal-300">How Surplus Suggestions Work</p>
                      <p className="text-teal-900 dark:text-teal-100/90 leading-relaxed font-medium">
                        Surplus stock is determined by comparing physical on-hand inventory with configured preferred stock levels and 30-day sales velocity. Units exceeding target stock or items classified as <span className="font-bold text-teal-950 dark:text-teal-200 underline decoration-teal-400">Slow-Moving</span> or <span className="font-bold text-teal-950 dark:text-teal-200 underline decoration-teal-400">Potential Dead Stock</span> can be listed for clearance. When you create a clearance listing, those units are reserved so regular operations cannot oversell them.
                      </p>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600 dark:text-stone-300 text-[10px] uppercase">Category:</span>
                      <select
                        value={surplusCategoryFilter}
                        onChange={(e) => setSurplusCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl font-medium text-slate-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="ALL">All Categories</option>
                        {uniqueCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search product or SKU..."
                          value={surplusSearch}
                          onChange={(e) => setSurplusSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl text-xs text-slate-800 dark:text-stone-100 placeholder-slate-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 sm:w-64"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Suggestions Table */}
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-stone-800/80 border-b border-slate-200 dark:border-stone-700 text-[11px] font-bold text-slate-700 dark:text-stone-200 uppercase tracking-wider">
                            <th className="py-3 px-4">Product & SKU</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 text-center">Physical Stock</th>
                            <th className="py-3 px-4 text-center">Reserved</th>
                            <th className="py-3 px-4 text-center">Available</th>
                            <th className="py-3 px-4 text-center">Target Stock</th>
                            <th className="py-3 px-4 text-center">Suggested Surplus</th>
                            <th className="py-3 px-4">Velocity / Activity</th>
                            <th className="py-3 px-4">Recommendation</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                          {surplusSuggestions
                            .filter((s) => {
                              if (surplusCategoryFilter !== 'ALL' && s.category !== surplusCategoryFilter) return false;
                              if (surplusSearch.trim()) {
                                const q = surplusSearch.toLowerCase();
                                return (s.productName || '').toLowerCase().includes(q) || (s.sku || '').toLowerCase().includes(q);
                              }
                              return true;
                            })
                            .map((s) => (
                              <tr key={s.productId} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/50 transition">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 dark:text-stone-100">{s.productName}</div>
                                  <div className="text-[11px] font-mono text-slate-500 dark:text-stone-400">{s.sku}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-700 dark:text-stone-300 font-medium">
                                  {s.category || 'General'}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-stone-100">
                                  {s.currentQuantity}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-medium text-amber-700 dark:text-amber-400">
                                  {s.reservedQuantity > 0 ? `${s.reservedQuantity} reserved` : '—'}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-stone-100">
                                  {s.availableQuantity}
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-stone-400">
                                  {s.preferredStockLevel != null ? s.preferredStockLevel : '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {s.suggestedSurplusQuantity > 0 ? (
                                    <span className="inline-block px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 rounded-lg font-mono font-bold text-xs">
                                      +{s.suggestedSurplusQuantity} units
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 dark:text-stone-400 font-mono">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    s.salesActivity === 'HIGH_VELOCITY'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : s.salesActivity === 'REGULAR'
                                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                      : s.salesActivity === 'SLOW_MOVING'
                                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                      : s.salesActivity === 'POTENTIAL_DEAD_STOCK'
                                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300'
                                  }`}>
                                    {s.salesActivity?.replace(/_/g, ' ') || 'NO SALES'}
                                  </span>
                                  <div className="text-[10px] text-slate-500 dark:text-stone-400 mt-0.5 font-medium">
                                    {s.unitsSoldLast30Days} sold in 30d
                                  </div>
                                </td>
                                <td className="py-3 px-4 max-w-xs text-slate-700 dark:text-stone-300 leading-snug">
                                  {s.recommendationReason}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleOpenCreateSurplus(s, s.suggestedSurplusQuantity > 0 ? s.suggestedSurplusQuantity : s.availableQuantity)}
                                    disabled={s.availableQuantity <= 0}
                                    className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold rounded-xl transition text-[11px] disabled:opacity-40"
                                  >
                                    List Clearance
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {surplusSuggestions.length === 0 && (
                            <tr>
                              <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-stone-400">
                                <Boxes className="w-8 h-8 text-slate-400 dark:text-stone-500 mx-auto mb-2" />
                                <p className="font-semibold text-xs text-slate-700 dark:text-stone-200">No products currently available for surplus suggestions.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: CLEARANCE LISTINGS */}
              {surplusSubTab === 'listings' && (
                <div className="space-y-4">
                  {/* Listings Filter Bar */}
                  <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-600 dark:text-stone-300 text-[10px] uppercase mr-1">Status:</span>
                      {[
                        { id: '', label: 'All Listings' },
                        { id: 'ACTIVE', label: 'Active' },
                        { id: 'PARTIALLY_SOLD', label: 'Partially Sold' },
                        { id: 'SOLD_OUT', label: 'Sold Out' },
                        { id: 'CANCELLED', label: 'Cancelled' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSurplusStatusFilter(tab.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                            surplusStatusFilter === tab.id
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-50 dark:bg-stone-800 text-slate-700 dark:text-stone-200 hover:bg-slate-100 dark:hover:bg-stone-700 border border-slate-200 dark:border-stone-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search listing by product..."
                          value={surplusSearch}
                          onChange={(e) => setSurplusSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl text-xs text-slate-800 dark:text-stone-100 placeholder-slate-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 sm:w-64"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Listings Table */}
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-stone-800/80 border-b border-slate-200 dark:border-stone-700 text-[11px] font-bold text-slate-700 dark:text-stone-200 uppercase tracking-wider">
                            <th className="py-3 px-4">Listing & Product</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-center">Listed / Sold / Remaining</th>
                            <th className="py-3 px-4">Pricing & Discount</th>
                            <th className="py-3 px-4">Revenue Recovered</th>
                            <th className="py-3 px-4">Created Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {surplusListings
                            .filter((l) => {
                              if (surplusSearch.trim()) {
                                const q = surplusSearch.toLowerCase();
                                return (l.productName || '').toLowerCase().includes(q) || (l.sku || '').toLowerCase().includes(q);
                              }
                              return true;
                            })
                            .map((l) => {
                              const pctSold = l.quantityListed > 0 ? Math.round((l.quantitySold / l.quantityListed) * 100) : 0;
                              return (
                                <tr key={l.id} className="hover:bg-slate-50/60 transition">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-400 text-[11px]">#{l.id}</span>
                                      <span className="font-bold text-slate-900">{l.productName}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                      {l.sku} • {l.category || 'General'}
                                    </div>
                                    {l.notes && (
                                      <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                                        "{l.notes}"
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                      l.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : l.status === 'PARTIALLY_SOLD'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : l.status === 'SOLD_OUT'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {l.status?.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="font-mono text-xs font-bold text-slate-800">
                                      <span className="text-emerald-700">{l.quantitySold}</span> / {l.quantityListed}
                                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                                        ({l.quantityRemaining} remaining)
                                      </span>
                                    </div>
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full mx-auto mt-1.5 overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full rounded-full"
                                        style={{ width: `${pctSold}%` }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-teal-700 text-sm">
                                        {formatPaise(l.discountedUnitPricePaise ?? l.discountedSellingPricePaise)}
                                      </span>
                                      {(() => {
                                        const origPrice = l.regularUnitPricePaise ?? l.originalSellingPricePaise;
                                        const discPrice = l.discountedUnitPricePaise ?? l.discountedSellingPricePaise;
                                        return origPrice && origPrice > discPrice ? (
                                          <span className="font-mono line-through text-[11px] text-slate-400">
                                            {formatPaise(origPrice)}
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                    {l.discountPercentage != null && l.discountPercentage > 0 && (
                                      <span className="inline-block px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-[9px] rounded-md mt-0.5 border border-rose-100">
                                        {Math.round(l.discountPercentage)}% OFF
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-mono font-bold text-slate-900">
                                      {formatPaise(l.recoveredRevenuePaise ?? l.totalRealizedRevenuePaise ?? 0)}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium">
                                      +{formatPaise(l.grossProfitPaise ?? l.totalRealizedGrossProfitPaise ?? 0)} profit
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Potential: {formatPaise(
                                        l.totalPotentialRevenuePaise ??
                                        ((l.quantityListed || 0) * (l.discountedUnitPricePaise ?? l.discountedSellingPricePaise ?? 0))
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                                    {formatDateTime(l.createdAt)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Record Sale button */}
                                      {l.quantityRemaining > 0 && (l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD') && (
                                        <button
                                          onClick={() => handleOpenSurplusSale(l)}
                                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[11px] shadow-xs transition flex items-center gap-1"
                                        >
                                          <ShoppingCart className="w-3.5 h-3.5" />
                                          <span>Sell</span>
                                        </button>
                                      )}

                                      {/* Details button */}
                                      <button
                                        onClick={() => handleOpenSurplusDetail(l)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition"
                                      >
                                        Details
                                      </button>

                                      {/* Cancel button */}
                                      {(l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD') && (
                                        <button
                                          onClick={() => handleOpenCancelSurplus(l)}
                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-[11px] transition"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {surplusListings.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-medium text-xs">No clearance listings match this filter.</p>
                                <button
                                  onClick={() => handleOpenCreateSurplus()}
                                  className="mt-3 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition"
                                >
                                  Create First Clearance Listing
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
}