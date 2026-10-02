import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Layers } from 'lucide-react';
import {
  productionBatchSchema,
  type ProductionBatchFormValues,
} from '../validation/production-schemas';

interface ProductionBatchFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductionBatchFormValues) => Promise<void>;
  productionOrderId: string;
  orderNumber?: string;
  isSubmitting?: boolean;
}

export const ProductionBatchFormDialog: React.FC<ProductionBatchFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productionOrderId,
  orderNumber,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductionBatchFormValues>({
    resolver: zodResolver(productionBatchSchema),
    defaultValues: {
      batch_number: '',
      production_order_id: productionOrderId,
      planned_quantity: 500,
      actual_quantity: 0,
      scrap_quantity: 0,
      shift: 'shift_1',
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      reset({
        batch_number: `LO-${year}${month}-${randomSeq}`,
        production_order_id: productionOrderId,
        planned_quantity: 500,
        actual_quantity: 0,
        scrap_quantity: 0,
        shift: 'shift_1',
        status: 'pending',
        notes: '',
      });
    }
  }, [isOpen, productionOrderId, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Tạo lô sản xuất mới</h3>
              <p className="text-xs text-muted-foreground">
                Phát lệnh cho lệnh sản xuất: {orderNumber || productionOrderId}
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
            <label className="block text-xs font-semibold text-foreground">Mã lô sản xuất *</label>
            <input
              type="text"
              {...register('batch_number')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
            />
            {errors.batch_number && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.batch_number.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Sản lượng kế hoạch (Tấn) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('planned_quantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              {errors.planned_quantity && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.planned_quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Thực tế thu được</label>
              <input
                type="number"
                step="0.1"
                {...register('actual_quantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Phế phẩm</label>
              <input
                type="number"
                step="0.1"
                {...register('scrap_quantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Ca phân công</label>
              <select
                {...register('shift')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              >
                <option value="shift_1">Ca 1</option>
                <option value="shift_2">Ca 2</option>
                <option value="shift_3">Ca 3</option>
                <option value="night">Ca đêm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Trạng thái lô</label>
              <select
                {...register('status')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              >
                <option value="pending">Chờ gia công</option>
                <option value="running">Đang chạy máy</option>
                <option value="paused">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
                <option value="rejected">Không đạt KCS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">Ghi chú lô</label>
            <input
              type="text"
              placeholder="VD: Cắt mẫu thử KCS đầu ca..."
              {...register('notes')}
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
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo lô sản xuất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
