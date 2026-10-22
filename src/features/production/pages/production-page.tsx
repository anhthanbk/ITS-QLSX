import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/features/auth/hooks/use-auth';

// Types
import type {
  ProductionShift,
  ProductionShiftFilterParams,
  ProductionMetricsFilterParams,
  PatrolFilterParams,
  PatrolArea,
  PatrolAreaMachineItem,
  QuickIncidentFormValues,
  PatrolAreaFormValues,
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
import {
  usePatrolAreas,
  usePatrolLogs,
  useConfirmNormalInspection,
  useReportPatrolIncident,
  useAvailableMachines,
  useCreatePatrolArea,
  useUpdatePatrolArea,
} from '../hooks/use-production-patrols';

// Components
import { ProductionAnnualPlanner } from '../components/production-annual-planner';
import { ProductionShiftFilterBar } from '../components/production-shift-filter-bar';
import { ProductionShiftTable } from '../components/production-shift-table';
import { ProductionShiftFormDialog } from '../components/production-shift-form-dialog';
import { ProductionShiftDetailModal } from '../components/production-shift-detail-modal';
import { ProductionShiftDeleteDialog } from '../components/production-shift-delete-dialog';
import { BatchShiftWarehouseDialog } from '../components/batch-shift-warehouse-dialog';
import { IncidentAnalyticsTab } from '../components/incident-analytics-tab';
import { ProductionPatrolHistoryTable } from '../components/production-patrol-history-table';
import { ProductionQrScannerModal } from '../components/production-qr-scanner-modal';
import { ProductionAreaChecklistModal } from '../components/production-area-checklist-modal';
import { ProductionQuickIncidentDialog } from '../components/production-quick-incident-dialog';
import { ProductionAreaQrPrintDialog } from '../components/production-area-qr-print-dialog';
import { ProductionPatrolAreaDialog } from '../components/production-patrol-area-dialog';

type ProductionTab = 'annual-plan' | 'shifts' | 'incidents' | 'patrols';

export const ProductionPage: React.FC = () => {
  const location = useLocation();
  const { user, hasRole, hasPermission } = useAuth();

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

  const canBatchSyncWarehouse =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('production_lead') ||
    hasPermission('production.plan.approve') ||
    hasPermission('inventory.receipt.create');

  // Determine active tab from URL path
  const getTabFromPath = (path: string): ProductionTab => {
    if (path.includes('/production/shifts')) return 'shifts';
    if (path.includes('/production/patrols')) return 'patrols';
    if (path.includes('/production/incidents')) return 'incidents';
    return 'annual-plan';
  };

  const [activeTab, setActiveTab] = useState<ProductionTab>(() =>
    getTabFromPath(location.pathname),
  );

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Shared master data
  const { data: lines = [] } = useProductionLines();

  // Metrics state (for shift recovery rate and productivity targets)
  const now = new Date();
  const metricFilters: ProductionMetricsFilterParams = {
    lineId: 'all',
    months: [],
    years: [now.getFullYear()],
  };

  const { data: metrics } = useProductionMetrics(metricFilters);

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

  // Batch warehouse sync state (Trưởng / phó phòng gom ca)
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [isBatchWarehouseOpen, setIsBatchWarehouseOpen] = useState(false);

  const selectedShifts = (shiftsData?.data || []).filter((shift) =>
    selectedShiftIds.includes(shift.id),
  );

  // 4. Patrols & Incidents State & Hooks
  const [patrolFilters, setPatrolFilters] = useState<PatrolFilterParams>({
    search: '',
    areaId: 'all',
    hasIssue: 'all',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 15,
  });

  const { data: patrolAreas = [] } = usePatrolAreas();
  const { data: patrolLogsData, isLoading: isLoadingPatrolLogs } = usePatrolLogs(patrolFilters);
  const confirmNormalMutation = useConfirmNormalInspection();
  const reportIncidentMutation = useReportPatrolIncident();
  const { data: availableMachines = [] } = useAvailableMachines();
  const createAreaMutation = useCreatePatrolArea();
  const updateAreaMutation = useUpdatePatrolArea();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isQuickIncidentOpen, setIsQuickIncidentOpen] = useState(false);
  const [isPrintQrOpen, setIsPrintQrOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<PatrolArea | null>(null);
  const [activeChecklistArea, setActiveChecklistArea] = useState<PatrolArea | null>(null);
  const [selectedIncidentMachine, setSelectedIncidentMachine] = useState<PatrolAreaMachineItem | null>(null);
  const [inspectorName, setInspectorName] = useState<string>(
    user?.profile?.full_name || 'Công nhân tuần kiểm',
  );

  // Sync inspector name when user changes
  useEffect(() => {
    if (user?.profile?.full_name) {
      setInspectorName(user.profile.full_name);
    }
  }, [user?.profile?.full_name]);

  return (
    <PageContainer>
      <div className="space-y-5">

        {/* VIEW 1: Kế hoạch sản xuất năm */}
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
              selectedShiftIds={selectedShiftIds}
              onToggleSelectShift={(shiftId) => {
                setSelectedShiftIds((prev) =>
                  prev.includes(shiftId)
                    ? prev.filter((id) => id !== shiftId)
                    : [...prev, shiftId],
                );
              }}
              onToggleSelectAll={(shiftIds) => setSelectedShiftIds(shiftIds)}
              onOpenBatchWarehouseSync={() => setIsBatchWarehouseOpen(true)}
              canBatchSyncWarehouse={canBatchSyncWarehouse}
            />
          </div>
        )}

        {/* Tab 3: Incidents & Downtime Pareto */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <IncidentAnalyticsTab lines={lines} />
          </div>
        )}

        {/* Tab 4: Lịch sử tuần kiểm thiết bị */}
        {activeTab === 'patrols' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <ProductionPatrolHistoryTable
              logs={patrolLogsData?.data || []}
              areas={patrolAreas}
              totalCount={patrolLogsData?.totalCount || 0}
              currentPage={patrolLogsData?.page || 1}
              totalPages={patrolLogsData?.totalPages || 1}
              filters={patrolFilters}
              onFilterChange={setPatrolFilters}
              isLoading={isLoadingPatrolLogs}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenQuickIncident={() => {
                setSelectedIncidentMachine(null);
                setIsQuickIncidentOpen(true);
              }}
              onOpenPrintQr={() => setIsPrintQrOpen(true)}
              onOpenCreateArea={() => {
                setEditingArea(null);
                setIsAreaDialogOpen(true);
              }}
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

      <BatchShiftWarehouseDialog
        isOpen={isBatchWarehouseOpen}
        onClose={() => setIsBatchWarehouseOpen(false)}
        selectedShifts={selectedShifts}
        onSuccess={() => {
          setSelectedShiftIds([]);
        }}
      />

      {/* Patrol & Quick Incident Modals */}
      <ProductionQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        areas={patrolAreas}
        onAreaDetected={(area) => {
          setActiveChecklistArea(area);
          setIsScannerOpen(false);
          setIsChecklistOpen(true);
        }}
      />

      <ProductionAreaChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => {
          setIsChecklistOpen(false);
          setActiveChecklistArea(null);
        }}
        area={activeChecklistArea}
        inspectorName={inspectorName}
        onInspectorNameChange={setInspectorName}
        onConfirmNormal={async (payload) => {
          await confirmNormalMutation.mutateAsync(payload);
        }}
        onOpenReportIncident={(machine) => {
          setSelectedIncidentMachine(machine || null);
          setIsQuickIncidentOpen(true);
        }}
        isConfirming={confirmNormalMutation.isPending}
      />

      <ProductionQuickIncidentDialog
        isOpen={isQuickIncidentOpen}
        onClose={() => {
          setIsQuickIncidentOpen(false);
          setSelectedIncidentMachine(null);
        }}
        onSubmit={async (values: QuickIncidentFormValues) => {
          await reportIncidentMutation.mutateAsync({
            ...values,
            checked_machines_count: activeChecklistArea?.machines?.length ?? 1,
          });
          setIsChecklistOpen(false);
          setActiveChecklistArea(null);
        }}
        isSubmitting={reportIncidentMutation.isPending}
        area={activeChecklistArea}
        allAreas={patrolAreas}
        preselectedMachine={selectedIncidentMachine}
        defaultReporterName={inspectorName}
      />

      <ProductionAreaQrPrintDialog
        isOpen={isPrintQrOpen}
        onClose={() => setIsPrintQrOpen(false)}
        areas={patrolAreas}
        onEditArea={(area) => {
          setIsPrintQrOpen(false);
          setEditingArea(area);
          setIsAreaDialogOpen(true);
        }}
      />

      <ProductionPatrolAreaDialog
        isOpen={isAreaDialogOpen}
        onClose={() => {
          setIsAreaDialogOpen(false);
          setEditingArea(null);
        }}
        initialData={editingArea}
        lines={lines}
        availableMachines={availableMachines}
        onSubmit={async (values: PatrolAreaFormValues) => {
          if (editingArea) {
            await updateAreaMutation.mutateAsync({ id: editingArea.id, payload: values });
          } else {
            await createAreaMutation.mutateAsync(values);
          }
          setIsAreaDialogOpen(false);
          setEditingArea(null);
        }}
        isSubmitting={createAreaMutation.isPending || updateAreaMutation.isPending}
      />
    </PageContainer>
  );
};
