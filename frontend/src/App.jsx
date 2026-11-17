import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';

// Context & Auth
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';

// Layout & Modals
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastAlert from './components/layout/ToastAlert';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppModals from './components/modals/AppModals';
import { useInventoryData } from './hooks/useInventoryData';
import { useAppModals } from './hooks/useAppModals';
import { getKolkataToday } from './utils/formatters';

// Lazy-loaded Views
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Sales = lazy(() => import('./pages/Sales'));
const Purchasing = lazy(() => import('./pages/Purchasing'));
const StockControl = lazy(() => import('./pages/StockControl'));
const Insights = lazy(() => import('./pages/Insights'));
const SurplusStock = lazy(() => import('./pages/SurplusStock'));
const Reports = lazy(() => import('./pages/Reports'));

function StockPileWorkspace() {
  const { isAuthenticated } = useAuth();

  // Navigation & Sub-navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [purchasingSubTab, setPurchasingSubTab] = useState('orders');
  const [stockControlSubTab, setStockControlSubTab] = useState('movements');

  // Overview Period Activity Filter State
  const [overviewPeriod, setOverviewPeriod] = useState('TODAY');
  const [overviewCustomFrom, setOverviewCustomFrom] = useState(getKolkataToday());
  const [overviewCustomTo, setOverviewCustomTo] = useState(getKolkataToday());

  // Global Alert State
  const [alert, setAlert] = useState(null);
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4500);
  };

  // Central Inventory & Domain State
  const data = useInventoryData({
    activeTab,
    overviewPeriod,
    overviewCustomFrom,
    overviewCustomTo,
    stockControlSubTab,
    triggerAlert
  });

  // Modal Handlers & Props
  const { handlers, modalProps } = useAppModals({
    ...data,
    triggerAlert,
    setActiveTab,
    setPurchasingSubTab
  });

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('stockpile-dark-mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('stockpile-dark-mode', darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Sidebar Dock/Collapse State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const prevTabRef = useRef(activeTab);
  const [viewKey, setViewKey] = useState(0);

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      setViewKey((k) => k + 1);
    }
  }, [activeTab]);

  // Auth Protection Gate (Bypassed - uncomment to re-enable)
  // if (!isAuthenticated) {
  //   return <AuthPage />;
  // }

  return (
    <div
      className="flex h-screen h-[100dvh] w-full overflow-hidden font-sans antialiased"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Fixed Desktop & Mobile Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        health={data.health}
        loadingHealth={data.loadingHealth}
        fetchHealthData={data.fetchHealthData}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative pb-16 lg:pb-0">
        <ToastAlert alert={alert} onClose={() => setAlert(null)} />

        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setMobileMenuOpen={setMobileMenuOpen}
          openNewSaleModal={handlers.openNewSaleModal}
          openNewPoModal={() => handlers.openNewPoModal()}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        <main key={viewKey} className="workspace-view-enter p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center p-12 min-h-[350px] space-y-3">
                  <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--spinner-color)', borderTopColor: 'transparent' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Loading view...</span>
                </div>
              }
            >
              {(activeTab === 'overview' || activeTab === 'dashboard') && (
                <Dashboard
                  dashboard={data.dashboard}
                  loadingDashboard={data.loadingDashboard}
                  products={data.products}
                  purchaseOrders={data.purchaseOrders}
                  overviewPeriod={overviewPeriod}
                  setOverviewPeriod={setOverviewPeriod}
                  overviewCustomFrom={overviewCustomFrom}
                  setOverviewCustomFrom={setOverviewCustomFrom}
                  overviewCustomTo={overviewCustomTo}
                  setOverviewCustomTo={setOverviewCustomTo}
                  onPeriodChange={(period, from, to) => data.fetchDashboardData(period, from, to)}
                  fetchDashboardData={data.fetchDashboardData}
                  salesMetrics={data.salesMetrics}
                  salesTrend={data.salesTrend}
                  salesIntelligence={data.salesIntelligence}
                  attentionItems={data.attentionItems}
                  setActiveTab={setActiveTab}
                  setStockControlSubTab={setStockControlSubTab}
                  openAddProductModal={handlers.openAddProductModal}
                  openNewSaleModal={handlers.openNewSaleModal}
                  openNewPoModal={handlers.openNewPoModal}
                  openReceiveModal={handlers.openReceiveModal}
                  openQuickActionModal={handlers.openQuickActionModal}
                />
              )}

              {activeTab === 'products' && (
                <Products
                  products={data.products}
                  loadingProducts={data.loadingProducts}
                  searchQuery={data.searchQuery}
                  setSearchQuery={data.setSearchQuery}
                  categoryFilter={data.categoryFilter}
                  setCategoryFilter={data.setCategoryFilter}
                  stockStatusFilter={data.stockStatusFilter}
                  setStockStatusFilter={data.setStockStatusFilter}
                  productsPage={data.productsPage}
                  setProductsPage={data.setProductsPage}
                  productsPageSize={data.productsPageSize}
                  setProductsPageSize={data.setProductsPageSize}
                  fetchProductsData={data.fetchProductsData}
                  openAddProductModal={handlers.openAddProductModal}
                  openEditProductModal={handlers.openEditProductModal}
                  openDeleteProductModal={handlers.confirmDeleteProduct}
                  openQuickActionModal={handlers.openQuickActionModal}
                />
              )}

              {activeTab === 'sales' && (
                <Sales
                  sales={data.sales}
                  loadingSales={data.loadingSales}
                  salesStatusFilter={data.salesStatusFilter}
                  setSalesStatusFilter={data.setSalesStatusFilter}
                  salesDateFrom={data.salesDateFrom}
                  setSalesDateFrom={data.setSalesDateFrom}
                  salesDateTo={data.salesDateTo}
                  setSalesDateTo={data.setSalesDateTo}
                  salesPage={data.salesPage}
                  setSalesPage={data.setSalesPage}
                  salesPageSize={data.salesPageSize}
                  setSalesPageSize={data.setSalesPageSize}
                  salesMetrics={data.salesMetrics}
                  openNewSaleModal={handlers.openNewSaleModal}
                  viewSaleDetails={handlers.viewSaleDetails}
                  confirmCancelSale={handlers.confirmCancelSale}
                  fetchSalesData={data.fetchSalesData}
                />
              )}

              {activeTab === 'purchasing' && (
                <Purchasing
                  purchasingSubTab={purchasingSubTab}
                  setPurchasingSubTab={setPurchasingSubTab}
                  purchaseOrders={data.purchaseOrders}
                  loadingPurchaseOrders={data.loadingPurchaseOrders}
                  poStatusFilter={data.poStatusFilter}
                  setPoStatusFilter={data.setPoStatusFilter}
                  poSupplierFilter={data.poSupplierFilter}
                  setPoSupplierFilter={data.setPoSupplierFilter}
                  poDateFrom={data.poDateFrom}
                  setPoDateFrom={data.setPoDateFrom}
                  poDateTo={data.poDateTo}
                  setPoDateTo={data.setPoDateTo}
                  poPage={data.poPage}
                  setPoPage={data.setPoPage}
                  poPageSize={data.poPageSize}
                  setPoPageSize={data.setPoPageSize}
                  suppliers={data.suppliers}
                  loadingSuppliers={data.loadingSuppliers}
                  supplierSearch={data.supplierSearch}
                  setSupplierSearch={data.setSupplierSearch}
                  openNewPoModal={handlers.openNewPoModal}
                  handlePlaceOrder={handlers.handlePlaceOrder}
                  openReceiveModal={handlers.openReceiveModal}
                  confirmCancelPo={handlers.confirmCancelPo}
                  viewPoDetails={handlers.viewPoDetails}
                  openAddSupplierModal={handlers.openAddSupplierModal}
                  openEditSupplierModal={handlers.openEditSupplierModal}
                  confirmDeleteSupplier={handlers.confirmDeleteSupplier}
                  viewSupplierProducts={handlers.viewSupplierProducts}
                  fetchPurchaseOrdersData={data.fetchPurchaseOrdersData}
                  fetchSuppliersData={data.fetchSuppliersData}
                />
              )}

              {activeTab === 'stock-control' && (
                <StockControl
                  stockControlSubTab={stockControlSubTab}
                  setStockControlSubTab={setStockControlSubTab}
                  movements={data.movements}
                  loadingMovements={data.loadingMovements}
                  movementProductFilter={data.movementProductFilter}
                  setMovementProductFilter={data.setMovementProductFilter}
                  movementTypeFilter={data.movementTypeFilter}
                  setMovementTypeFilter={data.setMovementTypeFilter}
                  movementDateFrom={data.movementDateFrom}
                  setMovementDateFrom={data.setMovementDateFrom}
                  movementDateTo={data.movementDateTo}
                  setMovementDateTo={data.setMovementDateTo}
                  movementsPage={data.movementsPage}
                  setMovementsPage={data.setMovementsPage}
                  movementsPageSize={data.movementsPageSize}
                  setMovementsPageSize={data.setMovementsPageSize}
                  products={data.products}
                  audits={data.audits}
                  auditSummary={data.auditSummary}
                  loadingAudits={data.loadingAudits}
                  auditFilter={data.auditFilter}
                  setAuditFilter={data.setAuditFilter}
                  auditDateFrom={data.auditDateFrom}
                  setAuditDateFrom={data.setAuditDateFrom}
                  auditDateTo={data.auditDateTo}
                  setAuditDateTo={data.setAuditDateTo}
                  auditsPage={data.auditsPage}
                  setAuditsPage={data.setAuditsPage}
                  auditsPageSize={data.auditsPageSize}
                  setAuditsPageSize={data.setAuditsPageSize}
                  selectedAudit={data.selectedAudit}
                  setSelectedAudit={data.setSelectedAudit}
                  selectedAuditId={data.selectedAuditId}
                  setSelectedAuditId={data.setSelectedAuditId}
                  dashboard={data.dashboard}
                  quickActionForm={modalProps.quickActionForm}
                  setQuickActionForm={modalProps.setQuickActionForm}
                  submittingQuickAction={modalProps.submittingQuickAction}
                  handleQuickActionSubmit={handlers.handleQuickActionSubmit}
                  loadingSelectedAudit={data.loadingSelectedAudit}
                  auditItemSearch={data.auditItemSearch}
                  setAuditItemSearch={data.setAuditItemSearch}
                  auditItemFilter={data.auditItemFilter}
                  setAuditItemFilter={data.setAuditItemFilter}
                  openQuickActionModal={handlers.openQuickActionModal}
                  openStartAuditModal={handlers.openStartAuditModal}
                  selectAuditForView={handlers.selectAuditForView}
                  openCountModal={handlers.openCountModal}
                  openCompleteAuditModal={handlers.openCompleteAuditModal}
                  openCancelAuditModal={handlers.openCancelAuditModal}
                  fetchMovementsData={data.fetchMovementsData}
                  fetchAuditsData={data.fetchAuditsData}
                />
              )}

              {activeTab === 'insights' && (
                <Insights
                  salesIntelligence={data.salesIntelligence}
                  loadingIntelligence={data.loadingIntelligence}
                  intelFilter={data.intelFilter}
                  setIntelFilter={data.setIntelFilter}
                  fetchIntelligenceData={data.fetchIntelligenceData}
                  openNewPoModal={handlers.openNewPoModal}
                />
              )}

              {activeTab === 'surplus' && (
                <SurplusStock
                  surplusSubTab={data.surplusSubTab}
                  setSurplusSubTab={data.setSurplusSubTab}
                  surplusSummary={data.surplusSummary}
                  surplusSuggestions={data.surplusSuggestions}
                  surplusListings={data.surplusListings}
                  surplusStatusFilter={data.surplusStatusFilter}
                  setSurplusStatusFilter={data.setSurplusStatusFilter}
                  surplusSearch={data.surplusSearch}
                  setSurplusSearch={data.setSurplusSearch}
                  surplusCategoryFilter={data.surplusCategoryFilter}
                  setSurplusCategoryFilter={data.setSurplusCategoryFilter}
                  loadingSurplus={data.loadingSurplus}
                  surplusError={data.surplusError}
                  handleOpenCreateSurplus={handlers.handleOpenCreateSurplus}
                  handleOpenSurplusSale={handlers.handleOpenSurplusSale}
                  handleOpenCancelSurplus={handlers.handleOpenCancelSurplus}
                  handleOpenSurplusDetail={handlers.handleOpenSurplusDetail}
                  fetchSurplusData={data.fetchSurplusData}
                />
              )}

              {activeTab === 'reports' && (
                <Reports
                  reportPeriod={data.reportPeriod}
                  setReportPeriod={data.setReportPeriod}
                  reportDate={data.reportDate}
                  setReportDate={data.setReportDate}
                  reportMonth={data.reportMonth}
                  setReportMonth={data.setReportMonth}
                  reportYear={data.reportYear}
                  setReportYear={data.setReportYear}
                  reportFrom={data.reportFrom}
                  setReportFrom={data.setReportFrom}
                  reportTo={data.reportTo}
                  setReportTo={data.setReportTo}
                  reportSubTab={data.reportSubTab}
                  setReportSubTab={data.setReportSubTab}
                  summaryReport={data.summaryReport}
                  pnlReport={data.pnlReport}
                  salesReport={data.salesReport}
                  lossReport={data.lossReport}
                  purchasesReport={data.purchasesReport}
                  expensesList={data.expensesList}
                  loadingReports={data.loadingReports}
                  reportsError={data.reportsError}
                  expenseCategoryFilter={data.expenseCategoryFilter}
                  setExpenseCategoryFilter={data.setExpenseCategoryFilter}
                  expenseDateFrom={data.expenseDateFrom}
                  setExpenseDateFrom={data.setExpenseDateFrom}
                  expenseDateTo={data.expenseDateTo}
                  setExpenseDateTo={data.setExpenseDateTo}
                  expensesPage={data.expensesPage}
                  setExpensesPage={data.setExpensesPage}
                  expensesPageSize={data.expensesPageSize}
                  setExpensesPageSize={data.setExpensesPageSize}
                  openAddExpenseModal={handlers.openAddExpenseModal}
                  openEditExpenseModal={handlers.openEditExpenseModal}
                  confirmDeleteExpense={handlers.confirmDeleteExpense}
                  fetchAllReportData={data.fetchAllReportData}
                  fetchReportsData={data.fetchAllReportData}
                  setReportsError={data.setReportsError}
                  handleExportCSV={handlers.handleExportCSV}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Modals */}
      <AppModals {...modalProps} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StockPileWorkspace />
    </AuthProvider>
  );
}
