// Production Module Domain Types

export type ProductionLineStatus = 'active' | 'inactive' | 'maintenance';

export interface ProductionLine {
  id: string;
  code: string;
  name: string;
  department_id: string | null;
  designed_capacity_tph: number;
  standard_shift_hours: number;
  shifts_per_day: number;
  status: ProductionLineStatus;
  created_at: string;
  updated_at: string;
}

// 1. Monthly Plans
export type PlanStatus = 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface ProductionMonthlyPlan {
  id: string;
  plan_code: string;
  line_id: string;
  line_name?: string;
  line_code?: string;
  year: number;
  month: number;
  planned_capacity_tph: number;
  planned_recovery_rate_pct: number;
  total_calendar_hours: number;
  planned_breakdown_hours: number;
  planned_maintenance_hours: number;
  planned_shutdown_hours: number;
  planned_operating_hours?: number;
  target_quality_rate_pct: number;
  planned_input_material_tons: number;
  planned_output_product_tons: number;
  planned_byproduct_tons: number;
  status: PlanStatus;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanProductAllocation {
  id: string;
  plan_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  allocation_pct: number;
  planned_quantity_tons: number;
  target_quality_standard: string | null;
  notes: string | null;
}

export interface PlanByproduct {
  id: string;
  plan_id: string;
  byproduct_name: string;
  ratio_pct: number;
  planned_quantity_tons: number;
  destination_storage: string | null;
  notes: string | null;
}

export interface PlanConsumption {
  id: string;
  plan_id: string;
  norm_id: string | null;
  resource_type: string;
  resource_name: string;
  unit_of_measure: string;
  norm_rate: number;
  planned_total_consumption: number;
  estimated_unit_price: number | null;
  estimated_total_cost: number | null;
}

// 2. Techno-Economic Norms
export type ResourceType =
  | 'electricity'
  | 'diesel'
  | 'coal'
  | 'water'
  | 'chemical'
  | 'explosive'
  | 'other';

export interface TechnoEconomicNorm {
  id: string;
  norm_code: string;
  line_id: string | null;
  line_name?: string;
  product_id: string | null;
  product_name?: string;
  resource_type: ResourceType;
  resource_name: string;
  unit_of_measure: string;
  norm_rate: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 3. Shifts & Operations
export type ShiftStatus = 'in_progress' | 'completed' | 'verified';

export interface ProductionShift {
  id: string;
  shift_code: string;
  line_id: string;
  line_name?: string;
  line_code?: string;
  shift_date: string;
  shift_number: number;
  standard_shift_hours: number;
  total_downtime_hours: number;
  running_hours?: number;
  raw_material_input_tons: number;
  product_output_tons: number;
  byproduct_output_tons: number;
  actual_capacity_tph?: number;
  actual_recovery_rate_pct?: number;
  operator_employee_id: string | null;
  operator_name?: string;
  status: ShiftStatus;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MeterType =
  | 'input_scale'
  | 'output_scale'
  | 'electric_meter'
  | 'diesel_meter'
  | 'coal_scale'
  | 'water_meter'
  | 'chemical_meter';

export interface ShiftMeterReading {
  id: string;
  shift_id: string;
  meter_code: string;
  meter_name: string;
  meter_type: MeterType;
  start_reading: number;
  end_reading: number;
  multiplier: number;
  consumed_quantity: number;
  unit_of_measure: string;
  notes: string | null;
}

export type DowntimeCategory =
  | 'breakdown_incident'
  | 'planned_maintenance'
  | 'scheduled_shutdown'
  | 'no_material'
  | 'power_outage'
  | 'operational_pause';

export type DowntimeStatus = 'resolved' | 'pending' | 'waiting_parts';

export interface ShiftDowntime {
  id: string;
  shift_id: string;
  line_id: string;
  machine_id: string | null;
  machine_name?: string;
  downtime_category: DowntimeCategory;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  reason: string;
  action_taken: string | null;
  status: DowntimeStatus;
  reported_by_employee_id: string | null;
  reported_by_name?: string;
  created_at: string;
}

export type ShiftLogChangeType =
  | 'process_parameter'
  | 'equipment_adjustment'
  | 'feed_ore_variation'
  | 'safety_notice'
  | 'management_directive'
  | 'other';

export interface ShiftLog {
  id: string;
  shift_id: string;
  log_time: string;
  change_type: ShiftLogChangeType;
  content: string;
  changed_by_employee_id: string | null;
  changed_by_name?: string;
  created_at: string;
}

export interface ShiftReceipt {
  id: string;
  receipt_code: string;
  shift_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  item_type: 'main_product' | 'byproduct';
  product_id: string | null;
  product_name?: string;
  byproduct_name: string | null;
  quantity_tons: number;
  batch_number: string | null;
  received_by_employee_id: string | null;
  quality_status: 'passed' | 'quarantined' | 'failed';
  receipt_time: string;
  notes: string | null;
}

// 4. Production Orders & Batches
export type OrderStatus =
  | 'draft'
  | 'scheduled'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProductionOrder {
  id: string;
  order_number: string;
  production_plan_id: string | null;
  plan_code?: string;
  line_id: string | null;
  line_name?: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  bom_id: string | null;
  target_quantity: number;
  completed_quantity: number;
  scrap_quantity: number;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  status: OrderStatus;
  priority: OrderPriority;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BatchStatus = 'pending' | 'running' | 'paused' | 'completed' | 'rejected';
export type BatchShift = 'shift_1' | 'shift_2' | 'shift_3' | 'night';

export interface ProductionBatch {
  id: string;
  batch_number: string;
  production_order_id: string;
  order_number?: string;
  machine_id: string | null;
  machine_name?: string;
  operator_employee_id: string | null;
  operator_name?: string;
  planned_quantity: number;
  actual_quantity: number;
  scrap_quantity: number;
  start_time: string | null;
  end_time: string | null;
  shift: BatchShift | null;
  status: BatchStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Filter query parameters
export interface ProductionPlanFilterParams {
  search?: string;
  status?: PlanStatus | 'all';
  lineId?: string | 'all';
  year?: number | 'all';
  month?: number | 'all';
  page: number;
  pageSize: number;
}

export interface ProductionShiftFilterParams {
  search?: string;
  lineId?: string | 'all';
  shiftNumber?: number | 'all';
  status?: ShiftStatus | 'all';
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

export interface ProductionNormFilterParams {
  search?: string;
  lineId?: string | 'all';
  resourceType?: ResourceType | 'all';
  isActive?: boolean | 'all';
  page: number;
  pageSize: number;
}

export interface ProductionOrderFilterParams {
  search?: string;
  status?: OrderStatus | 'all';
  priority?: OrderPriority | 'all';
  lineId?: string | 'all';
  productId?: string | 'all';
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductionMetrics {
  totalMonthlyPlans: number;
  activeLines: number;
  monthlyPlannedOutputTons: number;
  actualMonthlyOutputTons: number;
  avgCapacityTph: number;
  avgRecoveryRatePct: number;
  totalDowntimeHours: number;
  activeOrdersCount: number;
}
