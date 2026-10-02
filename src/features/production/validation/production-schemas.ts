import { z } from 'zod';

// 1. Monthly Plan Schema
export const productionPlanSchema = z.object({
  plan_code: z
    .string()
    .min(3, 'Mã kế hoạch phải có ít nhất 3 ký tự')
    .max(50, 'Mã kế hoạch tối đa 50 ký tự')
    .trim(),
  line_id: z.string().uuid('Vui lòng chọn dây chuyền sản xuất'),
  year: z
    .number({ invalid_type_error: 'Năm phải là số' })
    .int('Năm phải là số nguyên')
    .min(2020, 'Năm phải từ 2020 trở lên'),
  month: z
    .number({ invalid_type_error: 'Tháng phải là số' })
    .int('Tháng phải là số nguyên')
    .min(1, 'Tháng phải từ 1 đến 12')
    .max(12, 'Tháng phải từ 1 đến 12'),
  planned_capacity_tph: z
    .number({ invalid_type_error: 'Công suất phải là số' })
    .min(0.1, 'Công suất dự kiến phải lớn hơn 0'),
  planned_recovery_rate_pct: z
    .number({ invalid_type_error: 'Tỷ lệ thu hồi phải là số' })
    .min(0, 'Tỷ lệ thu hồi không thể âm')
    .max(100, 'Tỷ lệ thu hồi tối đa 100%'),
  total_calendar_hours: z
    .number({ invalid_type_error: 'Tổng giờ lịch phải là số' })
    .min(1, 'Tổng giờ lịch tháng phải lớn hơn 0'),
  planned_breakdown_hours: z
    .number({ invalid_type_error: 'Giờ sự cố phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  planned_maintenance_hours: z
    .number({ invalid_type_error: 'Giờ bảo dưỡng phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  planned_shutdown_hours: z
    .number({ invalid_type_error: 'Giờ dừng kế hoạch phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  target_quality_rate_pct: z
    .number({ invalid_type_error: 'Tỷ lệ chất lượng phải là số' })
    .min(0, 'Không được âm')
    .max(100, 'Tối đa 100%')
    .default(100),
  planned_input_material_tons: z
    .number({ invalid_type_error: 'Khối lượng quặng đầu vào phải là số' })
    .min(0, 'Không được âm'),
  planned_output_product_tons: z
    .number({ invalid_type_error: 'Sản lượng thành phẩm phải là số' })
    .min(0, 'Không được âm'),
  planned_byproduct_tons: z
    .number({ invalid_type_error: 'Sản lượng phụ phẩm phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  status: z
    .enum(['draft', 'approved', 'in_progress', 'completed', 'cancelled'])
    .default('draft'),
  notes: z.string().optional().nullable(),
});

export type ProductionPlanFormValues = z.infer<typeof productionPlanSchema>;

// 2. Techno-Economic Norm Schema
export const technoEconomicNormSchema = z.object({
  norm_code: z
    .string()
    .min(3, 'Mã định mức phải từ 3 ký tự')
    .max(50, 'Mã định mức tối đa 50 ký tự')
    .trim(),
  line_id: z.string().uuid('Vui lòng chọn dây chuyền').nullable().optional(),
  product_id: z.string().uuid('Vui lòng chọn sản phẩm').nullable().optional(),
  resource_type: z.enum([
    'electricity',
    'diesel',
    'coal',
    'water',
    'chemical',
    'explosive',
    'other',
  ]),
  resource_name: z
    .string()
    .min(2, 'Tên tài nguyên/vật tư phải từ 2 ký tự')
    .max(150, 'Tên tài nguyên tối đa 150 ký tự')
    .trim(),
  unit_of_measure: z
    .string()
    .min(1, 'Đơn vị tính không được bỏ trống')
    .max(20, 'Đơn vị tính tối đa 20 ký tự')
    .trim(),
  norm_rate: z
    .number({ invalid_type_error: 'Định mức tiêu hao phải là số' })
    .positive('Định mức tiêu hao phải lớn hơn 0'),
  effective_from: z.string().min(1, 'Vui lòng chọn ngày hiệu lực'),
  effective_to: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type TechnoEconomicNormFormValues = z.infer<typeof technoEconomicNormSchema>;

// 3. Production Shift Schema
export const productionShiftSchema = z.object({
  shift_code: z
    .string()
    .min(3, 'Mã ca phải từ 3 ký tự')
    .max(50, 'Mã ca tối đa 50 ký tự')
    .trim(),
  line_id: z.string().uuid('Vui lòng chọn dây chuyền'),
  shift_date: z.string().min(1, 'Vui lòng chọn ngày vận hành'),
  shift_number: z.number().int().min(1).max(3),
  standard_shift_hours: z
    .number({ invalid_type_error: 'Số giờ tiêu chuẩn phải là số' })
    .positive('Số giờ phải lớn hơn 0')
    .default(8.0),
  total_downtime_hours: z
    .number({ invalid_type_error: 'Giờ dừng chuyền phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  raw_material_input_tons: z
    .number({ invalid_type_error: 'Quặng cấp đầu vào phải là số' })
    .min(0, 'Không được âm'),
  product_output_tons: z
    .number({ invalid_type_error: 'Thành phẩm thu hồi phải là số' })
    .min(0, 'Không được âm'),
  byproduct_output_tons: z
    .number({ invalid_type_error: 'Phụ phẩm thu hồi phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  actual_capacity_tph: z.number().optional().nullable(),
  actual_recovery_rate_pct: z.number().optional().nullable(),
  operator_employee_id: z.string().uuid().optional().nullable(),
  status: z.enum(['in_progress', 'completed', 'verified']).default('completed'),
  notes: z.string().optional().nullable(),
});

export type ProductionShiftFormValues = z.infer<typeof productionShiftSchema>;

// 4. Shift Downtime Schema
export const shiftDowntimeSchema = z.object({
  shift_id: z.string().uuid('Vui lòng chọn ca sản xuất'),
  line_id: z.string().uuid('Vui lòng chọn dây chuyền'),
  machine_id: z.string().uuid().optional().nullable(),
  downtime_category: z.enum([
    'breakdown_incident',
    'planned_maintenance',
    'scheduled_shutdown',
    'no_material',
    'power_outage',
    'operational_pause',
  ]),
  start_time: z.string().min(1, 'Vui lòng nhập thời gian bắt đầu'),
  end_time: z.string().min(1, 'Vui lòng nhập thời gian kết thúc'),
  duration_minutes: z
    .number({ invalid_type_error: 'Số phút phải là số' })
    .positive('Thời lượng phải lớn hơn 0'),
  reason: z.string().min(3, 'Vui lòng nêu rõ nguyên nhân dừng máy').trim(),
  action_taken: z.string().optional().nullable(),
  status: z.enum(['resolved', 'pending', 'waiting_parts']).default('resolved'),
  reported_by_employee_id: z.string().uuid().optional().nullable(),
});

export type ShiftDowntimeFormValues = z.infer<typeof shiftDowntimeSchema>;

// 5. Shift Meter Schema
export const shiftMeterSchema = z.object({
  shift_id: z.string().uuid('Vui lòng chọn ca sản xuất'),
  meter_code: z.string().min(2, 'Mã đồng hồ phải từ 2 ký tự').trim(),
  meter_name: z.string().min(2, 'Tên đồng hồ phải từ 2 ký tự').trim(),
  meter_type: z.enum([
    'input_scale',
    'output_scale',
    'electric_meter',
    'diesel_meter',
    'coal_scale',
    'water_meter',
    'chemical_meter',
  ]),
  start_reading: z
    .number({ invalid_type_error: 'Chỉ số đầu phải là số' })
    .min(0, 'Chỉ số không âm'),
  end_reading: z
    .number({ invalid_type_error: 'Chỉ số cuối phải là số' })
    .min(0, 'Chỉ số không âm'),
  multiplier: z.number().positive('Hệ số nhân phải lớn hơn 0').default(1.0),
  consumed_quantity: z.number().min(0, 'Lượng tiêu thụ không âm'),
  unit_of_measure: z.string().min(1, 'Đơn vị tính không được trống'),
  notes: z.string().optional().nullable(),
});

export type ShiftMeterFormValues = z.infer<typeof shiftMeterSchema>;

// 6. Shift Log Schema
export const shiftLogSchema = z.object({
  shift_id: z.string().uuid('Vui lòng chọn ca sản xuất'),
  log_time: z.string().min(1, 'Vui lòng chọn thời gian ghi nhận'),
  change_type: z.enum([
    'process_parameter',
    'equipment_adjustment',
    'feed_ore_variation',
    'safety_notice',
    'management_directive',
    'other',
  ]),
  content: z.string().min(3, 'Nội dung nhật ký phải từ 3 ký tự').trim(),
  changed_by_employee_id: z.string().uuid().optional().nullable(),
});

export type ShiftLogFormValues = z.infer<typeof shiftLogSchema>;

// 7. Production Order Schema
export const productionOrderSchema = z.object({
  order_number: z
    .string()
    .min(3, 'Mã lệnh sản xuất phải từ 3 ký tự')
    .max(50, 'Mã lệnh sản xuất tối đa 50 ký tự')
    .trim(),
  production_plan_id: z.string().uuid().optional().nullable(),
  line_id: z.string().uuid('Vui lòng chọn dây chuyền').optional().nullable(),
  product_id: z.string().uuid('Vui lòng chọn sản phẩm cần sản xuất'),
  bom_id: z.string().uuid().optional().nullable(),
  target_quantity: z
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .positive('Sản lượng kế hoạch phải lớn hơn 0'),
  completed_quantity: z
    .number({ invalid_type_error: 'Số lượng hoàn thành phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  scrap_quantity: z
    .number({ invalid_type_error: 'Phế phẩm phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  planned_start_date: z.string().min(1, 'Vui lòng chọn ngày bắt đầu kế hoạch'),
  planned_end_date: z.string().min(1, 'Vui lòng chọn ngày kết thúc kế hoạch'),
  actual_start_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),
  status: z
    .enum(['draft', 'scheduled', 'released', 'in_progress', 'completed', 'cancelled', 'on_hold'])
    .default('scheduled'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type ProductionOrderFormValues = z.infer<typeof productionOrderSchema>;

// 8. Production Batch Schema
export const productionBatchSchema = z.object({
  batch_number: z
    .string()
    .min(3, 'Mã lô phải từ 3 ký tự')
    .max(50, 'Mã lô tối đa 50 ký tự')
    .trim(),
  production_order_id: z.string().uuid('Vui lòng chọn lệnh sản xuất'),
  machine_id: z.string().uuid().optional().nullable(),
  operator_employee_id: z.string().uuid().optional().nullable(),
  planned_quantity: z
    .number({ invalid_type_error: 'Sản lượng phải là số' })
    .positive('Sản lượng dự kiến phải lớn hơn 0'),
  actual_quantity: z
    .number({ invalid_type_error: 'Sản lượng thực tế phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  scrap_quantity: z
    .number({ invalid_type_error: 'Phế phẩm phải là số' })
    .min(0, 'Không được âm')
    .default(0),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  shift: z.enum(['shift_1', 'shift_2', 'shift_3', 'night']).optional().nullable(),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'rejected']).default('pending'),
  notes: z.string().optional().nullable(),
});

export type ProductionBatchFormValues = z.infer<typeof productionBatchSchema>;
