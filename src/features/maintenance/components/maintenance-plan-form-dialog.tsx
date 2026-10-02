import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  maintenancePlanSchema,
  type MaintenancePlanFormValues,
} from '../validation/maintenance-schemas';
import type { MaintenancePlan } from '../types';
import { useMachineOptions } from '../hooks/use-machines';

export interface MaintenancePlanFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: MaintenancePlan | null;
  onSubmit: (values: MaintenancePlanFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const MaintenancePlanFormDialog: React.FC<MaintenancePlanFormDialogProps> = ({
  isOpen,
  onClose,
  planToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const { data: machineOptions } = useMachineOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenancePlanFormValues>({
    resolver: zodResolver(maintenancePlanSchema),
    defaultValues: {
      plan_code: '',
      machine_id: '',
      title: '',
      frequency_days: 30,
      last_performed_date: '',
      next_due_date: '',
      standard_duration_hours: null,
      is_active: true,
    },
  });

  useEffect(() => {
    if (planToEdit) {
      reset({
        plan_code: planToEdit.plan_code,
        machine_id: planToEdit.machine_id,
        title: planToEdit.title,
        frequency_days: planToEdit.frequency_days,
        last_performed_date: planToEdit.last_performed_date || '',
        next_due_date: planToEdit.next_due_date || '',
        standard_duration_hours: planToEdit.standard_duration_hours,
        is_active: planToEdit.is_active,
      });
    } else {
      reset({
        plan_code: '',
        machine_id: machineOptions?.[0]?.id || '',
        title: '',
        frequency_days: 30,
        last_performed_date: '',
        next_due_date: '',
        standard_duration_hours: null,
        is_active: true,
      });
    }
  }, [planToEdit, reset, isOpen, machineOptions]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 id="plan-dialog-title" className="text-base font-bold text-foreground">
                {planToEdit ? 'Chỉnh Sửa Kế Hoạch PM' : 'Tạo Kế Hoạch Bảo Dưỡng Định Kỳ (PM)'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Kế hoạch bảo trì phòng ngừa tự động theo chu kỳ ngày
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Mã kế hoạch */}
            <div className="space-y-1">
              <label htmlFor="plan_code" className="text-xs font-semibold text-foreground">
                Mã kế hoạch <span className="text-destructive">*</span>
              </label>
              <input
                id="plan_code"
                type="text"
                placeholder="VD: PM-CRUSH-30D"
                {...register('plan_code')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              />
              {errors.plan_code && (
                <p className="text-[11px] text-destructive">{errors.plan_code.message}</p>
              )}
            </div>

            {/* Chọn thiết bị */}
            <div className="space-y-1">
              <label htmlFor="machine_id" className="text-xs font-semibold text-foreground">
                Thiết bị áp dụng <span className="text-destructive">*</span>
              </label>
              <select
                id="machine_id"
                {...register('machine_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn thiết bị --</option>
                {machineOptions?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_code} - {m.name}
                  </option>
                ))}
              </select>
              {errors.machine_id && (
                <p className="text-[11px] text-destructive">{errors.machine_id.message}</p>
              )}
            </div>
          </div>

          {/* Tiêu đề kế hoạch */}
          <div className="space-y-1">
            <label htmlFor="title" className="text-xs font-semibold text-foreground">
              Tên kế hoạch bảo dưỡng <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="VD: Bảo dưỡng định kỳ 30 ngày: Tra mỡ, kiểm tra độ căng băng tải"
              {...register('title')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.title && (
              <p className="text-[11px] text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Chu kỳ ngày */}
            <div className="space-y-1">
              <label htmlFor="frequency_days" className="text-xs font-semibold text-foreground">
                Chu kỳ (ngày) <span className="text-destructive">*</span>
              </label>
              <input
                id="frequency_days"
                type="number"
                placeholder="VD: 30"
                {...register('frequency_days')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.frequency_days && (
                <p className="text-[11px] text-destructive">{errors.frequency_days.message}</p>
              )}
            </div>

            {/* Thời lượng chuẩn */}
            <div className="space-y-1">
              <label htmlFor="standard_duration_hours" className="text-xs font-semibold text-foreground">
                Thời lượng chuẩn (giờ)
              </label>
              <input
                id="standard_duration_hours"
                type="number"
                step="0.5"
                placeholder="VD: 2.5"
                {...register('standard_duration_hours')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.standard_duration_hours && (
                <p className="text-[11px] text-destructive">{errors.standard_duration_hours.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Lần thực hiện gần nhất */}
            <div className="space-y-1">
              <label htmlFor="last_performed_date" className="text-xs font-semibold text-foreground">
                Lần thực hiện gần nhất
              </label>
              <input
                id="last_performed_date"
                type="date"
                {...register('last_performed_date')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Ngày tới hạn tiếp theo */}
            <div className="space-y-1">
              <label htmlFor="next_due_date" className="text-xs font-semibold text-foreground">
                Ngày tới hạn tiếp theo
              </label>
              <input
                id="next_due_date"
                type="date"
                {...register('next_due_date')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Trạng thái kích hoạt */}
          <div className="flex items-center gap-2 pt-2">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-xs font-medium text-foreground cursor-pointer">
              Áp dụng kế hoạch bảo dưỡng này ngay
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{planToEdit ? 'Lưu kế hoạch' : 'Tạo kế hoạch'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
