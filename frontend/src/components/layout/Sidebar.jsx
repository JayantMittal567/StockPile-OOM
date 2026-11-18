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
import { useAuth } from '../../context/AuthContext';

function getUserInitials(name = '') {
  if (!name) return 'SP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  const { user } = useAuth();
  return (
    <>
      {/* ================= DESKTOP SIDEBAR (>= 1024px) ================= */}
      <aside
        className={`liquid-glass-sidebar hidden lg:flex h-full flex-col justify-between shrink-0 overflow-y-auto overflow-x-hidden z-20 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {sidebarCollapsed ? (
          /* ----- DOCKED / COLLAPSED ICON RAIL ----- */
          <div className="w-[72px] flex flex-col items-center">
            {/* Logo */}
            <div className="py-3.5 flex flex-col items-center justify-center w-full" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setActiveTab('overview')}
                className="p-1 rounded-xl hover:opacity-90 transition cursor-pointer"
                title="StockPile — Go to Overview"
              >
                <img
                  src="/logo.png"
                  alt="StockPile"
                  className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow-xs"
                />
              </button>
            </div>

            {/* Nav Icons with Tooltips */}
            <nav className="py-3 px-2 space-y-1.5 w-full flex flex-col items-center">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
                return (
                  <div key={item.id} className="relative group flex items-center justify-center">
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`sidebar-nav-item w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                        isActive
                          ? 'sidebar-nav-item-active text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-black/5 dark:text-stone-300 dark:hover:text-white dark:hover:bg-white/10'
                      }`}
                      style={isActive ? { backgroundColor: 'var(--accent)' } : {}}
                      aria-label={item.label}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-700 dark:text-stone-300'}`} />
                    </button>
                    {/* Hover Tooltip */}
                    <div className="fixed left-[76px] px-2.5 py-1.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        ) : (
          /* ----- EXPANDED SIDEBAR ----- */
          <div className="w-64 min-w-[16rem]">
            {/* Brand Header */}
            <div className="p-4 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer group focus:outline-none min-w-0"
                title="StockPile — Go to Overview"
              >
                <img
                  src="/logo.png"
                  alt="StockPile"
                  className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-xs"
                />
                <div className="min-w-0">
                  <span
                    className="text-xl tracking-tight block select-none truncate font-extrabold"
                    style={{
                      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)'
                    }}
                  >
                    StockPile
                  </span>
                  <p className="text-[11px] truncate font-medium text-slate-600 dark:text-stone-400">Inventory & Supply</p>
                </div>
              </button>

              {/* Dock/Collapse Toggle Button */}
              {setSidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="p-3.5 space-y-1">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-stone-400">
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
                        ? 'sidebar-nav-item-active text-white shadow-xs font-bold'
                        : 'text-slate-800 hover:text-slate-950 hover:bg-black/5 dark:text-stone-200 dark:hover:text-white dark:hover:bg-white/10'
                    }`}
                    style={isActive ? { backgroundColor: 'var(--accent)' } : {}}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-700 dark:text-stone-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* User Profile & Database Status Area */}
        {sidebarCollapsed ? (
          <div className="w-[72px] pb-4 flex flex-col items-center gap-3">
            {/* Database Status Button */}
            <div className="relative group flex items-center justify-center">
              <button
                onClick={fetchHealthData}
                disabled={loadingHealth}
                className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/80 border border-stone-300/80 dark:border-stone-800 transition flex items-center justify-center cursor-pointer relative shadow-xs"
                aria-label="Database Status"
              >
                <Database className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    health?.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </button>
              <div className="fixed left-[76px] px-2.5 py-1.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                {health?.status === 'UP' ? 'DB Connected & Synced' : 'DB Offline'}
              </div>
            </div>

            {/* Compact Collapsed User Profile Rail */}
            <div className="pt-2 w-full flex flex-col items-center gap-1.5 border-t border-stone-200/80 dark:border-stone-800">
              <div className="relative group flex items-center justify-center">
                <div
                  className="w-9 h-9 rounded-xl bg-[#EA580C] text-white flex items-center justify-center text-xs font-bold shadow-xs select-none cursor-default"
                  aria-label={user?.name || 'User Profile'}
                >
                  {getUserInitials(user?.name)}
                </div>
                {/* User Tooltip */}
                <div className="fixed left-[76px] px-2.5 py-1.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                  <p className="font-bold">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] opacity-80">{user?.role || 'Inventory Director'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-64 min-w-[16rem] p-4 space-y-3">
            {/* Compact User Profile Pill */}
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/80 border border-stone-300/80 dark:border-stone-800 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs select-none">
                  {getUserInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-stone-100 truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                    {user?.role || 'Inventory Director'}
                  </p>
                </div>
              </div>
            </div>

            {/* SQLite Database Status */}
            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-stone-900/80 border border-stone-300/80 dark:border-stone-800 shadow-xs text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold flex items-center gap-1.5 text-[11px] text-slate-800 dark:text-stone-200">
                  <Database className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  SQLite Database
                </span>
                <button
                  onClick={fetchHealthData}
                  disabled={loadingHealth}
                  title="Refresh database connection status"
                  className="text-slate-600 hover:text-slate-950 dark:text-stone-400 dark:hover:text-stone-100 transition"
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
                <span className="font-bold text-slate-950 dark:text-white">
                  {health?.status === 'UP' ? 'Connected & Synced' : 'Database Offline'}
                </span>
              </div>
              {health?.tableCounts && (
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700 dark:text-stone-300 border-t border-stone-200 dark:border-stone-800 pt-2 font-mono font-medium">
                  <div>Products: {health.tableCounts.products ?? 0}</div>
                  <div>Sales: {health.tableCounts.sales ?? 0}</div>
                  <div>Suppliers: {health.tableCounts.suppliers ?? 0}</div>
                  <div>POs: {health.tableCounts.purchase_orders ?? 0}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative w-72 max-w-[80vw] flex flex-col justify-between p-5 z-10 shadow-2xl liquid-glass-sidebar"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--text-primary)'
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                  title="StockPile — Go to Overview"
                >
                  <img
                    src="/logo.png"
                    alt="StockPile"
                    className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow-xs"
                  />
                  <div>
                    <span
                      className="text-xl tracking-tight block select-none font-extrabold"
                      style={{
                        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: 'var(--text-primary)'
                      }}
                    >
                      StockPile
                    </span>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-stone-400">Inventory & Supply</p>
                  </div>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 dark:text-stone-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label="Close menu"
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
                        isActive
                          ? 'sidebar-nav-item-active text-white font-bold'
                          : 'text-slate-800 hover:text-slate-950 hover:bg-black/5 dark:text-stone-200 dark:hover:text-white dark:hover:bg-white/10'
                      }`}
                      style={isActive ? { backgroundColor: 'var(--accent)' } : {}}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-700 dark:text-stone-300'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
              {/* User Profile Pill Mobile Drawer */}
              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/80 border border-stone-300/80 dark:border-stone-800 shadow-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center text-xs font-bold shrink-0 select-none">
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-stone-100 truncate">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                      {user?.role || 'Inventory Director'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/90 dark:bg-stone-900/80 rounded-xl border border-stone-300/80 dark:border-stone-800 text-[11px] text-slate-700 dark:text-stone-300 shadow-xs">
                <p className="font-bold text-slate-950 dark:text-white mb-1">StockPile Suite v2.0</p>
                <p>Active SQLite storage. 100% verified transactional ledger.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md flex items-center justify-around px-2 py-1 shadow-lg"
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
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }} />
              <span className="text-[9px] mt-0.5 tracking-tight font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
