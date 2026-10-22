import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Users,
  Truck,
  Building2,
  FileQuestion,
  Plus,
  Calendar,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/components/feedback/use-toast';
import { cn } from '@/lib/utils';

// Types
import {
  INITIAL_REQUESTS,
  type SalesOrder,
  type PurchaseOrder,
  type Customer,
  type Supplier,
  type SalesOrderFilterParams,
  type PurchaseOrderFilterParams,
  type CustomerFilterParams,
  type SupplierFilterParams,
  type SalesOrderStatus,
  type PurchaseOrderStatus,
  type ProcurementRequest,
} from '../types';
import type {
  SalesOrderFormValues,
  PurchaseOrderFormValues,
  CustomerFormValues,
  SupplierFormValues,
} from '../validation/sales-schemas';

// Queries & Mutations
import {
  useSalesMetrics,
  useSalesProcurementDashboard,
  useSalesOrders,
  useCreateSalesOrder,
  useUpdateSalesOrder,
  useUpdateSalesOrderStatus,
  useDeleteSalesOrder,
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useDeletePurchaseOrder,
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useProductOptions,
  useMaterialOptions,
} from '../hooks/use-sales-queries';

// Components
import { SalesMetricCards } from '../components/sales-metric-cards';
import { SalesProcurementDashboard } from '../components/sales-procurement-dashboard';
import { SalesOrderTable } from '../components/sales-order-table';
import { SalesOrderFilterBar } from '../components/sales-order-filter-bar';
import { SalesOrderFormDialog } from '../components/sales-order-form-dialog';
import { SalesOrderDetailModal } from '../components/sales-order-detail-modal';
import { SalesOrderDeleteDialog } from '../components/sales-order-delete-dialog';
import { CustomerTable } from '../components/customer-table';
import { CustomerFormDialog } from '../components/customer-form-dialog';
import { CustomerDeleteDialog } from '../components/customer-delete-dialog';
import { PurchaseOrderTable } from '../components/purchase-order-table';
import { PurchaseOrderFilterBar } from '../components/purchase-order-filter-bar';
import { PurchaseOrderFormDialog } from '../components/purchase-order-form-dialog';
import { PurchaseOrderDetailModal } from '../components/purchase-order-detail-modal';
import { PurchaseOrderDeleteDialog } from '../components/purchase-order-delete-dialog';
import { SupplierTable } from '../components/supplier-table';
import { SupplierFormDialog } from '../components/supplier-form-dialog';
import { SupplierDeleteDialog } from '../components/supplier-delete-dialog';
import { ProcurementRequestPanel } from '../components/procurement-request-panel';
import { PurchaseOrderReceiveDialog } from '../components/purchase-order-receive-dialog';
import { SalesOrderDispatchDialog } from '../components/sales-order-dispatch-dialog';
import { SalesDispatchCalendar } from '../components/sales-dispatch-calendar';

export type SalesTab =
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'procurement-orders'
  | 'suppliers'
  | 'procurement-requests';

export const SalesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();
  const { success, error: toastError } = useToast();

  // Permissions evaluation
  const canManageSales =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('sales.order.manage');

  const canManageCustomers =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('sales.customer.manage') ||
    hasPermission('sales.order.manage');

  const canManagePurchase =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('purchase.order.manage') ||
    hasPermission('warehouse.transact');

  const canManageSuppliers =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('purchase.supplier.manage') ||
    hasPermission('master_data.manage');

  const canApprovePR =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('purchase.order.manage');

  const isAdmin = hasRole('admin') || hasRole('plant_manager');

  // Determine active tab from current URL
  const getTabFromPath = (path: string, search?: string): SalesTab => {
    if (search && search.includes('tab=dashboard')) return 'dashboard';
    if (search && search.includes('tab=suppliers')) return 'suppliers';
    if (path.includes('/sales/dashboard')) return 'dashboard';
    if (path.includes('/sales/suppliers') || path.includes('/procurement/suppliers'))
      return 'suppliers';
    if (path.includes('/sales/customers')) return 'customers';
    if (path.includes('/procurement/orders')) return 'procurement-orders';
    if (path.includes('/procurement/requests')) return 'procurement-requests';
    if (path.includes('/sales/orders')) return 'orders';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<SalesTab>(() =>
    getTabFromPath(location.pathname, location.search),
  );

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname, location.search));
  }, [location.pathname, location.search]);

  const handleTabChange = (tab: SalesTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'dashboard':
        navigate('/sales/dashboard');
        break;
      case 'orders':
        navigate('/sales/orders');
        break;
      case 'customers':
        navigate('/sales/customers');
        break;
      case 'procurement-orders':
        navigate('/procurement/orders');
        break;
      case 'suppliers':
        navigate('/procurement/suppliers');
        break;
      case 'procurement-requests':
        navigate('/procurement/requests');
        break;
    }
  };

  // Metrics, Dashboard & Catalogs
  const { data: metrics, isLoading: isMetricsLoading } = useSalesMetrics();
  const { data: dashboardData, isLoading: isDashboardLoading } = useSalesProcurementDashboard();
  const { data: products = [] } = useProductOptions();
  const { data: materials = [] } = useMaterialOptions();

  // 1. Sales Orders State & Queries
  const [salesFilters, setSalesFilters] = useState<SalesOrderFilterParams>({
    search: '',
    status: 'all',
    customerId: 'all',
    page: 1,
    pageSize: 10,
  });

  const {
    data: salesOrdersData,
    isLoading: isSalesOrdersLoading,
    isError: isSalesOrdersError,
    refetch: refetchSalesOrders,
  } = useSalesOrders(salesFilters);

  const createSalesOrderMutation = useCreateSalesOrder();
  const updateSalesOrderMutation = useUpdateSalesOrder();
  const updateSalesOrderStatusMutation = useUpdateSalesOrderStatus();
  const deleteSalesOrderMutation = useDeleteSalesOrder();

  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [isSalesOrderFormOpen, setIsSalesOrderFormOpen] = useState(false);
  const [isSalesOrderDetailOpen, setIsSalesOrderDetailOpen] = useState(false);
  const [isSalesOrderDeleteOpen, setIsSalesOrderDeleteOpen] = useState(false);
  const [isSalesOrderDispatchOpen, setIsSalesOrderDispatchOpen] = useState(false);
  const [dispatchingSalesOrder, setDispatchingSalesOrder] = useState<SalesOrder | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);

  // Dedicated queries for master schedule calendar (fetching up to 100 orders for comprehensive month view)
  const { data: calendarSalesData, isLoading: isCalendarSalesLoading } = useSalesOrders({
    page: 1,
    pageSize: 100,
    status: 'all',
  });
  const { data: calendarPurchaseData, isLoading: isCalendarPurchaseLoading } = usePurchaseOrders({
    page: 1,
    pageSize: 100,
    status: 'all',
  });

  // 2. Customers State & Queries
  const [customerFilters, setCustomerFilters] = useState<CustomerFilterParams>({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 10,
  });

  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useCustomers(customerFilters);

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isCustomerDeleteOpen, setIsCustomerDeleteOpen] = useState(false);

  // 3. Purchase Orders State & Queries
  const [purchaseFilters, setPurchaseFilters] = useState<PurchaseOrderFilterParams>({
    search: '',
    status: 'all',
    supplierId: 'all',
    page: 1,
    pageSize: 10,
  });

  const {
    data: purchaseOrdersData,
    isLoading: isPurchaseOrdersLoading,
    isError: isPurchaseOrdersError,
    refetch: refetchPurchaseOrders,
  } = usePurchaseOrders(purchaseFilters);

  const createPurchaseOrderMutation = useCreatePurchaseOrder();
  const updatePurchaseOrderMutation = useUpdatePurchaseOrder();
  const updatePurchaseOrderStatusMutation = useUpdatePurchaseOrderStatus();
  const deletePurchaseOrderMutation = useDeletePurchaseOrder();

  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [isPurchaseOrderDetailOpen, setIsPurchaseOrderDetailOpen] = useState(false);
  const [isPurchaseOrderDeleteOpen, setIsPurchaseOrderDeleteOpen] = useState(false);
  const [isPurchaseOrderReceiveOpen, setIsPurchaseOrderReceiveOpen] = useState(false);
  const [receivingPurchaseOrder, setReceivingPurchaseOrder] = useState<PurchaseOrder | null>(null);

  // 4. Suppliers State & Queries
  const [supplierFilters, setSupplierFilters] = useState<SupplierFilterParams>({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 10,
  });

  const {
    data: suppliersData,
    isLoading: isSuppliersLoading,
    isError: isSuppliersError,
    refetch: refetchSuppliers,
  } = useSuppliers(supplierFilters);

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isSupplierDeleteOpen, setIsSupplierDeleteOpen] = useState(false);

  // 5. Procurement Requests (PR) State & Local Persistence
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(() => {
    try {
      const saved = localStorage.getItem('its_procurement_requests');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_REQUESTS;
  });

  const [sourcePR, setSourcePR] = useState<ProcurementRequest | null>(null);

  const handleSaveRequests = (newReqs: ProcurementRequest[]) => {
    setProcurementRequests(newReqs);
    try {
      localStorage.setItem('its_procurement_requests', JSON.stringify(newReqs));
    } catch {
      // ignore
    }
  };

  const handleUpdatePRStatus = (id: string, newStatus: ProcurementRequest['status']) => {
    const updated = procurementRequests.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r,
    );
    handleSaveRequests(updated);
  };

  const handleCreatePR = (newPr: ProcurementRequest) => {
    const updated = [newPr, ...procurementRequests];
    handleSaveRequests(updated);
    success(`Đã tạo phiếu đề xuất mua sắm ${newPr.pr_code} thành công`);
  };

  const handleEditPR = (updatedPr: ProcurementRequest) => {
    const updated = procurementRequests.map((r) =>
      r.id === updatedPr.id ? updatedPr : r,
    );
    handleSaveRequests(updated);
    success(`Đã cập nhật phiếu đề xuất ${updatedPr.pr_code} thành công`);
  };

  const handleDeletePR = (id: string) => {
    const target = procurementRequests.find((r) => r.id === id);
    const updated = procurementRequests.filter((r) => r.id !== id);
    handleSaveRequests(updated);
    success(`Đã xóa phiếu đề xuất ${target?.pr_code || id} thành công`);
  };

  // Handlers - Sales Orders
  const handleSaveSalesOrder = async (values: SalesOrderFormValues) => {
    try {
      if (selectedSalesOrder) {
        await updateSalesOrderMutation.mutateAsync({
          id: selectedSalesOrder.id,
          values,
        });
        success('Cập nhật đơn hàng thành công');
      } else {
        await createSalesOrderMutation.mutateAsync(values);
        success('Tạo đơn hàng mới thành công');
      }
      setIsSalesOrderFormOpen(false);
      setSelectedSalesOrder(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Lỗi khi lưu đơn hàng');
    }
  };

  const handleUpdateSalesOrderStatus = async (
    order: SalesOrder,
    status: SalesOrderStatus,
  ) => {
    try {
      await updateSalesOrderStatusMutation.mutateAsync({ id: order.id, status });
      success(`Cập nhật trạng thái đơn ${order.order_code} thành công`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteSalesOrder = async (id: string) => {
    try {
      await deleteSalesOrderMutation.mutateAsync(id);
      success('Đã xóa đơn hàng thành công');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Không thể xóa đơn hàng');
    }
  };

  const handleOpenDispatchSalesOrder = (order: SalesOrder) => {
    setDispatchingSalesOrder(order);
    setIsSalesOrderDispatchOpen(true);
  };

  // Handlers - Customers
  const handleSaveCustomer = async (values: CustomerFormValues) => {
    try {
      if (selectedCustomer) {
        await updateCustomerMutation.mutateAsync({
          id: selectedCustomer.id,
          values,
        });
        success('Cập nhật khách hàng thành công');
      } else {
        await createCustomerMutation.mutateAsync(values);
        success('Thêm mới khách hàng thành công');
      }
      setIsCustomerFormOpen(false);
      setSelectedCustomer(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Lỗi khi lưu khách hàng');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomerMutation.mutateAsync(id);
      success('Đã xóa khách hàng thành công');
    } catch (err: unknown) {
      toastError(
        err instanceof Error
          ? err.message
          : 'Không thể xóa khách hàng do có dữ liệu liên kết',
      );
    }
  };

  // Handlers - Purchase Orders
  const handleSavePurchaseOrder = async (values: PurchaseOrderFormValues) => {
    try {
      if (selectedPurchaseOrder) {
        await updatePurchaseOrderMutation.mutateAsync({
          id: selectedPurchaseOrder.id,
          values,
        });
        success('Cập nhật đơn mua hàng thành công');
      } else {
        await createPurchaseOrderMutation.mutateAsync(values);
        success('Lập đơn đặt mua hàng thành công');
      }
      setIsPurchaseOrderFormOpen(false);
      setSelectedPurchaseOrder(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Lỗi khi lưu đơn mua hàng');
    }
  };

  const handleUpdatePurchaseOrderStatus = async (
    order: PurchaseOrder,
    status: PurchaseOrderStatus,
  ) => {
    try {
      await updatePurchaseOrderStatusMutation.mutateAsync({ id: order.id, status });
      success(`Cập nhật trạng thái đơn ${order.po_code} thành công`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeletePurchaseOrder = async (id: string) => {
    try {
      await deletePurchaseOrderMutation.mutateAsync(id);
      success('Đã xóa đơn mua hàng thành công');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Không thể xóa đơn mua hàng');
    }
  };

  const handleOpenReceivePurchaseOrder = (order: PurchaseOrder) => {
    setReceivingPurchaseOrder(order);
    setIsPurchaseOrderReceiveOpen(true);
  };

  // Handlers - Suppliers
  const handleSaveSupplier = async (values: SupplierFormValues) => {
    try {
      if (selectedSupplier) {
        await updateSupplierMutation.mutateAsync({
          id: selectedSupplier.id,
          values,
        });
        success('Cập nhật nhà cung cấp thành công');
      } else {
        await createSupplierMutation.mutateAsync(values);
        success('Thêm mới nhà cung cấp thành công');
      }
      setIsSupplierFormOpen(false);
      setSelectedSupplier(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Lỗi khi lưu nhà cung cấp');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplierMutation.mutateAsync(id);
      success('Đã xóa nhà cung cấp thành công');
    } catch (err: unknown) {
      toastError(
        err instanceof Error
          ? err.message
          : 'Không thể xóa nhà cung cấp do có dữ liệu liên kết',
      );
    }
  };

  // Convert PR to PO
  const handleConvertToPO = (pr: ProcurementRequest) => {
    setSourcePR(pr);
    setSelectedPurchaseOrder(null);
    setIsPurchaseOrderFormOpen(true);
  };

  // Page title and description depending on active tab
  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Tổng Quan Kinh Doanh & Mua Sắm (Command Center)',
          description:
            'Trung tâm chỉ huy điều hành kinh doanh bán cát, chuỗi cung ứng vật tư, cảnh báo tiến độ và dòng tiền',
        };
      case 'customers':
        return {
          title: 'Khách Hàng & Đối Tác Thương Mại',
          description: 'Danh bạ khách hàng B2B, quản lý hạn mức tín dụng và lịch sử đối soát giao dịch',
        };
      case 'procurement-orders':
        return {
          title: 'Đơn Đặt Mua Nhà Cung Ứng (PO)',
          description: 'Theo dõi đơn hàng thu mua nguyên vật liệu thô, vật tư phụ trợ và nhiên liệu vận hành xưởng',
        };
      case 'suppliers':
        return {
          title: 'Danh Bạ Nhà Cung Cấp (Suppliers)',
          description: 'Quản lý thông tin đối tác cung ứng mỏ khoáng sản, thiết bị kỹ thuật và xăng dầu',
        };
      case 'procurement-requests':
        return {
          title: 'Đề Xuất Mua Sắm Vật Tư (PR)',
          description: 'Trung tâm tiếp nhận, xét duyệt đề xuất vật tư các xưởng và luân chuyển sang đơn mua hàng',
        };
      default:
        return {
          title: 'Kinh Doanh & Đơn Hàng Bán Buôn (SO)',
          description: 'Quản lý hợp đồng cung ứng cát thành phẩm, tiến độ đơn hàng và giao nhận xuất bán',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <PageContainer
      title={meta.title}
      description={meta.description}
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'dashboard' && (
            <>
              {canManageSales && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedSalesOrder(null);
                    setIsSalesOrderFormOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tạo đơn bán</span>
                </Button>
              )}
              {canManagePurchase && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPurchaseOrder(null);
                    setIsPurchaseOrderFormOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Lập đơn mua PO</span>
                </Button>
              )}
            </>
          )}

          {activeTab === 'orders' && canManageSales && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedSalesOrder(null);
                setIsSalesOrderFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo đơn bán hàng</span>
            </Button>
          )}

          {activeTab === 'customers' && canManageCustomers && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedCustomer(null);
                setIsCustomerFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm khách hàng</span>
            </Button>
          )}

          {activeTab === 'procurement-orders' && canManagePurchase && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedPurchaseOrder(null);
                setIsPurchaseOrderFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Lập đơn mua PO</span>
            </Button>
          )}

          {activeTab === 'suppliers' && canManageSuppliers && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedSupplier(null);
                setIsSupplierFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nhà cung cấp</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              activeTab === 'dashboard'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard Kinh Doanh</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              activeTab === 'orders'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Đơn Hàng Bán (SO)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('customers')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              activeTab === 'customers'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Users className="h-4 w-4" />
            <span>Danh Mục Khách Hàng</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('procurement-requests')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              activeTab === 'procurement-requests'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <FileQuestion className="h-4 w-4" />
            <span>Đề Xuất Mua Sắm (PR)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('procurement-orders')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              activeTab === 'procurement-orders'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Truck className="h-4 w-4" />
            <span>Đơn Đặt Mua NCC (PO)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('suppliers')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              activeTab === 'suppliers'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>Danh Bạ Nhà Cung Cấp</span>
          </button>
        </div>

        {/* Tab 0: Executive Command Center Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <SalesProcurementDashboard
              data={dashboardData}
              isLoading={isDashboardLoading}
              onNavigateTab={handleTabChange}
              onOpenCreateSO={() => {
                setSelectedSalesOrder(null);
                setIsSalesOrderFormOpen(true);
              }}
              onOpenCreatePO={() => {
                setSelectedPurchaseOrder(null);
                setIsPurchaseOrderFormOpen(true);
              }}
              canManageSales={canManageSales}
              canManagePurchase={canManagePurchase}
            />

            {/* Master Logistics Calendar integrated into Dashboard view */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Lịch Kế Hoạch Xuất - Nhập Hàng
                      </h3>
                      <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        Tổng hợp SO & PO
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Theo dõi lịch xuất giao thành phẩm cho khách hàng và tiếp nhận nguyên vật liệu từ nhà cung cấp
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  {isCalendarOpen ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Thu gọn lịch</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>Mở rộng lịch kế hoạch</span>
                    </>
                  )}
                </Button>
              </div>

              {isCalendarOpen && (
                <SalesDispatchCalendar
                  salesOrders={calendarSalesData?.items || salesOrdersData?.items || []}
                  purchaseOrders={calendarPurchaseData?.items || purchaseOrdersData?.items || []}
                  customers={customersData?.items || []}
                  suppliers={suppliersData?.items || []}
                  isLoading={isCalendarSalesLoading || isCalendarPurchaseLoading}
                  canManageSales={canManageSales}
                  canManagePurchase={canManagePurchase}
                  onViewSalesOrder={(order) => {
                    setSelectedSalesOrder(order);
                    setIsSalesOrderDetailOpen(true);
                  }}
                  onDispatchSalesOrder={handleOpenDispatchSalesOrder}
                  onViewPurchaseOrder={(order) => {
                    setSelectedPurchaseOrder(order);
                    setIsPurchaseOrderDetailOpen(true);
                  }}
                  onReceivePurchaseOrder={(order) => {
                    setReceivingPurchaseOrder(order);
                    setIsPurchaseOrderReceiveOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Operational Tabs Header Context: KPI metrics only (Calendar removed from operational views per requirement) */}
        {activeTab !== 'dashboard' && (
          <SalesMetricCards metrics={metrics} isLoading={isMetricsLoading} />
        )}

        {/* Tab 1: Sales Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <SalesOrderFilterBar
              filters={salesFilters}
              customers={customersData?.items || []}
              onFilterChange={(newFilters) =>
                setSalesFilters((prev) => ({ ...prev, ...newFilters }))
              }
              onReset={() =>
                setSalesFilters({
                  search: '',
                  status: 'all',
                  customerId: 'all',
                  page: 1,
                  pageSize: 10,
                })
              }
            />

            <SalesOrderTable
              data={salesOrdersData}
              isLoading={isSalesOrdersLoading}
              isError={isSalesOrdersError}
              canManage={canManageSales}
              onPageChange={(page) => setSalesFilters((prev) => ({ ...prev, page }))}
              onPageSizeChange={(pageSize) =>
                setSalesFilters((prev) => ({ ...prev, pageSize, page: 1 }))
              }
              onViewDetail={(order) => {
                setSelectedSalesOrder(order);
                setIsSalesOrderDetailOpen(true);
              }}
              onEdit={(order) => {
                setSelectedSalesOrder(order);
                setIsSalesOrderFormOpen(true);
              }}
              onDelete={(order) => {
                setSelectedSalesOrder(order);
                setIsSalesOrderDeleteOpen(true);
              }}
              onDispatch={handleOpenDispatchSalesOrder}
              onStatusChange={handleUpdateSalesOrderStatus}
              onRetry={refetchSalesOrders}
            />
          </div>
        )}

        {/* Tab 2: Customers */}
        {activeTab === 'customers' && (
          <CustomerTable
            data={customersData}
            isLoading={isCustomersLoading}
            isError={isCustomersError}
            canManage={canManageCustomers}
            filters={customerFilters}
            onFilterChange={(newFilters) =>
              setCustomerFilters((prev) => ({ ...prev, ...newFilters }))
            }
            onPageChange={(page) => setCustomerFilters((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) =>
              setCustomerFilters((prev) => ({ ...prev, pageSize, page: 1 }))
            }
            onEdit={(customer) => {
              setSelectedCustomer(customer);
              setIsCustomerFormOpen(true);
            }}
            onDelete={(customer) => {
              setSelectedCustomer(customer);
              setIsCustomerDeleteOpen(true);
            }}
            onRetry={refetchCustomers}
          />
        )}

        {/* Tab 3: Purchase Orders */}
        {activeTab === 'procurement-orders' && (
          <div className="space-y-4">
            <PurchaseOrderFilterBar
              filters={purchaseFilters}
              suppliers={suppliersData?.items || []}
              onFilterChange={(newFilters) =>
                setPurchaseFilters((prev) => ({ ...prev, ...newFilters }))
              }
              onReset={() =>
                setPurchaseFilters({
                  search: '',
                  status: 'all',
                  supplierId: 'all',
                  page: 1,
                  pageSize: 10,
                })
              }
            />

            <PurchaseOrderTable
              data={purchaseOrdersData}
              isLoading={isPurchaseOrdersLoading}
              isError={isPurchaseOrdersError}
              canManage={canManagePurchase}
              onPageChange={(page) => setPurchaseFilters((prev) => ({ ...prev, page }))}
              onPageSizeChange={(pageSize) =>
                setPurchaseFilters((prev) => ({ ...prev, pageSize, page: 1 }))
              }
              onViewDetail={(order) => {
                setSelectedPurchaseOrder(order);
                setIsPurchaseOrderDetailOpen(true);
              }}
              onEdit={(order) => {
                setSelectedPurchaseOrder(order);
                setIsPurchaseOrderFormOpen(true);
              }}
              onDelete={(order) => {
                setSelectedPurchaseOrder(order);
                setIsPurchaseOrderDeleteOpen(true);
              }}
              onReceiveGoods={handleOpenReceivePurchaseOrder}
              onStatusChange={handleUpdatePurchaseOrderStatus}
              onRetry={refetchPurchaseOrders}
            />
          </div>
        )}

        {/* Tab 4: Suppliers */}
        {activeTab === 'suppliers' && (
          <SupplierTable
            data={suppliersData}
            isLoading={isSuppliersLoading}
            isError={isSuppliersError}
            canManage={canManageSuppliers}
            filters={supplierFilters}
            onFilterChange={(newFilters) =>
              setSupplierFilters((prev) => ({ ...prev, ...newFilters }))
            }
            onPageChange={(page) => setSupplierFilters((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) =>
              setSupplierFilters((prev) => ({ ...prev, pageSize, page: 1 }))
            }
            onEdit={(supplier) => {
              setSelectedSupplier(supplier);
              setIsSupplierFormOpen(true);
            }}
            onDelete={(supplier) => {
              setSelectedSupplier(supplier);
              setIsSupplierDeleteOpen(true);
            }}
            onRetry={refetchSuppliers}
          />
        )}

        {/* Tab 5: Procurement Requests (PR) */}
        {activeTab === 'procurement-requests' && (
          <ProcurementRequestPanel
            canManage={canManagePurchase}
            canApprove={canApprovePR}
            isAdmin={isAdmin}
            materials={materials}
            suppliers={suppliersData?.items || []}
            requests={procurementRequests}
            onConvertToPO={handleConvertToPO}
            onUpdateRequestStatus={handleUpdatePRStatus}
            onCreateRequest={handleCreatePR}
            onEditRequest={handleEditPR}
            onDeleteRequest={handleDeletePR}
          />
        )}
      </div>

      {/* Dialogs & Modals */}
      {/* 1. Sales Order Form Dialog */}
      <SalesOrderFormDialog
        isOpen={isSalesOrderFormOpen}
        order={selectedSalesOrder}
        customers={customersData?.items || []}
        products={products}
        onClose={() => {
          setIsSalesOrderFormOpen(false);
          setSelectedSalesOrder(null);
        }}
        onSubmit={handleSaveSalesOrder}
      />

      {/* 2. Sales Order Detail Modal */}
      <SalesOrderDetailModal
        orderId={isSalesOrderDetailOpen ? selectedSalesOrder?.id || null : null}
        onClose={() => {
          setIsSalesOrderDetailOpen(false);
          setSelectedSalesOrder(null);
        }}
      />

      {/* 3. Sales Order Delete Dialog */}
      <SalesOrderDeleteDialog
        isOpen={isSalesOrderDeleteOpen}
        order={selectedSalesOrder}
        onClose={() => {
          setIsSalesOrderDeleteOpen(false);
          setSelectedSalesOrder(null);
        }}
        onConfirm={handleDeleteSalesOrder}
      />

      {/* 4. Customer Form Dialog */}
      <CustomerFormDialog
        isOpen={isCustomerFormOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleSaveCustomer}
      />

      {/* 5. Customer Delete Dialog */}
      <CustomerDeleteDialog
        isOpen={isCustomerDeleteOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsCustomerDeleteOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteCustomer}
      />

      {/* 6. Purchase Order Form Dialog */}
      <PurchaseOrderFormDialog
        isOpen={isPurchaseOrderFormOpen}
        order={selectedPurchaseOrder}
        suppliers={suppliersData?.items || []}
        materials={materials}
        sourcePR={sourcePR}
        availablePRs={procurementRequests.filter((r) => r.status === 'approved')}
        onClose={() => {
          setIsPurchaseOrderFormOpen(false);
          setSelectedPurchaseOrder(null);
          setSourcePR(null);
        }}
        onSubmit={async (values) => {
          await handleSavePurchaseOrder(values);
          if (sourcePR) {
            handleUpdatePRStatus(sourcePR.id, 'converted_to_po');
            setSourcePR(null);
          }
        }}
      />

      {/* 7. Purchase Order Detail Modal */}
      <PurchaseOrderDetailModal
        orderId={isPurchaseOrderDetailOpen ? selectedPurchaseOrder?.id || null : null}
        onClose={() => {
          setIsPurchaseOrderDetailOpen(false);
          setSelectedPurchaseOrder(null);
        }}
        onReceiveGoods={(order) => {
          setIsPurchaseOrderDetailOpen(false);
          handleOpenReceivePurchaseOrder(order);
        }}
      />

      {/* 8. Purchase Order Delete Dialog */}
      <PurchaseOrderDeleteDialog
        isOpen={isPurchaseOrderDeleteOpen}
        order={selectedPurchaseOrder}
        onClose={() => {
          setIsPurchaseOrderDeleteOpen(false);
          setSelectedPurchaseOrder(null);
        }}
        onConfirm={handleDeletePurchaseOrder}
      />

      {/* 9. Supplier Form Dialog */}
      <SupplierFormDialog
        isOpen={isSupplierFormOpen}
        supplier={selectedSupplier}
        onClose={() => {
          setIsSupplierFormOpen(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleSaveSupplier}
      />

      {/* 10. Supplier Delete Dialog */}
      <SupplierDeleteDialog
        isOpen={isSupplierDeleteOpen}
        supplier={selectedSupplier}
        onClose={() => {
          setIsSupplierDeleteOpen(false);
          setSelectedSupplier(null);
        }}
        onConfirm={handleDeleteSupplier}
      />

      {/* 11. Purchase Order Receive Goods Dialog */}
      <PurchaseOrderReceiveDialog
        isOpen={isPurchaseOrderReceiveOpen}
        order={receivingPurchaseOrder}
        onClose={() => {
          setIsPurchaseOrderReceiveOpen(false);
          setReceivingPurchaseOrder(null);
        }}
        onSuccess={() => {
          refetchPurchaseOrders();
        }}
      />

      {/* 12. Sales Order Dispatch Goods Dialog */}
      <SalesOrderDispatchDialog
        isOpen={isSalesOrderDispatchOpen}
        order={dispatchingSalesOrder}
        onClose={() => {
          setIsSalesOrderDispatchOpen(false);
          setDispatchingSalesOrder(null);
        }}
        onSuccess={() => {
          refetchSalesOrders();
        }}
      />
    </PageContainer>
  );
};
