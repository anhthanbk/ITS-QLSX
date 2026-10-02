import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar } from 'lucide-react';
import {
  productionPlanSchema,
  type ProductionPlanFormValues,
} from '../validation/production-schemas';
import type { ProductionMonthlyPlan, ProductionLine } from '../types';

interface ProductionPlanFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductionPlanFormValues) => Promise<void>;
  initialData?: ProductionMonthlyPlan | null;
  lines: ProductionLine[];
  isSubmitting?: boolean;
}

export const ProductionPlanFormDialog: React.FC<ProductionPlanFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lines,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData;

  const defaultYear = new Date().getFullYear();
  const defaultMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductionPlanFormValues>({
    resolver: zodResolver(productionPlanSchema),
    defaultValues: {
      plan_code: '',
      line_id: lines[0]?.id || '',
      year: defaultYear,
      month: defaultMonth,
      planned_capacity_tph: 100,
      planned_recovery_rate_pct: 85,
      total_calendar_hours: 720,
      planned_breakdown_hours: 12,
      planned_maintenance_hours: 24,
      planned_shutdown_hours: 12,
      target_quality_rate_pct: 99,
      planned_input_material_tons: 60000,
      planned_output_product_tons: 51000,
      planned_byproduct_tons: 6000,
      status: 'draft',
      notes: '',
    },
  });

  const selectedLineId = watch('line_id');
  const selectedYear = watch('year');
  const selectedMonth = watch('month');
  const inputTons = watch('planned_input_material_tons');
  const recoveryPct = watch('planned_recovery_rate_pct');
  const calHours = watch('total_calendar_hours') || 720;
  const bdHours = watch('planned_breakdown_hours') || 0;
  const mtHours = watch('planned_maintenance_hours') || 0;
  const sdHours = watch('planned_shutdown_hours') || 0;

  const calculatedOperatingHours = Math.max(0, calHours - (bdHours + mtHours + sdHours));

  // Auto-generate plan code when creating
  useEffect(() => {
    if (!isEditing && selectedLineId && selectedYear && selectedMonth) {
      const line = lines.find((l) => l.id === selectedLineId);
      const lineCode = line?.code || 'LINE';
      const mStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
      setValue('plan_code', `KH-${selectedYear}-${mStr}-${lineCode}`);
    }
  }, [selectedLineId, selectedYear, selectedMonth, isEditing, lines, setValue]);

  // Auto-calculate suggested output tons when input tons and recovery change
  useEffect(() => {
    if (!isEditing && inputTons && recoveryPct) {
      const suggestedOutput = Math.round(inputTons * (recoveryPct / 100));
      setValue('planned_output_product_tons', suggestedOutput);
    }
  }, [inputTons, recoveryPct, isEditing, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        plan_code: initialData.plan_code,
        line_id: initialData.line_id,
        year: initialData.year,
        month: initialData.month,
        planned_capacity_tph: initialData.planned_capacity_tph,
        planned_recovery_rate_pct: initialData.planned_recovery_rate_pct,
        total_calendar_hours: initialData.total_calendar_hours,
        planned_breakdown_hours: initialData.planned_breakdown_hours,
        planned_maintenance_hours: initialData.planned_maintenance_hours,
        planned_shutdown_hours: initialData.planned_shutdown_hours,
        target_quality_rate_pct: initialData.target_quality_rate_pct,
        planned_input_material_tons: initialData.planned_input_material_tons,
        planned_output_product_tons: initialData.planned_output_product_tons,
        planned_byproduct_tons: initialData.planned_byproduct_tons,
        status: initialData.status,
        notes: initialData.notes || '',
      });
    } else {
      reset({
        plan_code: `KH-${defaultYear}-${defaultMonth < 10 ? `0${defaultMonth}` : defaultMonth}-${lines[0]?.code || 'LINE'}`,
        line_id: lines[0]?.id || '',
        year: defaultYear,
        month: defaultMonth,
        planned_capacity_tph: lines[0]?.designed_capacity_tph || 100,
        planned_recovery_rate_pct: 85,
        total_calendar_hours: 720,
        planned_breakdown_hours: 12,
        planned_maintenance_hours: 24,
        planned_shutdown_hours: 12,
        target_quality_rate_pct: 99,
        planned_input_material_tons: 60000,
        planned_output_product_tons: 51000,
        planned_byproduct_tons: 6000,
        status: 'draft',
        notes: '',
      });
    }
  }, [initialData, reset, defaultYear, defaultMonth, lines]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? 'Chỉnh sửa kế hoạch sản xuất' : 'Lập kế hoạch sản xuất tháng'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Phân bổ thời gian, công suất và sản lượng mục tiêu theo dây chuyền
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Plan Code */}
            <div>
              <label className="block text-xs font-semibold text-foreground">Mã kế hoạch *</label>
              <input
                type="text"
                {...register('plan_code')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.plan_code && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.plan_code.message}</p>
              )}
            </div>

            {/* Line Selection */}
            <div>
              <label className="block text-xs font-semibold text-foreground">Dây chuyền *</label>
              <div className="relative mt-1">
                <select
                  {...register('line_id')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn dây chuyền --</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.line_id && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.line_id.message}</p>
              )}
            </div>

            {/* Month & Year */}
            <div>
              <label className="block text-xs font-semibold text-foreground">Tháng kế hoạch *</label>
              <select
                {...register('month', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              {errors.month && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.month.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Năm kế hoạch *</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.year && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Planned Hours Section */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <h3 className="text-xs font-bold text-foreground">Phân bổ thời gian vận hành (Giờ)</h3>
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] text-muted-foreground">Tổng giờ lịch *</label>
                <input
                  type="number"
                  step="0.5"
                  {...register('total_calendar_hours', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground">Dừng sự cố (h)</label>
                <input
                  type="number"
                  step="0.5"
                  {...register('planned_breakdown_hours', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground">Bảo dưỡng (h)</label>
                <input
                  type="number"
                  step="0.5"
                  {...register('planned_maintenance_hours', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground">Dừng kế hoạch (h)</label>
                <input
                  type="number"
                  step="0.5"
                  {...register('planned_shutdown_hours', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
              <span className="text-muted-foreground">Thời gian hoạt động thực tế dự kiến:</span>
              <span className="font-bold text-primary">{calculatedOperatingHours.toFixed(1)} giờ</span>
            </div>
          </div>

          {/* Capacity and Quantities */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Công suất TK (TPH) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('planned_capacity_tph', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.planned_capacity_tph && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.planned_capacity_tph.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Tỷ lệ thu hồi (%) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('planned_recovery_rate_pct', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.planned_recovery_rate_pct && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.planned_recovery_rate_pct.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Chất lượng mục tiêu (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('target_quality_rate_pct', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Outputs Tons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Quặng cấp vào (Tấn) *
              </label>
              <input
                type="number"
                step="1"
                {...register('planned_input_material_tons', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.planned_input_material_tons && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.planned_input_material_tons.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Thành phẩm thu hồi (Tấn) *
              </label>
              <input
                type="number"
                step="1"
                {...register('planned_output_product_tons', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.planned_output_product_tons && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.planned_output_product_tons.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Phụ phẩm dự kiến (Tấn)
              </label>
              <input
                type="number"
                step="1"
                {...register('planned_byproduct_tons', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">Trạng thái</label>
              <select
                {...register('status')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="draft">Dự thảo</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Ghi chú kế hoạch</label>
              <input
                type="text"
                placeholder="VD: Phục vụ đơn hàng xuất khẩu quý 4..."
                {...register('notes')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật kế hoạch' : 'Lưu kế hoạch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
