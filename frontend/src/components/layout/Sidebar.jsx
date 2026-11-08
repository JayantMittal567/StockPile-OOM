import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  SlidersHorizontal,
  TrendingUp,
  Boxes,
  FileText,
  Database,
  RefreshCw,
  X
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'purchasing', label: 'Purchasing', icon: Truck },
  { id: 'stock-control', label: 'Stock Control', icon: SlidersHorizontal },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
  { id: 'surplus', label: 'Surplus Stock', icon: Boxes },
  { id: 'reports', label: 'Reports', icon: FileText }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  health,
  loadingHealth,
  fetchHealthData
}) {
  return (
    <>
      {/* ================= DESKTOP SIDEBAR (>= 1024px) ================= */}
      <aside className="hidden lg:flex w-64 h-full bg-slate-950 text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800 overflow-y-auto z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">Stockpile</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400">Inventory & Operations</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database & Engine Status Card */}
        <div className="p-4 m-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              SQLite Database
            </span>
            <button
              onClick={fetchHealthData}
              disabled={loadingHealth}
              title="Refresh database connection status"
              className="text-slate-500 hover:text-slate-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {health?.status === 'UP' ? 'Connected & Synced' : 'Database Offline'}
            </span>
          </div>
          {health?.tableCounts && (
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
              <div>Products: {health.tableCounts.products ?? 0}</div>
              <div>Sales: {health.tableCounts.sales ?? 0}</div>
              <div>Suppliers: {health.tableCounts.suppliers ?? 0}</div>
              <div>POs: {health.tableCounts.purchase_orders ?? 0}</div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-950 text-slate-300 flex flex-col justify-between p-5 z-10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <span className="font-bold text-white text-base">Stockpile</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Stockpile Suite v2.0</p>
              <p>Active SQLite storage. 100% verified transactional ledger.</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-around px-2 py-1 shadow-lg">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition flex-1 ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="text-[9px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
