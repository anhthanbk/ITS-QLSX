import React, { useState } from 'react';
import { Briefcase, Plus, X, Loader2, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from '../hooks/use-positions';
import { useDepartments } from '../hooks/use-departments';
import { positionFormSchema, type PositionFormValues } from '../validation/hr-schemas';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Position } from '../types';

export const PositionTab: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const { data: positions, isLoading } = usePositions(selectedDeptId);
  const { data: departments } = useDepartments();

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  const { hasRole, hasPermission } = useAuth();
  const canManage =
    hasRole('admin') ||
    hasPermission('hr.department.manage') ||
    hasPermission('master_data.manage');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [deletingPos, setDeletingPos] = useState<Position | null>(null);

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

  const handleOpenCreate = () => {
    setEditingPos(null);
    reset({
      code: '',
      title: '',
      department_id: departments?.[0]?.id || '',
      level: 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pos: Position) => {
    setEditingPos(pos);
    reset({
      code: pos.code,
      title: pos.title,
      department_id: pos.department_id,
      level: pos.level,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: PositionFormValues) => {
    try {
      if (editingPos) {
        await updateMutation.mutateAsync({ id: editingPos.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
      reset();
      setIsDialogOpen(false);
      setEditingPos(null);
    } catch {
      // Error is caught and surfaced via onError toast
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPos) return;
    try {
      await deleteMutation.mutateAsync(deletingPos.id);
      setDeletingPos(null);
    } catch {
      // Error is surfaced via onError toast
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
              onClick={handleOpenCreate}
              id="add-position-btn"
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
                {canManage && <th className="px-3 py-3.5 text-right sm:pr-6">Thao tác</th>}
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
                  {canManage && (
                    <td className="px-3 py-3.5 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(pos)}
                          title="Chỉnh sửa chức danh"
                          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPos(pos)}
                          title="Xóa chức danh"
                          className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog Create / Edit position */}
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
              <h3 className="text-sm font-bold text-foreground">
                {editingPos ? 'Chỉnh Sửa Chức Danh' : 'Thêm Chức Danh Mới'}
              </h3>
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
                  Cấp bậc chức vụ (1: Nhân viên, 5: Giám đốc)
                </label>
                <select
                  id="pos-level"
                  {...register('level', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={1}>Cấp 1 — Nhân viên / Công nhân</option>
                  <option value={2}>Cấp 2 — Chuyên viên / Kỹ thuật viên</option>
                  <option value={3}>Cấp 3 — Trưởng ca / Tổ trưởng</option>
                  <option value={4}>Cấp 4 — Quản đốc / Trưởng phòng</option>
                  <option value={5}>Cấp 5 — Giám đốc / Ban điều hành</option>
                </select>
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
                  disabled={isSaving}
                  className="flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingPos ? 'Lưu thay đổi' : 'Tạo chức danh'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPos && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeletingPos(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-destructive/20 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Xác Nhận Xóa Chức Danh</h3>
                <p className="text-xs text-muted-foreground font-mono">{deletingPos.code}</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa chức danh <strong className="text-foreground">{deletingPos.title}</strong>?
              Hành động này không thể hoàn tác nếu chức danh chưa được gán cho nhân viên nào.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPos(null)}
                disabled={deleteMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Xóa chức danh</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
