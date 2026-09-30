import React, { useState } from 'react';
import { Briefcase, Plus, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { usePositions, useCreatePosition } from '../hooks/use-positions';
import { useDepartments } from '../hooks/use-departments';
import { positionFormSchema, type PositionFormValues } from '../validation/hr-schemas';
import { useAuth } from '@/features/auth/hooks/use-auth';

export const PositionTab: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const { data: positions, isLoading } = usePositions(selectedDeptId);
  const { data: departments } = useDepartments();
  const createMutation = useCreatePosition();
  const { hasRole, hasPermission } = useAuth();
  const canManage = hasRole('admin') || hasPermission('hr.department.manage') || hasPermission('master_data.manage');

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      code: '',
      title: '',
      department_id: '',
      level: 1,
    },
  });

  const onSubmit = async (values: PositionFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      reset();
      setIsDialogOpen(false);
    } catch {
      // Error is caught and surfaced via useCreatePosition onError toast
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Danh Mục Chức Danh & Vị Trí</h3>
          <p className="text-xs text-muted-foreground">
            Bảng phân cấp bậc và chức danh công việc trong nhà máy
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm chức danh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Positions Table */}
      {isLoading ? (
        <div className="h-48 rounded-xl border border-border bg-card p-6 animate-pulse" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="py-3.5 pl-4 pr-3 sm:pl-6">Mã chức danh</th>
                <th className="px-3 py-3.5">Tên chức danh</th>
                <th className="px-3 py-3.5">Thuộc phòng ban</th>
                <th className="px-3 py-3.5">Cấp bậc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positions?.map((pos) => (
                <tr key={pos.id} className="transition-colors hover:bg-muted/30">
                  <td className="py-3.5 pl-4 pr-3 font-mono font-bold text-foreground sm:pl-6">
                    {pos.code}
                  </td>
                  <td className="px-3 py-3.5 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      <span>{pos.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-muted-foreground">
                    <span className="inline-flex rounded bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {pos.department?.name || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      Cấp {pos.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog create position */}
      {isDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDialogOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Thêm Chức Danh Mới</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDialogOpen(false)}
                className="h-7 w-7 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="pos-code" className="text-xs font-semibold text-foreground">
                  Mã chức danh <span className="text-destructive">*</span>
                </label>
                <input
                  id="pos-code"
                  type="text"
                  placeholder="VD: NV_VH"
                  {...register('code')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="pos-title" className="text-xs font-semibold text-foreground">
                  Tên chức danh <span className="text-destructive">*</span>
                </label>
                <input
                  id="pos-title"
                  type="text"
                  placeholder="VD: Kỹ Sư Vận Hành Hệ Thống"
                  {...register('title')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.title && (
                  <p className="text-[11px] text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="pos-dept" className="text-xs font-semibold text-foreground">
                  Phòng ban trực thuộc <span className="text-destructive">*</span>
                </label>
                <select
                  id="pos-dept"
                  {...register('department_id')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="text-[11px] text-destructive">{errors.department_id.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="pos-level" className="text-xs font-semibold text-foreground">
                  Cấp bậc (1 - 10)
                </label>
                <input
                  id="pos-level"
                  type="number"
                  min="1"
                  max="10"
                  {...register('level')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.level && (
                  <p className="text-[11px] text-destructive">{errors.level.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Tạo chức danh</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
