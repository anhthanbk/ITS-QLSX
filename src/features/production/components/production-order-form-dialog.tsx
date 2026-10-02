import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, ClipboardList } from 'lucide-react';
import {
  productionOrderSchema,
  type ProductionOrderFormValues,
} from '../validation/production-schemas';
import type { ProductionOrder, ProductionLine } from '../types';
import type { ProductCatalogItem } from '@/features/warehouse/types';

interface ProductionOrderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductionOrderFormValues) => Promise<void>;
  initialData?: ProductionOrder | null;
  lines: ProductionLine[];
  products: ProductCatalogItem[];
  isSubmitting?: boolean;
}

export const ProductionOrderFormDialog: React.FC<ProductionOrderFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lines,
  products,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData;
  const now = new Date();
  const startDateStr = now.toISOString().slice(0, 16);
  const endDateStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductionOrderFormValues>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      order_number: '',
      line_id: lines[0]?.id || null,
      product_id: products[0]?.id || '',
      target_quantity: 1000,
      completed_quantity: 0,
      scrap_quantity: 0,
      planned_start_date: startDateStr,
      planned_end_date: endDateStr,
      priority: 'medium',
      status: 'scheduled',
    },
  });

  // Auto-generate order number when creating
  useEffect(() => {
    if (!isEditing) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      setValue('order_number', `LSX-${year}${month}-${randomSeq}`);
    }
  }, [isEditing, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        order_number: initialData.order_number,
        line_id: initialData.line_id || null,
        product_id: initialData.product_id,
        production_plan_id: initialData.production_plan_id || null,
        bom_id: initialData.bom_id || null,
        target_quantity: initialData.target_quantity,
        completed_quantity: initialData.completed_quantity,
        scrap_quantity: initialData.scrap_quantity,
        planned_start_date: initialData.planned_start_date.slice(0, 16),
        planned_end_date: initialData.planned_end_date.slice(0, 16),
        actual_start_date: initialData.actual_start_date
          ? initialData.actual_start_date.slice(0, 16)
          : null,
        actual_end_date: initialData.actual_end_date
          ? initialData.actual_end_date.slice(0, 16)
          : null,
        priority: initialData.priority,
        status: initialData.status,
      });
    } else {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      reset({
        order_number: `LSX-${year}${month}-${randomSeq}`,
        line_id: lines[0]?.id || null,
        product_id: products[0]?.id || '',
        target_quantity: 1000,
        completed_quantity: 0,
        scrap_quantity: 0,
        planned_start_date: startDateStr,
        planned_end_date: endDateStr,
        priority: 'medium',
        status: 'scheduled',
      });
    }
  }, [initialData, reset, lines, products, startDateStr, endDateStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? 'Cập nhật lệnh sản xuất' : 'Tạo mới lệnh sản xuất (LSX)'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Chỉ định sản phẩm, dây chuyền, hạn ngạch sản xuất và tiến độ kế hoạch
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
              <label className="block text-xs font-semibold text-foreground">
                Mã lệnh sản xuất *
              </label>
              <input
                type="text"
                {...register('order_number')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
              />
              {errors.order_number && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.order_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Dây chuyền sản xuất</label>
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
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">Sản phẩm cần sản xuất *</label>
            <select
              {...register('product_id')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
            >
              <option value="">-- Chọn thành phẩm / bán thành phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} ({p.unit_of_measure})
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.product_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Sản lượng mục tiêu (Tấn) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('target_quantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.target_quantity && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.target_quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Đã hoàn thành</label>
              <input
                type="number"
                step="0.1"
                {...register('completed_quantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Phế phẩm (Tấn)</label>
              <input
                type="number"
                step="0.1"
                {...register('scrap_quantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Bắt đầu kế hoạch *
              </label>
              <input
                type="datetime-local"
                {...register('planned_start_date')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              {errors.planned_start_date && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {errors.planned_start_date.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Kết thúc kế hoạch *
              </label>
              <input
                type="datetime-local"
                {...register('planned_end_date')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              {errors.planned_end_date && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.planned_end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
              <select
                {...register('priority')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Ưu tiên cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Trạng thái lệnh</label>
              <select
                {...register('status')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="draft">Dự thảo</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="released">Đã phát lệnh</option>
                <option value="in_progress">Đang gia công</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="on_hold">Tạm dừng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Footer */}
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
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật lệnh' : 'Tạo lệnh sản xuất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
