import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  workOrderSchema,
  type WorkOrderFormValues,
} from '../validation/maintenance-schemas';
import type { MaintenanceWorkOrder } from '../types';
import { useMachineOptions } from '../hooks/use-machines';
import { useTechnicianOptions } from '../hooks/use-work-orders';
import { useMaintenancePlans } from '../hooks/use-maintenance-plans';

export interface WorkOrderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: MaintenanceWorkOrder | null;
  onSubmit: (values: WorkOrderFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const WorkOrderFormDialog: React.FC<WorkOrderFormDialogProps> = ({
  isOpen,
  onClose,
  orderToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const { data: machineOptions } = useMachineOptions();
  const { data: technicians } = useTechnicianOptions();
  const { data: plansData } = useMaintenancePlans({ page: 1, pageSize: 50, isActive: true });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      work_order_number: '',
      machine_id: '',
      maintenance_plan_id: null,
      type: 'preventative',
      priority: 'medium',
      assigned_technician_id: '',
      reported_issue: '',
      root_cause: '',
      resolution_summary: '',
      downtime_minutes: null,
      labor_hours: null,
      spare_parts_cost: null,
      status: 'open',
      scheduled_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedMachineId = watch('machine_id');
  const filteredPlans = plansData?.data?.filter((p) => p.machine_id === selectedMachineId) ?? [];

  useEffect(() => {
    if (orderToEdit) {
      reset({
        work_order_number: orderToEdit.work_order_number,
        machine_id: orderToEdit.machine_id,
        maintenance_plan_id: orderToEdit.maintenance_plan_id,
        type: orderToEdit.type,
        priority: orderToEdit.priority,
        assigned_technician_id: orderToEdit.assigned_technician_id,
        reported_issue: orderToEdit.reported_issue,
        root_cause: orderToEdit.root_cause || '',
        resolution_summary: orderToEdit.resolution_summary || '',
        downtime_minutes: orderToEdit.downtime_minutes,
        labor_hours: orderToEdit.labor_hours,
        spare_parts_cost: orderToEdit.spare_parts_cost,
        status: orderToEdit.status,
        scheduled_date: orderToEdit.scheduled_date || new Date().toISOString().split('T')[0],
      });
    } else {
      const generatedCode = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      reset({
        work_order_number: generatedCode,
        machine_id: machineOptions?.[0]?.id || '',
        maintenance_plan_id: null,
        type: 'preventative',
        priority: 'medium',
        assigned_technician_id: technicians?.[0]?.id || '',
        reported_issue: '',
        root_cause: '',
        resolution_summary: '',
        downtime_minutes: null,
        labor_hours: null,
        spare_parts_cost: null,
        status: 'open',
        scheduled_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [orderToEdit, reset, isOpen, machineOptions, technicians]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h2 id="order-dialog-title" className="text-base font-bold text-foreground">
                {orderToEdit ? 'Chỉnh Sửa Phiếu Sửa Chữa' : 'Lập Phiếu Sửa Chữa / Sự Cố (Work Order)'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Tiếp nhận yêu cầu bảo trì, phân công kỹ thuật viên và theo dõi tiến độ
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Mã phiếu */}
            <div className="space-y-1">
              <label htmlFor="work_order_number" className="text-xs font-semibold text-foreground">
                Mã phiếu WO <span className="text-destructive">*</span>
              </label>
              <input
                id="work_order_number"
                type="text"
                placeholder="VD: WO-2026-001"
                {...register('work_order_number')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              />
              {errors.work_order_number && (
                <p className="text-[11px] text-destructive">{errors.work_order_number.message}</p>
              )}
            </div>

            {/* Thiết bị */}
            <div className="space-y-1">
              <label htmlFor="machine_id" className="text-xs font-semibold text-foreground">
                Thiết bị cần bảo trì <span className="text-destructive">*</span>
              </label>
              <select
                id="machine_id"
                {...register('machine_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn thiết bị --</option>
                {machineOptions?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_code} - {m.name}
                  </option>
                ))}
              </select>
              {errors.machine_id && (
                <p className="text-[11px] text-destructive">{errors.machine_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Loại công việc */}
            <div className="space-y-1">
              <label htmlFor="type" className="text-xs font-semibold text-foreground">
                Loại bảo trì <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                {...register('type')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="preventative">Bảo dưỡng phòng ngừa (PM)</option>
                <option value="corrective_breakdown">Sự cố / Hỏng hóc (CM)</option>
                <option value="predictive">Bảo trì dự đoán (PdM)</option>
                <option value="calibration">Hiệu chuẩn thiết bị</option>
              </select>
            </div>

            {/* Mức độ ưu tiên */}
            <div className="space-y-1">
              <label htmlFor="priority" className="text-xs font-semibold text-foreground">
                Mức độ ưu tiên <span className="text-destructive">*</span>
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="low">Thấp (Low)</option>
                <option value="medium">Bình thường (Medium)</option>
                <option value="high">Cao (High)</option>
                <option value="critical">Khẩn cấp (Critical - Dừng máy)</option>
              </select>
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-semibold text-foreground">
                Trạng thái <span className="text-destructive">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="open">Mới tiếp nhận (Open)</option>
                <option value="in_progress">Đang xử lý (In Progress)</option>
                <option value="pending_parts">Chờ phụ tùng (Pending Parts)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
                <option value="cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Phân công kỹ thuật viên */}
            <div className="space-y-1">
              <label htmlFor="assigned_technician_id" className="text-xs font-semibold text-foreground">
                Kỹ thuật viên phụ trách <span className="text-destructive">*</span>
              </label>
              <select
                id="assigned_technician_id"
                {...register('assigned_technician_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn kỹ thuật viên --</option>
                {technicians?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.employee_code} - {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
              {errors.assigned_technician_id && (
                <p className="text-[11px] text-destructive">{errors.assigned_technician_id.message}</p>
              )}
            </div>

            {/* Ngày dự kiến */}
            <div className="space-y-1">
              <label htmlFor="scheduled_date" className="text-xs font-semibold text-foreground">
                Ngày thực hiện dự kiến <span className="text-destructive">*</span>
              </label>
              <input
                id="scheduled_date"
                type="date"
                {...register('scheduled_date')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.scheduled_date && (
                <p className="text-[11px] text-destructive">{errors.scheduled_date.message}</p>
              )}
            </div>
          </div>

          {/* Kế hoạch PM liên quan nếu có */}
          {filteredPlans.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="maintenance_plan_id" className="text-xs font-semibold text-foreground">
                Kế hoạch bảo dưỡng liên kết (Tùy chọn)
              </label>
              <select
                id="maintenance_plan_id"
                {...register('maintenance_plan_id', {
                  setValueAs: (v) => (v === '' ? null : v),
                })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Không liên kết kế hoạch --</option>
                {filteredPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_code} - {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mô tả sự cố / nội dung */}
          <div className="space-y-1">
            <label htmlFor="reported_issue" className="text-xs font-semibold text-foreground">
              Mô tả sự cố / Nội dung bảo trì <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reported_issue"
              rows={3}
              placeholder="Ghi rõ hiện tượng, tiếng kêu bất thường, mã lỗi hoặc công việc bảo dưỡng cần thực hiện..."
              {...register('reported_issue')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.reported_issue && (
              <p className="text-[11px] text-destructive">{errors.reported_issue.message}</p>
            )}
          </div>

          {/* Chi tiết xử lý (nguyên nhân, giải pháp, dừng máy, chi phí) */}
          <div className="rounded-xl border border-border/70 bg-accent/15 p-4 space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Kết quả & Chi phí xử lý (Dành cho nghiệm thu)
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="downtime_minutes" className="text-xs font-medium text-foreground">
                  Dừng máy (phút)
                </label>
                <input
                  id="downtime_minutes"
                  type="number"
                  placeholder="VD: 45"
                  {...register('downtime_minutes')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="labor_hours" className="text-xs font-medium text-foreground">
                  Giờ công (h)
                </label>
                <input
                  id="labor_hours"
                  type="number"
                  step="0.5"
                  placeholder="VD: 3.5"
                  {...register('labor_hours')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="spare_parts_cost" className="text-xs font-medium text-foreground">
                  Chi phí phụ tùng (VNĐ)
                </label>
                <input
                  id="spare_parts_cost"
                  type="number"
                  placeholder="VD: 1500000"
                  {...register('spare_parts_cost')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="root_cause" className="text-xs font-medium text-foreground">
                  Nguyên nhân gốc rễ
                </label>
                <input
                  id="root_cause"
                  type="text"
                  placeholder="VD: Vòng bi bị mòn do thiếu bôi trơn định kỳ"
                  {...register('root_cause')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="resolution_summary" className="text-xs font-medium text-foreground">
                  Giải pháp khắc phục
                </label>
                <input
                  id="resolution_summary"
                  type="text"
                  placeholder="VD: Đã thay thế vòng bi 6312 và bổ sung mỡ chịu nhiệt"
                  {...register('resolution_summary')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

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
              <span>{orderToEdit ? 'Lưu phiếu' : 'Lập phiếu sửa chữa'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
