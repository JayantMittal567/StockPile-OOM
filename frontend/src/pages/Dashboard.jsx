import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  Plus,
  ShoppingCart,
  Truck,
  ArrowDown,
  SlidersHorizontal,
  Activity,
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Tag,
  ClipboardCheck,
  IndianRupee,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  AlertOctagon,
  Percent,
  ShieldAlert,
  Clock,
  Receipt,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowUp
} from 'lucide-react';
import { formatPaise, formatDateTime } from '../utils/formatters';

export default function Dashboard({
  dashboard,
  loadingDashboard,
  products = [],
  purchaseOrders = [],
  overviewPeriod,
  setOverviewPeriod,
  overviewCustomFrom,
  setOverviewCustomFrom,
  overviewCustomTo,
  setOverviewCustomTo,
  onPeriodChange,
  fetchDashboardData,
  salesMetrics,
  salesTrend = [],
  salesIntelligence,
  attentionItems = [],
  setActiveTab,
  setStockControlSubTab = () => {},
  openAddProductModal,
  openNewSaleModal,
  openNewPoModal,
  openReceiveModal,
  openQuickActionModal
}) {
  return (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
                  <h2 className="text-sm font-bold text-slate-900">Dashboard Quick Actions</h2>
                  <p className="text-xs text-slate-500">Everyday operations at your fingertips</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                  <button
                    onClick={() => openAddProductModal()}
                    className="p-3 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-teal-600 text-white rounded-lg w-fit">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-teal-950">Add Product</p>
                      <p className="text-[10px] text-teal-700">Catalog entry</p>
                    </div>
                  </button>

                  <button
                    onClick={openNewSaleModal}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-indigo-600 text-white rounded-lg w-fit">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-indigo-950">Record Sale</p>
                      <p className="text-[10px] text-indigo-700">Customer POS</p>
                    </div>
                  </button>

                  <button
                    onClick={() => openNewPoModal()}
                    className="p-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-blue-600 text-white rounded-lg w-fit">
                      <Truck className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-blue-950">Create PO</p>
                      <p className="text-[10px] text-blue-700">Restock draft</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // If there is an ordered PO, open receive for it, else open fast intake
                      const pendingPo = purchaseOrders.find((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED');
                      if (pendingPo) {
                        openReceiveModal(pendingPo.id);
                      } else {
                        openQuickActionModal('RECEIVE');
                      }
                    }}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px]"
                  >
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg w-fit">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">Receive Stock</p>
                      <p className="text-[10px] text-emerald-700">Inbound intake</p>
                    </div>
                  </button>

                  <button
                    onClick={() => openQuickActionModal('ADJUST')}
                    className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 rounded-xl text-left transition flex flex-col justify-between gap-2 min-h-[82px] col-span-2 sm:col-span-1"
                  >
                    <span className="p-1.5 bg-amber-600 text-white rounded-lg w-fit">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-amber-950">Adjust Stock</p>
                      <p className="text-[10px] text-amber-700">Count audit</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 1: LIVE BUSINESS STATE (Always Reflects Current Database State) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-600" />
                      Live Business State
                    </h3>
                    <p className="text-xs text-slate-500">Real-time status of catalog, stock levels, orders, and audits</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Total Products */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Total Products</span>
                      <Package className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.liveState?.totalProducts ?? dashboard?.totalProducts ?? products.length}
                    </div>
                    <p className="text-[10px] text-slate-500">Catalog items</p>
                  </div>

                  {/* Total Physical Stock */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Total Physical Stock</span>
                      <Boxes className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.liveState?.totalQuantity ?? dashboard?.totalQuantity ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Physical units on hand</p>
                  </div>

                  {/* Current Inventory Value */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Current Inventory Value</span>
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPaise(dashboard?.liveState?.inventoryValuePaise ?? dashboard?.inventoryValuePaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Valued at purchase cost</p>
                  </div>

                  {/* Low Stock Items */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Low-Stock Products</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums flex items-center gap-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <span>{dashboard?.liveState?.lowStockCount ?? dashboard?.lowStockCount ?? 0}</span>
                      {(dashboard?.liveState?.lowStockCount > 0 || dashboard?.lowStockCount > 0) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded">
                          Low
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">At or below minimum level</p>
                  </div>

                  {/* Out of Stock Products */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Out-of-Stock Products</span>
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums flex items-center gap-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <span>{dashboard?.liveState?.outOfStockCount ?? dashboard?.outOfStockCount ?? 0}</span>
                      {(dashboard?.liveState?.outOfStockCount > 0 || dashboard?.outOfStockCount > 0) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                          Stockout
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Zero physical units</p>
                  </div>

                  {/* Active Surplus Listings */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Active Surplus Listings</span>
                      <Percent className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.liveState?.activeSurplusListings ?? dashboard?.summary?.activeSurplusListings ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Clearance listings</p>
                  </div>

                  {/* Pending Purchase Orders */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Pending Purchase Orders</span>
                      <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.liveState?.pendingPurchaseOrders ?? dashboard?.summary?.pendingPurchaseOrders ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Inbound restock orders</p>
                  </div>

                  {/* Open Stock Audits */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Open Stock Audits</span>
                      <ShieldAlert className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.liveState?.openStockAudits ?? dashboard?.summary?.openStockAudits ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Counts in progress</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERIOD-BASED ACTIVITY (Date-Based Operational Activity) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Period Activity
                    </h3>
                    <p className="text-xs text-slate-500">Operational performance calculated from actual transaction timestamps (Asia/Kolkata)</p>
                  </div>

                  {/* Period Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    {[
                      { id: 'TODAY', label: 'Today' },
                      { id: 'THIS_WEEK', label: 'This Week' },
                      { id: 'THIS_MONTH', label: 'This Month' },
                      { id: 'THIS_YEAR', label: 'This Year' },
                      { id: 'CUSTOM', label: 'Custom' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setOverviewPeriod(p.id);
                          if (p.id !== 'CUSTOM') {
                            fetchDashboardData(p.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          overviewPeriod === p.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Period Date Range Inputs */}
                {overviewPeriod === 'CUSTOM' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-600">Select Date Range:</span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">From:</label>
                      <input
                        type="date"
                        value={overviewCustomFrom}
                        onChange={(e) => setOverviewCustomFrom(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-400">To:</label>
                      <input
                        type="date"
                        value={overviewCustomTo}
                        onChange={(e) => setOverviewCustomTo(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                      />
                    </div>
                    <button
                      onClick={() => fetchDashboardData('CUSTOM', overviewCustomFrom, overviewCustomTo)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs transition"
                    >
                      Apply Range
                    </button>
                  </div>
                )}

                {/* 6 Period Activity Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Sales */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Sales</span>
                      <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPaise(dashboard?.periodActivity?.salesPaise ?? salesMetrics?.salesTodayPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.periodActivity?.completedSalesCount ?? salesMetrics?.salesTodayCount ?? 0} orders
                    </p>
                  </div>

                  {/* Gross Profit */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Gross Profit</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono tabular-nums truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPaise(dashboard?.periodActivity?.grossProfitPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Revenue minus COGS</p>
                  </div>

                  {/* Units Sold */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Units Sold</span>
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.periodActivity?.unitsSold ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Quantity delivered</p>
                  </div>

                  {/* Expenses */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Expenses</span>
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-amber-800 font-mono tabular-nums truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPaise(dashboard?.periodActivity?.expensesPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Operating costs</p>
                  </div>

                  {/* Discovered Losses */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Loss Discovered</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-rose-700 font-mono tabular-nums truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPaise(dashboard?.periodActivity?.inventoryLossPaise ?? 0)}
                    </div>
                    <p className="text-[10px] text-slate-500">Audits & write-downs</p>
                  </div>

                  {/* Discrepancies Discovered */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Discrepancies</span>
                      <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.periodActivity?.discrepanciesCount ?? 0}
                    </div>
                    <p className="text-[10px] text-slate-500">Variances identified</p>
                  </div>
                </div>
              </div>

              {/* Needs Your Attention (Actionable Alerts Section) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">Needs Your Attention</h3>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {attentionItems.length} items
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Click to action immediately</span>
                </div>

                {attentionItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700">All Operations Clear</p>
                    <p className="text-[11px] text-slate-400">No stockouts, overdue POs, or dead stock detected.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {attentionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          item.urgency === 'high'
                            ? 'bg-rose-50/70 border-rose-200'
                            : item.urgency === 'medium'
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (item.type === 'PO_ORDERED' || item.type === 'PO_PARTIAL') {
                              openReceiveModal(item.poId);
                            } else if (item.type === 'OUT_OF_STOCK' || item.type === 'LOW_STOCK') {
                              openNewPoModal(item.productId, item.preferredSupplierId);
                            } else {
                              setActiveTab('insights');
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] shrink-0 transition flex items-center gap-1 shadow-2xs ${
                            item.urgency === 'high'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : item.urgency === 'medium'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-slate-800 hover:bg-slate-900 text-white'
                          }`}
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales Summary & Trend Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart (2 columns) */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        Sales Performance (Last 14 Days)
                      </h3>
                      <p className="text-xs text-slate-500">Real transaction volume by day</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        Month: {formatPaise(salesMetrics?.salesMonthPaise ?? 0)}
                      </span>
                      <p className="text-[10px] text-slate-400 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {salesMetrics?.salesMonthCount ?? 0} total sales
                      </p>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-2 chart-enter-animate">
                    {salesTrend.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-slate-300 mb-1" />
                        <span>No completed sales in the last 14 days</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="saleDate"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={(v) => `₹${v / 100}`}
                          />
                          <Tooltip
                            formatter={(val) => [formatPaise(val), 'Revenue']}
                            labelFormatter={(lbl) => `Date: ${lbl}`}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          />
                          <Bar
                            dataKey="totalPaise"
                            fill="#4f46e5"
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={true}
                            animationDuration={380}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Sales Snapshot Card (1 column) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Sales Snapshot</h3>
                    <p className="text-xs text-slate-500 mb-3">Live verified financial analytics</p>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">Today's Revenue</span>
                        <span className="font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPaise(salesMetrics?.salesTodayPaise ?? 0)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">This Month's Revenue</span>
                        <span className="font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPaise(salesMetrics?.salesMonthPaise ?? 0)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                        <span className="text-emerald-800 font-medium">Cumulative Gross Profit</span>
                        <span className="font-bold text-emerald-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPaise(salesMetrics?.totalProfitPaise ?? 0)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">Completed Orders</span>
                        <span className="font-bold text-slate-900 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {salesMetrics?.totalSalesCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('sales')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition text-center"
                  >
                    View Sales & Orders Table &rarr;
                  </button>
                </div>
              </div>

              {/* Category Breakdown & Top Selling Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Bar Chart */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Inventory by Category</h3>
                      <p className="text-xs text-slate-500">Unit stock distribution</p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {dashboard?.categoryBreakdown?.length || 0} categories
                    </span>
                  </div>

                  <div className="h-56 w-full pt-2 chart-enter-animate">
                    {dashboard?.categoryBreakdown?.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No categories found
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboard?.categoryBreakdown || []}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip
                            formatter={(value) => [`${value} units`, 'Quantity']}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          />
                          <Bar
                            dataKey="totalQuantity"
                            fill="#0d9488"
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={true}
                            animationDuration={380}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Top-Selling Products (Last 30 Days)
                      </h3>
                      <p className="text-xs text-slate-500">Ranked by actual unit sales</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('insights')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      All Insights &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {salesIntelligence?.summary?.fastSellingProducts?.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No sales recorded during the last 30 days
                      </div>
                    ) : (
                      salesIntelligence?.summary?.fastSellingProducts?.map((prod, idx) => (
                        <div
                          key={prod.productId}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{prod.productName}</p>
                              <p className="text-[10px] text-slate-400">
                                SKU: {prod.sku} | In Stock: {prod.currentQuantity} units
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-indigo-700 font-mono tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {prod.unitsSoldLast30Days} sold
                            </span>
                            <p className="text-[10px] text-slate-400 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{prod.averageDailySalesLast30Days} / day</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Pending Purchase Orders & Products Needing Restock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending POs */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pending Purchase Orders</h3>
                      <p className="text-xs text-slate-500">Orders placed or awaiting arrival</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('purchasing')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Manage Orders &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {purchaseOrders.filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED').length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No pending purchase orders awaiting delivery
                      </div>
                    ) : (
                      purchaseOrders
                        .filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED')
                        .slice(0, 4)
                        .map((po) => (
                          <div
                            key={po.id}
                            className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">PO #{po.id}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    po.status === 'ORDERED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {po.status === 'ORDERED' ? 'Placed' : 'Partially Recv'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">Vendor: {po.supplierName}</p>
                              <p className="text-[10px] text-slate-400">
                                {po.totalQuantityReceived}/{po.totalQuantityOrdered} units | {formatPaise(po.totalAmountPaise)}
                              </p>
                            </div>
                            <button
                              onClick={() => openReceiveModal(po.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition"
                            >
                              Receive
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Restock Recommendations */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Restock Recommendations</h3>
                      <p className="text-xs text-slate-500">Products at or below low-stock limit</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('insights')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Insights &rarr;
                    </button>
                  </div>

                  <div className="space-y-2">
                    {salesIntelligence?.products?.filter((p) => p.currentQuantity <= p.lowStockLevel).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        All product inventory is comfortably stocked
                      </div>
                    ) : (
                      salesIntelligence?.products
                        ?.filter((p) => p.currentQuantity <= p.lowStockLevel)
                        .slice(0, 4)
                        .map((prod) => (
                          <div
                            key={prod.productId}
                            className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{prod.productName}</p>
                              <p className="text-[11px] text-slate-600">
                                Stock: <span className="font-bold text-rose-700">{prod.currentQuantity}</span> / Alert: {prod.lowStockLevel}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Preferred Target: {prod.preferredStockLevel || 'Not set'}
                              </p>
                            </div>
                            <button
                              onClick={() => openNewPoModal(prod.productId, null, prod.recommendedRestockQuantity || 10)}
                              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Order {prod.recommendedRestockQuantity || 10}</span>
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity Ledger */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Inventory Movements</h3>
                    <p className="text-xs text-slate-500">Live transaction history</p>
                  </div>
                  <button
                    onClick={() => {
                      setStockControlSubTab('movements');
                      setActiveTab('stock-control');
                    }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Full Ledger &rarr;
                  </button>
                </div>

                <div className="space-y-2">
                  {dashboard?.recentMovements?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No recent inventory movements
                    </div>
                  ) : (
                    dashboard?.recentMovements?.map((m) => (
                      <div
                        key={m.id || m.movementId}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`p-1.5 rounded-lg text-white shrink-0 ${
                              m.movementType === 'IN'
                                ? 'bg-emerald-600'
                                : m.movementType === 'OUT'
                                ? 'bg-indigo-600'
                                : 'bg-amber-600'
                            }`}
                          >
                            {m.movementType === 'IN' ? (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ) : m.movementType === 'OUT' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{m.productName}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {m.reason || 'Routine movement'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              m.movementType === 'IN'
                                ? 'text-emerald-700'
                                : m.movementType === 'OUT'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {m.movementType === 'IN' ? `+${m.quantity}` : m.movementType === 'OUT' ? `-${m.quantity}` : `=${m.newQuantity}`}
                          </span>
                          <p className="text-[10px] text-slate-400 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
  );
}