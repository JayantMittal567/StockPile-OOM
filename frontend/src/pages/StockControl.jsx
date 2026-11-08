import React from 'react';
import {
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  Scale,
  FileText,
  RefreshCw,
  ShieldAlert,
  X,
  Check,
  Edit3,
  Lock,
  Clock,
  TrendingDown
} from 'lucide-react';
import PaginationBar from '../components/common/PaginationBar';
import { formatPaise, formatDateTime, getKolkataToday } from '../utils/formatters';

export default function StockControl({
  stockControlSubTab,
  setStockControlSubTab,
  movements = [],
  loadingMovements,
  movementProductFilter,
  setMovementProductFilter,
  movementTypeFilter,
  setMovementTypeFilter,
  movementDateFrom,
  setMovementDateFrom,
  movementDateTo,
  setMovementDateTo,
  movementsPage,
  setMovementsPage,
  movementsPageSize,
  setMovementsPageSize,
  products = [],
  audits = [],
  auditSummary,
  loadingAudits,
  auditFilter,
  setAuditFilter,
  auditDateFrom,
  setAuditDateFrom,
  auditDateTo,
  setAuditDateTo,
  auditsPage,
  setAuditsPage,
  auditsPageSize,
  setAuditsPageSize,
  selectedAudit,
  setSelectedAudit = () => {},
  selectedAuditId,
  setSelectedAuditId = () => {},
  loadingSelectedAudit,
  auditItemSearch,
  setAuditItemSearch,
  auditItemFilter,
  setAuditItemFilter,
  openQuickActionModal,
  openStartAuditModal,
  selectAuditForView,
  openCountModal,
  openCompleteAuditModal,
  openCancelAuditModal,
  fetchMovementsData,
  fetchAuditsData,
  dashboard = null,
  quickActionForm = {},
  setQuickActionForm = () => {},
  submittingQuickAction = false,
  handleQuickActionSubmit = () => {}
}) {
  return (
            <div className="space-y-4 sm:space-y-5">
              {/* Subsection Selector */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockControlSubTab('movements')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      stockControlSubTab === 'movements'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Movement Ledger</span>
                  </button>

                  <button
                    onClick={() => setStockControlSubTab('adjustments')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      stockControlSubTab === 'adjustments'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Physical Adjustments</span>
                  </button>

                  <button
                    onClick={() => setStockControlSubTab('audits')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      stockControlSubTab === 'audits'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Stock Audits</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openQuickActionModal('RECEIVE')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Receive</span>
                  </button>
                  <button
                    onClick={() => openQuickActionModal('ADJUST')}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Adjust Count</span>
                  </button>
                </div>
              </div>

              {stockControlSubTab === 'movements' && (
                <div className="space-y-4">
                  {/* Movement Filters Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Type:</span>
                        {['', 'IN', 'OUT', 'ADJUSTMENT'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setMovementTypeFilter(type);
                              setMovementsPage(1);
                              fetchMovementsData(movementProductFilter, type);
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                              movementTypeFilter === type
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {type === '' ? 'All Types' : type === 'IN' ? 'Stock In' : type === 'OUT' ? 'Stock Out' : 'Adjustment'}
                          </button>
                        ))}
                      </div>

                      {products.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px] font-medium">Product:</span>
                          <select
                            value={movementProductFilter}
                            onChange={(e) => {
                              setMovementProductFilter(e.target.value);
                              setMovementsPage(1);
                              fetchMovementsData(e.target.value, movementTypeFilter);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="">All Catalog Products</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Movement Date Filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Movement Date:</span>
                      <input
                        type="date"
                        value={movementDateFrom}
                        onChange={(e) => {
                          setMovementDateFrom(e.target.value);
                          setMovementsPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={movementDateTo}
                        onChange={(e) => {
                          setMovementDateTo(e.target.value);
                          setMovementsPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {(movementDateFrom || movementDateTo) && (
                        <button
                          onClick={() => {
                            setMovementDateFrom('');
                            setMovementDateTo('');
                            setMovementsPage(1);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Movements Ledger Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {movements.filter((m) => {
                      const d = (m.createdAt || m.created_at || '').slice(0, 10);
                      if (movementDateFrom && d && d < movementDateFrom) return false;
                      if (movementDateTo && d && d > movementDateTo) return false;
                      return true;
                    }).length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                        <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No stock movements recorded</p>
                        <p className="text-[11px]">Inbound receipts, customer sales, and count reconciliations appear here.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">Log ID</th>
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4">Product</th>
                                <th className="py-3 px-4 text-center">Type</th>
                                <th className="py-3 px-4 text-right">Delta</th>
                                <th className="py-3 px-4 text-center">Stock Change</th>
                                <th className="py-3 px-4">Reason / Audit Trail</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {movements
                                .filter((m) => {
                                  const d = (m.createdAt || m.created_at || '').slice(0, 10);
                                  if (movementDateFrom && d && d < movementDateFrom) return false;
                                  if (movementDateTo && d && d > movementDateTo) return false;
                                  return true;
                                })
                                .slice((movementsPage - 1) * movementsPageSize, movementsPage * movementsPageSize)
                                .map((m) => (
                                <tr key={m.id || m.movementId} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-500">
                                    #{m.id || m.movementId}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500">
                                    {formatDateTime(m.createdAt)}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    {m.productName}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        m.movementType === 'IN'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : m.movementType === 'OUT'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {m.movementType}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold">
                                    <span
                                      className={
                                        m.movementType === 'IN'
                                          ? 'text-emerald-700'
                                          : m.movementType === 'OUT'
                                          ? 'text-rose-700'
                                          : 'text-amber-700'
                                      }
                                    >
                                      {m.movementType === 'IN' ? `+${m.quantity}` : m.movementType === 'OUT' ? `-${m.quantity}` : `=${m.newQuantity}`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                                    {m.previousQuantity} &rarr; <span className="font-bold text-slate-900">{m.newQuantity}</span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                                    {m.reason || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <PaginationBar
                          currentPage={movementsPage}
                          totalRecords={
                            movements.filter((m) => {
                              const d = (m.createdAt || m.created_at || '').slice(0, 10);
                              if (movementDateFrom && d && d < movementDateFrom) return false;
                              if (movementDateTo && d && d > movementDateTo) return false;
                              return true;
                            }).length
                          }
                          pageSize={movementsPageSize}
                          onPageChange={setMovementsPage}
                          onPageSizeChange={(newSize) => {
                            setMovementsPageSize(newSize);
                            setMovementsPage(1);
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {stockControlSubTab === 'adjustments' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Physical Stock Count Adjustment</h3>
                    <p className="text-xs text-slate-500">Reconcile physical inventory counts against system records</p>
                  </div>

                  <form onSubmit={handleQuickActionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Select Product</label>
                      <select
                        value={quickActionForm.productId}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, productId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Current: {p.quantity} units)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">New Physical Count</label>
                      <input
                        type="number"
                        min="0"
                        value={quickActionForm.quantity}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Adjustment Reason</label>
                      <select
                        value={quickActionForm.reason}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, reason: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Physical count reconciliation">Physical count reconciliation</option>
                        <option value="Damaged / broken goods">Damaged / broken goods</option>
                        <option value="Internal theft / shrinkage">Internal theft / shrinkage</option>
                        <option value="Discovered excess inventory">Discovered excess inventory</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuickAction}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>{submittingQuickAction ? 'Reconciling...' : 'Confirm Count Reconciliation'}</span>
                    </button>
                  </form>
                </div>
              )}

              {stockControlSubTab === 'audits' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* If an audit is selected, show AUDIT DETAILS VIEW */}
                  {selectedAuditId && selectedAudit ? (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Top Action Bar */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedAuditId(null);
                              setSelectedAudit(null);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-bold border border-slate-200"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Audits</span>
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                                Audit #AUD-{selectedAudit.id}
                              </h2>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  selectedAudit.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : selectedAudit.status === 'CANCELLED'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                }`}
                              >
                                {selectedAudit.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Created on {formatDateTime(selectedAudit.createdAt)}
                              {selectedAudit.completedAt && ` • Completed ${formatDateTime(selectedAudit.completedAt)}`}
                              {selectedAudit.cancelledAt && ` • Cancelled ${formatDateTime(selectedAudit.cancelledAt)}`}
                            </p>
                          </div>
                        </div>

                        {selectedAudit.status === 'OPEN' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openCancelAuditModal()}
                              className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel Audit</span>
                            </button>

                            <button
                              onClick={() => openCompleteAuditModal()}
                              disabled={selectedAudit.countedProducts < selectedAudit.totalProducts}
                              title={
                                selectedAudit.countedProducts < selectedAudit.totalProducts
                                  ? 'All products must have physical counts before completing'
                                  : 'Apply stock corrections and complete audit'
                              }
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                                selectedAudit.countedProducts >= selectedAudit.totalProducts
                                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Complete Audit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Audit Progress & Discrepancy KPI Bar */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Catalog Scope</p>
                          <p className="text-xl sm:text-2xl font-bold text-slate-900">{selectedAudit.totalProducts}</p>
                          <p className="text-[11px] text-slate-400">Total products in count</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Physical Progress</p>
                          <p className="text-xl sm:text-2xl font-bold text-teal-600">
                            {selectedAudit.countedProducts} / {selectedAudit.totalProducts}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {Math.round((selectedAudit.countedProducts / (selectedAudit.totalProducts || 1)) * 100)}% counted
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Discrepancies</p>
                          <p
                            className={`text-xl sm:text-2xl font-bold ${
                              selectedAudit.discrepancyCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {selectedAudit.discrepancyCount}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {selectedAudit.discrepancyCount > 0 ? 'Products with variances' : 'Zero variances'}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <p className="text-xs text-slate-500 font-medium">Audit Status</p>
                          <p className="text-xl sm:text-2xl font-bold text-slate-900 capitalize">
                            {selectedAudit.status.toLowerCase()}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {selectedAudit.status === 'OPEN'
                              ? 'Counting in progress'
                              : selectedAudit.status === 'COMPLETED'
                              ? 'Reconciled & closed'
                              : 'Cancelled'}
                          </p>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <ClipboardCheck className="w-4 h-4 text-teal-600" />
                            Counting Progress
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedAudit.countedProducts} of {selectedAudit.totalProducts} items recorded (
                            {Math.round((selectedAudit.countedProducts / (selectedAudit.totalProducts || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round(
                                (selectedAudit.countedProducts / (selectedAudit.totalProducts || 1)) * 100
                              )}%`
                            }}
                          />
                        </div>

                        {selectedAudit.notes && (
                          <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-slate-700">Audit Notes:</span> {selectedAudit.notes}
                          </p>
                        )}
                        {selectedAudit.cancellationReason && (
                          <p className="text-xs text-rose-600 pt-1 border-t border-slate-100 font-medium">
                            <span className="font-semibold">Cancellation Reason:</span> {selectedAudit.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Items Filter & Search Bar */}
                      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
                          <button
                            onClick={() => setAuditItemFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'ALL'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All ({selectedAudit.items?.length || 0})
                          </button>
                          <button
                            onClick={() => setAuditItemFilter('UNCOUNTED')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'UNCOUNTED'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Uncounted ({selectedAudit.items?.filter((i) => i.countedQuantity === null).length || 0})
                          </button>
                          <button
                            onClick={() => setAuditItemFilter('DISCREPANCIES')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'DISCREPANCIES'
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            Discrepancies ({selectedAudit.discrepancyCount || 0})
                          </button>
                          <button
                            onClick={() => setAuditItemFilter('MATCHED')}
                            className={`px-3 py-1.5 rounded-xl transition ${
                              auditItemFilter === 'MATCHED'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            Matched (
                            {selectedAudit.items?.filter(
                              (i) => i.countedQuantity !== null && i.variance === 0
                            ).length || 0}
                            )
                          </button>
                        </div>

                        <div className="relative min-w-[240px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search product or SKU..."
                            value={auditItemSearch}
                            onChange={(e) => setAuditItemSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Items List Table */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3 text-center">System Stock</th>
                                <th className="px-4 py-3 text-center">Physical Count</th>
                                <th className="px-4 py-3 text-center">Variance (Diff)</th>
                                <th className="px-4 py-3">Item Notes</th>
                                <th className="px-4 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {(selectedAudit.items || [])
                                .filter((item) => {
                                  const matchesSearch =
                                    !auditItemSearch.trim() ||
                                    item.productNameSnapshot
                                      .toLowerCase()
                                      .includes(auditItemSearch.toLowerCase()) ||
                                    item.skuSnapshot
                                      .toLowerCase()
                                      .includes(auditItemSearch.toLowerCase());
                                  if (!matchesSearch) return false;
                                  if (auditItemFilter === 'UNCOUNTED') return item.countedQuantity === null;
                                  if (auditItemFilter === 'DISCREPANCIES')
                                    return item.countedQuantity !== null && item.variance !== 0;
                                  if (auditItemFilter === 'MATCHED')
                                    return item.countedQuantity !== null && item.variance === 0;
                                  return true;
                                })
                                .map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                                      <p className="font-mono text-[11px] text-slate-500">{item.skuSnapshot}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-700">
                                      {item.systemQuantity} units
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">
                                      {item.countedQuantity !== null ? (
                                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                                          {item.countedQuantity} units
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                          Not Counted
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {item.countedQuantity === null ? (
                                        <span className="text-slate-400 font-medium">—</span>
                                      ) : item.variance === 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <Check className="w-3.5 h-3.5" />
                                          Match (0)
                                        </span>
                                      ) : item.variance < 0 ? (
                                        <span
                                          title={`${Math.abs(item.variance)} unit(s) missing during count`}
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                          -{Math.abs(item.variance)} Missing
                                        </span>
                                      ) : (
                                        <span
                                          title={`+${item.variance} extra unit(s) found during count`}
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                          +{item.variance} Extra
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                                      {item.itemNotes || <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {selectedAudit.status === 'OPEN' ? (
                                        <button
                                          onClick={() => openCountModal(item)}
                                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                                          <span>{item.countedQuantity !== null ? 'Edit Count' : 'Count'}</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 font-medium">
                                          <Lock className="w-3 h-3" />
                                          Locked
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* AUDIT OVERVIEW & HISTORY TABLE */
                    <div className="space-y-4 sm:space-y-6">
                      {/* Summary Statistics Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Open Audits</p>
                            <p className="text-xl sm:text-2xl font-bold text-teal-600">
                              {auditSummary?.openAudits ?? audits.filter((a) => a.status === 'OPEN').length}
                            </p>
                            <p className="text-[11px] text-slate-400">Active stock cycle counts</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Pending Discrepancies</p>
                            <p className="text-xl sm:text-2xl font-bold text-amber-600">
                              {auditSummary?.pendingDiscrepancies ??
                                audits
                                  .filter((a) => a.status === 'OPEN')
                                  .reduce((acc, a) => acc + (Number(a.productsWithDiscrepancies) || 0), 0)}
                            </p>
                            <p className="text-[11px] text-slate-400">In open audits awaiting count</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Loss Discovered Today</p>
                            <p className="text-xl sm:text-2xl font-bold text-rose-600">
                              {formatPaise(auditSummary?.inventoryLossTodayPaise ?? dashboard?.periodActivity?.inventoryLossPaise ?? 0)}
                            </p>
                            <p className="text-[11px] text-slate-400">From audits finalized today</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Completed This Month</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                              {auditSummary?.completedAuditsThisMonth ??
                                audits.filter(
                                  (a) =>
                                    a.status === 'COMPLETED' &&
                                    (a.completedAt || a.completed_at || '').startsWith(getKolkataToday().slice(0, 7))
                                ).length}
                            </p>
                            <p className="text-[11px] text-slate-400">Reconciled in current month</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Header with Status Filters, Date Filters & Actions */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
                            <button
                              onClick={() => {
                                setAuditFilter('OPEN');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'OPEN'
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Active Open ({audits.filter((a) => a.status === 'OPEN').length})
                            </button>
                            <button
                              onClick={() => {
                                setAuditFilter('COMPLETED');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'COMPLETED'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Completed ({audits.filter((a) => a.status === 'COMPLETED').length})
                            </button>
                            <button
                              onClick={() => {
                                setAuditFilter('CANCELLED');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'CANCELLED'
                                  ? 'bg-slate-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Cancelled ({audits.filter((a) => a.status === 'CANCELLED').length})
                            </button>
                            <button
                              onClick={() => {
                                setAuditFilter('ALL');
                                setAuditsPage(1);
                              }}
                              className={`px-3 py-1.5 rounded-xl transition ${
                                auditFilter === 'ALL'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              All Records ({audits.length})
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={fetchAuditsData}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                              title="Refresh Audits"
                            >
                              <RefreshCw className={`w-4 h-4 ${loadingAudits ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                              onClick={() => openStartAuditModal()}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Start New Audit</span>
                            </button>
                          </div>
                        </div>

                        {/* Date Range Filter Bar for Audit History */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                          <span className="text-[11px] font-semibold text-slate-400">Created Date:</span>
                          <input
                            type="date"
                            value={auditDateFrom}
                            onChange={(e) => {
                              setAuditDateFrom(e.target.value);
                              setAuditsPage(1);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="date"
                            value={auditDateTo}
                            onChange={(e) => {
                              setAuditDateTo(e.target.value);
                              setAuditsPage(1);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          {(auditDateFrom || auditDateTo) && (
                            <button
                              onClick={() => {
                                setAuditDateFrom('');
                                setAuditDateTo('');
                                setAuditsPage(1);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                            >
                              Clear Dates
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Audits History Table */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Physical Stock Audits Ledger</h3>
                            <p className="text-xs text-slate-500">History of cycle counts, discrepancy analyses, and reconciliation runs</p>
                          </div>
                        </div>

                        {loadingAudits ? (
                          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600" />
                            <p>Loading audit ledger records...</p>
                          </div>
                        ) : audits.filter((a) => {
                            if (auditFilter !== 'ALL' && a.status !== auditFilter) return false;
                            const d = (a.createdAt || a.created_at || '').slice(0, 10);
                            if (auditDateFrom && d && d < auditDateFrom) return false;
                            if (auditDateTo && d && d > auditDateTo) return false;
                            return true;
                          }).length === 0 ? (
                          <div className="p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                              <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">No Stock Audits Found</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              {auditFilter !== 'ALL'
                                ? `No audits found with status "${auditFilter}".`
                                : 'Start a physical count to verify on-hand warehouse inventory against system stock.'}
                            </p>
                            {auditFilter === 'ALL' && (
                              <button
                                onClick={() => openStartAuditModal()}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Start First Audit</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Audit ID</th>
                                    <th className="px-4 py-3">Created Date</th>
                                    <th className="px-4 py-3 text-center">Catalog Scope</th>
                                    <th className="px-4 py-3">Count Progress</th>
                                    <th className="px-4 py-3 text-center">Discrepancies</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {audits
                                    .filter((a) => {
                                      if (auditFilter !== 'ALL' && a.status !== auditFilter) return false;
                                      const d = (a.createdAt || a.created_at || '').slice(0, 10);
                                      if (auditDateFrom && d && d < auditDateFrom) return false;
                                      if (auditDateTo && d && d > auditDateTo) return false;
                                      return true;
                                    })
                                    .slice((auditsPage - 1) * auditsPageSize, auditsPage * auditsPageSize)
                                    .map((audit) => (
                                      <tr key={audit.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                          #AUD-{audit.id}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                          {formatDateTime(audit.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-slate-700">
                                          {audit.totalProducts} products
                                        </td>
                                        <td className="px-4 py-3 min-w-[140px]">
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                              <span>
                                                {audit.productsCounted} / {audit.totalProducts}
                                              </span>
                                              <span className="font-mono">
                                                {Math.round(
                                                  (audit.productsCounted / (audit.totalProducts || 1)) * 100
                                                )}
                                                %
                                              </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                              <div
                                                className="bg-teal-600 h-1.5 rounded-full"
                                                style={{
                                                  width: `${Math.round(
                                                    (audit.productsCounted / (audit.totalProducts || 1)) * 100
                                                  )}%`
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {audit.productsWithDiscrepancies > 0 ? (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                              {audit.productsWithDiscrepancies} variance
                                              {audit.productsWithDiscrepancies > 1 ? 's' : ''}
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50">
                                              0
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                              audit.status === 'COMPLETED'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : audit.status === 'CANCELLED'
                                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                : 'bg-teal-50 text-teal-700 border-teal-200'
                                            }`}
                                          >
                                            {audit.status}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <button
                                            onClick={() => selectAuditForView(audit)}
                                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
                                          >
                                            <ClipboardCheck className="w-3.5 h-3.5 text-teal-400" />
                                            <span>View Details</span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>

                            <PaginationBar
                              currentPage={auditsPage}
                              totalRecords={
                                audits.filter((a) => {
                                  if (auditFilter !== 'ALL' && a.status !== auditFilter) return false;
                                  const d = (a.createdAt || a.created_at || '').slice(0, 10);
                                  if (auditDateFrom && d && d < auditDateFrom) return false;
                                  if (auditDateTo && d && d > auditDateTo) return false;
                                  return true;
                                }).length
                              }
                              pageSize={auditsPageSize}
                              onPageChange={setAuditsPage}
                              onPageSizeChange={(newSize) => {
                                setAuditsPageSize(newSize);
                                setAuditsPage(1);
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
  );
}