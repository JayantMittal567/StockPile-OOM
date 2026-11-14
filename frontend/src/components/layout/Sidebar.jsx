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
  X,
  ChevronLeft
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
  fetchHealthData,
  sidebarCollapsed = false,
  setSidebarCollapsed
}) {
  return (
    <>
      {/* ================= DESKTOP SIDEBAR (>= 1024px) ================= */}
      <aside
        className={`hidden lg:flex h-full flex-col justify-between shrink-0 overflow-y-auto overflow-x-hidden z-20 transition-[width,opacity] duration-[220ms] ease-[cubic-bezier(0.2,0,0,1)] ${
          sidebarCollapsed ? 'w-0 border-r-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: sidebarCollapsed ? 'none' : '1px solid var(--border-color)',
          color: 'var(--text-muted)'
        }}
      >
        <div className="w-64 min-w-[16rem]">
          {/* Brand Header */}
          <div className="p-5 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-left bg-transparent border-none p-0 cursor-pointer group focus:outline-none"
              title="Go to Overview"
            >
              <span
                className="text-2xl tracking-tight text-white block select-none"
                style={{
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-0.02em'
                }}
              >
                StockPile
              </span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Inventory & Operations</p>
            </button>

            {/* Dock/Collapse Toggle Button */}
            {setSidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Workspace
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'sidebar-nav-item-active text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--accent)' } : {}}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database & Engine Status Card */}
        <div className="w-64 min-w-[16rem]">
          <div className="p-4 m-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <Database className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
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
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative w-72 max-w-[80vw] flex flex-col justify-between p-5 z-10 shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                >
                  <span
                    className="text-xl tracking-tight text-white block select-none"
                    style={{
                      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontWeight: 800,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    StockPile
                  </span>
                </button>
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
                      className={`sidebar-nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive ? 'sidebar-nav-item-active text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                      style={isActive ? { backgroundColor: 'var(--accent)' } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">StockPile Suite v2.0</p>
              <p>Active SQLite storage. 100% verified transactional ledger.</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xs flex items-center justify-around px-2 py-1 shadow-lg"
        style={{
          backgroundColor: 'var(--mobile-nav-bg)',
          borderTop: '1px solid var(--border-color)'
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition flex-1 ${
                isActive ? 'font-bold' : 'hover:opacity-80'
              }`}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span className="text-[9px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
