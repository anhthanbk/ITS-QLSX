import { supabase } from '@/lib/supabase/client';
import type {
  ProductionLine,
  ProductionMonthlyPlan,
  PlanProductAllocation,
  PlanByproduct,
  PlanConsumption,
  TechnoEconomicNorm,
  ProductionShift,
  ShiftMeterReading,
  ShiftDowntime,
  ShiftLog,
  ProductionOrder,
  ProductionBatch,
  ProductionPlanFilterParams,
  ProductionShiftFilterParams,
  ProductionNormFilterParams,
  ProductionOrderFilterParams,
  PaginatedResult,
  ProductionMetrics,
  AnnualPlanData,
  AnnualPlanProductRow,
  AnnualPlanMaterialRow,
  PlanStatus,
} from '../types';
import {
  getCalendarHours,
  calculateOperatingHours,
  createDefaultTimePlan,
  computeMonthKPI,
  sumMonthProducts,
  sumMonthProductsByType,
  sumMonthMaterials,
} from '../utils/annual-plan-calc';
import type {
  ProductionPlanFormValues,
  TechnoEconomicNormFormValues,
  ProductionShiftFormValues,
  ShiftDowntimeFormValues,
  ShiftMeterFormValues,
  ShiftLogFormValues,
  ProductionOrderFormValues,
  ProductionBatchFormValues,
} from '../validation/production-schemas';

interface RawPlanRow {
  id: string;
  plan_code: string;
  line_id: string;
  year: number;
  month: number;
  planned_capacity_tph: number | string;
  planned_recovery_rate_pct: number | string;
  total_calendar_hours: number | string;
  planned_breakdown_hours: number | string;
  planned_maintenance_hours: number | string;
  planned_shutdown_hours: number | string;
  planned_operating_hours?: number | string | null;
  target_quality_rate_pct: number | string;
  planned_input_material_tons: number | string;
  planned_output_product_tons: number | string;
  planned_byproduct_tons: number | string;
  status: ProductionMonthlyPlan['status'];
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  production_lines?: { name: string; code: string } | null;
}

interface RawPlanProductRow {
  id: string;
  plan_id: string;
  product_id: string;
  allocation_pct: number | string;
  planned_quantity_tons: number | string;
  target_quality_standard: string | null;
  notes: string | null;
  products?: { name: string; sku: string } | null;
}

interface RawPlanByproductRow {
  id: string;
  plan_id: string;
  byproduct_name: string;
  ratio_pct: number | string;
  planned_quantity_tons: number | string;
  destination_storage: string | null;
  notes: string | null;
}

interface RawPlanConsumptionRow {
  id: string;
  plan_id: string;
  norm_id: string | null;
  resource_type: string;
  resource_name: string;
  unit_of_measure: string;
  norm_rate: number | string;
  planned_total_consumption: number | string;
  estimated_unit_price: number | string | null;
  estimated_total_cost: number | string | null;
}

interface RawNormRow {
  id: string;
  norm_code: string;
  line_id: string | null;
  product_id: string | null;
  resource_type: TechnoEconomicNorm['resource_type'];
  resource_name: string;
  unit_of_measure: string;
  norm_rate: number | string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  production_lines?: { name: string } | null;
  products?: { name: string } | null;
}

interface RawShiftRow {
  id: string;
  shift_code: string;
  line_id: string;
  shift_date: string;
  shift_number: number;
  standard_shift_hours: number | string;
  total_downtime_hours: number | string;
  running_hours?: number | string | null;
  raw_material_input_tons: number | string;
  product_output_tons: number | string;
  byproduct_output_tons: number | string;
  actual_capacity_tph?: number | string | null;
  actual_recovery_rate_pct?: number | string | null;
  operator_employee_id: string | null;
  status: ProductionShift['status'];
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  production_lines?: { name: string; code: string } | null;
  employees?: { full_name: string; employee_code: string } | null;
}

interface RawMeterRow {
  id: string;
  shift_id: string;
  meter_code: string;
  meter_name: string;
  meter_type: ShiftMeterReading['meter_type'];
  start_reading: number | string;
  end_reading: number | string;
  multiplier: number | string;
  consumed_quantity: number | string;
  unit_of_measure: string;
  notes: string | null;
}

interface RawDowntimeRow {
  id: string;
  shift_id: string;
  line_id: string;
  machine_id: string | null;
  downtime_category: ShiftDowntime['downtime_category'];
  start_time: string;
  end_time: string;
  duration_minutes: number | string;
  reason: string;
  action_taken: string | null;
  status: ShiftDowntime['status'];
  reported_by_employee_id: string | null;
  created_at: string;
  machines?: { name: string } | null;
}

interface RawShiftLogRow {
  id: string;
  shift_id: string;
  log_time: string;
  change_type: ShiftLog['change_type'];
  content: string;
  changed_by_employee_id: string | null;
  created_at: string;
  employees?: { full_name: string } | null;
}

interface RawOrderRow {
  id: string;
  order_number: string;
  production_plan_id: string | null;
  line_id: string | null;
  product_id: string;
  bom_id: string | null;
  target_quantity: number | string;
  completed_quantity: number | string;
  scrap_quantity: number | string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  status: ProductionOrder['status'];
  priority: ProductionOrder['priority'];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  production_lines?: { name: string } | null;
  products?: { name: string; sku: string } | null;
  production_monthly_plans?: { plan_code: string } | null;
}

interface RawBatchRow {
  id: string;
  batch_number: string;
  production_order_id: string;
  machine_id: string | null;
  operator_employee_id: string | null;
  planned_quantity: number | string;
  actual_quantity: number | string;
  scrap_quantity: number | string;
  start_time: string | null;
  end_time: string | null;
  shift: ProductionBatch['shift'];
  status: ProductionBatch['status'];
  notes: string | null;
  created_at: string;
  updated_at: string;
  machines?: { name: string } | null;
  employees?: { full_name: string } | null;
}

// ==========================================
// 1. PRODUCTION LINES
// ==========================================
export async function fetchProductionLines(): Promise<ProductionLine[]> {
  const { data, error } = await supabase
    .from('production_lines')
    .select(
      'id, code, name, department_id, designed_capacity_tph, standard_shift_hours, shifts_per_day, status, created_at, updated_at',
    )
    .order('code', { ascending: true });

  if (error) throw error;
  return (data || []) as ProductionLine[];
}

export async function createProductionLine(
  values: Omit<ProductionLine, 'id' | 'created_at' | 'updated_at'>,
): Promise<ProductionLine> {
  const { data, error } = await supabase
    .from('production_lines')
    .insert([
      {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        department_id: values.department_id || null,
        designed_capacity_tph: Number(values.designed_capacity_tph) || 0,
        standard_shift_hours: Number(values.standard_shift_hours) || 8,
        shifts_per_day: Number(values.shifts_per_day) || 3,
        status: values.status || 'active',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as ProductionLine;
}

export async function updateProductionLine(
  id: string,
  values: Partial<Omit<ProductionLine, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ProductionLine> {
  const payload: {
    code?: string;
    name?: string;
    department_id?: string | null;
    designed_capacity_tph?: number;
    standard_shift_hours?: number;
    shifts_per_day?: number;
    status?: string;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (values.code !== undefined) payload.code = values.code.trim().toUpperCase();
  if (values.name !== undefined) payload.name = values.name.trim();
  if (values.department_id !== undefined) payload.department_id = values.department_id || null;
  if (values.designed_capacity_tph !== undefined)
    payload.designed_capacity_tph = Number(values.designed_capacity_tph);
  if (values.standard_shift_hours !== undefined)
    payload.standard_shift_hours = Number(values.standard_shift_hours);
  if (values.shifts_per_day !== undefined) payload.shifts_per_day = Number(values.shifts_per_day);
  if (values.status !== undefined) payload.status = values.status;

  const { data, error } = await supabase
    .from('production_lines')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductionLine;
}

export async function deleteProductionLine(id: string): Promise<void> {
  // 1. Verify if there are existing shifts or orders for this line
  const [shiftsRes, ordersRes] = await Promise.all([
    supabase.from('production_shifts').select('id', { count: 'exact', head: true }).eq('line_id', id),
    supabase.from('production_orders').select('id', { count: 'exact', head: true }).eq('line_id', id),
  ]);

  if ((shiftsRes.count || 0) > 0) {
    throw new Error(
      'Không thể xóa dây chuyền đã có dữ liệu theo dõi ca sản xuất. Vui lòng chuyển trạng thái sang "Tạm dừng".',
    );
  }
  if ((ordersRes.count || 0) > 0) {
    throw new Error(
      'Không thể xóa dây chuyền đã có lệnh sản xuất. Vui lòng chuyển trạng thái sang "Tạm dừng".',
    );
  }

  // 2. Cascade cleanup associated monthly plans and their allocations/consumptions
  const { data: plans } = await supabase
    .from('production_monthly_plans')
    .select('id')
    .eq('line_id', id);

  if (plans && plans.length > 0) {
    const planIds = plans.map((p) => p.id);
    await Promise.all([
      supabase.from('production_plan_products').delete().in('plan_id', planIds),
      supabase.from('production_plan_consumptions').delete().in('plan_id', planIds),
    ]);
    await supabase.from('production_monthly_plans').delete().eq('line_id', id);
  }

  // 3. Clean up techno-economic norms
  await supabase.from('techno_economic_norms').delete().eq('line_id', id);

  // 4. Delete the production line record
  const { error } = await supabase.from('production_lines').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 2. MONTHLY PRODUCTION PLANS
// ==========================================
export async function fetchProductionPlans(
  params: ProductionPlanFilterParams,
): Promise<PaginatedResult<ProductionMonthlyPlan>> {
  const { search, status, lineId, year, month, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('production_monthly_plans')
    .select(
      `
      id, plan_code, line_id, year, month, planned_capacity_tph, planned_recovery_rate_pct,
      total_calendar_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours,
      planned_operating_hours, target_quality_rate_pct, planned_input_material_tons,
      planned_output_product_tons, planned_byproduct_tons, status, approved_by, approved_at,
      notes, created_by, created_at, updated_at,
      production_lines ( name, code )
    `,
      { count: 'exact' },
    );

  if (search && search.trim() !== '') {
    query = query.ilike('plan_code', `%${search.trim()}%`);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (lineId && lineId !== 'all') {
    query = query.eq('line_id', lineId);
  }
  if (year && year !== 'all') {
    query = query.eq('year', year);
  }
  if (month && month !== 'all') {
    query = query.eq('month', month);
  }

  const { data, count, error } = await query
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const rawRows = (data || []) as unknown as RawPlanRow[];
  const formatted: ProductionMonthlyPlan[] = rawRows.map((row) => ({
    id: row.id,
    plan_code: row.plan_code,
    line_id: row.line_id,
    line_name: row.production_lines?.name,
    line_code: row.production_lines?.code,
    year: row.year,
    month: row.month,
    planned_capacity_tph: Number(row.planned_capacity_tph),
    planned_recovery_rate_pct: Number(row.planned_recovery_rate_pct),
    total_calendar_hours: Number(row.total_calendar_hours),
    planned_breakdown_hours: Number(row.planned_breakdown_hours),
    planned_maintenance_hours: Number(row.planned_maintenance_hours),
    planned_shutdown_hours: Number(row.planned_shutdown_hours),
    planned_operating_hours: Number(row.planned_operating_hours),
    target_quality_rate_pct: Number(row.target_quality_rate_pct),
    planned_input_material_tons: Number(row.planned_input_material_tons),
    planned_output_product_tons: Number(row.planned_output_product_tons),
    planned_byproduct_tons: Number(row.planned_byproduct_tons),
    status: row.status,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const totalCount = count || 0;
  return {
    data: formatted,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

/**
 * Fetches the entire 12-month Annual Production Plan for a specific year and line,
 * including product allocations and material consumptions.
 */
export async function fetchAnnualProductionPlan(
  year: number,
  lineId: string,
): Promise<AnnualPlanData> {
  // Step 1: fetch production line info
  const { data: lineRow } = await supabase
    .from('production_lines')
    .select('id, code, name')
    .eq('id', lineId)
    .single();

  const lineName = lineRow?.name;

  // Step 2: fetch monthly plans for this line and year
  const { data: planRows, error: planErr } = await supabase
    .from('production_monthly_plans')
    .select(
      `id, plan_code, line_id, year, month, planned_capacity_tph, planned_recovery_rate_pct,
      total_calendar_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours,
      planned_operating_hours, target_quality_rate_pct, planned_input_material_tons,
      planned_output_product_tons, planned_byproduct_tons, status, approved_by, approved_at,
      notes, created_by, created_at, updated_at`,
    )
    .eq('year', year)
    .eq('line_id', lineId)
    .order('month', { ascending: true });

  if (planErr) throw planErr;

  const rawPlans = (planRows || []) as unknown as RawPlanRow[];

  let status: PlanStatus = 'draft';
  if (rawPlans.length > 0) {
    status = rawPlans.some((p) => p.status === 'approved') ? 'approved' : (rawPlans[0]?.status ?? 'draft');
  }

  // Initialize timePlan & targetQualityPct
  const timePlan = createDefaultTimePlan(year);
  const targetQualityPct: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    targetQualityPct[m] = 99.0;
  }

  const planIdToMonth = new Map<string, number>();

  rawPlans.forEach((p) => {
    const m = p.month;
    planIdToMonth.set(p.id, m);
    targetQualityPct[m] = Number(p.target_quality_rate_pct) || 99.0;
    const cal = Number(p.total_calendar_hours) || getCalendarHours(year, m);
    const maint = Number(p.planned_maintenance_hours) || 0;
    const inc = Number(p.planned_breakdown_hours) || 0;
    const shut = Number(p.planned_shutdown_hours) || 0;
    timePlan[m] = {
      month: m,
      calendarHours: cal,
      maintenanceHours: maint,
      incidentHours: inc,
      plannedShutdownHours: shut,
      operatingHours: calculateOperatingHours(cal, maint, inc, shut),
    };
  });

  const planIds = rawPlans.map((p) => p.id);

  const productRowsMap = new Map<string, AnnualPlanProductRow>();
  const materialRowsMap = new Map<string, AnnualPlanMaterialRow>();

  if (planIds.length > 0) {
    // Step 3: fetch products and consumptions in parallel
    const [prodRes, consRes] = await Promise.all([
      supabase
        .from('production_plan_products')
        .select(
          `id, plan_id, product_id, allocation_pct, planned_quantity_tons,
          products ( id, name, sku, unit_of_measure, product_type )`,
        )
        .in('plan_id', planIds),
      supabase
        .from('production_plan_consumptions')
        .select(
          'id, plan_id, norm_id, resource_type, resource_name, unit_of_measure, norm_rate, planned_total_consumption',
        )
        .in('plan_id', planIds),
    ]);

    if (prodRes.error) throw prodRes.error;
    if (consRes.error) throw consRes.error;

    // Process products
    const rawProds = (prodRes.data || []) as unknown as Array<{
      id: string;
      plan_id: string;
      product_id: string;
      planned_quantity_tons: number | string;
      products?: {
        id: string;
        name: string;
        sku: string;
        unit_of_measure: string;
        product_type?: string;
      } | null;
    }>;

    for (const item of rawProds) {
      const month = planIdToMonth.get(item.plan_id);
      if (!month) continue;
      const pId = item.product_id;
      if (!productRowsMap.has(pId)) {
        const monthsInit: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) monthsInit[m] = 0;
        productRowsMap.set(pId, {
          productId: pId,
          productName: item.products?.name || 'Sản phẩm',
          productSku: item.products?.sku || '',
          productType: (item.products?.product_type as 'finished_good' | 'semi_finished' | 'by_product') || 'finished_good',
          unitOfMeasure: item.products?.unit_of_measure || 'tấn',
          months: monthsInit,
        });
      }
      productRowsMap.get(pId)!.months[month] = Number(item.planned_quantity_tons) || 0;
    }

    // Process consumptions
    const rawCons = (consRes.data || []) as unknown as Array<{
      id: string;
      plan_id: string;
      resource_type: string;
      resource_name: string;
      unit_of_measure: string;
      planned_total_consumption: number | string;
    }>;

    for (const item of rawCons) {
      const month = planIdToMonth.get(item.plan_id);
      if (!month) continue;
      const key = `${item.resource_type}:${item.resource_name}`;
      if (!materialRowsMap.has(key)) {
        const monthsInit: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) monthsInit[m] = 0;
        let categoryGroup: 'material' | 'fuel' | 'supply' = 'material';
        if (item.resource_type === 'fuel' || item.resource_type === 'fuel_energy') {
          categoryGroup = 'fuel';
        } else if (
          item.resource_type === 'supply' ||
          item.resource_type === 'spare_part' ||
          item.resource_type === 'chemical' ||
          item.resource_type === 'consumable'
        ) {
          categoryGroup = 'supply';
        }

        materialRowsMap.set(key, {
          materialId: key,
          materialName: item.resource_name,
          materialCode: '',
          category: item.resource_type,
          categoryGroup,
          unitOfMeasure: item.unit_of_measure || 'tấn',
          months: monthsInit,
        });
      }
      materialRowsMap.get(key)!.months[month] = Number(item.planned_total_consumption) || 0;
    }
  }

  // Ensure default electricity consumption item is always present
  const hasElectricity = Array.from(materialRowsMap.values()).some(
    (m) => m.materialName.toLowerCase().includes('điện') || m.materialCode === 'ELEC-POWER',
  );
  if (!hasElectricity) {
    const elecMonthsInit: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) elecMonthsInit[m] = 0;
    const defaultElecKey = 'fuel:Điện năng tiêu thụ (Điện sản xuất)';
    materialRowsMap.set(defaultElecKey, {
      materialId: 'default-electricity',
      materialName: 'Điện năng tiêu thụ (Điện sản xuất)',
      materialCode: 'ELEC-POWER',
      category: 'fuel_energy',
      categoryGroup: 'fuel',
      unitOfMeasure: 'kWh',
      months: elecMonthsInit,
    });
  }

  return {
    year,
    lineId,
    lineName,
    status,
    products: Array.from(productRowsMap.values()),
    materials: Array.from(materialRowsMap.values()),
    timePlan,
    targetQualityPct,
  };
}

/**
 * Saves or updates all 12 monthly plans, product allocations, and material consumptions.
 */
export async function saveAnnualProductionPlan(planData: AnnualPlanData): Promise<void> {
  const { year, lineId, products, materials, timePlan, targetQualityPct, status } = planData;

  // Step 1: get line code for plan_code naming
  const { data: lineRow } = await supabase
    .from('production_lines')
    .select('code')
    .eq('id', lineId)
    .single();

  const lineCode = (lineRow?.code || 'LINE').replace(/[^a-zA-Z0-9]/g, '');

  // Step 2: Loop 12 months and upsert each monthly plan
  for (let m = 1; m <= 12; m++) {
    const t = timePlan[m] || {
      calendarHours: getCalendarHours(year, m),
      maintenanceHours: 0,
      incidentHours: 0,
      plannedShutdownHours: 0,
      operatingHours: getCalendarHours(year, m),
    };

    const calHours = Number(t.calendarHours) || getCalendarHours(year, m);
    const maintHours = Number(t.maintenanceHours) || 0;
    const incHours = Number(t.incidentHours) || 0;
    const shutHours = Number(t.plannedShutdownHours) || 0;
    const opHours = calculateOperatingHours(calHours, maintHours, incHours, shutHours);

    const totalProductMonth = sumMonthProducts(products, m);
    const finishedProductMonth = sumMonthProductsByType(products, m, 'finished_good');
    const byproductMonth = sumMonthProductsByType(products, m, 'by_product');
    const rawMaterialMonth = sumMonthMaterials(materials, m, 'material');
    const fuelMonth = sumMonthMaterials(materials, m, 'fuel');
    const supplyMonth = sumMonthMaterials(materials, m, 'supply');

    const kpi = computeMonthKPI({
      month: m,
      calendarHours: calHours,
      maintenanceHours: maintHours,
      incidentHours: incHours,
      plannedShutdownHours: shutHours,
      operatingHours: opHours,
      rawMaterialTons: rawMaterialMonth,
      fuelConsumption: fuelMonth,
      supplyConsumption: supplyMonth,
      totalProductTons: totalProductMonth,
      finishedProductTons: finishedProductMonth,
      byproductTons: byproductMonth,
    });

    const planCode = `KH-${lineCode}-${year}-T${String(m).padStart(2, '0')}`;
    const qualityPct = Number(targetQualityPct[m]) || 99.0;

    // Upsert monthly plan
    const { data: upsertedPlan, error: planErr } = await supabase
      .from('production_monthly_plans')
      .upsert(
        {
          line_id: lineId,
          year,
          month: m,
          plan_code: planCode,
          planned_capacity_tph: Number(kpi.capacityTph.toFixed(2)),
          planned_recovery_rate_pct: Math.min(100, Math.max(0, Number(kpi.recoveryPct.toFixed(2)))),
          total_calendar_hours: calHours,
          planned_breakdown_hours: incHours,
          planned_maintenance_hours: maintHours,
          planned_shutdown_hours: shutHours,
          target_quality_rate_pct: qualityPct,
          planned_input_material_tons: rawMaterialMonth,
          planned_output_product_tons: finishedProductMonth,
          planned_byproduct_tons: byproductMonth,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'line_id,year,month' },
      )
      .select('id')
      .single();

    if (planErr) throw planErr;
    const planId = upsertedPlan.id;

    // Sync products for this month
    await supabase.from('production_plan_products').delete().eq('plan_id', planId);
    if (products.length > 0) {
      const prodInserts = products.map((prod) => {
        const qty = Number(prod.months[m]) || 0;
        const alloc = totalProductMonth > 0 ? (qty / totalProductMonth) * 100 : 0;
        return {
          plan_id: planId,
          product_id: prod.productId,
          planned_quantity_tons: qty,
          allocation_pct: Number(alloc.toFixed(2)),
        };
      });
      const { error: insProdErr } = await supabase.from('production_plan_products').insert(prodInserts);
      if (insProdErr) throw insProdErr;
    }

    // Sync consumptions for this month
    await supabase.from('production_plan_consumptions').delete().eq('plan_id', planId);
    if (materials.length > 0) {
      const consInserts = materials.map((mat) => {
        const qty = Number(mat.months[m]) || 0;
        const norm = finishedProductMonth * 0.955 > 0 ? qty / (finishedProductMonth * 0.955) : 0;
        return {
          plan_id: planId,
          resource_type: mat.categoryGroup,
          resource_name: mat.materialName,
          unit_of_measure: mat.unitOfMeasure,
          norm_rate: Number(norm.toFixed(4)),
          planned_total_consumption: qty,
        };
      });
      const { error: insConsErr } = await supabase.from('production_plan_consumptions').insert(consInserts);
      if (insConsErr) throw insConsErr;
    }
  }
}

/**
 * Approves all monthly plans for an annual plan.
 */
export async function approveAnnualProductionPlan(year: number, lineId: string): Promise<void> {
  const { error } = await supabase
    .from('production_monthly_plans')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('year', year)
    .eq('line_id', lineId);

  if (error) throw error;
}

/**
 * Deletes all 12 monthly plans for an annual plan (year & lineId),
 * along with their products and consumptions.
 */
export async function deleteAnnualProductionPlan(year: number, lineId: string): Promise<void> {
  // 1. Query all monthly plan IDs for this year & line
  const { data: plans, error: findErr } = await supabase
    .from('production_monthly_plans')
    .select('id')
    .eq('year', year)
    .eq('line_id', lineId);

  if (findErr) throw findErr;
  if (!plans || plans.length === 0) return;

  const planIds = plans.map((p) => p.id);

  // 2. Delete child records
  await Promise.all([
    supabase.from('production_plan_products').delete().in('plan_id', planIds),
    supabase.from('production_plan_consumptions').delete().in('plan_id', planIds),
  ]);

  // 3. Delete monthly plans
  const { error: delErr } = await supabase
    .from('production_monthly_plans')
    .delete()
    .eq('year', year)
    .eq('line_id', lineId);

  if (delErr) throw delErr;
}

export async function fetchProductionPlanById(id: string): Promise<{
  plan: ProductionMonthlyPlan;
  products: PlanProductAllocation[];
  byproducts: PlanByproduct[];
  consumptions: PlanConsumption[];
}> {
  const { data: rawPlan, error: planError } = await supabase
    .from('production_monthly_plans')
    .select(
      `
      id, plan_code, line_id, year, month, planned_capacity_tph, planned_recovery_rate_pct,
      total_calendar_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours,
      planned_operating_hours, target_quality_rate_pct, planned_input_material_tons,
      planned_output_product_tons, planned_byproduct_tons, status, approved_by, approved_at,
      notes, created_by, created_at, updated_at,
      production_lines ( name, code )
    `,
    )
    .eq('id', id)
    .single();

  if (planError) throw planError;
  const planData = rawPlan as unknown as RawPlanRow;

  const plan: ProductionMonthlyPlan = {
    id: planData.id,
    plan_code: planData.plan_code,
    line_id: planData.line_id,
    line_name: planData.production_lines?.name,
    line_code: planData.production_lines?.code,
    year: planData.year,
    month: planData.month,
    planned_capacity_tph: Number(planData.planned_capacity_tph),
    planned_recovery_rate_pct: Number(planData.planned_recovery_rate_pct),
    total_calendar_hours: Number(planData.total_calendar_hours),
    planned_breakdown_hours: Number(planData.planned_breakdown_hours),
    planned_maintenance_hours: Number(planData.planned_maintenance_hours),
    planned_shutdown_hours: Number(planData.planned_shutdown_hours),
    planned_operating_hours: Number(planData.planned_operating_hours),
    target_quality_rate_pct: Number(planData.target_quality_rate_pct),
    planned_input_material_tons: Number(planData.planned_input_material_tons),
    planned_output_product_tons: Number(planData.planned_output_product_tons),
    planned_byproduct_tons: Number(planData.planned_byproduct_tons),
    status: planData.status,
    approved_by: planData.approved_by,
    approved_at: planData.approved_at,
    notes: planData.notes,
    created_by: planData.created_by,
    created_at: planData.created_at,
    updated_at: planData.updated_at,
  };

  const { data: prodData } = await supabase
    .from('production_plan_products')
    .select(
      `
      id, plan_id, product_id, allocation_pct, planned_quantity_tons, target_quality_standard, notes,
      products ( name, sku )
    `,
    )
    .eq('plan_id', id);

  const rawProducts = (prodData || []) as unknown as RawPlanProductRow[];
  const products: PlanProductAllocation[] = rawProducts.map((row) => ({
    id: row.id,
    plan_id: row.plan_id,
    product_id: row.product_id,
    product_name: row.products?.name,
    product_sku: row.products?.sku,
    allocation_pct: Number(row.allocation_pct),
    planned_quantity_tons: Number(row.planned_quantity_tons),
    target_quality_standard: row.target_quality_standard,
    notes: row.notes,
  }));

  const { data: bypData } = await supabase
    .from('production_plan_byproducts')
    .select('id, plan_id, byproduct_name, ratio_pct, planned_quantity_tons, destination_storage, notes')
    .eq('plan_id', id);

  const rawByproducts = (bypData || []) as unknown as RawPlanByproductRow[];
  const byproducts: PlanByproduct[] = rawByproducts.map((row) => ({
    id: row.id,
    plan_id: row.plan_id,
    byproduct_name: row.byproduct_name,
    ratio_pct: Number(row.ratio_pct),
    planned_quantity_tons: Number(row.planned_quantity_tons),
    destination_storage: row.destination_storage,
    notes: row.notes,
  }));

  const { data: consData } = await supabase
    .from('production_plan_consumptions')
    .select(
      'id, plan_id, norm_id, resource_type, resource_name, unit_of_measure, norm_rate, planned_total_consumption, estimated_unit_price, estimated_total_cost',
    )
    .eq('plan_id', id);

  const rawConsumptions = (consData || []) as unknown as RawPlanConsumptionRow[];
  const consumptions: PlanConsumption[] = rawConsumptions.map((row) => ({
    id: row.id,
    plan_id: row.plan_id,
    norm_id: row.norm_id,
    resource_type: row.resource_type,
    resource_name: row.resource_name,
    unit_of_measure: row.unit_of_measure,
    norm_rate: Number(row.norm_rate),
    planned_total_consumption: Number(row.planned_total_consumption),
    estimated_unit_price: row.estimated_unit_price ? Number(row.estimated_unit_price) : null,
    estimated_total_cost: row.estimated_total_cost ? Number(row.estimated_total_cost) : null,
  }));

  return { plan, products, byproducts, consumptions };
}

export async function createProductionPlan(
  values: ProductionPlanFormValues,
): Promise<ProductionMonthlyPlan> {
  const { data, error } = await supabase
    .from('production_monthly_plans')
    .insert([
      {
        plan_code: values.plan_code,
        line_id: values.line_id,
        year: values.year,
        month: values.month,
        planned_capacity_tph: values.planned_capacity_tph,
        planned_recovery_rate_pct: values.planned_recovery_rate_pct,
        total_calendar_hours: values.total_calendar_hours,
        planned_breakdown_hours: values.planned_breakdown_hours,
        planned_maintenance_hours: values.planned_maintenance_hours,
        planned_shutdown_hours: values.planned_shutdown_hours,
        target_quality_rate_pct: values.target_quality_rate_pct,
        planned_input_material_tons: values.planned_input_material_tons,
        planned_output_product_tons: values.planned_output_product_tons,
        planned_byproduct_tons: values.planned_byproduct_tons,
        status: values.status,
        notes: values.notes,
      },
    ])
    .select(
      'id, plan_code, line_id, year, month, planned_capacity_tph, planned_recovery_rate_pct, total_calendar_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours, planned_operating_hours, target_quality_rate_pct, planned_input_material_tons, planned_output_product_tons, planned_byproduct_tons, status, approved_by, approved_at, notes, created_by, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionMonthlyPlan;
}

export async function updateProductionPlan(
  id: string,
  values: Partial<ProductionPlanFormValues>,
): Promise<ProductionMonthlyPlan> {
  const { data, error } = await supabase
    .from('production_monthly_plans')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, plan_code, line_id, year, month, planned_capacity_tph, planned_recovery_rate_pct, total_calendar_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours, planned_operating_hours, target_quality_rate_pct, planned_input_material_tons, planned_output_product_tons, planned_byproduct_tons, status, approved_by, approved_at, notes, created_by, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionMonthlyPlan;
}

export async function approveProductionPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('production_monthly_plans')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProductionPlan(id: string): Promise<void> {
  const { error } = await supabase.from('production_monthly_plans').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 3. TECHNO-ECONOMIC NORMS
// ==========================================
export async function fetchTechnoEconomicNorms(
  params: ProductionNormFilterParams,
): Promise<PaginatedResult<TechnoEconomicNorm>> {
  const { search, lineId, resourceType, isActive, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('techno_economic_norms')
    .select(
      `
      id, norm_code, line_id, product_id, resource_type, resource_name, unit_of_measure,
      norm_rate, effective_from, effective_to, is_active, created_at, updated_at,
      production_lines ( name ),
      products ( name )
    `,
      { count: 'exact' },
    );

  if (search && search.trim() !== '') {
    query = query.or(
      `norm_code.ilike.%${search.trim()}%,resource_name.ilike.%${search.trim()}%`,
    );
  }
  if (lineId && lineId !== 'all') {
    query = query.eq('line_id', lineId);
  }
  if (resourceType && resourceType !== 'all') {
    query = query.eq('resource_type', resourceType);
  }
  if (isActive !== undefined && isActive !== 'all') {
    query = query.eq('is_active', isActive);
  }

  const { data, count, error } = await query
    .order('norm_code', { ascending: true })
    .range(from, to);

  if (error) throw error;

  const rawRows = (data || []) as unknown as RawNormRow[];
  const formatted: TechnoEconomicNorm[] = rawRows.map((row) => ({
    id: row.id,
    norm_code: row.norm_code,
    line_id: row.line_id,
    line_name: row.production_lines?.name,
    product_id: row.product_id,
    product_name: row.products?.name,
    resource_type: row.resource_type,
    resource_name: row.resource_name,
    unit_of_measure: row.unit_of_measure,
    norm_rate: Number(row.norm_rate),
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const totalCount = count || 0;
  return {
    data: formatted,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function createTechnoEconomicNorm(
  values: TechnoEconomicNormFormValues,
): Promise<TechnoEconomicNorm> {
  const { data, error } = await supabase
    .from('techno_economic_norms')
    .insert([
      {
        norm_code: values.norm_code,
        line_id: values.line_id || null,
        product_id: values.product_id || null,
        resource_type: values.resource_type,
        resource_name: values.resource_name,
        unit_of_measure: values.unit_of_measure,
        norm_rate: values.norm_rate,
        effective_from: values.effective_from,
        effective_to: values.effective_to || null,
        is_active: values.is_active,
      },
    ])
    .select(
      'id, norm_code, line_id, product_id, resource_type, resource_name, unit_of_measure, norm_rate, effective_from, effective_to, is_active, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as TechnoEconomicNorm;
}

export async function updateTechnoEconomicNorm(
  id: string,
  values: Partial<TechnoEconomicNormFormValues>,
): Promise<TechnoEconomicNorm> {
  const { data, error } = await supabase
    .from('techno_economic_norms')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, norm_code, line_id, product_id, resource_type, resource_name, unit_of_measure, norm_rate, effective_from, effective_to, is_active, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as TechnoEconomicNorm;
}

export async function deleteTechnoEconomicNorm(id: string): Promise<void> {
  const { error } = await supabase.from('techno_economic_norms').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// 4. PRODUCTION SHIFTS & EXECUTION
// ==========================================
export async function fetchProductionShifts(
  params: ProductionShiftFilterParams,
): Promise<PaginatedResult<ProductionShift>> {
  const { search, lineId, shiftNumber, status, fromDate, toDate, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('production_shifts')
    .select(
      `
      id, shift_code, line_id, shift_date, shift_number, standard_shift_hours,
      total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons,
      byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct,
      operator_employee_id, status, verified_by, notes, created_at, updated_at,
      production_lines ( name, code ),
      employees ( full_name, employee_code )
    `,
      { count: 'exact' },
    );

  if (search && search.trim() !== '') {
    query = query.ilike('shift_code', `%${search.trim()}%`);
  }
  if (lineId && lineId !== 'all') {
    query = query.eq('line_id', lineId);
  }
  if (shiftNumber && shiftNumber !== 'all') {
    query = query.eq('shift_number', shiftNumber);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (fromDate) {
    query = query.gte('shift_date', fromDate);
  }
  if (toDate) {
    query = query.lte('shift_date', toDate);
  }

  const { data, count, error } = await query
    .order('shift_date', { ascending: false })
    .order('shift_number', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const rawRows = (data || []) as unknown as RawShiftRow[];
  const formatted: ProductionShift[] = rawRows.map((row) => ({
    id: row.id,
    shift_code: row.shift_code,
    line_id: row.line_id,
    line_name: row.production_lines?.name,
    line_code: row.production_lines?.code,
    shift_date: row.shift_date,
    shift_number: row.shift_number,
    standard_shift_hours: Number(row.standard_shift_hours),
    total_downtime_hours: Number(row.total_downtime_hours),
    running_hours: Number(row.running_hours),
    raw_material_input_tons: Number(row.raw_material_input_tons),
    product_output_tons: Number(row.product_output_tons),
    byproduct_output_tons: Number(row.byproduct_output_tons),
    actual_capacity_tph: Number(row.actual_capacity_tph),
    actual_recovery_rate_pct: Number(row.actual_recovery_rate_pct),
    operator_employee_id: row.operator_employee_id,
    operator_name: row.employees?.full_name,
    status: row.status,
    verified_by: row.verified_by,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const totalCount = count || 0;
  return {
    data: formatted,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function fetchProductionShiftById(id: string): Promise<{
  shift: ProductionShift;
  meters: ShiftMeterReading[];
  downtimes: ShiftDowntime[];
  logs: ShiftLog[];
}> {
  const { data: rawShift, error: shiftError } = await supabase
    .from('production_shifts')
    .select(
      `
      id, shift_code, line_id, shift_date, shift_number, standard_shift_hours,
      total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons,
      byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct,
      operator_employee_id, status, verified_by, notes, created_at, updated_at,
      production_lines ( name, code ),
      employees ( full_name, employee_code )
    `,
    )
    .eq('id', id)
    .single();

  if (shiftError) throw shiftError;
  const shiftData = rawShift as unknown as RawShiftRow;

  const shift: ProductionShift = {
    id: shiftData.id,
    shift_code: shiftData.shift_code,
    line_id: shiftData.line_id,
    line_name: shiftData.production_lines?.name,
    line_code: shiftData.production_lines?.code,
    shift_date: shiftData.shift_date,
    shift_number: shiftData.shift_number,
    standard_shift_hours: Number(shiftData.standard_shift_hours),
    total_downtime_hours: Number(shiftData.total_downtime_hours),
    running_hours: Number(shiftData.running_hours),
    raw_material_input_tons: Number(shiftData.raw_material_input_tons),
    product_output_tons: Number(shiftData.product_output_tons),
    byproduct_output_tons: Number(shiftData.byproduct_output_tons),
    actual_capacity_tph: Number(shiftData.actual_capacity_tph),
    actual_recovery_rate_pct: Number(shiftData.actual_recovery_rate_pct),
    operator_employee_id: shiftData.operator_employee_id,
    operator_name: shiftData.employees?.full_name,
    status: shiftData.status,
    verified_by: shiftData.verified_by,
    notes: shiftData.notes,
    created_at: shiftData.created_at,
    updated_at: shiftData.updated_at,
  };

  const { data: meterData } = await supabase
    .from('production_shift_meter_readings')
    .select(
      'id, shift_id, meter_code, meter_name, meter_type, start_reading, end_reading, multiplier, consumed_quantity, unit_of_measure, notes',
    )
    .eq('shift_id', id);

  const rawMeters = (meterData || []) as unknown as RawMeterRow[];
  const meters: ShiftMeterReading[] = rawMeters.map((row) => ({
    id: row.id,
    shift_id: row.shift_id,
    meter_code: row.meter_code,
    meter_name: row.meter_name,
    meter_type: row.meter_type,
    start_reading: Number(row.start_reading),
    end_reading: Number(row.end_reading),
    multiplier: Number(row.multiplier),
    consumed_quantity: Number(row.consumed_quantity),
    unit_of_measure: row.unit_of_measure,
    notes: row.notes,
  }));

  const { data: downData } = await supabase
    .from('production_shift_downtime')
    .select(
      `
      id, shift_id, line_id, machine_id, downtime_category, start_time, end_time,
      duration_minutes, reason, action_taken, status, reported_by_employee_id, created_at,
      machines ( name )
    `,
    )
    .eq('shift_id', id);

  const rawDowntimes = (downData || []) as unknown as RawDowntimeRow[];
  const downtimes: ShiftDowntime[] = rawDowntimes.map((row) => ({
    id: row.id,
    shift_id: row.shift_id,
    line_id: row.line_id,
    machine_id: row.machine_id,
    machine_name: row.machines?.name,
    downtime_category: row.downtime_category,
    start_time: row.start_time,
    end_time: row.end_time,
    duration_minutes: Number(row.duration_minutes),
    reason: row.reason,
    action_taken: row.action_taken,
    status: row.status,
    reported_by_employee_id: row.reported_by_employee_id,
    created_at: row.created_at,
  }));

  const { data: logData } = await supabase
    .from('production_shift_logs')
    .select(
      `
      id, shift_id, log_time, change_type, content, changed_by_employee_id, created_at,
      employees ( full_name )
    `,
    )
    .eq('shift_id', id);

  const rawLogs = (logData || []) as unknown as RawShiftLogRow[];
  const logs: ShiftLog[] = rawLogs.map((row) => ({
    id: row.id,
    shift_id: row.shift_id,
    log_time: row.log_time,
    change_type: row.change_type,
    content: row.content,
    changed_by_employee_id: row.changed_by_employee_id,
    changed_by_name: row.employees?.full_name,
    created_at: row.created_at,
  }));

  return { shift, meters, downtimes, logs };
}

export async function createProductionShift(
  values: ProductionShiftFormValues,
): Promise<ProductionShift> {
  const runningHours = Math.max(
    0,
    values.standard_shift_hours - (values.total_downtime_hours || 0),
  );
  const capacity =
    runningHours > 0 ? Number((values.product_output_tons / runningHours).toFixed(2)) : 0;
  const recovery =
    values.raw_material_input_tons > 0
      ? Number(
          ((values.product_output_tons / values.raw_material_input_tons) * 100).toFixed(2),
        )
      : 0;

  const { data, error } = await supabase
    .from('production_shifts')
    .insert([
      {
        shift_code: values.shift_code,
        line_id: values.line_id,
        shift_date: values.shift_date,
        shift_number: values.shift_number,
        standard_shift_hours: values.standard_shift_hours,
        total_downtime_hours: values.total_downtime_hours,
        raw_material_input_tons: values.raw_material_input_tons,
        product_output_tons: values.product_output_tons,
        byproduct_output_tons: values.byproduct_output_tons,
        actual_capacity_tph: capacity,
        actual_recovery_rate_pct: recovery,
        operator_employee_id: values.operator_employee_id || null,
        status: values.status,
        notes: values.notes,
      },
    ])
    .select(
      'id, shift_code, line_id, shift_date, shift_number, standard_shift_hours, total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons, byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct, operator_employee_id, status, verified_by, notes, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionShift;
}

export async function updateProductionShift(
  id: string,
  values: Partial<ProductionShiftFormValues>,
): Promise<ProductionShift> {
  const { data, error } = await supabase
    .from('production_shifts')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, shift_code, line_id, shift_date, shift_number, standard_shift_hours, total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons, byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct, operator_employee_id, status, verified_by, notes, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionShift;
}

export async function verifyProductionShift(id: string): Promise<void> {
  const { error } = await supabase
    .from('production_shifts')
    .update({
      status: 'verified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProductionShift(id: string): Promise<void> {
  const { error } = await supabase.from('production_shifts').delete().eq('id', id);
  if (error) throw error;
}

export async function createShiftDowntime(
  values: ShiftDowntimeFormValues,
): Promise<ShiftDowntime> {
  const { data, error } = await supabase
    .from('production_shift_downtime')
    .insert([
      {
        shift_id: values.shift_id,
        line_id: values.line_id,
        machine_id: values.machine_id || null,
        downtime_category: values.downtime_category,
        start_time: values.start_time,
        end_time: values.end_time,
        duration_minutes: values.duration_minutes,
        reason: values.reason,
        action_taken: values.action_taken || null,
        status: values.status,
        reported_by_employee_id: values.reported_by_employee_id || null,
      },
    ])
    .select(
      'id, shift_id, line_id, machine_id, downtime_category, start_time, end_time, duration_minutes, reason, action_taken, status, reported_by_employee_id, created_at',
    )
    .single();

  if (error) throw error;
  return data as ShiftDowntime;
}

export async function createShiftMeterReading(
  values: ShiftMeterFormValues,
): Promise<ShiftMeterReading> {
  const { data, error } = await supabase
    .from('production_shift_meter_readings')
    .insert([
      {
        shift_id: values.shift_id,
        meter_code: values.meter_code,
        meter_name: values.meter_name,
        meter_type: values.meter_type,
        start_reading: values.start_reading,
        end_reading: values.end_reading,
        multiplier: values.multiplier,
        consumed_quantity: values.consumed_quantity,
        unit_of_measure: values.unit_of_measure,
        notes: values.notes || null,
      },
    ])
    .select(
      'id, shift_id, meter_code, meter_name, meter_type, start_reading, end_reading, multiplier, consumed_quantity, unit_of_measure, notes',
    )
    .single();

  if (error) throw error;
  return data as ShiftMeterReading;
}

export async function createShiftLog(values: ShiftLogFormValues): Promise<ShiftLog> {
  const { data, error } = await supabase
    .from('production_shift_logs')
    .insert([
      {
        shift_id: values.shift_id,
        log_time: values.log_time,
        change_type: values.change_type,
        content: values.content,
        changed_by_employee_id: values.changed_by_employee_id || null,
      },
    ])
    .select(
      'id, shift_id, log_time, change_type, content, changed_by_employee_id, created_at',
    )
    .single();

  if (error) throw error;
  return data as ShiftLog;
}

// ==========================================
// 5. PRODUCTION ORDERS & BATCHES
// ==========================================
export async function fetchProductionOrders(
  params: ProductionOrderFilterParams,
): Promise<PaginatedResult<ProductionOrder>> {
  const { search, status, priority, lineId, productId, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('production_orders')
    .select(
      `
      id, order_number, production_plan_id, line_id, product_id, bom_id,
      target_quantity, completed_quantity, scrap_quantity,
      planned_start_date, planned_end_date, actual_start_date, actual_end_date,
      status, priority, created_by, created_at, updated_at,
      production_lines ( name ),
      products ( name, sku ),
      production_monthly_plans ( plan_code )
    `,
      { count: 'exact' },
    );

  if (search && search.trim() !== '') {
    query = query.ilike('order_number', `%${search.trim()}%`);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (priority && priority !== 'all') {
    query = query.eq('priority', priority);
  }
  if (lineId && lineId !== 'all') {
    query = query.eq('line_id', lineId);
  }
  if (productId && productId !== 'all') {
    query = query.eq('product_id', productId);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const rawRows = (data || []) as unknown as RawOrderRow[];
  const formatted: ProductionOrder[] = rawRows.map((row) => ({
    id: row.id,
    order_number: row.order_number,
    production_plan_id: row.production_plan_id,
    plan_code: row.production_monthly_plans?.plan_code,
    line_id: row.line_id,
    line_name: row.production_lines?.name,
    product_id: row.product_id,
    product_name: row.products?.name,
    product_sku: row.products?.sku,
    bom_id: row.bom_id,
    target_quantity: Number(row.target_quantity),
    completed_quantity: Number(row.completed_quantity),
    scrap_quantity: Number(row.scrap_quantity),
    planned_start_date: row.planned_start_date,
    planned_end_date: row.planned_end_date,
    actual_start_date: row.actual_start_date,
    actual_end_date: row.actual_end_date,
    status: row.status,
    priority: row.priority,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const totalCount = count || 0;
  return {
    data: formatted,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

export async function fetchProductionBatches(orderId: string): Promise<ProductionBatch[]> {
  const { data, error } = await supabase
    .from('production_batches')
    .select(
      `
      id, batch_number, production_order_id, machine_id, operator_employee_id,
      planned_quantity, actual_quantity, scrap_quantity, start_time, end_time,
      shift, status, notes, created_at, updated_at,
      machines ( name ),
      employees ( full_name )
    `,
    )
    .eq('production_order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rawRows = (data || []) as unknown as RawBatchRow[];
  return rawRows.map((row) => ({
    id: row.id,
    batch_number: row.batch_number,
    production_order_id: row.production_order_id,
    machine_id: row.machine_id,
    machine_name: row.machines?.name,
    operator_employee_id: row.operator_employee_id,
    operator_name: row.employees?.full_name,
    planned_quantity: Number(row.planned_quantity),
    actual_quantity: Number(row.actual_quantity),
    scrap_quantity: Number(row.scrap_quantity),
    start_time: row.start_time,
    end_time: row.end_time,
    shift: row.shift,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createProductionOrder(
  values: ProductionOrderFormValues,
): Promise<ProductionOrder> {
  const { data, error } = await supabase
    .from('production_orders')
    .insert([
      {
        order_number: values.order_number,
        production_plan_id: values.production_plan_id || null,
        line_id: values.line_id || null,
        product_id: values.product_id,
        bom_id: values.bom_id || null,
        target_quantity: values.target_quantity,
        completed_quantity: values.completed_quantity || 0,
        scrap_quantity: values.scrap_quantity || 0,
        planned_start_date: values.planned_start_date,
        planned_end_date: values.planned_end_date,
        actual_start_date: values.actual_start_date || null,
        actual_end_date: values.actual_end_date || null,
        status: values.status,
        priority: values.priority,
      },
    ])
    .select(
      'id, order_number, production_plan_id, line_id, product_id, bom_id, target_quantity, completed_quantity, scrap_quantity, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status, priority, created_by, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionOrder;
}

export async function updateProductionOrder(
  id: string,
  values: Partial<ProductionOrderFormValues>,
): Promise<ProductionOrder> {
  const { data, error } = await supabase
    .from('production_orders')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, order_number, production_plan_id, line_id, product_id, bom_id, target_quantity, completed_quantity, scrap_quantity, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status, priority, created_by, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionOrder;
}

export async function deleteProductionOrder(id: string): Promise<void> {
  const { error } = await supabase.from('production_orders').delete().eq('id', id);
  if (error) throw error;
}

export async function createProductionBatch(
  values: ProductionBatchFormValues,
): Promise<ProductionBatch> {
  const { data, error } = await supabase
    .from('production_batches')
    .insert([
      {
        batch_number: values.batch_number,
        production_order_id: values.production_order_id,
        machine_id: values.machine_id || null,
        operator_employee_id: values.operator_employee_id || null,
        planned_quantity: values.planned_quantity,
        actual_quantity: values.actual_quantity || 0,
        scrap_quantity: values.scrap_quantity || 0,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        shift: values.shift || null,
        status: values.status,
        notes: values.notes || null,
      },
    ])
    .select(
      'id, batch_number, production_order_id, machine_id, operator_employee_id, planned_quantity, actual_quantity, scrap_quantity, start_time, end_time, shift, status, notes, created_at, updated_at',
    )
    .single();

  if (error) throw error;
  return data as ProductionBatch;
}

// ==========================================
// 6. PRODUCTION SUMMARY METRICS
// ==========================================
export async function fetchProductionMetrics(): Promise<ProductionMetrics> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Active production lines count
  const { count: linesCount } = await supabase
    .from('production_lines')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // Current month plans sum
  const { data: plansData } = await supabase
    .from('production_monthly_plans')
    .select('planned_output_product_tons, status')
    .eq('year', currentYear)
    .eq('month', currentMonth);

  const totalMonthlyPlans = plansData?.length || 0;
  const monthlyPlannedOutputTons = (plansData || []).reduce(
    (sum, p) => sum + Number(p.planned_output_product_tons || 0),
    0,
  );

  // Active production orders
  const { count: ordersCount } = await supabase
    .from('production_orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['scheduled', 'released', 'in_progress']);

  // Recent shifts data
  const { data: shiftsData } = await supabase
    .from('production_shifts')
    .select(
      'product_output_tons, total_downtime_hours, actual_capacity_tph, actual_recovery_rate_pct',
    )
    .order('shift_date', { ascending: false })
    .limit(30);

  const shifts = shiftsData || [];
  const actualMonthlyOutputTons = shifts.reduce(
    (sum, s) => sum + Number(s.product_output_tons || 0),
    0,
  );
  const totalDowntimeHours = shifts.reduce(
    (sum, s) => sum + Number(s.total_downtime_hours || 0),
    0,
  );

  const avgCapacityTph =
    shifts.length > 0
      ? Number(
          (
            shifts.reduce((sum, s) => sum + Number(s.actual_capacity_tph || 0), 0) /
            shifts.length
          ).toFixed(2),
        )
      : 0;

  const avgRecoveryRatePct =
    shifts.length > 0
      ? Number(
          (
            shifts.reduce((sum, s) => sum + Number(s.actual_recovery_rate_pct || 0), 0) /
            shifts.length
          ).toFixed(2),
        )
      : 0;

  return {
    totalMonthlyPlans,
    activeLines: linesCount || 0,
    monthlyPlannedOutputTons,
    actualMonthlyOutputTons,
    avgCapacityTph,
    avgRecoveryRatePct,
    totalDowntimeHours,
    activeOrdersCount: ordersCount || 0,
  };
}
