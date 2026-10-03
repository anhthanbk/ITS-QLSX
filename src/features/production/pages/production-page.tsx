import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Sliders, ClipboardList } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

// Types
import type {
  ProductionShift,
  TechnoEconomicNorm,
  ProductionOrder,
  ProductionShiftFilterParams,
  ProductionNormFilterParams,
  ProductionOrderFilterParams,
} from '../types';

// Hooks
import { useProductionLines } from '../hooks/use-production-lines';
import { useProductionMetrics } from '../hooks/use-production-metrics';
import {
  useProductionShifts,
  useCreateProductionShift,
  useUpdateProductionShift,
  useVerifyProductionShift,
  useDeleteProductionShift,
} from '../hooks/use-production-shifts';
import {
  useProductionNorms,
  useCreateProductionNorm,
  useUpdateProductionNorm,
  useDeleteProductionNorm,
} from '../hooks/use-production-norms';
import {
  useProductionOrders,
  useCreateProductionOrder,
  useUpdateProductionOrder,
  useDeleteProductionOrder,
} from '../hooks/use-production-orders';
import { useProductsCatalog } from '@/features/warehouse/hooks/use-products-catalog';

// Components
import { ProductionMetricCards } from '../components/production-metric-cards';
import { ProductionAnnualPlanner } from '../components/production-annual-planner';

import { ProductionShiftFilterBar } from '../components/production-shift-filter-bar';
import { ProductionShiftTable } from '../components/production-shift-table';
import { ProductionShiftFormDialog } from '../components/production-shift-form-dialog';
import { ProductionShiftDetailModal } from '../components/production-shift-detail-modal';

import { ProductionNormFilterBar } from '../components/production-norm-filter-bar';
import { ProductionNormTable } from '../components/production-norm-table';
import { ProductionNormFormDialog } from '../components/production-norm-form-dialog';
import { ProductionNormDeleteDialog } from '../components/production-norm-delete-dialog';

import { ProductionOrderFilterBar } from '../components/production-order-filter-bar';
import { ProductionOrderTable } from '../components/production-order-table';
import { ProductionOrderFormDialog } from '../components/production-order-form-dialog';
import { ProductionOrderDetailModal } from '../components/production-order-detail-modal';

type ProductionTab = 'annual-plan' | 'shifts' | 'norms' | 'batches';

export const ProductionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();

  // Permission evaluation
  const canManagePlans =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('production_lead') ||
    hasPermission('production.plan.create') ||
    hasPermission('master_data.manage');

  const canApprovePlans =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('production.plan.approve');

  const canManageShifts =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('production_lead') ||
    hasRole('operator') ||
    hasPermission('production.shift.write');

  const canVerifyShifts =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('production_lead') ||
    hasPermission('production.shift.verify');

  const canManageNorms =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('production_lead') ||
    hasPermission('master_data.manage');

  const canManageOrders =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('production_lead') ||
    hasPermission('production.plan.create') ||
    hasPermission('master_data.manage');

  // Determine active tab from URL path
  const getTabFromPath = (path: string): ProductionTab => {
    if (path.includes('/production/shifts')) return 'shifts';
    if (path.includes('/production/norms')) return 'norms';
    if (path.includes('/production/batches')) return 'batches';
    return 'annual-plan';
  };

  const [activeTab, setActiveTab] = useState<ProductionTab>(() =>
    getTabFromPath(location.pathname),
  );

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: ProductionTab) => {
    setActiveTab(tab);
    navigate(`/production/${tab}`);
  };

  // Shared master data
  const { data: lines = [] } = useProductionLines();
  const { data: metrics, isLoading: isLoadingMetrics } = useProductionMetrics();
  const { data: productsData } = useProductsCatalog({ page: 1, pageSize: 50 });
  const products = productsData?.data || [];

  // ==========================================
  // TAB 1: PRODUCTION SHIFTS STATE
  // ==========================================
  const [shiftFilters, setShiftFilters] = useState<ProductionShiftFilterParams>({
    search: '',
    lineId: 'all',
    shiftNumber: 'all',
    status: 'all',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 10,
  });

  const { data: shiftsData, isLoading: isLoadingShifts } = useProductionShifts(shiftFilters);
  const createShiftMutation = useCreateProductionShift();
  const updateShiftMutation = useUpdateProductionShift();
  const verifyShiftMutation = useVerifyProductionShift();
  const deleteShiftMutation = useDeleteProductionShift();

  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ProductionShift | null>(null);
  const [viewingShift, setViewingShift] = useState<ProductionShift | null>(null);

  // ==========================================
  // TAB 3: TECHNO-ECONOMIC NORMS STATE
  // ==========================================
  const [normFilters, setNormFilters] = useState<ProductionNormFilterParams>({
    search: '',
    lineId: 'all',
    resourceType: 'all',
    isActive: 'all',
    page: 1,
    pageSize: 10,
  });

  const { data: normsData, isLoading: isLoadingNorms } = useProductionNorms(normFilters);
  const createNormMutation = useCreateProductionNorm();
  const updateNormMutation = useUpdateProductionNorm();
  const deleteNormMutation = useDeleteProductionNorm();

  const [isNormFormOpen, setIsNormFormOpen] = useState(false);
  const [editingNorm, setEditingNorm] = useState<TechnoEconomicNorm | null>(null);
  const [deletingNorm, setDeletingNorm] = useState<TechnoEconomicNorm | null>(null);

  // ==========================================
  // TAB 4: PRODUCTION ORDERS & BATCHES STATE
  // ==========================================
  const [orderFilters, setOrderFilters] = useState<ProductionOrderFilterParams>({
    search: '',
    status: 'all',
    priority: 'all',
    lineId: 'all',
    productId: 'all',
    page: 1,
    pageSize: 10,
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useProductionOrders(orderFilters);
  const createOrderMutation = useCreateProductionOrder();
  const updateOrderMutation = useUpdateProductionOrder();
  const deleteOrderMutation = useDeleteProductionOrder();

  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ProductionOrder | null>(null);

  // Dynamic header based on tab
  const tabConfigs = {
    'annual-plan': {
      title: 'Kế hoạch sản xuất năm',
      description: 'Lập và theo dõi kế hoạch sản lượng, nguyên nhiên liệu, thời gian và chỉ số KT-KT 12 tháng',
    },
    shifts: {
      title: 'Theo dõi ca & nhập liệu',
      description: 'Ghi nhận số đo cân, công tơ điện nước, thời gian dừng chuyền và nhật ký ca',
    },
    norms: {
      title: 'Định mức Kinh tế - Kỹ thuật',
      description: 'Quản lý định mức suất tiêu hao điện, nước, hóa chất theo tấn thành phẩm',
    },
    batches: {
      title: 'Lệnh sản xuất & Lô thành phẩm',
      description: 'Điều phối lệnh gia công, phát hành lô sản xuất và kiểm soát tiến độ',
    },
  };

  const tabs = [
    {
      id: 'annual-plan' as const,
      label: 'Kế hoạch sản xuất năm',
      icon: Calendar,
    },
    {
      id: 'shifts' as const,
      label: 'Theo dõi ca & nhập liệu',
      icon: Clock,
      count: shiftsData?.totalCount,
    },
    {
      id: 'norms' as const,
      label: 'Định mức KT - KT',
      icon: Sliders,
      count: normsData?.totalCount,
    },
    {
      id: 'batches' as const,
      label: 'Lệnh SX & Lô thành phẩm',
      icon: ClipboardList,
      count: ordersData?.totalCount,
    },
  ];

  return (
    <PageContainer
      title={tabConfigs[activeTab].title}
      description={tabConfigs[activeTab].description}
    >
      <div className="space-y-5">
        {/* KPI Metrics Summary Bar */}
        <ProductionMetricCards metrics={metrics} isLoading={isLoadingMetrics} />

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-[10px]',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Kế hoạch sản xuất năm */}
        {activeTab === 'annual-plan' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <ProductionAnnualPlanner
              lines={lines}
              canManage={canManagePlans}
              canApprove={canApprovePlans}
            />
          </div>
        )}

        {/* Tab 2: Theo dõi ca & nhập liệu */}
        {activeTab === 'shifts' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <ProductionShiftFilterBar
              search={shiftFilters.search || ''}
              onSearchChange={(search) =>
                setShiftFilters((prev) => ({ ...prev, search, page: 1 }))
              }
              status={shiftFilters.status || 'all'}
              onStatusChange={(status) =>
                setShiftFilters((prev) => ({ ...prev, status, page: 1 }))
              }
              lineId={shiftFilters.lineId || 'all'}
              onLineIdChange={(lineId) =>
                setShiftFilters((prev) => ({ ...prev, lineId, page: 1 }))
              }
              shiftNumber={shiftFilters.shiftNumber || 'all'}
              onShiftNumberChange={(shiftNumber) =>
                setShiftFilters((prev) => ({ ...prev, shiftNumber, page: 1 }))
              }
              fromDate={shiftFilters.fromDate || ''}
              onFromDateChange={(fromDate) =>
                setShiftFilters((prev) => ({ ...prev, fromDate, page: 1 }))
              }
              toDate={shiftFilters.toDate || ''}
              onToDateChange={(toDate) =>
                setShiftFilters((prev) => ({ ...prev, toDate, page: 1 }))
              }
              lines={lines}
              onReset={() =>
                setShiftFilters({
                  search: '',
                  lineId: 'all',
                  shiftNumber: 'all',
                  status: 'all',
                  fromDate: '',
                  toDate: '',
                  page: 1,
                  pageSize: 10,
                })
              }
              onCreate={() => {
                setEditingShift(null);
                setIsShiftFormOpen(true);
              }}
              canManage={canManageShifts}
            />

            <ProductionShiftTable
              data={shiftsData?.data || []}
              isLoading={isLoadingShifts}
              totalCount={shiftsData?.totalCount || 0}
              page={shiftFilters.page}
              pageSize={shiftFilters.pageSize}
              onPageChange={(page) => setShiftFilters((prev) => ({ ...prev, page }))}
              onView={(shift) => setViewingShift(shift)}
              onEdit={(shift) => {
                setEditingShift(shift);
                setIsShiftFormOpen(true);
              }}
              onDelete={(shift) => deleteShiftMutation.mutate(shift.id)}
              onVerify={(shift) => verifyShiftMutation.mutate(shift.id)}
              canManage={canManageShifts}
              canVerify={canVerifyShifts}
            />
          </div>
        )}

        {/* Tab 3: Định mức KT - KT */}
        {activeTab === 'norms' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <ProductionNormFilterBar
              search={normFilters.search || ''}
              onSearchChange={(search) => setNormFilters((prev) => ({ ...prev, search, page: 1 }))}
              resourceType={normFilters.resourceType || 'all'}
              onResourceTypeChange={(resourceType) =>
                setNormFilters((prev) => ({ ...prev, resourceType, page: 1 }))
              }
              lineId={normFilters.lineId || 'all'}
              onLineIdChange={(lineId) => setNormFilters((prev) => ({ ...prev, lineId, page: 1 }))}
              isActive={normFilters.isActive !== undefined ? normFilters.isActive : 'all'}
              onIsActiveChange={(isActive) =>
                setNormFilters((prev) => ({ ...prev, isActive, page: 1 }))
              }
              lines={lines}
              onReset={() =>
                setNormFilters({
                  search: '',
                  lineId: 'all',
                  resourceType: 'all',
                  isActive: 'all',
                  page: 1,
                  pageSize: 10,
                })
              }
              onCreate={() => {
                setEditingNorm(null);
                setIsNormFormOpen(true);
              }}
              canManage={canManageNorms}
            />

            <ProductionNormTable
              data={normsData?.data || []}
              isLoading={isLoadingNorms}
              totalCount={normsData?.totalCount || 0}
              page={normFilters.page}
              pageSize={normFilters.pageSize}
              onPageChange={(page) => setNormFilters((prev) => ({ ...prev, page }))}
              onEdit={(norm) => {
                setEditingNorm(norm);
                setIsNormFormOpen(true);
              }}
              onDelete={(norm) => setDeletingNorm(norm)}
              canManage={canManageNorms}
            />
          </div>
        )}

        {/* Tab 4: Lệnh sản xuất & Lô thành phẩm */}
        {activeTab === 'batches' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <ProductionOrderFilterBar
              search={orderFilters.search || ''}
              onSearchChange={(search) =>
                setOrderFilters((prev) => ({ ...prev, search, page: 1 }))
              }
              status={orderFilters.status || 'all'}
              onStatusChange={(status) =>
                setOrderFilters((prev) => ({ ...prev, status, page: 1 }))
              }
              priority={orderFilters.priority || 'all'}
              onPriorityChange={(priority) =>
                setOrderFilters((prev) => ({ ...prev, priority, page: 1 }))
              }
              lineId={orderFilters.lineId || 'all'}
              onLineIdChange={(lineId) =>
                setOrderFilters((prev) => ({ ...prev, lineId, page: 1 }))
              }
              lines={lines}
              onReset={() =>
                setOrderFilters({
                  search: '',
                  status: 'all',
                  priority: 'all',
                  lineId: 'all',
                  productId: 'all',
                  page: 1,
                  pageSize: 10,
                })
              }
              onCreate={() => {
                setEditingOrder(null);
                setIsOrderFormOpen(true);
              }}
              canManage={canManageOrders}
            />

            <ProductionOrderTable
              data={ordersData?.data || []}
              isLoading={isLoadingOrders}
              totalCount={ordersData?.totalCount || 0}
              page={orderFilters.page}
              pageSize={orderFilters.pageSize}
              onPageChange={(page) => setOrderFilters((prev) => ({ ...prev, page }))}
              onView={(order) => setViewingOrder(order)}
              onEdit={(order) => {
                setEditingOrder(order);
                setIsOrderFormOpen(true);
              }}
              onDelete={(order) => deleteOrderMutation.mutate(order.id)}
              canManage={canManageOrders}
            />
          </div>
        )}
      </div>

      {/* Shift Modals */}
      <ProductionShiftFormDialog
        isOpen={isShiftFormOpen}
        onClose={() => setIsShiftFormOpen(false)}
        onSubmit={async (values) => {
          if (editingShift) {
            await updateShiftMutation.mutateAsync({ id: editingShift.id, values });
          } else {
            await createShiftMutation.mutateAsync(values);
          }
          setIsShiftFormOpen(false);
          setEditingShift(null);
        }}
        initialData={editingShift}
        lines={lines}
        isSubmitting={createShiftMutation.isPending || updateShiftMutation.isPending}
      />

      <ProductionShiftDetailModal
        isOpen={!!viewingShift}
        onClose={() => setViewingShift(null)}
        shift={viewingShift}
        onVerify={(shift) => verifyShiftMutation.mutate(shift.id)}
        canVerify={canVerifyShifts}
        canManage={canManageShifts}
      />

      {/* Norm Modals */}
      <ProductionNormFormDialog
        isOpen={isNormFormOpen}
        onClose={() => setIsNormFormOpen(false)}
        onSubmit={async (values) => {
          if (editingNorm) {
            await updateNormMutation.mutateAsync({ id: editingNorm.id, values });
          } else {
            await createNormMutation.mutateAsync(values);
          }
          setIsNormFormOpen(false);
          setEditingNorm(null);
        }}
        initialData={editingNorm}
        lines={lines}
        isSubmitting={createNormMutation.isPending || updateNormMutation.isPending}
      />

      <ProductionNormDeleteDialog
        isOpen={!!deletingNorm}
        onClose={() => setDeletingNorm(null)}
        onConfirm={async () => {
          if (deletingNorm) {
            await deleteNormMutation.mutateAsync(deletingNorm.id);
            setDeletingNorm(null);
          }
        }}
        norm={deletingNorm}
        isDeleting={deleteNormMutation.isPending}
      />

      {/* Order Modals */}
      <ProductionOrderFormDialog
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        onSubmit={async (values) => {
          if (editingOrder) {
            await updateOrderMutation.mutateAsync({ id: editingOrder.id, values });
          } else {
            await createOrderMutation.mutateAsync(values);
          }
          setIsOrderFormOpen(false);
          setEditingOrder(null);
        }}
        initialData={editingOrder}
        lines={lines}
        products={products}
        isSubmitting={createOrderMutation.isPending || updateOrderMutation.isPending}
      />

      <ProductionOrderDetailModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
        canManage={canManageOrders}
      />
    </PageContainer>
  );
};
