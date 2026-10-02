import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { inventoryAdjustmentSchema, type InventoryAdjustmentFormValues } from '../validation/warehouse-schemas';
import type { InventoryStockBalance } from '@/features/warehouse/types';

interface InventoryAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: InventoryStockBalance | null;
  onSubmit: (values: InventoryAdjustmentFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const InventoryAdjustmentDialog: React.FC<InventoryAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  stockItem,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InventoryAdjustmentFormValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      warehouse_id: '',
      item_type: 'material',
      item_id: '',
      actual_quantity: 0,
      reason: '',
    },
  });

  const actualQty = watch('actual_quantity') || 0;
  const currentQty = stockItem?.current_quantity || 0;
  const difference = Number((actualQty - currentQty).toFixed(4));

  useEffect(() => {
    if (stockItem && isOpen) {
      reset({
        warehouse_id: stockItem.warehouse_id,
        item_type: stockItem.item_type,
        item_id: stockItem.item_id,
        actual_quantity: stockItem.current_quantity,
        reason: '',
      });
    }
  }, [stockItem, isOpen, reset]);

  const handleFormSubmit = async (data: InventoryAdjustmentFormValues) => {
    await onSubmit(data);
  };

  if (!isOpen || !stockItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjustment-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 id="adjustment-dialog-title" className="text-base font-bold text-foreground">
                Kiểm kê & Điều chỉnh tồn
              </h2>
              <p className="text-[11px] text-muted-foreground">Khớp số lượng thực tế với dữ liệu sổ sách hệ thống</p>
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

        {/* Item Info Summary */}
        <div className="px-6 pt-4">
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kho lưu trữ:</span>
              <span className="font-semibold text-foreground">{stockItem.warehouse_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mặt hàng:</span>
              <span className="font-semibold text-foreground">{stockItem.item_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã mặt hàng:</span>
              <span className="font-mono font-bold text-foreground">{stockItem.item_code}</span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-1.5 font-medium">
              <span className="text-muted-foreground">Tồn theo sổ sách:</span>
              <span className="font-mono text-sm font-bold text-foreground">
                {currentQty.toLocaleString('vi-VN')} {stockItem.unit_of_measure}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Actual count */}
          <div className="space-y-1">
            <label htmlFor="actual_quantity" className="text-xs font-semibold text-foreground">
              Số lượng kiểm đếm thực tế ({stockItem.unit_of_measure}) <span className="text-destructive">*</span>
            </label>
            <input
              id="actual_quantity"
              type="number"
              step="any"
              min="0"
              placeholder="VD: 120"
              {...register('actual_quantity', { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.actual_quantity && (
              <p className="text-[11px] text-destructive">{errors.actual_quantity.message}</p>
            )}
          </div>

          {/* Difference card */}
          <div
            className={`rounded-xl border p-3 flex items-center justify-between text-xs font-semibold ${
              difference > 0
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : difference < 0
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-border bg-accent/20 text-muted-foreground'
            }`}
          >
            <span>Chênh lệch điều chỉnh:</span>
            <span className="font-mono text-sm font-bold">
              {difference > 0 ? `+${difference.toLocaleString('vi-VN')}` : difference.toLocaleString('vi-VN')}{' '}
              {stockItem.unit_of_measure} ({difference > 0 ? 'Thừa' : difference < 0 ? 'Thiếu' : 'Khớp'})
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label htmlFor="reason" className="text-xs font-semibold text-foreground">
              Lý do kiểm kê / điều chỉnh <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reason"
              rows={3}
              placeholder="VD: Kiểm kê định kỳ cuối tháng 10, phát hiện hao hụt tự nhiên do bay hơi..."
              {...register('reason')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {errors.reason && <p className="text-[11px] text-destructive">{errors.reason.message}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || difference === 0}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu biên bản kiểm kê</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
