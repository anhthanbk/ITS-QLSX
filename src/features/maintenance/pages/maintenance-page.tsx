import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Cpu, Calendar, ClipboardList, Package, GitCommit } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  useMachines,
  useMaintenanceMetrics,
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
} from '../hooks/use-machines';
import { useMachineAdjustments } from '../hooks/use-machine-adjustments';
import type { Machine, MachineStatus, MachineFilterParams } from '../types';
import type { MachineFormValues } from '../validation/maintenance-schemas';
import { MaintenanceMetricCards } from '../components/maintenance-metric-cards';
import { MachineFilterBar } from '../components/machine-filter-bar';
import { MachineTable } from '../components/machine-table';
import { MachineFormDialog } from '../components/machine-form-dialog';
import { MachineDetailModal } from '../components/machine-detail-modal';
import { MachineDeleteDialog } from '../components/machine-delete-dialog';
import { MaintenancePlansTab } from '../components/maintenance-plans-tab';
import { WorkOrdersTab } from '../components/work-orders-tab';
import { AdjustmentsTab } from '../components/adjustments-tab';
import { SparePartsTab } from '../components/spare-parts-tab';
import { cn } from '@/lib/utils';

type MaintenanceTab = 'machines' | 'schedules' | 'orders' | 'adjustments' | 'spares';

export const MaintenancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();

  // Permission evaluation
  const canManageMachines =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('maintenance_tech') ||
    hasPermission('maintenance.manage') ||
    hasPermission('maintenance.machine.manage');

  const canManageSchedules =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('maintenance_tech') ||
    hasPermission('maintenance.manage') ||
    hasPermission('maintenance.schedule.manage');

  const canManageOrders =
    hasRole('admin') ||
    hasRole('plant_manager') ||
    hasRole('maintenance_tech') ||
    hasPermission('maintenance.manage') ||
    hasPermission('maintenance.order.manage');

  // Determine active tab from URL path
  const getTabFromPath = (path: string): MaintenanceTab => {
    if (path.includes('/maintenance/schedules')) return 'schedules';
    if (path.includes('/maintenance/orders')) return 'orders';
    if (path.includes('/maintenance/adjustments')) return 'adjustments';
    if (path.includes('/maintenance/spares')) return 'spares';
    return 'machines';
  };

  const [activeTab, setActiveTab] = useState<MaintenanceTab>(() =>
    getTabFromPath(location.pathname),
  );

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: MaintenanceTab) => {
    setActiveTab(tab);
    navigate(`/maintenance/${tab}`);
  };

  // Machine query and filter state
  const [machineFilters, setMachineFilters] = useState<MachineFilterParams>({
    search: '',
    status: 'all',
    departmentId: 'all',
    page: 1,
    pageSize: 10,
  });

  const {
    data: machinesData,
    isLoading: isLoadingMachines,
    isError: isMachinesError,
    refetch: refetchMachines,
  } = useMachines(machineFilters);

  const { data: metrics, isLoading: isLoadingMetrics } = useMaintenanceMetrics();
  const { data: adjustmentsCountData } = useMachineAdjustments({ page: 1, pageSize: 1 });
  const totalAdjustments = adjustmentsCountData?.totalCount;

  const createMachineMutation = useCreateMachine();
  const updateMachineMutation = useUpdateMachine();
  const deleteMachineMutation = useDeleteMachine();

  // Modal dialog states for machines
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'adjustments' | 'plans' | 'orders'>('info');
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  // Machine filter handlers
  const handleSearchChange = (search: string) => {
    setMachineFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleStatusChange = (status: MachineStatus | 'all') => {
    setMachineFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleResetFilters = () => {
    setMachineFilters({
      search: '',
      status: 'all',
      departmentId: 'all',
      page: 1,
      pageSize: 10,
    });
  };

  const handlePageChange = (page: number) => {
    setMachineFilters((prev) => ({ ...prev, page }));
  };

  const handleFormSubmit = async (values: MachineFormValues) => {
    if (editingMachine) {
      await updateMachineMutation.mutateAsync({ id: editingMachine.id, values });
    } else {
      await createMachineMutation.mutateAsync(values);
    }
    setIsFormOpen(false);
    setEditingMachine(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingMachine) {
      await deleteMachineMutation.mutateAsync(deletingMachine.id);
      setDeletingMachine(null);
    }
  };

  const tabs = [
    {
      id: 'machines' as const,
      label: 'Hồ sơ thiết bị',
      icon: Cpu,
      count: metrics?.totalMachines,
    },
    {
      id: 'schedules' as const,
      label: 'Lịch bảo dưỡng định kỳ',
      icon: Calendar,
      count: metrics?.totalPlannedPMs,
    },
    {
      id: 'orders' as const,
      label: 'Phiếu sửa chữa & Sự cố',
      icon: ClipboardList,
      count: metrics?.activeWorkOrders,
    },
    {
      id: 'adjustments' as const,
      label: 'Cải tiến thiết bị',
      icon: GitCommit,
      count: totalAdjustments,
    },
    {
      id: 'spares' as const,
      label: 'Kho phụ tùng & Linh kiện',
      icon: Package,
    },
  ];

  return (
    <PageContainer
      title="Bảo Trì & Quản Lý Thiết Bị Cơ Điện"
      description="Quản lý hồ sơ máy móc, lập kế hoạch bảo trì phòng ngừa (PM) và xử lý sự cố dừng máy (Downtime)"
    >
      <div className="space-y-6">
        {/* Metric Cards Top Overview */}
        <MaintenanceMetricCards metrics={metrics} isLoading={isLoadingMetrics} />

        {/* Tab Navigation Navigation Bar */}
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
                  'group flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Machines */}
        {activeTab === 'machines' && (
          <div className="space-y-4">
            <MachineFilterBar
              search={machineFilters.search || ''}
              status={machineFilters.status || 'all'}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              onReset={handleResetFilters}
              canCreate={canManageMachines}
              onOpenCreate={() => {
                setEditingMachine(null);
                setIsFormOpen(true);
              }}
            />

            <MachineTable
              data={machinesData}
              isLoading={isLoadingMachines}
              isError={isMachinesError}
              onRetry={refetchMachines}
              onPageChange={handlePageChange}
              onViewDetail={(m) => {
                setViewingMachine(m);
                setDetailTab('info');
              }}
              onEdit={(m) => {
                setEditingMachine(m);
                setIsFormOpen(true);
              }}
              onDelete={(m) => setDeletingMachine(m)}
              canManage={canManageMachines}
              onOpenCreate={() => {
                setEditingMachine(null);
                setIsFormOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Maintenance Plans */}
        {activeTab === 'schedules' && <MaintenancePlansTab canManage={canManageSchedules} />}

        {/* Tab 3: Work Orders */}
        {activeTab === 'orders' && <WorkOrdersTab canManage={canManageOrders} />}

        {/* Tab 4: Machine Adjustments & Improvements */}
        {activeTab === 'adjustments' && <AdjustmentsTab canManage={canManageMachines} />}

        {/* Tab 5: Spare Parts */}
        {activeTab === 'spares' && <SparePartsTab />}

        {/* Machine Form Dialog */}
        <MachineFormDialog
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMachine(null);
          }}
          machineToEdit={editingMachine}
          onSubmit={handleFormSubmit}
          isSubmitting={createMachineMutation.isPending || updateMachineMutation.isPending}
        />

        {/* Machine Detail Modal */}
        <MachineDetailModal
          isOpen={!!viewingMachine}
          onClose={() => setViewingMachine(null)}
          machine={viewingMachine}
          initialTab={detailTab}
          onEdit={(m) => {
            setViewingMachine(null);
            setEditingMachine(m);
            setIsFormOpen(true);
          }}
          canManage={canManageMachines}
        />

        {/* Machine Delete Confirmation Dialog */}
        <MachineDeleteDialog
          isOpen={!!deletingMachine}
          onClose={() => setDeletingMachine(null)}
          machine={deletingMachine}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMachineMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
