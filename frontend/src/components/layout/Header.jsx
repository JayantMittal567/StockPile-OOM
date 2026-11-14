import React, { useCallback, useRef } from 'react';
import { Menu, ShoppingCart, Plus, Sun, Moon } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  setMobileMenuOpen,
  openNewSaleModal,
  openNewPoModal,
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed
}) {
  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
      case 'dashboard':
        return 'Overview';
      case 'products':
        return 'Products';
      case 'sales':
        return 'Sales';
      case 'purchasing':
        return 'Purchasing';
      case 'stock-control':
        return 'Stock Control';
      case 'insights':
        return 'Insights';
      case 'surplus':
        return 'Surplus Stock';
      case 'reports':
        return 'Reports';
      default:
        return 'Overview';
    }
  };

  const themeToggleRef = useRef(null);

  const toggleDarkMode = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Use View Transitions API if available (Telegram-style circular reveal)
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        document.documentElement.classList.toggle('dark');
        setDarkMode((prev) => !prev);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    } else {
      // Smooth CSS fallback
      document.documentElement.style.transition = 'background-color 0.4s ease, color 0.4s ease';
      document.documentElement.classList.toggle('dark');
      setDarkMode((prev) => !prev);
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, 450);
    }
  }, [setDarkMode]);

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xs border-b px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl transition"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar dock toggle when collapsed */}
        {sidebarCollapsed && setSidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:inline-flex p-2 rounded-xl transition hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--text-secondary)' }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h1
          className="text-base sm:text-lg font-bold tracking-tight capitalize"
          style={{ color: 'var(--text-primary)' }}
        >
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <button
          ref={themeToggleRef}
          onClick={toggleDarkMode}
          className="w-9 h-9 inline-flex items-center justify-center shrink-0 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--accent-subtle)'
          }}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 shrink-0 block" />
          ) : (
            <Moon className="w-4 h-4 shrink-0 block" />
          )}
        </button>

        {/* Quick POS Trigger */}
        <button
          onClick={openNewSaleModal}
          className="px-3 py-2 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          style={{ backgroundColor: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Record Sale</span>
        </button>
        {/* Quick PO Trigger */}
        <button
          onClick={() => openNewPoModal()}
          className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New PO</span>
        </button>
      </div>
    </header>
  );
}
