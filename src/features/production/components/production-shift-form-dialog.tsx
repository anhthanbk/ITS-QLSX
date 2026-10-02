import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Clock } from 'lucide-react';
import {
  productionShiftSchema,
  type ProductionShiftFormValues,
} from '../validation/production-schemas';
import type { ProductionShift, ProductionLine } from '../types';

interface ProductionShiftFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductionShiftFormValues) => Promise<void>;
  initialData?: ProductionShift | null;
  lines: ProductionLine[];
  isSubmitting?: boolean;
}

export const ProductionShiftFormDialog: React.FC<ProductionShiftFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lines,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData;
  const todayStr = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductionShiftFormValues>({
    resolver: zodResolver(productionShiftSchema),
    defaultValues: {
      shift_code: '',
      line_id: lines[0]?.id || '',
      shift_date: todayStr,
      shift_number: 1,
      standard_shift_hours: 8.0,
      total_downtime_hours: 0,
      raw_material_input_tons: 800,
      product_output_tons: 680,
      byproduct_output_tons: 80,
      status: 'completed',
      notes: '',
    },
  });

  const selectedLineId = watch('line_id');
  const selectedDate = watch('shift_date');
  const selectedShiftNumber = watch('shift_number');
  const stdHours = watch('standard_shift_hours') || 8;
  const dtHours = watch('total_downtime_hours') || 0;
  const inTons = watch('raw_material_input_tons') || 0;
  const outTons = watch('product_output_tons') || 0;

  const runningHours = Math.max(0, stdHours - dtHours);
  const calculatedCapacity =
    runningHours > 0 ? (outTons / runningHours).toFixed(2) : '0';
  const calculatedRecovery =
    inTons > 0 ? ((outTons / inTons) * 100).toFixed(2) : '0';

  // Auto-generate shift code
  useEffect(() => {
    if (!isEditing && selectedLineId && selectedDate && selectedShiftNumber) {
      const line = lines.find((l) => l.id === selectedLineId);
      const lineCode = line?.code || 'LINE';
      const cleanDate = selectedDate.replace(/-/g, '');
      setValue('shift_code', `CA-${cleanDate}-${lineCode}-S${selectedShiftNumber}`);
    }
  }, [selectedLineId, selectedDate, selectedShiftNumber, isEditing, lines, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        shift_code: initialData.shift_code,
        line_id: initialData.line_id,
        shift_date: initialData.shift_date,
        shift_number: initialData.shift_number,
        standard_shift_hours: initialData.standard_shift_hours,
        total_downtime_hours: initialData.total_downtime_hours,
        raw_material_input_tons: initialData.raw_material_input_tons,
        product_output_tons: initialData.product_output_tons,
        byproduct_output_tons: initialData.byproduct_output_tons,
        operator_employee_id: initialData.operator_employee_id,
        status: initialData.status,
        notes: initialData.notes || '',
      });
    } else {
      const cleanDate = todayStr.replace(/-/g, '');
      reset({
        shift_code: `CA-${cleanDate}-${lines[0]?.code || 'LINE'}-S1`,
        line_id: lines[0]?.id || '',
        shift_date: todayStr,
        shift_number: 1,
        standard_shift_hours: 8.0,
        total_downtime_hours: 0,
        raw_material_input_tons: 800,
        product_output_tons: 680,
        byproduct_output_tons: 80,
        status: 'completed',
        notes: '',
      });
    }
  }, [initialData, reset, todayStr, lines]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? 'Chỉnh sửa ca sản xuất' : 'Ghi nhận số liệu ca sản xuất'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Ghi nhận sản lượng thu hồi, thời gian chạy máy và chỉ số vận hành
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
            <div>
              <label className="block text-xs font-semibold text-foreground">Mã ca *</label>
              <input
                type="text"
                {...register('shift_code')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
              />
              {errors.shift_code && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.shift_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Dây chuyền *</label>
              <select
                {...register('line_id')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="">-- Chọn dây chuyền --</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </select>
              {errors.line_id && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.line_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Ngày vận hành *</label>
              <input
                type="date"
                {...register('shift_date')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.shift_date && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.shift_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Ca sản xuất *</label>
              <select
                {...register('shift_number', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value={1}>Ca 1 (06:00 - 14:00)</option>
                <option value={2}>Ca 2 (14:00 - 22:00)</option>
                <option value={3}>Ca 3 (22:00 - 06:00)</option>
              </select>
            </div>
          </div>

          {/* Time & Running Hours */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] text-muted-foreground">Giờ tiêu chuẩn (h) *</label>
                <input
                  type="number"
                  step="0.5"
                  {...register('standard_shift_hours', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground">Giờ dừng chuyền (h)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('total_downtime_hours', { valueAsNumber: true })}
                  className="mt-1 w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-muted-foreground">Giờ chạy máy thực:</span>
                <span className="text-sm font-bold text-primary">{runningHours.toFixed(1)} giờ</span>
              </div>
            </div>
          </div>

          {/* Production Output */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Quặng cấp đầu vào (Tấn) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('raw_material_input_tons', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.raw_material_input_tons && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.raw_material_input_tons.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Thành phẩm thu hồi (Tấn) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('product_output_tons', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.product_output_tons && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.product_output_tons.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Phụ phẩm thu hồi (Tấn)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('byproduct_output_tons', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Calculated KPIs Preview */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span>
              Công suất tính toán: <strong>{calculatedCapacity} TPH</strong>
            </span>
            <span>
              Tỷ lệ thu hồi: <strong>{calculatedRecovery}%</strong>
            </span>
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">Trạng thái ca</label>
              <select
                {...register('status')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="in_progress">Đang vận hành</option>
                <option value="completed">Đã chốt ca</option>
                <option value="verified">Đã nghiệm thu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Nhật ký tóm tắt</label>
              <input
                type="text"
                placeholder="VD: Chạy ổn định, nguyên liệu ẩm 5%..."
                {...register('notes')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật ca' : 'Lưu bản ghi ca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
