import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Warehouse as WarehouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { warehouseSchema, type WarehouseFormValues } from '../validation/warehouse-schemas';
import type { Warehouse } from '@/features/warehouse/types';
import { useWarehouseManagerOptions } from '../hooks/use-warehouses';

export interface WarehouseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseToEdit?: Warehouse | null;
  onSubmit: (values: WarehouseFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const WarehouseFormDialog: React.FC<WarehouseFormDialogProps> = ({
  isOpen,
  onClose,
  warehouseToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const { data: managers = [] } = useWarehouseManagerOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: '',
      name: '',
      warehouse_type: 'raw_material',
      location: '',
      manager_employee_id: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (warehouseToEdit) {
      reset({
        code: warehouseToEdit.code,
        name: warehouseToEdit.name,
        warehouse_type: warehouseToEdit.warehouse_type,
        location: warehouseToEdit.location ?? '',
        manager_employee_id: warehouseToEdit.manager_employee_id ?? '',
        status: warehouseToEdit.status,
      });
    } else {
      reset({
        code: '',
        name: '',
        warehouse_type: 'raw_material',
        location: '',
        manager_employee_id: '',
        status: 'active',
      });
    }
  }, [warehouseToEdit, reset, isOpen]);

  const handleFormSubmit = async (data: WarehouseFormValues) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-dialog-title"
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
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 id="warehouse-dialog-title" className="text-base font-bold text-foreground">
                {warehouseToEdit ? 'Chỉnh sửa thông tin kho' : 'Thêm kho mới'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {warehouseToEdit ? `Mã kho: ${warehouseToEdit.code}` : 'Khai báo thông số kho lưu trữ & vật tư'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mã kho */}
            <div className="space-y-1">
              <label htmlFor="code" className="text-xs font-semibold text-foreground">
                Mã kho <span className="text-destructive">*</span>
              </label>
              <input
                id="code"
                type="text"
                placeholder="VD: K-NVL, K-TP..."
                {...register('code')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
            </div>

            {/* Loại kho */}
            <div className="space-y-1">
              <label htmlFor="warehouse_type" className="text-xs font-semibold text-foreground">
                Loại kho lưu trữ <span className="text-destructive">*</span>
              </label>
              <select
                id="warehouse_type"
                {...register('warehouse_type')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="raw_material">Kho nguyên vật liệu (raw_material)</option>
                <option value="finished_goods">Kho thành phẩm (finished_goods)</option>
                <option value="spare_parts">Kho phụ tùng & thiết bị (spare_parts)</option>
                <option value="quarantine">Kho cách ly / kiểm định (quarantine)</option>
                <option value="byproduct">Kho phụ phẩm / chất thải (byproduct)</option>
                <option value="transit">Kho trung chuyển (transit)</option>
              </select>
              {errors.warehouse_type && (
                <p className="text-[11px] text-destructive">{errors.warehouse_type.message}</p>
              )}
            </div>
          </div>

          {/* Tên kho */}
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-semibold text-foreground">
              Tên kho <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="VD: Kho Nguyên Vật Liệu Chính"
              {...register('name')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
          </div>

          {/* Vị trí mặt bằng */}
          <div className="space-y-1">
            <label htmlFor="location" className="text-xs font-semibold text-foreground">
              Vị trí mặt bằng / Địa điểm
            </label>
            <input
              id="location"
              type="text"
              placeholder="VD: Khu A - Cạnh xưởng nghiền tuyển"
              {...register('location')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.location && <p className="text-[11px] text-destructive">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Người phụ trách */}
            <div className="space-y-1">
              <label htmlFor="manager_employee_id" className="text-xs font-semibold text-foreground">
                Thủ kho / Người phụ trách
              </label>
              <select
                id="manager_employee_id"
                {...register('manager_employee_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chưa chỉ định --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.employee_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-semibold text-foreground">
                Trạng thái vận hành <span className="text-destructive">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Đang hoạt động (active)</option>
                <option value="inactive">Tạm dừng tiếp nhận (inactive)</option>
              </select>
              {errors.status && <p className="text-[11px] text-destructive">{errors.status.message}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{warehouseToEdit ? 'Lưu thay đổi' : 'Thêm kho'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
