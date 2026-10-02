import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertTriangle } from 'lucide-react';
import {
  shiftDowntimeSchema,
  type ShiftDowntimeFormValues,
} from '../validation/production-schemas';

interface ProductionShiftDowntimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ShiftDowntimeFormValues) => Promise<void>;
  shiftId: string;
  lineId: string;
  isSubmitting?: boolean;
}

export const ProductionShiftDowntimeDialog: React.FC<ProductionShiftDowntimeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  shiftId,
  lineId,
  isSubmitting = false,
}) => {
  const now = new Date();
  const startTimeStr = new Date(now.getTime() - 30 * 60 * 1000).toISOString().slice(0, 16);
  const endTimeStr = now.toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShiftDowntimeFormValues>({
    resolver: zodResolver(shiftDowntimeSchema),
    defaultValues: {
      shift_id: shiftId,
      line_id: lineId,
      downtime_category: 'breakdown_incident',
      start_time: startTimeStr,
      end_time: endTimeStr,
      duration_minutes: 30,
      reason: '',
      action_taken: '',
      status: 'resolved',
    },
  });

  const startTime = watch('start_time');
  const endTime = watch('end_time');

  React.useEffect(() => {
    if (startTime && endTime) {
      const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
      const diffMins = Math.max(0, Math.round(diffMs / (1000 * 60)));
      if (diffMins > 0) {
        setValue('duration_minutes', diffMins);
      }
    }
  }, [startTime, endTime, setValue]);

  React.useEffect(() => {
    if (isOpen) {
      reset({
        shift_id: shiftId,
        line_id: lineId,
        downtime_category: 'breakdown_incident',
        start_time: startTimeStr,
        end_time: endTimeStr,
        duration_minutes: 30,
        reason: '',
        action_taken: '',
        status: 'resolved',
      });
    }
  }, [isOpen, shiftId, lineId, reset, startTimeStr, endTimeStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Ghi nhận sự cố dừng máy</h3>
              <p className="text-xs text-muted-foreground">
                Tự động tổng hợp thời gian dừng máy vào báo cáo ca
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground">Loại dừng máy *</label>
            <select
              {...register('downtime_category')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
            >
              <option value="breakdown_incident">Sự cố hỏng hóc thiết bị đột xuất</option>
              <option value="planned_maintenance">Bảo dưỡng máy móc định kỳ</option>
              <option value="scheduled_shutdown">Dừng kế hoạch (vệ sinh/thay ca)</option>
              <option value="no_material">Thiếu quặng nguyên liệu cấp</option>
              <option value="power_outage">Mất điện lưới / ngắt nguồn khẩn cấp</option>
              <option value="operational_pause">Tạm dừng điều chỉnh công nghệ</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Bắt đầu *</label>
              <input
                type="datetime-local"
                {...register('start_time')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Kết thúc *</label>
              <input
                type="datetime-local"
                {...register('end_time')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Thời lượng (Phút) *</label>
              <input
                type="number"
                {...register('duration_minutes', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.duration_minutes.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Tình trạng khắc phục</label>
              <select
                {...register('status')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              >
                <option value="resolved">Đã xử lý xong</option>
                <option value="pending">Đang xử lý</option>
                <option value="waiting_parts">Chờ vật tư thay thế</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">Nguyên nhân chi tiết *</label>
            <textarea
              rows={2}
              placeholder="VD: Rách băng tải B200 do đá kẹt góc xả..."
              {...register('reason')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
            />
            {errors.reason && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">Biện pháp xử lý</label>
            <input
              type="text"
              placeholder="VD: Vá dán băng tải nguội, kiểm tra chạy thử..."
              {...register('action_taken')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu sự cố dừng máy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
