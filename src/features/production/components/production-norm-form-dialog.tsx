import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Sliders } from 'lucide-react';
import {
  technoEconomicNormSchema,
  type TechnoEconomicNormFormValues,
} from '../validation/production-schemas';
import type { TechnoEconomicNorm, ProductionLine } from '../types';

interface ProductionNormFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TechnoEconomicNormFormValues) => Promise<void>;
  initialData?: TechnoEconomicNorm | null;
  lines: ProductionLine[];
  isSubmitting?: boolean;
}

export const ProductionNormFormDialog: React.FC<ProductionNormFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lines,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData;
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechnoEconomicNormFormValues>({
    resolver: zodResolver(technoEconomicNormSchema),
    defaultValues: {
      norm_code: '',
      line_id: lines[0]?.id || null,
      resource_type: 'electricity',
      resource_name: '',
      unit_of_measure: 'kWh/Tấn',
      norm_rate: 15.0,
      effective_from: todayStr,
      effective_to: null,
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        norm_code: initialData.norm_code,
        line_id: initialData.line_id || null,
        product_id: initialData.product_id || null,
        resource_type: initialData.resource_type,
        resource_name: initialData.resource_name,
        unit_of_measure: initialData.unit_of_measure,
        norm_rate: initialData.norm_rate,
        effective_from: initialData.effective_from,
        effective_to: initialData.effective_to || null,
        is_active: initialData.is_active,
      });
    } else {
      reset({
        norm_code: '',
        line_id: lines[0]?.id || null,
        resource_type: 'electricity',
        resource_name: '',
        unit_of_measure: 'kWh/Tấn',
        norm_rate: 15.0,
        effective_from: todayStr,
        effective_to: null,
        is_active: true,
      });
    }
  }, [initialData, reset, todayStr, lines]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? 'Chỉnh sửa định mức KT - KT' : 'Thêm định mức kinh tế kỹ thuật'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Định mức suất tiêu hao điện, nước, hóa chất hoặc phụ liệu theo tấn thành phẩm
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Mã định mức *</label>
              <input
                type="text"
                placeholder="VD: DM-DIEN-02"
                {...register('norm_code')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
              />
              {errors.norm_code && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.norm_code.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Loại tài nguyên *</label>
              <select
                {...register('resource_type')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="electricity">Điện năng</option>
                <option value="water">Nước tuần hoàn</option>
                <option value="chemical">Hóa chất / Phụ gia</option>
                <option value="diesel">Dầu Diesel</option>
                <option value="coal">Than đốt</option>
                <option value="explosive">Vật liệu nổ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Tên tài nguyên / Vật tư *
            </label>
            <input
              type="text"
              placeholder="VD: Điện năng tiêu thụ chuyền tuyển rửa"
              {...register('resource_name')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
            />
            {errors.resource_name && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.resource_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Dây chuyền áp dụng</label>
              <select
                {...register('line_id')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="">Toàn bộ nhà máy</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Đơn vị tính *</label>
              <input
                type="text"
                placeholder="VD: kWh/Tấn, m3/Tấn..."
                {...register('unit_of_measure')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
              {errors.unit_of_measure && (
                <p className="mt-1 text-[11px] text-rose-500">{errors.unit_of_measure.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Mức tiêu hao định mức *
            </label>
            <input
              type="number"
              step="0.0001"
              {...register('norm_rate', { valueAsNumber: true })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
            />
            {errors.norm_rate && (
              <p className="mt-1 text-[11px] text-rose-500">{errors.norm_rate.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Hiệu lực từ ngày *</label>
              <input
                type="date"
                {...register('effective_from')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Đến ngày (tùy chọn)</label>
              <input
                type="date"
                {...register('effective_to')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_norm"
              {...register('is_active')}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="is_active_norm" className="text-xs font-medium text-foreground">
              Định mức đang có hiệu lực áp dụng
            </label>
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
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật định mức' : 'Lưu định mức'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
