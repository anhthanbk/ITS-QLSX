import React, { useState } from 'react';
import { Building2, Plus, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useDepartments, useCreateDepartment } from '../hooks/use-departments';
import { departmentFormSchema, type DepartmentFormValues } from '../validation/hr-schemas';
import { useAuth } from '@/features/auth/hooks/use-auth';

export const DepartmentTab: React.FC = () => {
  const { data: departments, isLoading } = useDepartments();
  const createMutation = useCreateDepartment();
  const { hasRole, hasPermission } = useAuth();
  const canManage = hasRole('admin') || hasPermission('hr.department.manage') || hasPermission('master_data.manage');

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      code: '',
      name: '',
      parent_id: null,
      status: 'active',
    },
  });

  const onSubmit = async (values: DepartmentFormValues) => {
    await createMutation.mutateAsync(values);
    reset();
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Danh Sách Cơ Cấu Phòng Ban</h3>
          <p className="text-xs text-muted-foreground">
            Các đơn vị, phòng ban trực thuộc trong nhà máy sản xuất
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm phòng ban</span>
          </Button>
        )}
      </div>

      {/* Grid of Departments */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card p-4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.map((dept) => (
            <div
              key={dept.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{dept.name}</h4>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Mã: {dept.code}
                    </span>
                  </div>
                </div>

                <span
                  className={
                    dept.status === 'active'
                      ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }
                >
                  {dept.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Trưởng đơn vị:</span>
                <span className="font-medium text-foreground">
                  {dept.manager
                    ? `${dept.manager.last_name} ${dept.manager.first_name}`
                    : 'Chưa bổ nhiệm'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog create department */}
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
              <h3 className="text-sm font-bold text-foreground">Thêm Phòng Ban Mới</h3>
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
                <label htmlFor="dept-code" className="text-xs font-semibold text-foreground">
                  Mã phòng ban <span className="text-destructive">*</span>
                </label>
                <input
                  id="dept-code"
                  type="text"
                  placeholder="VD: P_IT"
                  {...register('code')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="dept-name" className="text-xs font-semibold text-foreground">
                  Tên phòng ban <span className="text-destructive">*</span>
                </label>
                <input
                  id="dept-name"
                  type="text"
                  placeholder="VD: Phòng Công Nghệ Thông Tin"
                  {...register('name')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="dept-status" className="text-xs font-semibold text-foreground">
                  Trạng thái
                </label>
                <select
                  id="dept-status"
                  {...register('status')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
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
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Tạo phòng ban</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
