import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, BookOpen } from 'lucide-react';
import {
  shiftLogSchema,
  type ShiftLogFormValues,
} from '../validation/production-schemas';

interface ProductionShiftLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ShiftLogFormValues) => Promise<void>;
  shiftId: string;
  isSubmitting?: boolean;
}

export const ProductionShiftLogDialog: React.FC<ProductionShiftLogDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  shiftId,
  isSubmitting = false,
}) => {
  const now = new Date();
  const logTimeStr = now.toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShiftLogFormValues>({
    resolver: zodResolver(shiftLogSchema),
    defaultValues: {
      shift_id: shiftId,
      log_time: logTimeStr,
      change_type: 'process_parameter',
      content: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        shift_id: shiftId,
        log_time: logTimeStr,
        change_type: 'process_parameter',
        content: '',
      });
    }
  }, [isOpen, shiftId, reset, logTimeStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Ghi nhật ký vận hành ca</h3>
              <p className="text-xs text-muted-foreground">
                Ghi chú điều chỉnh thông số công nghệ, chỉ đạo quản đốc hoặc lưu ý an toàn
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Thời điểm *</label>
              <input
                type="datetime-local"
                {...register('log_time')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Phân loại ghi chú *</label>
              <select
                {...register('change_type')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              >
                <option value="process_parameter">Điều chỉnh thông số công nghệ</option>
                <option value="equipment_adjustment">Hiệu chỉnh máy móc / thiết bị</option>
                <option value="feed_ore_variation">Biến động quặng nguyên liệu đầu vào</option>
                <option value="safety_notice">Cảnh báo / Nhắc nhở an toàn</option>
                <option value="management_directive">Chỉ đạo từ Ban Giám đốc / Quản đốc</option>
                <option value="other">Ghi chú khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">Nội dung nhật ký *</label>
            <textarea
              rows={3}
              placeholder="VD: Điều chỉnh lưu lượng nước rửa từ 45m3/h lên 52m3/h do quặng đầu vào lẫn nhiều bùn sét..."
              {...register('content')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
            />
            {errors.content && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.content.message}</p>
            )}
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
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Ghi nhật ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
