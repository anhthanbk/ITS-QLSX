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

export interface ShiftMaterialConsumption {
  material_id?: string;
  resource_name: string;
  category: 'material' | 'fuel' | 'supply';
  unit_of_measure: string;
  planned_norm?: number;
  actual_quantity: number;
  notes?: string;
  warehouse_id?: string | null;
  warehouse_name?: string | null;
}

export interface ShiftProductOutput {
  product_id?: string;
  product_name: string;
  product_sku: string;
  product_type?: string | null;
  unit_of_measure: string;
  is_out_of_plan: boolean;
  quantity_tons: number;
  warehouse_id?: string | null;
  warehouse_name?: string | null;
  storage_location?: string | null;
}

export interface ShiftDowntimeEvent {
  id?: string;
  type: 'breakdown_incident' | 'planned_maintenance' | 'scheduled_shutdown';
  start_time: string; // "HH:mm" e.g. "08:00"
  end_time: string;   // "HH:mm" e.g. "08:45"
  duration_minutes?: number;
  duration_hours: number;
  machine_id?: string | null;
  equipment_code?: string | null;
  equipment_name?: string | null;
  incident_category?: string | null;
  shutdown_type?: string | null;
  maintenance_type?: string | null;
  reason?: string | null;
  action_taken?: string | null;
}

export interface ShiftDowntimeBreakdown {
  maintenance_hours: number;
  maintenance_note?: string | null;
  incident_hours: number;
  incident_category?: string | null;
  incident_reason?: string | null;
  incident_action?: string | null;
  planned_shutdown_hours: number;
  planned_shutdown_reason?: string | null;
  total_downtime_hours: number;
  events?: ShiftDowntimeEvent[];
  is_date_range?: boolean;
  from_date?: string;
  to_date?: string;
  updated_by_name?: string | null;
  operator_name?: string | null;
}

export interface ProductionShift {
  id: string;
  shift_code: string;
  line_id: string;
  line_name?: string;
  line_code?: string;
  shift_date: string;
  end_date?: string | null;
  shift_number: number;
  standard_shift_hours: number;
  total_downtime_hours: number;
  running_hours?: number;
  raw_material_input_tons: number;
  product_output_tons: number;
  byproduct_output_tons: number;
  actual_capacity_tph?: number;
  actual_recovery_rate_pct?: number;
  actual_quality_rate_pct?: number;
  operator_employee_id: string | null;
  operator_name?: string;
  status?: ShiftStatus;
  notes: string | null;
  materials_consumption?: ShiftMaterialConsumption[];
  products_output?: ShiftProductOutput[];
  downtime_breakdown?: ShiftDowntimeBreakdown;
  warehouse_synced?: boolean;
  warehouse_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchShiftWarehouseSyncItem {
  id?: string;
  item_type: 'product' | 'byproduct' | 'material';
  item_id: string;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  total_quantity: number;
  warehouse_id: string;
  warehouse_name?: string;
  storage_location?: string | null;
  shift_ids: string[];
  shift_codes: string[];
}

export interface BatchShiftWarehouseSyncPayload {
  selected_shift_ids: string[];
  products: BatchShiftWarehouseSyncItem[];
  byproducts: BatchShiftWarehouseSyncItem[];
  materials: BatchShiftWarehouseSyncItem[];
  notes?: string | null;
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

export interface ProductionMetricsFilterParams {
  lineId?: string;
  year?: number;
  month?: number;
  years?: number[];
  months?: number[];
}

export interface ConsumptionNormMetric {
  key: string;
  resourceName: string;
  categoryGroup: 'material' | 'fuel' | 'supply';
  unit: string;
  plannedNorm: number;
  actualNorm: number;
  variancePct: number;
  plannedTotal?: number;
  actualTotal?: number;
  status: 'better' | 'worse' | 'neutral' | 'no_data';
}

export interface ProductionMetrics {
  totalMonthlyPlans: number;
  activeLines: number;
  // 1. Output Actual vs Planned
  monthlyPlannedOutputTons: number;
  actualMonthlyOutputTons: number;
  outputProgressPct: number;
  // 2. Techno-Economic Norms Actual vs Planned
  plannedRecoveryRatePct: number;
  avgRecoveryRatePct: number;
  recoveryVariancePct: number;
  // 3. Operating & Downtime Actual vs Planned
  plannedOperatingHours: number;
  actualOperatingHours: number;
  plannedDowntimeHours: number;
  actualDowntimeHours: number;
  availabilityPct: number;
  // 4. OEE & Breakdown
  plannedCapacityTph: number;
  plannedProductivityTph?: number;
  avgCapacityTph: number;
  targetQualityRatePct: number;
  availabilityScore: number;
  performanceScore: number;
  qualityScore: number;
  oeePct: number;
  // Legacy compatibility fields
  totalDowntimeHours: number;
  activeOrdersCount: number;
  // Consumption norms vs actuals comparison row
  consumptionNorms?: ConsumptionNormMetric[];
}

// ==========================================
// 6. ANNUAL PRODUCTION PLANNING (LẬP KẾ HOẠCH SẢN XUẤT NĂM)
// ==========================================

export type MaterialCategoryGroup = 'material' | 'fuel' | 'supply';

export type PlanProductClassification = 'finished_good' | 'semi_finished' | 'by_product';

export interface AnnualPlanProductRow {
  productId: string;
  productName: string;
  productSku: string;
  productType?: PlanProductClassification | string;
  unitOfMeasure: string;
  // Monthly planned quantity: month 1..12 -> number (tấn)
  months: Record<number, number>;
}

export interface AnnualPlanMaterialRow {
  materialId: string;
  materialName: string;
  materialCode: string;
  category: string;
  categoryGroup: MaterialCategoryGroup;
  unitOfMeasure: string;
  // Monthly planned quantity: month 1..12 -> number
  months: Record<number, number>;
}

export interface AnnualPlanTimeMonth {
  month: number;
  calendarHours: number; // Tự tính: số ngày trong tháng * 24
  maintenanceHours: number; // Giờ bảo trì
  incidentHours: number; // Giờ sự cố
  plannedShutdownHours: number; // Giờ nghỉ trong kế hoạch
  operatingHours: number; // Giờ vận hành = calendarHours - (maintenanceHours + incidentHours + plannedShutdownHours)
}

export interface AnnualPlanMonthKPI {
  month: number;
  // 1. Công suất: nguyên liệu / giờ vận hành (tấn/giờ)
  capacityTph: number;
  // 2. Năng suất: tổng THÀNH PHẨM / giờ vận hành (tấn/giờ) - chỉ tính thành phẩm
  productivityTph: number;
  // 3. Tỷ lệ thu hồi thành phẩm từ nguyên liệu: tổng thành phẩm / nguyên liệu * 100%
  recoveryPct: number;
  // 4. Tỷ lệ thu hồi phụ phẩm từ nguyên liệu: tổng phụ phẩm / nguyên liệu * 100%
  byproductRecoveryPct: number;
  // 5. Định mức tiêu hao điện: tiêu hao điện (kWh) / tổng thành phẩm
  electricityNorm: number;
  recoveryFormula?: number; // Tùy chọn cũ
  // 6. % giờ đối với tổng giờ tháng
  pctOperatingHours: number;
  pctMaintenanceHours: number;
  pctIncidentHours: number;
  pctShutdownHours: number;
  // 7. Định mức KT-KT: tính theo tổng THÀNH PHẨM
  rawMaterialNorm: number; // nguyên liệu / thành phẩm
  fuelNorm: number;        // tiêu hao nhiên liệu / thành phẩm
  supplyNorm: number;      // tiêu hao vật tư / thành phẩm
}

export function normalizeProductType(type?: string | null): PlanProductClassification {
  if (!type) return 'finished_good';
  const lower = type.toLowerCase().trim();
  if (
    lower === 'by_product' ||
    lower === 'byproduct' ||
    lower === 'phụ phẩm' ||
    lower.includes('by_product') ||
    lower.includes('phụ phẩm')
  ) {
    return 'by_product';
  }
  if (
    lower === 'semi_finished' ||
    lower === 'semifinished' ||
    lower === 'bán thành phẩm' ||
    lower.includes('semi_finished') ||
    lower.includes('bán thành')
  ) {
    return 'semi_finished';
  }
  return 'finished_good';
}

/**
 * Kiểm tra xem một sản phẩm có phải là sản phẩm / thành phẩm chính hay không.
 * Loại trừ hoàn toàn phụ phẩm, bán thành phẩm (MM, Magmin, VFS, FSAP, v.v.).
 */
export function isFinishedProduct(item?: {
  product_sku?: string | null;
  product_name?: string | null;
  product_type?: string | null;
}): boolean {
  if (!item) return false;

  if (item.product_type) {
    const norm = normalizeProductType(item.product_type);
    if (norm === 'by_product' || norm === 'semi_finished') {
      return false;
    }
    if (norm === 'finished_good') {
      return true;
    }
  }

  const sku = (item.product_sku || '').trim().toLowerCase();
  const name = (item.product_name || '').trim().toLowerCase();

  // Danh mục phụ phẩm thực tế tại nhà máy: MM, MAGMIN, VFS, FSAP
  if (
    sku === 'mm' ||
    sku === 'magmin' ||
    sku === 'vfs' ||
    sku === 'fsap' ||
    sku.startsWith('mm-') ||
    sku.endsWith('-mm') ||
    sku.includes('magmin') ||
    sku.includes('vfs') ||
    sku.includes('fsap') ||
    name.includes('phụ phẩm') ||
    name.includes('bán thành phẩm') ||
    name.includes('sau chế biến') ||
    name.includes('magmin') ||
    name.includes('vfs') ||
    name.includes('fsap')
  ) {
    return false;
  }

  return true;
}

export interface AnnualPlanData {
  year: number;
  lineId: string;
  lineName?: string;
  status: PlanStatus;
  products: AnnualPlanProductRow[];
  materials: AnnualPlanMaterialRow[];
  timePlan: Record<number, AnnualPlanTimeMonth>;
  targetQualityPct: Record<number, number>; // Month 1..12 -> %
}

// 7. Downtime Incident & Pareto Analytics
export interface DowntimeIncidentRecord {
  id: string;
  shift_id: string;
  shift_code?: string;
  shift_date: string;
  shift_number: number;
  line_id: string;
  line_code?: string;
  line_name?: string;
  type: 'breakdown_incident' | 'planned_maintenance' | 'scheduled_shutdown';
  machine_id?: string | null;
  equipment_code?: string | null;
  equipment_name?: string | null;
  incident_category?: string | null;
  shutdown_type?: string | null;
  maintenance_type?: string | null;
  reason: string;
  action_taken?: string | null;
  duration_minutes: number;
  duration_hours: number;
  start_time: string;
  end_time: string;
  status: string;
  operator_name?: string;
}

export interface ParetoItem {
  key: string;
  label: string;
  count: number;
  duration_hours: number;
  percentage: number;
  cumulative_percentage: number;
  is_in_vital_few: boolean;
}

export interface IncidentAnalyticsFilters {
  lineId?: string;
  fromDate?: string;
  toDate?: string;
  downtimeType?: 'all' | 'breakdown_incident' | 'planned_maintenance' | 'scheduled_shutdown';
  dimension?: 'incident_category' | 'equipment_code';
  search?: string;
}

export interface IncidentAIInsight {
  vitalFewSummary: string;
  frequencyVsDurationComment: string;
  topBottleneckEquipment: string;
  recommendations: Array<{
    priority: 'urgent' | 'medium' | 'preventive';
    title: string;
    description: string;
    affectedKey?: string;
  }>;
}


