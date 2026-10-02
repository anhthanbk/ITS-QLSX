import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { materialSchema, type MaterialFormValues } from '../validation/warehouse-schemas';
import type { MaterialCatalogItem } from '@/features/warehouse/types';

export interface MaterialFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit?: MaterialCatalogItem | null;
  onSubmit: (values: MaterialFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const MaterialFormDialog: React.FC<MaterialFormDialogProps> = ({
  isOpen,
  onClose,
  materialToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      code: '',
      name: '',
      category: 'raw_material',
      unit_of_measure: 'kg',
      min_stock_level: 0,
      max_stock_level: null,
      reorder_point: 0,
      standard_cost: 0,
      status: 'active',
    },
  });

  useEffect(() => {
    if (materialToEdit) {
      reset({
        code: materialToEdit.code,
        name: materialToEdit.name,
        category: (materialToEdit.category as MaterialFormValues['category']) || 'raw_material',
        unit_of_measure: materialToEdit.unit_of_measure,
        min_stock_level: materialToEdit.min_stock_level,
        max_stock_level: materialToEdit.max_stock_level,
        reorder_point: materialToEdit.reorder_point,
        standard_cost: materialToEdit.standard_cost,
        status: (materialToEdit.status as 'active' | 'inactive') || 'active',
      });
    } else {
      reset({
        code: '',
        name: '',
        category: 'raw_material',
        unit_of_measure: 'kg',
        min_stock_level: 0,
        max_stock_level: null,
        reorder_point: 0,
        standard_cost: 0,
        status: 'active',
      });
    }
  }, [materialToEdit, reset, isOpen]);

  const handleFormSubmit = async (data: MaterialFormValues) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 id="material-dialog-title" className="text-base font-bold text-foreground">
                {materialToEdit ? 'Chỉnh sửa vật tư & định mức' : 'Thêm vật tư mới vào danh mục'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {materialToEdit
                  ? `Mã: ${materialToEdit.code} — Cập nhật quy cách và mức cảnh báo tồn kho`
                  : 'Khai báo thông số quy cách, phân loại nhóm và ngưỡng tồn an toàn'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6 text-xs">
          {/* Row 1: Code and Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="material-code" className="mb-1 block font-semibold text-foreground">
                Mã vật tư <span className="text-destructive">*</span>
              </label>
              <input
                id="material-code"
                type="text"
                placeholder="VD: NVL-004, SP-BEAR-6312"
                {...register('code')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              {errors.code && <p className="mt-1 text-[11px] text-destructive">{errors.code.message}</p>}
            </div>

            <div>
              <label htmlFor="material-category" className="mb-1 block font-semibold text-foreground">
                Nhóm phân loại <span className="text-destructive">*</span>
              </label>
              <select
                id="material-category"
                {...register('category')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="raw_material">Nguyên vật liệu (raw_material)</option>
                <option value="chemical">Hóa chất công nghiệp (chemical)</option>
                <option value="spare_part">Phụ tùng cơ điện (spare_part)</option>
                <option value="packaging">Vật tư bao bì & Đóng gói (packaging)</option>
                <option value="consumable">Vật tư tiêu hao / BHLĐ (consumable)</option>
                <option value="fuel_energy">Nhiên liệu & Năng lượng (fuel_energy)</option>
                <option value="other">Vật tư phụ trợ khác (other)</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-[11px] text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label htmlFor="material-name" className="mb-1 block font-semibold text-foreground">
              Tên vật tư / Quy cách kỹ thuật <span className="text-destructive">*</span>
            </label>
            <input
              id="material-name"
              type="text"
              placeholder="VD: Quặng Bauxite thô Loại 1 hoặc Vòng bi SKF 6312 2Z/C3"
              {...register('name')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
            {errors.name && <p className="mt-1 text-[11px] text-destructive">{errors.name.message}</p>}
          </div>

          {/* Row 3: Unit and Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="material-unit" className="mb-1 block font-semibold text-foreground">
                Đơn vị tính (ĐVT) <span className="text-destructive">*</span>
              </label>
              <input
                id="material-unit"
                type="text"
                placeholder="VD: tấn, kg, Cái, Bộ, Sợi, Lít..."
                {...register('unit_of_measure')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              {errors.unit_of_measure && (
                <p className="mt-1 text-[11px] text-destructive">{errors.unit_of_measure.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="material-status" className="mb-1 block font-semibold text-foreground">
                Trạng thái danh mục
              </label>
              <select
                id="material-status"
                {...register('status')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="active">Đang sử dụng (Active)</option>
                <option value="inactive">Tạm ngưng (Inactive)</option>
              </select>
            </div>
          </div>

          {/* Group 2: Stock Thresholds & Cost */}
          <div className="rounded-xl border border-border/80 bg-accent/20 p-3 space-y-3">
            <h3 className="text-xs font-bold text-foreground">Định mức an toàn & Điểm đặt hàng</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="material-min-stock" className="mb-1 block font-medium text-foreground">
                  Tồn tối thiểu (Min) <span className="text-destructive">*</span>
                </label>
                <input
                  id="material-min-stock"
                  type="number"
                  step="any"
                  min="0"
                  {...register('min_stock_level')}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                />
                {errors.min_stock_level && (
                  <p className="mt-1 text-[10px] text-destructive">{errors.min_stock_level.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="material-reorder-point" className="mb-1 block font-medium text-foreground">
                  Điểm đặt hàng lại <span className="text-destructive">*</span>
                </label>
                <input
                  id="material-reorder-point"
                  type="number"
                  step="any"
                  min="0"
                  {...register('reorder_point')}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                />
                {errors.reorder_point && (
                  <p className="mt-1 text-[10px] text-destructive">{errors.reorder_point.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="material-max-stock" className="mb-1 block font-medium text-foreground">
                  Tồn tối đa (Max)
                </label>
                <input
                  id="material-max-stock"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Tuỳ chọn"
                  {...register('max_stock_level')}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="material-cost" className="mb-1 block font-medium text-foreground">
                Đơn giá định mức kế hoạch (VNĐ)
              </label>
              <input
                id="material-cost"
                type="number"
                step="any"
                min="0"
                placeholder="VD: 350000"
                {...register('standard_cost')}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              {errors.standard_cost && (
                <p className="mt-1 text-[10px] text-destructive">{errors.standard_cost.message}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {materialToEdit ? 'Lưu thay đổi' : 'Thêm vật tư'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
