import React from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  Eye,
  XCircle,
  RefreshCw
} from 'lucide-react';
import PaginationBar from '../components/common/PaginationBar';
import { formatPaise, formatDateTime } from '../utils/formatters';

export default function Sales({
  sales = [],
  loadingSales,
  salesStatusFilter,
  setSalesStatusFilter,
  salesDateFrom,
  setSalesDateFrom,
  salesDateTo,
  setSalesDateTo,
  salesPage,
  setSalesPage,
  salesPageSize,
  setSalesPageSize,
  salesMetrics,
  openNewSaleModal,
  viewSaleDetails,
  confirmCancelSale,
  fetchSalesData
}) {
  return (
            <div className="space-y-4 sm:space-y-5">
              {/* Top Sales KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Today's Sales</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                    {formatPaise(salesMetrics?.salesTodayPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{salesMetrics?.salesTodayCount ?? 0} orders today</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-slate-500 text-xs font-medium">This Month</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                    {formatPaise(salesMetrics?.salesMonthPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{salesMetrics?.salesMonthCount ?? 0} orders this month</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Total Lifetime Sales</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                    {formatPaise(salesMetrics?.totalSalesPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{salesMetrics?.totalSalesCount ?? 0} total sales</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-emerald-700 text-xs font-medium">Gross Profit</span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-800 font-mono">
                    {formatPaise(salesMetrics?.totalProfitPaise ?? 0)}
                  </div>
                  <p className="text-[10px] text-emerald-600">Total margin</p>
                </div>
              </div>

              {/* Action Bar & Status Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    {['ALL', 'COMPLETED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setSalesStatusFilter(st);
                          setSalesPage(1);
                          fetchSalesData(st);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          salesStatusFilter === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'ALL' ? 'All Sales' : st === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={openNewSaleModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs w-fit"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Record Customer Sale</span>
                  </button>
                </div>

                {/* Sales Date Filter */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Order Date:</span>
                  <input
                    type="date"
                    value={salesDateFrom}
                    onChange={(e) => {
                      setSalesDateFrom(e.target.value);
                      setSalesPage(1);
                    }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={salesDateTo}
                    onChange={(e) => {
                      setSalesDateTo(e.target.value);
                      setSalesPage(1);
                    }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  {(salesDateFrom || salesDateTo) && (
                    <button
                      onClick={() => {
                        setSalesDateFrom('');
                        setSalesDateTo('');
                        setSalesPage(1);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              </div>

              {/* Sales History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Sales Transaction Ledger ({sales.filter((s) => {
                      const d = (s.createdAt || s.created_at || '').slice(0, 10);
                      if (salesDateFrom && d && d < salesDateFrom) return false;
                      if (salesDateTo && d && d > salesDateTo) return false;
                      return true;
                    }).length} records)
                  </span>
                  <button
                    onClick={() => fetchSalesData()}
                    className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSales ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {sales.filter((s) => {
                  const d = (s.createdAt || s.created_at || '').slice(0, 10);
                  if (salesDateFrom && d && d < salesDateFrom) return false;
                  if (salesDateTo && d && d > salesDateTo) return false;
                  return true;
                }).length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No sales transactions found</p>
                    <p className="text-[11px]">Record your first sale to start tracking business revenue.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Items / Units</th>
                            <th className="py-3 px-4 text-right">Subtotal</th>
                            <th className="py-3 px-4 text-right">Discount</th>
                            <th className="py-3 px-4 text-right">Total Paid</th>
                            <th className="py-3 px-4 text-center">Payment</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sales
                            .filter((s) => {
                              const d = (s.createdAt || s.created_at || '').slice(0, 10);
                              if (salesDateFrom && d && d < salesDateFrom) return false;
                              if (salesDateTo && d && d > salesDateTo) return false;
                              return true;
                            })
                            .slice((salesPage - 1) * salesPageSize, salesPage * salesPageSize)
                            .map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                #SO-{s.id}
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {formatDateTime(s.createdAt)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-800">{s.itemCount} items</span>
                                <span className="text-[10px] text-slate-400 block">({s.totalQuantity} units)</span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-500">
                                {formatPaise(s.subtotalPaise)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-400">
                                {s.discountPaise > 0 ? (
                                  <span>
                                    -{formatPaise(s.discountPaise)}
                                    {s.discountPercent ? <span className="text-[10px] text-slate-400 block font-sans">({s.discountPercent}%)</span> : null}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {formatPaise(s.totalPaise)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {s.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    s.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800 line-through'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                <button
                                  onClick={() => viewSaleDetails(s.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition"
                                >
                                  Details
                                </button>
                                {s.status === 'COMPLETED' && (
                                  <button
                                    onClick={() => confirmCancelSale(s)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <PaginationBar
                      currentPage={salesPage}
                      totalRecords={
                        sales.filter((s) => {
                          const d = (s.createdAt || s.created_at || '').slice(0, 10);
                          if (salesDateFrom && d && d < salesDateFrom) return false;
                          if (salesDateTo && d && d > salesDateTo) return false;
                          return true;
                        }).length
                      }
                      pageSize={salesPageSize}
                      onPageChange={setSalesPage}
                      onPageSizeChange={(newSize) => {
                        setSalesPageSize(newSize);
                        setSalesPage(1);
                      }}
                    />
                  </>
                )}
              </div>
            </div>
  );
}