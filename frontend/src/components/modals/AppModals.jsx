import React from 'react';
import ProductModal from '../products/ProductModal';
import DeleteProductModal from '../products/DeleteProductModal';
import SaleModal from '../sales/SaleModal';
import SaleDetailModal from '../sales/SaleDetailModal';
import CancelSaleModal from '../sales/CancelSaleModal';
import PoModal from '../purchasing/PoModal';
import ReceivePoModal from '../purchasing/ReceivePoModal';
import CancelPoModal from '../purchasing/CancelPoModal';
import PoDetailModal from '../purchasing/PoDetailModal';
import SupplierModal from '../purchasing/SupplierModal';
import DeleteSupplierModal from '../purchasing/DeleteSupplierModal';
import SupplierProductsModal from '../purchasing/SupplierProductsModal';
import QuickActionModal from '../stock-control/QuickActionModal';
import StartAuditModal from '../stock-control/StartAuditModal';
import CountModal from '../stock-control/CountModal';
import CompleteAuditModal from '../stock-control/CompleteAuditModal';
import CancelAuditModal from '../stock-control/CancelAuditModal';
import ExpenseModal from '../reports/ExpenseModal';
import DeleteExpenseModal from '../reports/DeleteExpenseModal';
import CreateSurplusModal from '../surplus/CreateSurplusModal';
import SurplusSaleModal from '../surplus/SurplusSaleModal';
import CancelSurplusModal from '../surplus/CancelSurplusModal';
import SurplusDetailModal from '../surplus/SurplusDetailModal';

export default function AppModals(props) {
  const {
    // Products
    productModalOpen,
    setProductModalOpen,
    editingProduct,
    productForm,
    setProductForm,
    productFormError,
    savingProduct,
    showAdvancedProduct,
    setShowAdvancedProduct,
    handleProductNameChange,
    handleProductCategoryChange,
    handleSaveProduct,
    suppliers,
    setSkuManuallyEdited,
    products,
    productRecordMode,
    setProductRecordMode,
    selectedExistingProductId,
    setSelectedExistingProductId,
    existingProductIntakeQty,
    setExistingProductIntakeQty,
    existingProductIntakeReason,
    setExistingProductIntakeReason,
    deleteProductModalOpen,
    setDeleteProductModalOpen,
    productToDelete,
    deletingProduct,
    handleDeleteProduct,

    // Quick Action
    quickActionModalOpen,
    setQuickActionModalOpen,
    quickActionForm,
    setQuickActionForm,
    submittingQuickAction,
    quickActionError,
    handleQuickActionSubmit,

    // Sales
    saleModalOpen,
    setSaleModalOpen,
    saleSuccessData,
    setSaleSuccessData,
    openNewSaleModal,
    saleCart,
    setSaleCart,
    saleDiscountPercent,
    setSaleDiscountPercent,
    salePaymentMethod,
    setSalePaymentMethod,
    submittingSale,
    saleFormError,
    setSaleFormError,
    saleProductSearchQuery,
    setSaleProductSearchQuery,
    showClearCartConfirm,
    setShowClearCartConfirm,
    saleRequiresConfirm,
    setSaleRequiresConfirm,
    saleSearchInputRef,
    cartCalculations,
    searchFilteredProducts,
    viewSaleDetails,
    handleAddToCart,
    handleAddCartRow,
    handleCartItemChange,
    handleRemoveCartRow,
    handleUpdateQuantity,
    handleCustomPriceChange,
    handleResetItemPrice,
    handleClearCart,
    handleCheckoutSale,
    saleDetailModalOpen,
    setSaleDetailModalOpen,
    selectedSaleDetail,
    loadingSaleDetail,
    cancelSaleModalOpen,
    setCancelSaleModalOpen,
    saleToCancel,
    cancelSaleReason,
    setCancelSaleReason,
    cancellingSale,
    handleCancelSale,

    // Purchasing
    poModalOpen,
    setPoModalOpen,
    editingPo,
    poForm,
    setPoForm,
    poFormError,
    savingPo,
    handleSavePurchaseOrder,
    poCalculations,
    handlePoItemChange,
    handleRemovePoItemRow,
    handleAddPoItemRow,
    receiveModalOpen,
    setReceiveModalOpen,
    receivingPo,
    receiveItemQuantities,
    setReceiveItemQuantities,
    submittingReceive,
    receiveError,
    handleSubmitReceive,
    cancelPoModalOpen,
    setCancelPoModalOpen,
    poToCancel,
    cancelPoReason,
    setCancelPoReason,
    cancellingPo,
    handleCancelPo,
    poDetailModalOpen,
    setPoDetailModalOpen,
    selectedPoDetail,
    loadingPoDetail,

    // Suppliers
    supplierModalOpen,
    setSupplierModalOpen,
    editingSupplier,
    supplierForm,
    setSupplierForm,
    supplierFormError,
    savingSupplier,
    handleSaveSupplier,
    deleteSupplierModalOpen,
    setDeleteSupplierModalOpen,
    supplierToDelete,
    deletingSupplier,
    handleDeleteSupplier,
    supplierProductsModalOpen,
    setSupplierProductsModalOpen,
    selectedSupplierForProducts,
    supplierProductsList,
    loadingSupplierProducts,

    // Audits
    startAuditModalOpen,
    setStartAuditModalOpen,
    auditMode,
    setAuditMode,
    selectedAuditProductIds,
    setSelectedAuditProductIds,
    auditProductSearch,
    setAuditProductSearch,
    auditNotes,
    setAuditNotes,
    submittingAudit,
    handleStartAudit,
    countingItem,
    setCountingItem,
    countQuantityInput,
    setCountQuantityInput,
    countNotesInput,
    setCountNotesInput,
    submittingCount,
    handleRecordCount,
    completeAuditModalOpen,
    setCompleteAuditModalOpen,
    selectedAudit,
    submittingCompleteAudit,
    completeAuditError,
    handleCompleteAudit,
    cancelAuditModalOpen,
    setCancelAuditModalOpen,
    cancelAuditReason,
    setCancelAuditReason,
    submittingCancelAudit,
    handleCancelAudit,

    // Expenses
    expenseModalOpen,
    setExpenseModalOpen,
    editingExpense,
    expenseForm,
    setExpenseForm,
    expenseFormError,
    savingExpense,
    handleSaveExpense,
    deleteExpenseModalOpen,
    setDeleteExpenseModalOpen,
    expenseToDelete,
    deletingExpense,
    handleDeleteExpense,

    // Surplus
    createSurplusModalOpen,
    setCreateSurplusModalOpen,
    createSurplusForm,
    setCreateSurplusForm,
    selectedProductForSurplus,
    submittingCreateSurplus,
    createSurplusError,
    handleSubmitCreateSurplus,
    handleSelectProductForSurplus,
    surplusSaleModalOpen,
    setSurplusSaleModalOpen,
    surplusListingForSale,
    surplusSaleForm,
    setSurplusSaleForm,
    submittingSurplusSale,
    surplusSaleError,
    handleSubmitSurplusSale,
    cancelSurplusModalOpen,
    setCancelSurplusModalOpen,
    surplusListingToCancel,
    cancelSurplusReason,
    setCancelSurplusReason,
    submittingCancelSurplus,
    handleConfirmCancelSurplus,
    surplusDetailModalOpen,
    setSurplusDetailModalOpen,
    selectedSurplusDetail,
    loadingSurplusDetail
  } = props;

  return (
    <>
      {/* 1. Product Modals */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        productFormError={productFormError}
        savingProduct={savingProduct}
        showAdvancedProduct={showAdvancedProduct}
        setShowAdvancedProduct={setShowAdvancedProduct}
        handleProductNameChange={handleProductNameChange}
        handleProductCategoryChange={handleProductCategoryChange}
        handleSaveProduct={handleSaveProduct}
        suppliers={suppliers}
        setSkuManuallyEdited={setSkuManuallyEdited}
        products={products}
        productRecordMode={productRecordMode}
        setProductRecordMode={setProductRecordMode}
        selectedExistingProductId={selectedExistingProductId}
        setSelectedExistingProductId={setSelectedExistingProductId}
        existingProductIntakeQty={existingProductIntakeQty}
        setExistingProductIntakeQty={setExistingProductIntakeQty}
        existingProductIntakeReason={existingProductIntakeReason}
        setExistingProductIntakeReason={setExistingProductIntakeReason}
      />
      <DeleteProductModal
        isOpen={deleteProductModalOpen}
        onClose={() => setDeleteProductModalOpen(false)}
        productToDelete={productToDelete}
        deletingProduct={deletingProduct}
        handleDeleteProduct={handleDeleteProduct}
      />

      {/* 2. Sales Modals (POS Checkout, Details, Cancellation) */}
      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        saleSuccessData={saleSuccessData}
        setSaleSuccessData={setSaleSuccessData}
        openNewSaleModal={openNewSaleModal}
        saleCart={saleCart}
        setSaleCart={setSaleCart}
        saleDiscountPercent={saleDiscountPercent}
        setSaleDiscountPercent={setSaleDiscountPercent}
        salePaymentMethod={salePaymentMethod}
        setSalePaymentMethod={setSalePaymentMethod}
        submittingSale={submittingSale}
        saleFormError={saleFormError}
        setSaleFormError={setSaleFormError}
        saleProductSearchQuery={saleProductSearchQuery}
        setSaleProductSearchQuery={setSaleProductSearchQuery}
        showClearCartConfirm={showClearCartConfirm}
        setShowClearCartConfirm={setShowClearCartConfirm}
        saleRequiresConfirm={saleRequiresConfirm}
        setSaleRequiresConfirm={setSaleRequiresConfirm}
        saleSearchInputRef={saleSearchInputRef}
        products={products}
        cartCalculations={cartCalculations}
        searchFilteredProducts={searchFilteredProducts}
        viewSaleDetails={viewSaleDetails}
        handleAddToCart={handleAddToCart}
        handleAddCartRow={handleAddCartRow}
        handleCartItemChange={handleCartItemChange}
        handleRemoveCartRow={handleRemoveCartRow}
        handleUpdateQuantity={handleUpdateQuantity}
        handleCustomPriceChange={handleCustomPriceChange}
        handleResetItemPrice={handleResetItemPrice}
        handleClearCart={handleClearCart}
        handleCheckoutSale={handleCheckoutSale}
      />
      <SaleDetailModal
        isOpen={saleDetailModalOpen}
        onClose={() => setSaleDetailModalOpen(false)}
        selectedSaleDetail={selectedSaleDetail}
        loadingSaleDetail={loadingSaleDetail}
      />
      <CancelSaleModal
        isOpen={cancelSaleModalOpen}
        onClose={() => setCancelSaleModalOpen(false)}
        saleToCancel={saleToCancel}
        cancelSaleReason={cancelSaleReason}
        setCancelSaleReason={setCancelSaleReason}
        cancellingSale={cancellingSale}
        handleCancelSale={handleCancelSale}
      />

      {/* 3. Purchasing & Supplier Modals */}
      <PoModal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        editingPo={editingPo}
        poForm={poForm}
        setPoForm={setPoForm}
        poFormError={poFormError}
        savingPo={savingPo}
        handleSavePurchaseOrder={handleSavePurchaseOrder}
        handleSavePo={handleSavePurchaseOrder}
        suppliers={suppliers}
        products={products}
        poCalculations={poCalculations}
        handlePoItemChange={handlePoItemChange}
        handleRemovePoItemRow={handleRemovePoItemRow}
        handleAddPoItemRow={handleAddPoItemRow}
      />
      <ReceivePoModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        receivingPo={receivingPo}
        receiveItemQuantities={receiveItemQuantities}
        setReceiveItemQuantities={setReceiveItemQuantities}
        submittingReceive={submittingReceive}
        receiveError={receiveError}
        handleSubmitReceive={handleSubmitReceive}
        handleReceiveGoods={handleSubmitReceive}
      />
      <CancelPoModal
        isOpen={cancelPoModalOpen}
        onClose={() => setCancelPoModalOpen(false)}
        poToCancel={poToCancel}
        cancelPoReason={cancelPoReason}
        setCancelPoReason={setCancelPoReason}
        cancellingPo={cancellingPo}
        handleCancelPo={handleCancelPo}
      />
      <PoDetailModal
        isOpen={poDetailModalOpen}
        onClose={() => setPoDetailModalOpen(false)}
        selectedPoDetail={selectedPoDetail}
        loadingPoDetail={loadingPoDetail}
      />
      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        editingSupplier={editingSupplier}
        supplierForm={supplierForm}
        setSupplierForm={setSupplierForm}
        supplierFormError={supplierFormError}
        savingSupplier={savingSupplier}
        handleSaveSupplier={handleSaveSupplier}
      />
      <DeleteSupplierModal
        isOpen={deleteSupplierModalOpen}
        onClose={() => setDeleteSupplierModalOpen(false)}
        supplierToDelete={supplierToDelete}
        deletingSupplier={deletingSupplier}
        handleDeleteSupplier={handleDeleteSupplier}
      />
      <SupplierProductsModal
        isOpen={supplierProductsModalOpen}
        onClose={() => setSupplierProductsModalOpen(false)}
        selectedSupplierForProducts={selectedSupplierForProducts}
        supplierProductsList={supplierProductsList}
        loadingSupplierProducts={loadingSupplierProducts}
      />

      {/* 4. Stock Control & Audit Modals */}
      <QuickActionModal
        isOpen={quickActionModalOpen}
        onClose={() => setQuickActionModalOpen(false)}
        quickActionForm={quickActionForm}
        setQuickActionForm={setQuickActionForm}
        submittingQuickAction={submittingQuickAction}
        quickActionError={quickActionError}
        handleQuickActionSubmit={handleQuickActionSubmit}
        products={products}
      />
      <StartAuditModal
        isOpen={startAuditModalOpen}
        onClose={() => setStartAuditModalOpen(false)}
        auditMode={auditMode}
        setAuditMode={setAuditMode}
        selectedAuditProductIds={selectedAuditProductIds}
        setSelectedAuditProductIds={setSelectedAuditProductIds}
        auditProductSearch={auditProductSearch}
        setAuditProductSearch={setAuditProductSearch}
        auditNotes={auditNotes}
        setAuditNotes={setAuditNotes}
        submittingAudit={submittingAudit}
        handleStartAudit={handleStartAudit}
        products={products}
      />
      <CountModal
        isOpen={Boolean(countingItem)}
        onClose={() => setCountingItem(null)}
        countingItem={countingItem}
        countQuantityInput={countQuantityInput}
        setCountQuantityInput={setCountQuantityInput}
        countNotesInput={countNotesInput}
        setCountNotesInput={setCountNotesInput}
        submittingCount={submittingCount}
        handleRecordCount={handleRecordCount}
      />
      <CompleteAuditModal
        isOpen={completeAuditModalOpen && Boolean(selectedAudit)}
        onClose={() => setCompleteAuditModalOpen(false)}
        selectedAudit={selectedAudit}
        submittingCompleteAudit={submittingCompleteAudit}
        completeAuditError={completeAuditError}
        handleCompleteAudit={handleCompleteAudit}
      />
      <CancelAuditModal
        isOpen={cancelAuditModalOpen && Boolean(selectedAudit)}
        onClose={() => setCancelAuditModalOpen(false)}
        selectedAudit={selectedAudit}
        cancelAuditReason={cancelAuditReason}
        setCancelAuditReason={setCancelAuditReason}
        submittingCancelAudit={submittingCancelAudit}
        handleCancelAudit={handleCancelAudit}
      />

      {/* 5. Expense Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        editingExpense={editingExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        expenseFormError={expenseFormError}
        savingExpense={savingExpense}
        handleSaveExpense={handleSaveExpense}
      />
      <DeleteExpenseModal
        isOpen={deleteExpenseModalOpen && Boolean(expenseToDelete)}
        onClose={() => setDeleteExpenseModalOpen(false)}
        expenseToDelete={expenseToDelete}
        deletingExpense={deletingExpense}
        handleDeleteExpense={handleDeleteExpense}
      />

      {/* 6. Surplus Clearance Modals */}
      <CreateSurplusModal
        isOpen={createSurplusModalOpen}
        onClose={() => setCreateSurplusModalOpen(false)}
        createSurplusForm={createSurplusForm}
        setCreateSurplusForm={setCreateSurplusForm}
        selectedProductForSurplus={selectedProductForSurplus}
        submittingCreateSurplus={submittingCreateSurplus}
        createSurplusError={createSurplusError}
        handleSubmitCreateSurplus={handleSubmitCreateSurplus}
        handleSelectProductForSurplus={handleSelectProductForSurplus}
        products={products}
      />
      <SurplusSaleModal
        isOpen={surplusSaleModalOpen && Boolean(surplusListingForSale)}
        onClose={() => setSurplusSaleModalOpen(false)}
        surplusListingForSale={surplusListingForSale}
        surplusSaleForm={surplusSaleForm}
        setSurplusSaleForm={setSurplusSaleForm}
        submittingSurplusSale={submittingSurplusSale}
        surplusSaleError={surplusSaleError}
        handleSubmitSurplusSale={handleSubmitSurplusSale}
      />
      <CancelSurplusModal
        isOpen={cancelSurplusModalOpen && Boolean(surplusListingToCancel)}
        onClose={() => setCancelSurplusModalOpen(false)}
        surplusListingToCancel={surplusListingToCancel}
        cancelSurplusReason={cancelSurplusReason}
        setCancelSurplusReason={setCancelSurplusReason}
        submittingCancelSurplus={submittingCancelSurplus}
        handleConfirmCancelSurplus={handleConfirmCancelSurplus}
      />
      <SurplusDetailModal
        isOpen={surplusDetailModalOpen && Boolean(selectedSurplusDetail)}
        onClose={() => setSurplusDetailModalOpen(false)}
        selectedSurplusDetail={selectedSurplusDetail}
        loadingSurplusDetail={loadingSurplusDetail}
        viewSaleDetails={viewSaleDetails}
      />
    </>
  );
}
