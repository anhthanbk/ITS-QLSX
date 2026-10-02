import { z } from 'zod';

export const machineStatusEnum = z.enum([
  'operational',
  'in_maintenance',
  'breakdown',
  'standby',
  'decommissioned',
]);

export const machineSchema = z.object({
  machine_code: z
    .string()
    .trim()
    .min(2, 'Mã thiết bị phải có ít nhất 2 ký tự')
    .max(50, 'Mã thiết bị không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã thiết bị chỉ chứa chữ cái, số, gạch ngang và gạch dưới')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Tên thiết bị phải có ít nhất 2 ký tự')
    .max(150, 'Tên thiết bị không vượt quá 150 ký tự'),
  line_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  model: z.string().trim().max(100, 'Model tối đa 100 ký tự').nullable().optional(),
  serial_number: z.string().trim().max(100, 'Số serial tối đa 100 ký tự').nullable().optional(),
  line_location: z.string().trim().max(150, 'Vị trí lắp đặt tối đa 150 ký tự').nullable().optional(),
  rated_capacity_per_hour: z.coerce
    .number()
    .min(0, 'Công suất định mức không thể là số âm')
    .nullable()
    .optional(),
  power_rating_kw: z.coerce
    .number()
    .min(0, 'Công suất điện không thể là số âm')
    .nullable()
    .optional(),
  installation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)')
    .nullable()
    .optional()
    .or(z.literal('')),
  status: machineStatusEnum.default('operational'),
  /** Additional technical specifications as key‑value pairs */
  extra_specs: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return val;
  }, z.record(z.string(), z.string()).nullable().optional()),
});

export type MachineFormValues = z.infer<typeof machineSchema>;

export const maintenancePlanSchema = z.object({
  plan_code: z
    .string()
    .trim()
    .min(2, 'Mã kế hoạch phải có ít nhất 2 ký tự')
    .max(50, 'Mã kế hoạch không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã kế hoạch chỉ chứa chữ cái, số, gạch ngang và gạch dưới')
    .transform((val) => val.toUpperCase()),
  machine_id: z.string().uuid('Vui lòng chọn thiết bị'),
  title: z
    .string()
    .trim()
    .min(3, 'Tên kế hoạch bảo dưỡng phải có ít nhất 3 ký tự')
    .max(150, 'Tên kế hoạch không vượt quá 150 ký tự'),
  frequency_days: z.coerce
    .number()
    .int('Chu kỳ phải là số nguyên')
    .min(1, 'Chu kỳ tối thiểu là 1 ngày')
    .max(1825, 'Chu kỳ tối đa 5 năm (1825 ngày)'),
  last_performed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày không hợp lệ')
    .nullable()
    .optional()
    .or(z.literal('')),
  next_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày không hợp lệ')
    .nullable()
    .optional()
    .or(z.literal('')),
  standard_duration_hours: z.coerce
    .number()
    .min(0, 'Thời lượng chuẩn không được là số âm')
    .nullable()
    .optional(),
  is_active: z.boolean().default(true),
});

export type MaintenancePlanFormValues = z.infer<typeof maintenancePlanSchema>;

export const workOrderTypeEnum = z.enum([
  'preventative',
  'corrective_breakdown',
  'predictive',
  'calibration',
]);

export const workOrderPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const workOrderStatusEnum = z.enum([
  'open',
  'in_progress',
  'pending_parts',
  'completed',
  'cancelled',
]);

export const workOrderSchema = z.object({
  work_order_number: z
    .string()
    .trim()
    .min(2, 'Mã phiếu phải có ít nhất 2 ký tự')
    .max(50, 'Mã phiếu không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã phiếu chỉ chứa chữ cái, số, gạch ngang và gạch dưới')
    .transform((val) => val.toUpperCase()),
  machine_id: z.string().uuid('Vui lòng chọn thiết bị'),
  maintenance_plan_id: z.string().uuid().nullable().optional(),
  type: workOrderTypeEnum.default('preventative'),
  priority: workOrderPriorityEnum.default('medium'),
  assigned_technician_id: z.string().uuid('Vui lòng phân công kỹ thuật viên'),
  reported_issue: z
    .string()
    .trim()
    .min(5, 'Mô tả sự cố / nội dung bảo dưỡng tối thiểu 5 ký tự')
    .max(1000, 'Mô tả tối đa 1000 ký tự'),
  root_cause: z.string().trim().max(1000, 'Nguyên nhân tối đa 1000 ký tự').nullable().optional(),
  resolution_summary: z
    .string()
    .trim()
    .max(1000, 'Giải pháp xử lý tối đa 1000 ký tự')
    .nullable()
    .optional(),
  downtime_minutes: z.coerce
    .number()
    .int('Thời gian dừng máy phải là số nguyên')
    .min(0, 'Thời gian dừng máy không được là số âm')
    .nullable()
    .optional(),
  labor_hours: z.coerce
    .number()
    .min(0, 'Giờ công kỹ thuật không được là số âm')
    .nullable()
    .optional(),
  spare_parts_cost: z.coerce
    .number()
    .min(0, 'Chi phí phụ tùng không được là số âm')
    .nullable()
    .optional(),
  status: workOrderStatusEnum.default('open'),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày dự kiến không hợp lệ (YYYY-MM-DD)'),
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export const workOrderStatusUpdateSchema = z.object({
  status: workOrderStatusEnum,
  root_cause: z.string().trim().max(1000).nullable().optional(),
  resolution_summary: z.string().trim().max(1000).nullable().optional(),
  downtime_minutes: z.coerce.number().int().min(0).nullable().optional(),
  labor_hours: z.coerce.number().min(0).nullable().optional(),
  spare_parts_cost: z.coerce.number().min(0).nullable().optional(),
});

export type WorkOrderStatusUpdateValues = z.infer<typeof workOrderStatusUpdateSchema>;

export const machineAdjustmentSchema = z.object({
  machine_id: z.string().uuid('ID thiết bị không hợp lệ'),
  status_before: machineStatusEnum,
  status_after: machineStatusEnum,
  operating_condition_before: z
    .string()
    .trim()
    .max(1000, 'Tình trạng hoạt động tối đa 1000 ký tự')
    .nullable()
    .optional()
    .or(z.literal('')),
  improvement_content: z
    .string()
    .trim()
    .min(5, 'Nội dung cải tiến tối thiểu 5 ký tự')
    .max(2000, 'Nội dung cải tiến không vượt quá 2000 ký tự'),
  result: z
    .string()
    .trim()
    .min(3, 'Kết quả sau điều chỉnh tối thiểu 3 ký tự')
    .max(2000, 'Kết quả không vượt quá 2000 ký tự'),
  changed_params: z.record(z.string(), z.string()).nullable().optional(),
  applied_to_machine: z.boolean().default(true),
  performed_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)'),
});

export type MachineAdjustmentFormValues = z.infer<typeof machineAdjustmentSchema>;

