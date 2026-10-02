import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Truck,
  ClipboardCheck,
  Warehouse as WarehouseIcon,
  Layers,
  Boxes,
  PackageCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  useWarehouses,
  useWarehouseMetrics,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useStockBalances,
  useInventoryTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useInventoryAdjustment,
  useMaterialsCatalog,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useProductsCatalog,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks';
import type { Warehouse, InventoryStockBalance, MaterialCatalogItem, ProductCatalogItem, InventoryTransaction } from '../types';
import type {
  WarehouseFormValues,
  TransactionFormValues,
  InventoryAdjustmentFormValues,
  MaterialFormValues,
  ProductFormValues,
} from '../validation/warehouse-schemas';
import {
  WarehouseMetricCards,
  WarehouseFilterBar,
  WarehouseTable,
  WarehouseFormDialog,
  WarehouseDetailModal,
  WarehouseDeleteDialog,
  StockBalanceTable,
  TransactionTable,
  TransactionFormDialog,
  TransactionDeleteDialog,
  InventoryAdjustmentDialog,
  MaterialCatalogTable,
  MaterialFormDialog,
  ProductCatalogTable,
  ProductFormDialog,
  ProductDeleteDialog,
} from '../components';

export type WarehouseTab =
  | 'stock'
  | 'transactions'
  | 'products'
  | 'materials'
  | 'inventory'
  | 'locations';

export const WarehousePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();

  // Permission evaluations
  const canManage =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('warehouse_keeper') ||
    hasPermission('master_data.manage') ||
    hasPermission('warehouse.transact');

  const canTransact =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('warehouse_keeper') ||
    hasPermission('warehouse.transact');

  const canManageTransactions =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('master_data.manage');

  // Determine active tab from URL
  const getTabFromPath = (path: string): WarehouseTab => {
    if (path.includes('/warehouse/transactions')) return 'transactions';
    if (path.includes('/warehouse/products')) return 'products';
    if (path.includes('/warehouse/materials')) return 'materials';
    if (path.includes('/warehouse/inventory')) return 'inventory';
    if (path.includes('/warehouse/locations')) return 'locations';
    return 'stock';
  };

  const [activeTab, setActiveTab] = useState<WarehouseTab>(getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: WarehouseTab) => {
    setActiveTab(tab);
    navigate(`/warehouse/${tab}`);
  };

  // Dashboard Metrics
  const { data: metrics, isLoading: isMetricsLoading } = useWarehouseMetrics();

  // 1. Warehouse List state
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState('all');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState('all');
  const [warehousePage, setWarehousePage] = useState(1);
  const warehousePageSize = 10;

  const {
    data: warehousesData,
    isLoading: isWarehousesLoading,
    isError: isWarehousesError,
    refetch: refetchWarehouses,
  } = useWarehouses({
    search: warehouseSearch,
    warehouseType: warehouseTypeFilter,
    status: warehouseStatusFilter,
    page: warehousePage,
    pageSize: warehousePageSize,
  });

  const warehousesList = warehousesData?.data ?? [];

  // Warehouse CRUD mutations
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();

  // Warehouse Dialog States
  const [isWarehouseFormOpen, setIsWarehouseFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [selectedWarehouseForDetail, setSelectedWarehouseForDetail] = useState<Warehouse | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);

  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    setIsWarehouseFormOpen(true);
  };

  const handleOpenEditWarehouse = (w: Warehouse) => {
    setEditingWarehouse(w);
    setIsWarehouseFormOpen(true);
  };

  const handleWarehouseFormSubmit = async (values: WarehouseFormValues) => {
    if (editingWarehouse) {
      await updateWarehouseMutation.mutateAsync({ id: editingWarehouse.id, values });
    } else {
      await createWarehouseMutation.mutateAsync(values);
    }
    setIsWarehouseFormOpen(false);
  };

  const handleConfirmDeleteWarehouse = async () => {
    if (deletingWarehouse) {
      await deleteWarehouseMutation.mutateAsync(deletingWarehouse.id);
      setDeletingWarehouse(null);
    }
  };

  // 2. Stock Balance State
  const [stockSearch, setStockSearch] = useState('');
  const [stockWarehouseId, setStockWarehouseId] = useState('all');
  const [stockItemType, setStockItemType] = useState('all');
  const [stockPage, setStockPage] = useState(1);
  const stockPageSize = 50;

  const {
    data: stockBalancesData,
    isLoading: isStockLoading,
    isError: isStockError,
    refetch: refetchStock,
  } = useStockBalances({
    search: stockSearch,
    warehouseId: stockWarehouseId,
    itemType: stockItemType,
    page: stockPage,
    pageSize: stockPageSize,
  });

  // 2b. Materials Catalog State
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategory, setMaterialCategory] = useState('all');
  const [materialPage, setMaterialPage] = useState(1);
  const materialPageSize = 10;

  const {
    data: materialsCatalogData,
    isLoading: isMaterialsLoading,
    isError: isMaterialsError,
    refetch: refetchMaterials,
  } = useMaterialsCatalog({
    search: materialSearch,
    category: materialCategory,
    page: materialPage,
    pageSize: materialPageSize,
  });

  // Material Mutations & Dialog State
  const createMaterialMutation = useCreateMaterial();
  const updateMaterialMutation = useUpdateMaterial();
  const deleteMaterialMutation = useDeleteMaterial();

  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialCatalogItem | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialCatalogItem | null>(null);

  const handleOpenCreateMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialFormOpen(true);
  };

  const handleOpenEditMaterial = (m: MaterialCatalogItem) => {
    setEditingMaterial(m);
    setIsMaterialFormOpen(true);
  };

  const handleMaterialFormSubmit = async (values: MaterialFormValues) => {
    if (editingMaterial) {
      await updateMaterialMutation.mutateAsync({ id: editingMaterial.id, values });
    } else {
      await createMaterialMutation.mutateAsync(values);
    }
    setIsMaterialFormOpen(false);
  };

  const handleConfirmDeleteMaterial = async () => {
    if (deletingMaterial) {
      await deleteMaterialMutation.mutateAsync(deletingMaterial.id);
      setDeletingMaterial(null);
    }
  };

  // 2b. Products Catalog state
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productPage, setProductPage] = useState(1);
  const productPageSize = 10;

  const {
    data: productsCatalogData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProductsCatalog({
    search: productSearch,
    productType: productTypeFilter,
    status: productStatusFilter,
    page: productPage,
    pageSize: productPageSize,
  });

  // Product Mutations & Dialog State
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductCatalogItem | null>(null);

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (p: ProductCatalogItem) => {
    setEditingProduct(p);
    setIsProductFormOpen(true);
  };

  const handleProductFormSubmit = async (values: ProductFormValues) => {
    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct.id, values });
    } else {
      await createProductMutation.mutateAsync(values);
    }
    setIsProductFormOpen(false);
  };

  const handleConfirmDeleteProduct = async () => {
    if (deletingProduct) {
      await deleteProductMutation.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  // 3. Transactions State
  const [txSearch, setTxSearch] = useState('');
  const [txWarehouseId, setTxWarehouseId] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txItemTypeFilter, setTxItemTypeFilter] = useState('all');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [txPage, setTxPage] = useState(1);
  const txPageSize = 10;

  const {
    data: transactionsData,
    isLoading: isTxLoading,
    isError: isTxError,
    refetch: refetchTx,
  } = useInventoryTransactions({
    search: txSearch,
    warehouseId: txWarehouseId,
    transactionType: txTypeFilter,
    itemType: txItemTypeFilter,
    startDate: txStartDate,
    endDate: txEndDate,
    page: txPage,
    pageSize: txPageSize,
  });

  const createTxMutation = useCreateTransaction();
  const updateTxMutation = useUpdateTransaction();
  const deleteTxMutation = useDeleteTransaction();

  const [isTxFormOpen, setIsTxFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<InventoryTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<InventoryTransaction | null>(null);

  const handleOpenCreateTx = () => {
    setEditingTransaction(null);
    setIsTxFormOpen(true);
  };

  const handleOpenEditTx = (tx: InventoryTransaction) => {
    setEditingTransaction(tx);
    setIsTxFormOpen(true);
  };

  const handleTxFormSubmit = async (values: TransactionFormValues) => {
    if (editingTransaction) {
      await updateTxMutation.mutateAsync({ id: editingTransaction.id, values });
    } else {
      await createTxMutation.mutateAsync(values);
    }
    setIsTxFormOpen(false);
    setEditingTransaction(null);
  };

  const handleConfirmDeleteTx = async () => {
    if (deletingTransaction) {
      await deleteTxMutation.mutateAsync(deletingTransaction.id);
      setDeletingTransaction(null);
    }
  };

  // 4. Physical Inventory Adjustment State
  const adjustmentMutation = useInventoryAdjustment();
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [stockItemToAdjust, setStockItemToAdjust] = useState<InventoryStockBalance | null>(null);

  const handleOpenAdjustment = (item: InventoryStockBalance) => {
    setStockItemToAdjust(item);
    setIsAdjustmentOpen(true);
  };

  const handleAdjustmentSubmit = async (values: InventoryAdjustmentFormValues) => {
    await adjustmentMutation.mutateAsync(values);
    setIsAdjustmentOpen(false);
  };

  const tabs = [
    { id: 'stock' as const, label: 'Báo cáo tồn kho', icon: Layers },
    { id: 'transactions' as const, label: 'Nhập / Xuất kho', icon: Truck },
    { id: 'products' as const, label: 'Sản phẩm & Thành phẩm', icon: PackageCheck },
    { id: 'materials' as const, label: 'Vật tư & NVL', icon: Boxes },
    { id: 'inventory' as const, label: 'Kiểm kê định kỳ', icon: ClipboardCheck },
    { id: 'locations' as const, label: 'Kho lưu trữ', icon: WarehouseIcon },
  ];

  const getPageHeader = () => {
    switch (activeTab) {
      case 'transactions':
        return {
          title: 'Lịch sử Nhập / Xuất kho',
          description: 'Theo dõi phiếu giao dịch, luân chuyển vật tư và xuất nhập thành phẩm trong nhà máy',
        };
      case 'products':
        return {
          title: 'Danh mục Sản phẩm & Thành phẩm',
          description: 'Quản lý danh mục sản phẩm, thành phẩm, phụ phẩm, đơn giá bán và định mức sản xuất (bảng products)',
        };
      case 'materials':
        return {
          title: 'Danh mục Vật tư & Định mức',
          description: 'Quản lý nguyên vật liệu chính, hóa chất, phụ tùng cơ điện, bao bì, tiêu hao và định mức tồn kho (bảng materials)',
        };
      case 'inventory':
        return {
          title: 'Kiểm kê kho định kỳ',
          description: 'Biên bản kiểm kê định kỳ, rà soát số dư thực tế và lập phiếu điều chỉnh chênh lệch',
        };
      case 'locations':
        return {
          title: 'Danh mục Kho lưu trữ',
          description: 'Quản lý hệ thống các kho bãi, địa điểm lưu trữ và phân công thủ kho phụ trách (bảng warehouses)',
        };
      default:
        return {
          title: 'Báo cáo Tồn kho tổng hợp',
          description: 'Giám sát số dư tồn kho tức thời phân bổ theo từng kho lưu trữ hoặc tổng hợp theo mặt hàng',
        };
    }
  };

  const pageHeader = getPageHeader();

  return (
    <PageContainer
      title={pageHeader.title}
      description={pageHeader.description}
    >
      <div className="space-y-5">
        {/* Metric Cards */}
        <WarehouseMetricCards metrics={metrics} isLoading={isMetricsLoading} />

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-primary bg-card text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: STOCK BALANCES */}
        {activeTab === 'stock' && (
          <StockBalanceTable
            data={stockBalancesData}
            isLoading={isStockLoading}
            isError={isStockError}
            onRetry={refetchStock}
            warehouses={warehousesList}
            selectedWarehouseId={stockWarehouseId}
            onWarehouseChange={(id) => {
              setStockWarehouseId(id);
              setStockPage(1);
            }}
            selectedItemType={stockItemType}
            onItemTypeChange={(t) => {
              setStockItemType(t);
              setStockPage(1);
            }}
            search={stockSearch}
            onSearchChange={(val) => {
              setStockSearch(val);
              setStockPage(1);
            }}
            onResetFilters={() => {
              setStockSearch('');
              setStockWarehouseId('all');
              setStockItemType('all');
              setStockPage(1);
            }}
            onPageChange={setStockPage}
            onAdjustStock={handleOpenAdjustment}
            canTransact={canTransact}
          />
        )}

        {/* TAB 2: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <ProductCatalogTable
            data={productsCatalogData}
            isLoading={isProductsLoading}
            isError={isProductsError}
            onRetry={refetchProducts}
            search={productSearch}
            onSearchChange={(val) => {
              setProductSearch(val);
              setProductPage(1);
            }}
            selectedProductType={productTypeFilter}
            onProductTypeChange={(t) => {
              setProductTypeFilter(t);
              setProductPage(1);
            }}
            selectedStatus={productStatusFilter}
            onStatusChange={(s) => {
              setProductStatusFilter(s);
              setProductPage(1);
            }}
            onResetFilters={() => {
              setProductSearch('');
              setProductTypeFilter('all');
              setProductStatusFilter('all');
              setProductPage(1);
            }}
            onPageChange={setProductPage}
            canManage={canManage}
            onOpenCreate={handleOpenCreateProduct}
            onEdit={handleOpenEditProduct}
            onDelete={setDeletingProduct}
          />
        )}

        {/* TAB 3: MATERIALS CATALOG */}
        {activeTab === 'materials' && (
          <MaterialCatalogTable
            data={materialsCatalogData}
            isLoading={isMaterialsLoading}
            isError={isMaterialsError}
            onRetry={refetchMaterials}
            search={materialSearch}
            onSearchChange={(val) => {
              setMaterialSearch(val);
              setMaterialPage(1);
            }}
            selectedCategory={materialCategory}
            onCategoryChange={(cat) => {
              setMaterialCategory(cat);
              setMaterialPage(1);
            }}
            onResetFilters={() => {
              setMaterialSearch('');
              setMaterialCategory('all');
              setMaterialPage(1);
            }}
            onPageChange={setMaterialPage}
            canManage={canManage}
            onOpenCreate={handleOpenCreateMaterial}
            onEdit={handleOpenEditMaterial}
            onDelete={setDeletingMaterial}
          />
        )}

        {/* TAB 4: WAREHOUSES LIST / LOCATIONS */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <WarehouseFilterBar
              search={warehouseSearch}
              onSearchChange={(val) => {
                setWarehouseSearch(val);
                setWarehousePage(1);
              }}
              warehouseType={warehouseTypeFilter}
              onWarehouseTypeChange={(t) => {
                setWarehouseTypeFilter(t);
                setWarehousePage(1);
              }}
              status={warehouseStatusFilter}
              onStatusChange={(s) => {
                setWarehouseStatusFilter(s);
                setWarehousePage(1);
              }}
              onReset={() => {
                setWarehouseSearch('');
                setWarehouseTypeFilter('all');
                setWarehouseStatusFilter('all');
                setWarehousePage(1);
              }}
              onOpenCreate={handleOpenCreateWarehouse}
              canManage={canManage}
            />
            <WarehouseTable
              data={warehousesData}
              isLoading={isWarehousesLoading}
              isError={isWarehousesError}
              onRetry={refetchWarehouses}
              onPageChange={setWarehousePage}
              onViewDetail={setSelectedWarehouseForDetail}
              onEdit={handleOpenEditWarehouse}
              onDelete={setDeletingWarehouse}
              canManage={canManage}
              onOpenCreate={handleOpenCreateWarehouse}
            />
          </div>
        )}

        {/* TAB 2: TRANSACTIONS (NHẬP / XUẤT) */}
        {activeTab === 'transactions' && (
          <TransactionTable
            data={transactionsData}
            isLoading={isTxLoading}
            isError={isTxError}
            onRetry={refetchTx}
            warehouses={warehousesList}
            selectedWarehouseId={txWarehouseId}
            onWarehouseChange={(id) => {
              setTxWarehouseId(id);
              setTxPage(1);
            }}
            selectedTxType={txTypeFilter}
            onTxTypeChange={(t) => {
              setTxTypeFilter(t);
              setTxPage(1);
            }}
            selectedItemType={txItemTypeFilter}
            onItemTypeChange={(t) => {
              setTxItemTypeFilter(t);
              setTxPage(1);
            }}
            search={txSearch}
            onSearchChange={(val) => {
              setTxSearch(val);
              setTxPage(1);
            }}
            startDate={txStartDate}
            onStartDateChange={(val) => {
              setTxStartDate(val);
              setTxPage(1);
            }}
            endDate={txEndDate}
            onEndDateChange={(val) => {
              setTxEndDate(val);
              setTxPage(1);
            }}
            onResetFilters={() => {
              setTxSearch('');
              setTxWarehouseId('all');
              setTxTypeFilter('all');
              setTxItemTypeFilter('all');
              setTxStartDate('');
              setTxEndDate('');
              setTxPage(1);
            }}
            onPageChange={setTxPage}
            onOpenCreateTx={handleOpenCreateTx}
            canTransact={canTransact}
            canManageTransactions={canManageTransactions}
            onEditTransaction={handleOpenEditTx}
            onDeleteTransaction={setDeletingTransaction}
          />
        )}

        {/* TAB 3: INVENTORY ADJUSTMENT / COUNTING */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Quy trình kiểm kê & Điều chỉnh tồn kho</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chọn mặt hàng cần kiểm đếm để đối chiếu số lượng thực tế với dữ liệu sổ sách hệ thống.
                  </p>
                </div>
              </div>
            </div>

            <StockBalanceTable
              data={stockBalancesData}
              isLoading={isStockLoading}
              isError={isStockError}
              onRetry={refetchStock}
              warehouses={warehousesList}
              selectedWarehouseId={stockWarehouseId}
              onWarehouseChange={(id) => {
                setStockWarehouseId(id);
                setStockPage(1);
              }}
              selectedItemType={stockItemType}
              onItemTypeChange={(t) => {
                setStockItemType(t);
                setStockPage(1);
              }}
              search={stockSearch}
              onSearchChange={(val) => {
                setStockSearch(val);
                setStockPage(1);
              }}
              onResetFilters={() => {
                setStockSearch('');
                setStockWarehouseId('all');
                setStockItemType('all');
                setStockPage(1);
              }}
              onPageChange={setStockPage}
              onAdjustStock={handleOpenAdjustment}
              canTransact={canTransact}
            />
          </div>
        )}

        {/* Dialogs & Modals */}
        <WarehouseFormDialog
          isOpen={isWarehouseFormOpen}
          onClose={() => setIsWarehouseFormOpen(false)}
          warehouseToEdit={editingWarehouse}
          onSubmit={handleWarehouseFormSubmit}
          isSubmitting={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
        />

        <WarehouseDetailModal
          warehouse={selectedWarehouseForDetail}
          isOpen={!!selectedWarehouseForDetail}
          onClose={() => setSelectedWarehouseForDetail(null)}
          onEdit={handleOpenEditWarehouse}
          canManage={canManage}
        />

        <WarehouseDeleteDialog
          isOpen={!!deletingWarehouse}
          warehouse={deletingWarehouse}
          onClose={() => setDeletingWarehouse(null)}
          onConfirm={handleConfirmDeleteWarehouse}
          isDeleting={deleteWarehouseMutation.isPending}
        />

        <TransactionFormDialog
          isOpen={isTxFormOpen}
          onClose={() => {
            setIsTxFormOpen(false);
            setEditingTransaction(null);
          }}
          warehouses={warehousesList}
          transactionToEdit={editingTransaction}
          onSubmit={handleTxFormSubmit}
          isSubmitting={createTxMutation.isPending || updateTxMutation.isPending}
        />

        <TransactionDeleteDialog
          isOpen={!!deletingTransaction}
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={handleConfirmDeleteTx}
          isDeleting={deleteTxMutation.isPending}
        />

        <InventoryAdjustmentDialog
          isOpen={isAdjustmentOpen}
          onClose={() => {
            setIsAdjustmentOpen(false);
            setStockItemToAdjust(null);
          }}
          stockItem={stockItemToAdjust}
          onSubmit={handleAdjustmentSubmit}
          isSubmitting={adjustmentMutation.isPending}
        />

        {/* Material Form Dialog (Thêm mới / Chỉnh sửa Vật tư) */}
        <MaterialFormDialog
          isOpen={isMaterialFormOpen}
          onClose={() => setIsMaterialFormOpen(false)}
          materialToEdit={editingMaterial}
          onSubmit={handleMaterialFormSubmit}
          isSubmitting={createMaterialMutation.isPending || updateMaterialMutation.isPending}
        />

        {/* Material Delete Confirmation Dialog */}
        {deletingMaterial && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-material-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setDeletingMaterial(null)}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 id="delete-material-dialog-title" className="text-sm font-bold text-foreground">
                    Xác nhận xóa vật tư khỏi danh mục
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hành động này sẽ loại bỏ hoàn toàn vật tư khỏi hệ thống.
                  </p>
                </div>
              </div>

              <div className="my-4 rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1.5">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Mã vật tư:</span>
                  <span className="font-mono font-bold text-foreground">{deletingMaterial.code}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Tên vật tư:</span>
                  <span className="font-semibold text-foreground">{deletingMaterial.name}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Đơn vị tính:</span>
                  <span className="text-foreground">{deletingMaterial.unit_of_measure}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingMaterial(null)}
                  disabled={deleteMaterialMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDeleteMaterial}
                  disabled={deleteMaterialMutation.isPending}
                  className="gap-1.5"
                >
                  {deleteMaterialMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xóa vĩnh viễn
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Product Form Dialog */}
        <ProductFormDialog
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          productToEdit={editingProduct}
          onSubmit={handleProductFormSubmit}
          isSubmitting={createProductMutation.isPending || updateProductMutation.isPending}
        />

        {/* Product Delete Dialog */}
        <ProductDeleteDialog
          isOpen={!!deletingProduct}
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleConfirmDeleteProduct}
          isDeleting={deleteProductMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
