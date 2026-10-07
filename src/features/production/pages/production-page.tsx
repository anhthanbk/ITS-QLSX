import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

// Types
import type {
  ProductionShift,
  ProductionShiftFilterParams,
  ProductionMetricsFilterParams,
} from '../types';

// Hooks
import { useProductionLines } from '../hooks/use-production-lines';
import { useProductionMetrics } from '../hooks/use-production-metrics';
import {
  useProductionShifts,
  useCreateProductionShift,
  useUpdateProductionShift,
  useDeleteProductionShift,
} from '../hooks/use-production-shifts';

// Components
import { ProductionMetricCards } from '../components/production-metric-cards';
import { ProductionMetricFilterBar } from '../components/production-metric-filter-bar';
import { ProductionConsumptionNormsBar } from '../components/production-consumption-norms-bar';
import { ProductionAnnualPlanner } from '../components/production-annual-planner';
import { ProductionShiftFilterBar } from '../components/production-shift-filter-bar';
import { ProductionShiftTable } from '../components/production-shift-table';
import { ProductionShiftFormDialog } from '../components/production-shift-form-dialog';
import { ProductionShiftDetailModal } from '../components/production-shift-detail-modal';
import { ProductionShiftDeleteDialog } from '../components/production-shift-delete-dialog';

type ProductionTab = 'annual-plan' | 'shifts';

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

  const canDeleteShifts =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasPermission('production.shift.delete');

  // Determine active tab from URL path
  const getTabFromPath = (path: string): ProductionTab => {
    if (path.includes('/production/shifts')) return 'shifts';
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

  // Metrics filters state (lineId, months, years)
  const now = new Date();
  const [metricFilters, setMetricFilters] = useState<ProductionMetricsFilterParams>({
    lineId: 'all',
    months: [], // [] means "Tất cả các tháng"
    years: [now.getFullYear()],
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useProductionMetrics(metricFilters);

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
  const deleteShiftMutation = useDeleteProductionShift();

  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [shiftFormMode, setShiftFormMode] = useState<'shift' | 'date_range'>('shift');
  const [editingShift, setEditingShift] = useState<ProductionShift | null>(null);
  const [viewingShift, setViewingShift] = useState<ProductionShift | null>(null);
  const [deletingShift, setDeletingShift] = useState<ProductionShift | null>(null);

  // Dynamic header based on tab
  const tabConfigs = {
    'annual-plan': {
      title: 'Kế hoạch sản xuất năm',
      description: 'Lập và theo dõi kế hoạch sản lượng, nguyên nhiên liệu, thời gian và chỉ số KT-KT 12 tháng',
    },
    shifts: {
      title: 'Theo dõi ca & nhập liệu',
      description: 'Ghi nhận sản lượng thành phẩm, tiêu hao nguyên nhiên liệu, thời gian dừng chuyền và chất lượng sản phẩm',
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
  ];

  return (
    <PageContainer
      title={tabConfigs[activeTab].title}
      description={tabConfigs[activeTab].description}
    >
      <div className="space-y-4">
        {/* Metric Cards Filter Bar: Lọc dây chuyền, tháng, năm */}
        <ProductionMetricFilterBar
          lineId={metricFilters.lineId || 'all'}
          onLineIdChange={(lineId) => setMetricFilters((prev) => ({ ...prev, lineId }))}
          selectedMonths={metricFilters.months || []}
          onMonthsChange={(months) => setMetricFilters((prev) => ({ ...prev, months }))}
          selectedYears={metricFilters.years || []}
          onYearsChange={(years) => setMetricFilters((prev) => ({ ...prev, years }))}
          lines={lines}
          onReset={() =>
            setMetricFilters({
              lineId: 'all',
              months: [],
              years: [now.getFullYear()],
            })
          }
        />

        {/* KPI Metrics Summary Bar (4 Cards) */}
        <ProductionMetricCards metrics={metrics} isLoading={isLoadingMetrics} />

        {/* Row of Consumption Norms vs Actuals with % comparison */}
        <ProductionConsumptionNormsBar
          norms={metrics?.consumptionNorms}
          isLoading={isLoadingMetrics}
        />

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

        {/* Tab 1: Kế hoạch sản xuất năm */}
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
                setShiftFormMode('shift');
                setIsShiftFormOpen(true);
              }}
              onCreateRange={() => {
                setEditingShift(null);
                setShiftFormMode('date_range');
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
                const isRange =
                  Boolean(shift.downtime_breakdown?.is_date_range) ||
                  shift.shift_code.startsWith('KY-') ||
                  Boolean(shift.notes?.includes('[Kỳ:'));
                setShiftFormMode(isRange ? 'date_range' : 'shift');
                setIsShiftFormOpen(true);
              }}
              onDelete={(shift) => setDeletingShift(shift)}
              canManage={canManageShifts}
              canDelete={canDeleteShifts}
              plannedProductivityTph={metrics?.plannedProductivityTph}
              plannedRecoveryRatePct={metrics?.plannedRecoveryRatePct}
            />
          </div>
        )}
      </div>

      {/* Shift Modals */}
      <ProductionShiftFormDialog
        isOpen={isShiftFormOpen}
        initialMode={shiftFormMode}
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
        onDelete={(shift) => setDeletingShift(shift)}
        canManage={canManageShifts}
        canDelete={canDeleteShifts}
      />

      <ProductionShiftDeleteDialog
        isOpen={!!deletingShift}
        onClose={() => setDeletingShift(null)}
        onConfirm={async () => {
          if (deletingShift) {
            await deleteShiftMutation.mutateAsync(deletingShift.id);
            setDeletingShift(null);
          }
        }}
        shift={deletingShift}
        isDeleting={deleteShiftMutation.isPending}
      />
    </PageContainer>
  );
};
