import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import {
  FileText,
  Plus,
  Printer,
  Calendar,
  Layers,
  TrendingUp,
  ShoppingCart,
  ShieldAlert,
  Truck,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  Download,
  Clock,
  AlertCircle,
  TrendingDown,
  ShoppingBag,
  Receipt,
  Info
} from 'lucide-react';
import PaginationBar from '../components/common/PaginationBar';
import { formatPaise, formatDateTime } from '../utils/formatters';

export default function Reports({
  reportPeriod,
  setReportPeriod,
  reportDate,
  setReportDate,
  reportMonth,
  setReportMonth,
  reportYear,
  setReportYear,
  reportFrom,
  setReportFrom,
  reportTo,
  setReportTo,
  reportSubTab,
  setReportSubTab,
  summaryReport,
  pnlReport,
  salesReport,
  lossReport,
  purchasesReport,
  expensesList = [],
  loadingReports,
  reportsError,
  setReportsError = () => {},
  expenseCategoryFilter,
  setExpenseCategoryFilter,
  expenseDateFrom,
  setExpenseDateFrom,
  expenseDateTo,
  setExpenseDateTo,
  expensesPage,
  setExpensesPage,
  expensesPageSize,
  setExpensesPageSize,
  openAddExpenseModal,
  openEditExpenseModal,
  confirmDeleteExpense,
  fetchReportsData,
  fetchAllReportData = fetchReportsData,
  handleExportCSV
}) {
  return (
            <div className="space-y-6">
              {/* Top Banner & Primary Actions */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Financial Reports & Business Analytics</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 tracking-wider uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Authoritative P&L statements, sales margins, inventory losses, operating expenses, and procurement ledger.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={openAddExpenseModal}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={!summaryReport || loadingReports}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={fetchAllReportData}
                    disabled={loadingReports}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Refresh reports"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin text-teal-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* REPORT PERIOD SELECTOR TOOLBAR */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Segmented Control */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-fit">
                    {[
                      { id: 'DAILY', label: 'Daily' },
                      { id: 'MONTHLY', label: 'Monthly' },
                      { id: 'YEARLY', label: 'Yearly' },
                      { id: 'CUSTOM', label: 'Custom' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setReportPeriod(p.id);
                          setReportsError('');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          reportPeriod === p.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Contextual Date Selectors */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {reportPeriod === 'DAILY' && (
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>Select Date:</span>
                        </label>
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {reportPeriod === 'MONTHLY' && (
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>Month & Year:</span>
                        </label>
                        <select
                          value={reportMonth}
                          onChange={(e) => setReportMonth(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {reportPeriod === 'YEARLY' && (
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>Calendar Year:</span>
                        </label>
                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {reportPeriod === 'CUSTOM' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">From:</span>
                          <input
                            type="date"
                            value={reportFrom}
                            onChange={(e) => setReportFrom(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">To:</span>
                          <input
                            type="date"
                            value={reportTo}
                            onChange={(e) => setReportTo(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Period & Timezone Summary Pill */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Period Window:</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 rounded-md font-mono text-slate-800 font-semibold">
                      {summaryReport?.from || '—'} to {summaryReport?.to || '—'}
                    </span>
                    <span className="text-slate-400">({summaryReport?.periodType || reportPeriod})</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3 h-3 text-teal-600" />
                      Asia/Kolkata (UTC+05:30)
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-600">Currency: INR (₹)</span>
                  </div>
                </div>

                {/* Error Banner */}
                {reportsError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{reportsError}</span>
                    </div>
                    <button
                      onClick={fetchAllReportData}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px]"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* 8 EXECUTIVE FINANCIAL METRIC CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Gross Sales */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Gross Sales
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 truncate">
                    {formatPaise(summaryReport?.grossSalesPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Pre-discount catalog total</p>
                </div>

                {/* 2. Discounts */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">
                    Discounts Given
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-amber-900 truncate">
                    {formatPaise(summaryReport?.discountsPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Promotions & customer savings</p>
                </div>

                {/* 3. Net Revenue */}
                <div className="p-4 bg-white rounded-2xl border border-teal-200/90 bg-teal-50/20 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-teal-800 font-bold uppercase tracking-wider">
                      Net Revenue
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                      Authoritative
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-teal-950 truncate">
                    {formatPaise(summaryReport?.netRevenuePaise || 0)}
                  </div>
                  <p className="text-[10px] text-teal-700">{summaryReport?.completedSalesCount || 0} completed orders</p>
                </div>

                {/* 4. Cost of Goods Sold */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Cost of Goods (COGS)
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 truncate">
                    {formatPaise(summaryReport?.cogsPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Procurement cost of sold items</p>
                </div>

                {/* 5. Gross Profit */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-wider">
                      Gross Profit
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      (summaryReport?.grossProfitPaise || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pnlReport?.grossMarginPercentage ?? '0.0'}% Margin
                    </span>
                  </div>
                  <div className={`text-lg sm:text-xl font-bold font-mono truncate ${
                    (summaryReport?.grossProfitPaise || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatPaise(summaryReport?.grossProfitPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Revenue minus product COGS</p>
                </div>

                {/* 6. Inventory Losses */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-rose-600 font-bold uppercase tracking-wider">
                    Inventory Losses
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 truncate">
                    {formatPaise(summaryReport?.inventoryLossPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{lossReport?.totalUnitsLost || 0} units lost / damaged</p>
                </div>

                {/* 7. Operating Expenses */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider">
                    Operating Expenses
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-purple-900 truncate">
                    {formatPaise(summaryReport?.operatingExpensesPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Rent, salaries & overheads</p>
                </div>

                {/* 8. Operating Result Before Tax */}
                <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                  (summaryReport?.operatingResultPaise || 0) >= 0
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Operating Result
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      (summaryReport?.operatingResultPaise || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pnlReport?.netMarginPercentage ?? '0.0'}% Net
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono truncate">
                    {formatPaise(summaryReport?.operatingResultPaise || 0)}
                  </div>
                  <p className="text-[10px] text-slate-500">Gross profit - losses - expenses</p>
                </div>
              </div>

              {/* REPORT SUB-TABS NAVIGATION */}
              <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs pb-1">
                {[
                  { id: 'overview', label: 'Executive P&L Statement', icon: FileText },
                  { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
                  { id: 'loss', label: 'Inventory Loss', icon: TrendingDown },
                  { id: 'purchasing', label: 'Purchasing & Procurement', icon: ShoppingBag },
                  { id: 'expenses', label: 'Operating Expenses', icon: Receipt }
                ].map((st) => {
                  const Icon = st.icon;
                  const active = reportSubTab === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setReportSubTab(st.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ========================================================
                  SUB-TAB 1: EXECUTIVE OVERVIEW & P&L STATEMENT
                 ======================================================== */}
              {reportSubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Financial Breakdown Performance Chart */}
                  {summaryReport?.breakdown && summaryReport.breakdown.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Performance Trend</h3>
                          <p className="text-xs text-slate-500">
                            {summaryReport.periodType === 'YEARLY'
                              ? '12-Month Fiscal Distribution'
                              : summaryReport.periodType === 'MONTHLY'
                              ? 'Daily Financial Progression'
                              : 'Period Comparison Timeline'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Net Revenue
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Gross Profit
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Expenses
                          </span>
                        </div>
                      </div>

                      <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={summaryReport.breakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                              dataKey="period"
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              tickLine={false}
                              axisLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#64748b' }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(val) => `₹${(val / 100).toLocaleString('en-IN')}`}
                            />
                            <Tooltip
                              formatter={(val, name) => [formatPaise(val), name]}
                              labelFormatter={(lbl) => `Period: ${lbl}`}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                            />
                            <Bar dataKey="netRevenuePaise" name="Net Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="grossProfitPaise" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="operatingExpensesPaise" name="Operating Expenses" fill="#9333ea" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* FORMAL PROFIT & LOSS STATEMENT */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Profit & Loss Statement (Operating)</h3>
                        <p className="text-xs text-slate-500">
                          Structured income & expenditure summary for {summaryReport?.from || '—'} to {summaryReport?.to || '—'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
                        Management Accounting
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
                      {/* 1. REVENUE SECTION */}
                      <div className="space-y-2 border-l-2 border-teal-500 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>1. Revenue</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 pl-2 text-xs">
                          <span>Gross Sales (Catalog Price)</span>
                          <span className="font-mono">{formatPaise(summaryReport?.grossSalesPaise || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-700 pl-2 text-xs">
                          <span>Less: Sales Discounts & Reductions</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.discountsPaise || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-teal-800 pt-1.5 border-t border-slate-100 pl-2">
                          <span>Net Revenue</span>
                          <span className="font-mono">{formatPaise(summaryReport?.netRevenuePaise || 0)}</span>
                        </div>
                      </div>

                      {/* 2. COST OF GOODS SOLD */}
                      <div className="space-y-2 border-l-2 border-slate-400 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>2. Cost of Goods Sold (COGS)</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 pl-2 text-xs">
                          <span>Direct Procurement Cost of Sold Inventory</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.cogsPaise || 0)}</span>
                        </div>
                      </div>

                      {/* 3. GROSS PROFIT */}
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between font-bold text-emerald-950">
                        <div>
                          <span>3. Gross Profit (Net Revenue − COGS)</span>
                          <span className="ml-2 px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-md text-[10px]">
                            {pnlReport?.grossMarginPercentage ?? '0.0'}% Gross Margin
                          </span>
                        </div>
                        <span className="font-mono text-base">{formatPaise(summaryReport?.grossProfitPaise || 0)}</span>
                      </div>

                      {/* 4. INVENTORY LOSSES */}
                      <div className="space-y-2 border-l-2 border-rose-400 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>4. Inventory Losses</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-rose-700 pl-2 text-xs">
                          <span>Physical Audit Discrepancies & Stock Adjustments</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.inventoryLossPaise || 0)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-2">
                          Derived strictly from negative adjustment logs and non-sale outflows.
                        </p>
                      </div>

                      {/* 5. OPERATING EXPENSES */}
                      <div className="space-y-2 border-l-2 border-purple-400 pl-4">
                        <div className="flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-xs">
                          <span>5. Operating Expenses (OPEX)</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-900 pl-2 text-xs">
                          <span>Total Recorded Overhead & Operating Expenses</span>
                          <span className="font-mono">-{formatPaise(summaryReport?.operatingExpensesPaise || 0)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-2">
                          Includes warehouse rent, staff salaries, utility bills, maintenance and other registered expenses.
                        </p>
                      </div>

                      {/* 6. FINAL OPERATING RESULT */}
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        (summaryReport?.operatingResultPaise || 0) >= 0
                          ? 'bg-emerald-100/70 border-emerald-200 text-emerald-950'
                          : 'bg-rose-100/70 border-rose-200 text-rose-950'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold">Operating Result Before Tax</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (summaryReport?.operatingResultPaise || 0) >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                            }`}>
                              {pnlReport?.netMarginPercentage ?? '0.0'}% Net Margin
                            </span>
                          </div>
                          <p className="text-xs opacity-80 mt-0.5">
                            Gross Profit ({formatPaise(summaryReport?.grossProfitPaise || 0)}) − Inventory Loss ({formatPaise(summaryReport?.inventoryLossPaise || 0)}) − Operating Expenses ({formatPaise(summaryReport?.operatingExpensesPaise || 0)})
                          </p>
                        </div>
                        <div className="font-mono text-xl sm:text-2xl font-bold">
                          {formatPaise(summaryReport?.operatingResultPaise || 0)}
                        </div>
                      </div>

                      {/* 7. PROCUREMENT CAPITALIZATION NOTE */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900">Procurement & Inventory Balance Note: </span>
                          <span>
                            Total purchases of {formatPaise(summaryReport?.totalPurchasesPaise || 0)} ({summaryReport?.purchaseOrdersCount || 0} purchase orders) occurred in this period. As per standard inventory accounting, purchase orders increase warehouse balance sheet assets and are not deducted as operating expenses.
                          </span>
                        </div>
                      </div>

                      {/* DISCLAIMER FOOTER */}
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center italic">
                        Note: This is a management-level operating report calculated from recorded system transactions. It does not constitute an audited statutory or tax statement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 2: SALES ANALYTICS
                 ======================================================== */}
              {reportSubTab === 'sales' && (
                <div className="space-y-6">
                  {/* Sales Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Average Order Value</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {formatPaise(salesReport?.averageOrderValuePaise || 0)}
                      </div>
                      <p className="text-[10px] text-slate-400">Net revenue / completed orders</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Completed Orders</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {salesReport?.completedSalesCount || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Excludes cancelled transactions</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Units Sold</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {salesReport?.unitsSold || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Across all product lines</p>
                    </div>
                  </div>

                  {/* Payment Method Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Payment Methods Breakdown</h3>
                    {salesReport?.paymentMethods && salesReport.paymentMethods.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {salesReport.paymentMethods.map((pm) => (
                          <div key={pm.paymentMethod} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 border border-slate-200 uppercase">
                                {pm.paymentMethod}
                              </span>
                              <p className="text-xs text-slate-500 mt-1">{pm.orderCount} transaction(s)</p>
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {formatPaise(pm.totalPaise)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No completed sales recorded in this period.</p>
                    )}
                  </div>

                  {/* Top Selling Products Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Top-Selling Products by Revenue</h3>
                      <span className="text-xs text-slate-500">Ranked by net sales volume</span>
                    </div>

                    {salesReport?.topSellingProducts && salesReport.topSellingProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">Product Name</th>
                              <th className="py-3 px-4">SKU</th>
                              <th className="py-3 px-4">Category</th>
                              <th className="py-3 px-4 text-center">Units Sold</th>
                              <th className="py-3 px-4 text-right">Revenue</th>
                              <th className="py-3 px-4 text-right">COGS</th>
                              <th className="py-3 px-4 text-right">Gross Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {salesReport.topSellingProducts.map((p, idx) => (
                              <tr key={p.productId || idx} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 px-4 font-bold text-slate-900">{p.productName}</td>
                                <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-bold font-mono">{p.unitsSold}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatPaise(p.totalRevenuePaise)}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatPaise(p.totalCostPaise)}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatPaise(p.grossProfitPaise)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No product sales recorded in the selected period.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 3: INVENTORY LOSS ANALYSIS
                 ======================================================== */}
              {reportSubTab === 'loss' && (
                <div className="space-y-6">
                  {/* Loss Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
                      <span className="text-xs text-rose-700 font-bold uppercase tracking-wider">Total Loss Value</span>
                      <div className="text-2xl font-bold font-mono text-rose-800">
                        {formatPaise(lossReport?.totalLossPaise || 0)}
                      </div>
                      <p className="text-[10px] text-slate-500">Valued at product purchase cost</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Units Lost</span>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {lossReport?.totalUnitsLost || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Missing, damaged, or expired stock</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Loss Incidents</span>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {lossReport?.incidentCount || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Recorded adjustment events</p>
                    </div>
                  </div>

                  {/* Accounting Policy Alert */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Loss Derivation & Surplus Accounting Rule:</p>
                      <p className="mt-0.5 text-amber-800">
                        Inventory losses are derived strictly from downward adjustments and non-sale outflows. Upward stock count reconciliations from physical audits are tracked separately as "Additional Inventory Found" and are never counted as revenue or operating profit.
                      </p>
                    </div>
                  </div>

                  {/* Incidents Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Inventory Loss Incidents</h3>
                      <span className="text-xs text-slate-500">{lossReport?.incidents?.length || 0} registered incidents</span>
                    </div>

                    {lossReport?.incidents && lossReport.incidents.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">ID</th>
                              <th className="py-3 px-4">Product Name</th>
                              <th className="py-3 px-4">SKU</th>
                              <th className="py-3 px-4 text-center">Units Lost</th>
                              <th className="py-3 px-4 text-right">Unit Cost</th>
                              <th className="py-3 px-4 text-right">Total Loss</th>
                              <th className="py-3 px-4">Reason / Audit Details</th>
                              <th className="py-3 px-4 text-right">Recorded Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lossReport.incidents.map((inc) => (
                              <tr key={inc.movementId} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 px-4 font-mono text-slate-500">#{inc.movementId}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">{inc.productName}</td>
                                <td className="py-3 px-4 font-mono text-slate-600">{inc.sku}</td>
                                <td className="py-3 px-4 text-center font-bold font-mono text-rose-700">-{inc.unitsLost}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatPaise(inc.unitCostPaise)}</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatPaise(inc.totalLossPaise)}</td>
                                <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{inc.reason || 'Manual Adjustment'}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-500">{formatDateTime(inc.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No inventory loss incidents registered in this period.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 4: PURCHASING & PROCUREMENT ANALYSIS
                 ======================================================== */}
              {reportSubTab === 'purchasing' && (
                <div className="space-y-6">
                  {/* Purchasing Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total POs Created</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {purchasesReport?.totalOrdersCount || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Excludes cancelled POs</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Procurement Spend</span>
                      <div className="text-xl font-bold font-mono text-teal-800">
                        {formatPaise(purchasesReport?.totalSpendPaise || 0)}
                      </div>
                      <p className="text-[10px] text-slate-400">Committed purchase value</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Units Ordered</span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {purchasesReport?.totalUnitsOrdered || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Gross purchase units</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Units Received</span>
                      <div className="text-xl font-bold font-mono text-emerald-700">
                        {purchasesReport?.totalUnitsReceived || 0}
                      </div>
                      <p className="text-[10px] text-slate-400">Delivered to warehouse</p>
                    </div>
                  </div>

                  {/* Supplier Spend Breakdown Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Supplier Procurement Breakdown</h3>
                      <span className="text-xs text-slate-500">Spend allocated per supplier</span>
                    </div>

                    {purchasesReport?.supplierBreakdown && purchasesReport.supplierBreakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">Supplier Name</th>
                              <th className="py-3 px-4 text-center">Orders Placed</th>
                              <th className="py-3 px-4 text-right">Total Procurement Spend</th>
                              <th className="py-3 px-4 text-right">Spend Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {purchasesReport.supplierBreakdown.map((s) => {
                              const share = purchasesReport.totalSpendPaise > 0
                                ? ((s.totalSpendPaise / purchasesReport.totalSpendPaise) * 100).toFixed(1)
                                : '0.0';
                              return (
                                <tr key={s.supplierId} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3 px-4 font-bold text-slate-900">{s.supplierName}</td>
                                  <td className="py-3 px-4 text-center font-bold font-mono">{s.orderCount}</td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatPaise(s.totalSpendPaise)}</td>
                                  <td className="py-3 px-4 text-right font-mono text-teal-700 font-semibold">{share}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No purchase orders registered in this reporting period.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  SUB-TAB 5: OPERATING EXPENSES (CRUD)
                 ======================================================== */}
              {reportSubTab === 'expenses' && (
                <div className="space-y-6">
                  {/* Expenses Action Header */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Filter by Category:</span>
                        <select
                          value={expenseCategoryFilter}
                          onChange={(e) => {
                            setExpenseCategoryFilter(e.target.value);
                            setExpensesPage(1);
                          }}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="ALL">All Categories</option>
                          {['Rent', 'Salaries', 'Utilities', 'Transport', 'Maintenance', 'Marketing', 'Other'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={openAddExpenseModal}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Expense</span>
                      </button>
                    </div>

                    {/* Expense Date Filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Expense Date:</span>
                      <input
                        type="date"
                        value={expenseDateFrom}
                        onChange={(e) => {
                          setExpenseDateFrom(e.target.value);
                          setExpensesPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={expenseDateTo}
                        onChange={(e) => {
                          setExpenseDateTo(e.target.value);
                          setExpensesPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {(expenseDateFrom || expenseDateTo) && (
                        <button
                          onClick={() => {
                            setExpenseDateFrom('');
                            setExpenseDateTo('');
                            setExpensesPage(1);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expenses Ledger Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Operating Expenses Ledger</h3>
                      <span className="text-xs text-slate-500">
                        {expensesList.filter(e => {
                          if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                          const d = (e.createdAt || e.created_at || '').slice(0, 10);
                          if (expenseDateFrom && d && d < expenseDateFrom) return false;
                          if (expenseDateTo && d && d > expenseDateTo) return false;
                          return true;
                        }).length} recorded items
                      </span>
                    </div>

                    {expensesList.filter(e => {
                      if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                      const d = (e.createdAt || e.created_at || '').slice(0, 10);
                      if (expenseDateFrom && d && d < expenseDateFrom) return false;
                      if (expenseDateTo && d && d > expenseDateTo) return false;
                      return true;
                    }).length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">ID</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {expensesList
                                .filter(e => {
                                  if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                                  const d = (e.createdAt || e.created_at || '').slice(0, 10);
                                  if (expenseDateFrom && d && d < expenseDateFrom) return false;
                                  if (expenseDateTo && d && d > expenseDateTo) return false;
                                  return true;
                                })
                                .slice((expensesPage - 1) * expensesPageSize, expensesPage * expensesPageSize)
                                .map((exp) => (
                                  <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                                    <td className="py-3 px-4 font-mono text-slate-500">#{exp.id}</td>
                                    <td className="py-3 px-4">
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                                        {exp.category}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-900">{exp.description || '—'}</td>
                                    <td className="py-3 px-4 font-mono text-slate-600">{formatDateTime(exp.createdAt)}</td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatPaise(exp.amountPaise)}</td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => openEditExpenseModal(exp)}
                                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                                          title="Edit Expense"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => confirmDeleteExpense(exp)}
                                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition"
                                          title="Delete Expense"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        <PaginationBar
                          currentPage={expensesPage}
                          totalRecords={
                            expensesList.filter(e => {
                              if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
                              const d = (e.createdAt || e.created_at || '').slice(0, 10);
                              if (expenseDateFrom && d && d < expenseDateFrom) return false;
                              if (expenseDateTo && d && d > expenseDateTo) return false;
                              return true;
                            }).length
                          }
                          pageSize={expensesPageSize}
                          onPageChange={setExpensesPage}
                          onPageSizeChange={(newSize) => {
                            setExpensesPageSize(newSize);
                            setExpensesPage(1);
                          }}
                        />
                      </>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No operating expenses found for the selected category.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
  );
}