import React from 'react';
import { Menu, ShoppingCart, Plus } from 'lucide-react';

export default function Header({
  activeTab,
  setMobileMenuOpen,
  openNewSaleModal,
  openNewPoModal
}) {
  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
      case 'dashboard':
        return 'Business Overview';
      case 'products':
        return 'Product Catalog';
      case 'sales':
        return 'Sales & Orders';
      case 'purchasing':
        return 'Purchasing & Suppliers';
      case 'stock-control':
        return 'Stock Control & Movements';
      case 'insights':
        return 'Inventory Intelligence & Insights';
      case 'surplus':
        return 'Surplus Stock Clearance';
      case 'reports':
        return 'Business Reports';
      default:
        return 'Business Management';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight capitalize">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Lightweight inventory & business operations for small businesses
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick POS Trigger in Header */}
        <button
          onClick={openNewSaleModal}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Record Sale</span>
        </button>
        {/* Quick PO Trigger in Header */}
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
