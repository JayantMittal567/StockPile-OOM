import React from 'react';
import {
  ShoppingBag,
  Users,
  Plus,
  Search,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Package,
  RefreshCw,
  Truck,
  ArrowRight
} from 'lucide-react';
import PaginationBar from '../components/common/PaginationBar';
import { formatPaise, formatDateTime } from '../utils/formatters';

export default function Purchasing({
  purchasingSubTab,
  setPurchasingSubTab,
  purchaseOrders = [],
  loadingPurchaseOrders,
  poStatusFilter,
  setPoStatusFilter,
  poSupplierFilter,
  setPoSupplierFilter,
  poDateFrom,
  setPoDateFrom,
  poDateTo,
  setPoDateTo,
  poPage,
  setPoPage,
  poPageSize,
  setPoPageSize,
  suppliers = [],
  loadingSuppliers,
  supplierSearch,
  setSupplierSearch,
  openNewPoModal,
  handlePlaceOrder,
  openReceiveModal,
  confirmCancelPo,
  viewPoDetails,
  openAddSupplierModal,
  openEditSupplierModal,
  confirmDeleteSupplier,
  viewSupplierProducts,
  fetchPurchaseOrdersData,
  fetchSuppliersData
}) {
  return (
            <div className="space-y-4 sm:space-y-5">
              {/* Subsection Selector */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPurchasingSubTab('orders')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      purchasingSubTab === 'orders'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Purchase Orders ({purchaseOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setPurchasingSubTab('suppliers')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      purchasingSubTab === 'suppliers'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Suppliers Directory ({suppliers.length})</span>
                  </button>
                </div>

                {purchasingSubTab === 'orders' ? (
                  <button
                    onClick={() => openNewPoModal()}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Purchase Order</span>
                  </button>
                ) : (
                  <button
                    onClick={openAddSupplierModal}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Supplier</span>
                  </button>
                )}
              </div>

              {/* SUBSECTION A: PURCHASE ORDERS */}
              {purchasingSubTab === 'orders' && (
                <div className="space-y-4">
                  {/* Status Filters Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-400 text-[10px] uppercase mr-1">Status:</span>
                        {['ALL', 'ACTIVE', 'DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              setPoStatusFilter(st);
                              setPoPage(1);
                              fetchPurchaseOrdersData(st === 'ACTIVE' ? '' : st, poSupplierFilter);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              poStatusFilter === st
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st === 'ALL'
                              ? 'All'
                              : st === 'ACTIVE'
                              ? 'Active Only'
                              : st === 'DRAFT'
                              ? 'Drafts'
                              : st === 'ORDERED'
                              ? 'Ordered'
                              : st === 'PARTIALLY_RECEIVED'
                              ? 'Partial'
                              : st === 'RECEIVED'
                              ? 'Received'
                              : 'Cancelled'}
                          </button>
                        ))}
                      </div>

                      {suppliers.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">Vendor:</span>
                          <select
                            value={poSupplierFilter}
                            onChange={(e) => {
                              setPoSupplierFilter(e.target.value);
                              setPoPage(1);
                              fetchPurchaseOrdersData(poStatusFilter === 'ACTIVE' ? '' : poStatusFilter, e.target.value);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="">All Suppliers</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* PO Date Range Filter */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Order Date:</span>
                      <input
                        type="date"
                        value={poDateFrom}
                        onChange={(e) => {
                          setPoDateFrom(e.target.value);
                          setPoPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={poDateTo}
                        onChange={(e) => {
                          setPoDateTo(e.target.value);
                          setPoPage(1);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {(poDateFrom || poDateTo) && (
                        <button
                          onClick={() => {
                            setPoDateFrom('');
                            setPoDateTo('');
                            setPoPage(1);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Purchase Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {purchaseOrders.filter((po) => {
                      if (poStatusFilter === 'ACTIVE' && (po.status === 'RECEIVED' || po.status === 'CANCELLED')) return false;
                      const d = (po.createdAt || po.created_at || '').slice(0, 10);
                      if (poDateFrom && d && d < poDateFrom) return false;
                      if (poDateTo && d && d > poDateTo) return false;
                      return true;
                    }).length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">No purchase orders found</p>
                        <p className="text-[11px]">Draft a purchase order to replenish inventory with your suppliers.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">PO Number</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Total Amount</th>
                                <th className="py-3 px-4 text-center">Fulfillment</th>
                                <th className="py-3 px-4">Timeline</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {purchaseOrders
                                .filter((po) => {
                                  if (poStatusFilter === 'ACTIVE' && (po.status === 'RECEIVED' || po.status === 'CANCELLED')) return false;
                                  const d = (po.createdAt || po.created_at || '').slice(0, 10);
                                  if (poDateFrom && d && d < poDateFrom) return false;
                                  if (poDateTo && d && d > poDateTo) return false;
                                  return true;
                                })
                                .slice((poPage - 1) * poPageSize, poPage * poPageSize)
                                .map((po) => (
                                <tr key={po.id} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                    #PO-{po.id}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-800">
                                    {po.supplierName}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        po.status === 'DRAFT'
                                          ? 'bg-slate-100 text-slate-700'
                                          : po.status === 'ORDERED'
                                          ? 'bg-blue-100 text-blue-800'
                                          : po.status === 'PARTIALLY_RECEIVED'
                                          ? 'bg-amber-100 text-amber-800'
                                          : po.status === 'RECEIVED'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800 line-through'
                                      }`}
                                    >
                                      {po.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                    {formatPaise(po.totalAmountPaise)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="font-mono text-[11px] font-bold text-slate-800">
                                        {po.totalQuantityReceived} / {po.totalQuantityOrdered} units
                                      </span>
                                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                        <div
                                          className="bg-teal-600 h-1.5 rounded-full"
                                          style={{
                                            width: `${
                                              po.totalQuantityOrdered > 0
                                                ? (po.totalQuantityReceived / po.totalQuantityOrdered) * 100
                                                : 0
                                            }%`
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[10px] text-slate-400">
                                    <div>Created: {formatDateTime(po.createdAt)}</div>
                                    {po.placedAt && <div>Placed: {formatDateTime(po.placedAt)}</div>}
                                    {po.receivedAt && <div>Received: {formatDateTime(po.receivedAt)}</div>}
                                  </td>
                                  <td className="py-3 px-4 text-right space-x-1">
                                    <button
                                      onClick={() => viewPoDetails(po.id)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                                    >
                                      Details
                                    </button>

                                    {po.status === 'DRAFT' && (
                                      <>
                                        <button
                                          onClick={() => handlePlaceOrder(po.id)}
                                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition"
                                        >
                                          Place
                                        </button>
                                        <button
                                          onClick={() => confirmCancelPo(po)}
                                          className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    )}

                                    {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                                      <>
                                        <button
                                          onClick={() => openReceiveModal(po.id)}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                                        >
                                          Receive
                                        </button>
                                        <button
                                          onClick={() => confirmCancelPo(po)}
                                          className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <PaginationBar
                          currentPage={poPage}
                          totalRecords={
                            purchaseOrders.filter((po) => {
                              if (poStatusFilter === 'ACTIVE' && (po.status === 'RECEIVED' || po.status === 'CANCELLED')) return false;
                              const d = (po.createdAt || po.created_at || '').slice(0, 10);
                              if (poDateFrom && d && d < poDateFrom) return false;
                              if (poDateTo && d && d > poDateTo) return false;
                              return true;
                            }).length
                          }
                          pageSize={poPageSize}
                          onPageChange={setPoPage}
                          onPageSizeChange={(newSize) => {
                            setPoPageSize(newSize);
                            setPoPage(1);
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SUBSECTION B: SUPPLIERS DIRECTORY */}
              {purchasingSubTab === 'suppliers' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search suppliers by name, phone, email..."
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          fetchSuppliersData(e.target.value);
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                              <p className="text-[11px] text-slate-400">Vendor #{s.id}</p>
                            </div>
                            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                              <Truck className="w-4 h-4" />
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            {s.contactPerson && (
                              <p className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{s.contactPerson}</span>
                              </p>
                            )}
                            {s.phone && (
                              <p className="flex items-center gap-1.5 font-mono">
                                <span className="text-slate-400">📞</span>
                                <span>{s.phone}</span>
                              </p>
                            )}
                            {s.email && (
                              <p className="flex items-center gap-1.5 font-mono text-teal-700 truncate">
                                <span className="text-slate-400">✉</span>
                                <span>{s.email}</span>
                              </p>
                            )}
                            {s.address && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                📍 {s.address}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => viewSupplierProducts(s)}
                            className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                          >
                            <span>Products</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <div className="space-x-1">
                            <button
                              onClick={() => openEditSupplierModal(s)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDeleteSupplier(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
  );
}