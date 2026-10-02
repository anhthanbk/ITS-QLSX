import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MaintenancePlan, MaintenancePlanFilterParams } from '../types';
import type { MaintenancePlanFormValues } from '../validation/maintenance-schemas';
import {
  useMaintenancePlans,
  useCreateMaintenancePlan,
  useUpdateMaintenancePlan,
  useDeleteMaintenancePlan,
} from '../hooks/use-maintenance-plans';
import { useMachineOptions } from '../hooks/use-machines';
import { MaintenancePlanFormDialog } from './maintenance-plan-form-dialog';

interface MaintenancePlansTabProps {
  canManage: boolean;
}

export const MaintenancePlansTab: React.FC<MaintenancePlansTabProps> = ({ canManage }) => {
  const [filters, setFilters] = useState<MaintenancePlanFilterParams>({
    search: '',
    machineId: 'all',
    isActive: 'all',
    page: 1,
    pageSize: 10,
  });

  const { data: plansData, isLoading, isError, refetch } = useMaintenancePlans(filters);
  const { data: machineOptions } = useMachineOptions();

  const createMutation = useCreateMaintenancePlan();
  const updateMutation = useUpdateMaintenancePlan();
  const deleteMutation = useDeleteMaintenancePlan();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<MaintenancePlan | null>(null);

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleMachineChange = (machineId: string) => {
    setFilters((prev) => ({ ...prev, machineId, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    let isActive: boolean | 'all' = 'all';
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;
    setFilters((prev) => ({ ...prev, isActive, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      machineId: 'all',
      isActive: 'all',
      page: 1,
      pageSize: 10,
    });
  };

  const handleFormSubmit = async (values: MaintenancePlanFormValues) => {
    if (editingPlan) {
      await updateMutation.mutateAsync({ id: editingPlan.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setIsFormOpen(false);
    setEditingPlan(null);
  };

  const handleDelete = async () => {
    if (deletingPlan) {
      await deleteMutation.mutateAsync(deletingPlan.id);
      setDeletingPlan(null);
    }
  };

  const plans = plansData?.data ?? [];
  const totalCount = plansData?.totalCount ?? 0;
  const page = plansData?.page ?? 1;
  const totalPages = plansData?.totalPages ?? 1;
  const pageSize = plansData?.pageSize ?? 10;

  const isFiltered =
    filters.search !== '' || filters.machineId !== 'all' || filters.isActive !== 'all';

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Filter and Actions Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo mã kế hoạch, tên nội dung PM..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[180px]">
              <select
                value={filters.machineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-3 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả thiết bị</option>
                {machineOptions?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={
                  filters.isActive === true
                    ? 'active'
                    : filters.isActive === false
                      ? 'inactive'
                      : 'all'
                }
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-3 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang áp dụng</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 border-t border-border pt-3 md:border-t-0 md:pt-0">
            <Button
              size="sm"
              onClick={() => {
                setEditingPlan(null);
                setIsFormOpen(true);
              }}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo kế hoạch PM</span>
            </Button>
          </div>
        )}
      </div>

      {/* Content state */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-accent/40 rounded-lg" />
            <div className="h-12 bg-accent/30 rounded-lg" />
            <div className="h-12 bg-accent/30 rounded-lg" />
            <div className="h-12 bg-accent/30 rounded-lg" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải dữ liệu kế hoạch PM</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có kế hoạch PM nào</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Lập kế hoạch bảo trì phòng ngừa định kỳ giúp duy trì tuổi thọ và giảm thiểu sự cố máy móc.
          </p>
          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                setEditingPlan(null);
                setIsFormOpen(true);
              }}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Tạo kế hoạch đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Mã kế hoạch</th>
                    <th className="py-3 px-4">Nội dung bảo dưỡng</th>
                    <th className="py-3 px-4">Thiết bị</th>
                    <th className="py-3 px-4">Chu kỳ</th>
                    <th className="py-3 px-4">Thực hiện gần nhất</th>
                    <th className="py-3 px-4">Tới hạn tiếp theo</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {plans.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-accent/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                        <span className="rounded bg-accent/60 px-2 py-0.5 border border-border/80">
                          {p.plan_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{p.title}</div>
                        {p.standard_duration_hours !== null && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>Thời lượng chuẩn: {p.standard_duration_hours}h</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {p.machines?.machine_code} - {p.machines?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-foreground">
                        {p.frequency_days} ngày
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                        {p.last_performed_date || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-foreground">
                        {p.next_due_date || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Áp dụng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border">
                            <XCircle className="h-3 w-3" />
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingPlan(p);
                                setIsFormOpen(true);
                              }}
                              title="Chỉnh sửa"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingPlan(p)}
                              title="Xóa kế hoạch"
                              className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
            <span className="text-xs text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
              <span className="font-semibold text-foreground">{endIdx}</span> trong tổng số{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> kế hoạch
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: page - 1 }))}
                className="h-8 gap-1 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Trước
              </Button>

              <span className="text-xs font-medium text-foreground px-2">
                Trang {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: page + 1 }))}
                className="h-8 gap-1 px-2.5 text-xs"
              >
                Sau
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <MaintenancePlanFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlan(null);
        }}
        planToEdit={editingPlan}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      {deletingPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeletingPlan(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-foreground">Xóa Kế Hoạch Bảo Dưỡng</h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Bạn có chắc chắn muốn xóa kế hoạch{' '}
              <span className="font-bold text-foreground">{deletingPlan.title}</span> (
              <span className="font-mono">{deletingPlan.plan_code}</span>)?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPlan(null)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-xs"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
