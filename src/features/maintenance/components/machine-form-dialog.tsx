import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Cpu, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { machineSchema, type MachineFormValues } from '../validation/maintenance-schemas';
import type { Machine } from '../types';
import { useProductionLines } from '../hooks/use-machines';
import { useDepartments } from '@/features/hr/hooks/use-departments';

export interface MachineFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machineToEdit?: Machine | null;
  onSubmit: (values: MachineFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const MachineFormDialog: React.FC<MachineFormDialogProps> = ({
  isOpen,
  onClose,
  machineToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const { data: productionLines } = useProductionLines();
  const { data: departments } = useDepartments();

  const [extraSpecsList, setExtraSpecsList] = useState<Array<{ key: string; value: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      machine_code: '',
      name: '',
      line_id: null,
      department_id: null,
      model: '',
      serial_number: '',
      line_location: '',
      rated_capacity_per_hour: null,
      power_rating_kw: null,
      installation_date: '',
      status: 'operational',
    },
  });

  useEffect(() => {
    if (machineToEdit) {
      reset({
        machine_code: machineToEdit.machine_code,
        name: machineToEdit.name,
        line_id: machineToEdit.line_id,
        department_id: machineToEdit.department_id,
        model: machineToEdit.model || '',
        serial_number: machineToEdit.serial_number || '',
        line_location: machineToEdit.line_location || '',
        rated_capacity_per_hour: machineToEdit.rated_capacity_per_hour,
        power_rating_kw: machineToEdit.power_rating_kw,
        installation_date: machineToEdit.installation_date || '',
        status: machineToEdit.status,
      });

      const specs = machineToEdit.extra_specs;
      if (specs && typeof specs === 'object' && Object.keys(specs).length > 0) {
        setExtraSpecsList(
          Object.entries(specs).map(([key, value]) => ({ key, value: String(value) })),
        );
      } else {
        setExtraSpecsList([]);
      }
    } else {
      reset({
        machine_code: '',
        name: '',
        line_id: null,
        department_id: null,
        model: '',
        serial_number: '',
        line_location: '',
        rated_capacity_per_hour: null,
        power_rating_kw: null,
        installation_date: '',
        status: 'operational',
      });
      setExtraSpecsList([]);
    }
  }, [machineToEdit, reset, isOpen]);

  const handleFormSubmit = (data: MachineFormValues) => {
    const specsObj: Record<string, string> = {};
    extraSpecsList.forEach((item) => {
      const k = item.key.trim();
      const v = item.value.trim();
      if (k && v) {
        specsObj[k] = v;
      }
    });

    return onSubmit({
      ...data,
      extra_specs: Object.keys(specsObj).length > 0 ? specsObj : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="machine-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h2 id="machine-dialog-title" className="text-base font-bold text-foreground">
                {machineToEdit ? 'Chỉnh Sửa Thông Tin Thiết Bị' : 'Thêm Thiết Bị Mới'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {machineToEdit
                  ? `Mã TB: ${machineToEdit.machine_code}`
                  : 'Khai báo thông số kỹ thuật và dây chuyền lắp đặt'}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Mã thiết bị */}
            <div className="space-y-1">
              <label htmlFor="machine_code" className="text-xs font-semibold text-foreground">
                Mã thiết bị <span className="text-destructive">*</span>
              </label>
              <input
                id="machine_code"
                type="text"
                placeholder="VD: MC-CRUSH-01"
                {...register('machine_code')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              />
              {errors.machine_code && (
                <p className="text-[11px] text-destructive">{errors.machine_code.message}</p>
              )}
            </div>

            {/* Tên thiết bị */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-foreground">
                Tên thiết bị <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="VD: Máy nghiền búa sơ cấp"
                {...register('name')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Dây chuyền sản xuất */}
            <div className="space-y-1">
              <label htmlFor="line_id" className="text-xs font-semibold text-foreground">
                Dây chuyền sản xuất
              </label>
              <select
                id="line_id"
                {...register('line_id', {
                  setValueAs: (v) => (v === '' ? null : v),
                })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chưa gán dây chuyền --</option>
                {productionLines?.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name} ({line.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Phòng ban / Bộ phận */}
            <div className="space-y-1">
              <label htmlFor="department_id" className="text-xs font-semibold text-foreground">
                Bộ phận quản lý
              </label>
              <select
                id="department_id"
                {...register('department_id', {
                  setValueAs: (v) => (v === '' ? null : v),
                })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn bộ phận --</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Model */}
            <div className="space-y-1">
              <label htmlFor="model" className="text-xs font-semibold text-foreground">
                Model máy
              </label>
              <input
                id="model"
                type="text"
                placeholder="VD: MB-800X"
                {...register('model')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Serial Number */}
            <div className="space-y-1">
              <label htmlFor="serial_number" className="text-xs font-semibold text-foreground">
                Số Serial
              </label>
              <input
                id="serial_number"
                type="text"
                placeholder="VD: SN-2024-998"
                {...register('serial_number')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Vị trí trên dây chuyền */}
            <div className="space-y-1">
              <label htmlFor="line_location" className="text-xs font-semibold text-foreground">
                Vị trí lắp đặt
              </label>
              <input
                id="line_location"
                type="text"
                placeholder="VD: Đầu dây chuyền 1"
                {...register('line_location')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Công suất định mức */}
            <div className="space-y-1">
              <label htmlFor="rated_capacity_per_hour" className="text-xs font-semibold text-foreground">
                Công suất (tấn/giờ)
              </label>
              <input
                id="rated_capacity_per_hour"
                type="number"
                step="0.1"
                placeholder="VD: 50"
                {...register('rated_capacity_per_hour')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.rated_capacity_per_hour && (
                <p className="text-[11px] text-destructive">{errors.rated_capacity_per_hour.message}</p>
              )}
            </div>

            {/* Công suất điện */}
            <div className="space-y-1">
              <label htmlFor="power_rating_kw" className="text-xs font-semibold text-foreground">
                Điện năng (kW)
              </label>
              <input
                id="power_rating_kw"
                type="number"
                step="0.1"
                placeholder="VD: 75"
                {...register('power_rating_kw')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.power_rating_kw && (
                <p className="text-[11px] text-destructive">{errors.power_rating_kw.message}</p>
              )}
            </div>

            {/* Trạng thái vận hành */}
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-semibold text-foreground">
                Trạng thái <span className="text-destructive">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="operational">Đang vận hành</option>
                <option value="in_maintenance">Đang bảo dưỡng</option>
                <option value="breakdown">Sự cố / Hỏng</option>
                <option value="standby">Dự phòng</option>
                <option value="decommissioned">Ngừng sử dụng</option>
              </select>
            </div>
          </div>

          {/* Ngày lắp đặt */}
          <div className="space-y-1">
            <label htmlFor="installation_date" className="text-xs font-semibold text-foreground">
              Ngày đưa vào sử dụng
            </label>
            <input
              id="installation_date"
              type="date"
              {...register('installation_date')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-xs"
            />
            {errors.installation_date && (
              <p className="text-[11px] text-destructive">{errors.installation_date.message}</p>
            )}
          </div>

          {/* Thông số kỹ thuật khác (Thông số phụ) */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Thông số kỹ thuật khác (Thông số phụ)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Ghi nhận thông số phụ như: Tốc độ băng tải (1.2m/s), Bề rộng (600mm), Chiều dài (15m)...
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExtraSpecsList([...extraSpecsList, { key: '', value: '' }])}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm thông số</span>
              </Button>
            </div>

            {extraSpecsList.length === 0 ? (
              <div className="text-center py-3 text-[11px] text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
                Chưa có thông số phụ nào. Nhấn <strong>"Thêm thông số"</strong> để bổ sung thông số đặc thù của máy.
              </div>
            ) : (
              <div className="space-y-2">
                {extraSpecsList.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tên thông số (VD: Tốc độ băng tải, Bề rộng, Chiều dài...)"
                      value={spec.key}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtraSpecsList((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, key: val } : item)),
                        );
                      }}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Giá trị (VD: 1.2 m/s, 600 mm, 15 m...)"
                      value={spec.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExtraSpecsList((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, value: val } : item)),
                        );
                      }}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = extraSpecsList.filter((_, i) => i !== index);
                        setExtraSpecsList(updated);
                      }}
                      aria-label="Xóa thông số"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{machineToEdit ? 'Lưu thay đổi' : 'Thêm thiết bị'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
