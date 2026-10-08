import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type {
  ProductionLine,
  ProductionMonthlyPlan,
  PlanProductAllocation,
  PlanByproduct,
  PlanConsumption,
  TechnoEconomicNorm,
  ProductionShift,
  ShiftDowntime,
  ProductionOrder,
  ProductionBatch,
  ProductionPlanFilterParams,
  ProductionShiftFilterParams,
  ProductionNormFilterParams,
  ProductionOrderFilterParams,
  PaginatedResult,
  ProductionMetrics,
  ProductionMetricsFilterParams,
  ConsumptionNormMetric,
  AnnualPlanData,
  AnnualPlanProductRow,
  AnnualPlanMaterialRow,
  PlanStatus,
  ShiftStatus,
  ShiftDowntimeBreakdown,
  BatchShiftWarehouseSyncPayload,
  BatchShiftWarehouseSyncItem,
  DowntimeIncidentRecord,
  IncidentAnalyticsFilters,
  ParetoItem,
  IncidentAIInsight,
} from '../types';
import { isFinishedProduct, isSemiFinishedProduct, isByProduct } from '../types';
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
  actual_quality_rate_pct?: number | string | null;
  operator_employee_id: string | null;
  status?: string | null;
  notes: string | null;
  materials_consumption?: unknown;
  products_output?: unknown;
  downtime_breakdown?: unknown;
  warehouse_synced?: boolean;
  warehouse_synced_at?: string | null;
  created_at: string;
  updated_at: string;
  production_lines?: { name: string; code: string } | null;
  employees?: { first_name?: string; last_name?: string; employee_code?: string } | null;
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
  employees?: { first_name?: string; last_name?: string } | null;
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
        let categoryGroup: 'material' | 'fuel' | 'energy' | 'supply' = 'material';
        const resLower = (item.resource_type || '').toLowerCase();
        const nameLower = (item.resource_name || '').toLowerCase();
        const uomLower = (item.unit_of_measure || '').toLowerCase();

        if (
          resLower === 'electricity' ||
          resLower === 'energy' ||
          nameLower.includes('điện') ||
          uomLower === 'kwh'
        ) {
          categoryGroup = 'energy';
        } else if (resLower === 'fuel' || resLower === 'fuel_energy') {
          categoryGroup = 'fuel';
        } else if (
          resLower === 'supply' ||
          resLower === 'spare_part' ||
          resLower === 'chemical' ||
          resLower === 'consumable'
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
    const defaultElecKey = 'energy:Điện năng tiêu thụ (Điện sản xuất)';
    materialRowsMap.set(defaultElecKey, {
      materialId: 'default-electricity',
      materialName: 'Điện năng tiêu thụ (Điện sản xuất)',
      materialCode: 'ELEC-POWER',
      category: 'energy',
      categoryGroup: 'energy',
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
        const norm = finishedProductMonth > 0 ? qty / finishedProductMonth : 0;
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
  const { search, lineId, shiftNumber, fromDate, toDate, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

    let query = supabase
      .from('production_shifts')
      .select(
        `
        id, shift_code, line_id, shift_date, shift_number, standard_shift_hours,
        total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons,
        byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct, actual_quality_rate_pct,
        operator_employee_id, notes,
        materials_consumption, products_output, downtime_breakdown,
        warehouse_synced, warehouse_synced_at,
        created_at, updated_at,
        production_lines ( name, code ),
        employees ( first_name, last_name, employee_code )
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
      actual_quality_rate_pct: row.actual_quality_rate_pct !== null && row.actual_quality_rate_pct !== undefined ? Number(row.actual_quality_rate_pct) : 100,
      operator_employee_id: row.operator_employee_id,
      operator_name: row.employees
        ? [row.employees.last_name, row.employees.first_name].filter(Boolean).join(' ') || undefined
        : ((row.downtime_breakdown as Record<string, unknown> | null)?.updated_by_name as string) ||
          ((row.downtime_breakdown as Record<string, unknown> | null)?.operator_name as string) ||
          'Lê Anh Thân',
      status: (row.status as ShiftStatus) || undefined,
      notes: row.notes,
      materials_consumption: Array.isArray(row.materials_consumption) ? row.materials_consumption : [],
      products_output: Array.isArray(row.products_output) ? row.products_output : [],
      downtime_breakdown: row.downtime_breakdown && typeof row.downtime_breakdown === 'object' ? (row.downtime_breakdown as ProductionShift['downtime_breakdown']) : undefined,
      warehouse_synced: !!row.warehouse_synced,
      warehouse_synced_at: row.warehouse_synced_at || null,
      end_date:
        (row.downtime_breakdown as Record<string, unknown> | null)?.to_date as string | undefined ||
        row.notes?.match(/\[Kỳ:\s*([^\s]+)\s*(?:đến|->|-)\s*([^\]]+)\]/i)?.[2]?.trim() ||
        null,
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
  downtimes: ShiftDowntime[];
}> {
    const query = supabase
      .from('production_shifts')
      .select(
        `
        id, shift_code, line_id, shift_date, shift_number, standard_shift_hours,
        total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons,
        byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct, actual_quality_rate_pct,
        operator_employee_id, notes,
        materials_consumption, products_output, downtime_breakdown,
        warehouse_synced, warehouse_synced_at,
        created_at, updated_at,
        production_lines ( name, code ),
        employees ( first_name, last_name, employee_code )
      `,
      )
      .eq('id', id)
      .single();

    const { data: rawShift, error: shiftError } = await query;

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
      actual_quality_rate_pct:
        shiftData.actual_quality_rate_pct !== null && shiftData.actual_quality_rate_pct !== undefined
          ? Number(shiftData.actual_quality_rate_pct)
          : 100,
      operator_employee_id: shiftData.operator_employee_id,
      operator_name: shiftData.employees
        ? [shiftData.employees.last_name, shiftData.employees.first_name].filter(Boolean).join(' ') || undefined
        : ((shiftData.downtime_breakdown as Record<string, unknown> | null)?.updated_by_name as string) ||
          ((shiftData.downtime_breakdown as Record<string, unknown> | null)?.operator_name as string) ||
          'Lê Anh Thân',
      status: 'completed' as ShiftStatus,
      notes: shiftData.notes,
      materials_consumption: Array.isArray(shiftData.materials_consumption) ? shiftData.materials_consumption : [],
      products_output: Array.isArray(shiftData.products_output) ? shiftData.products_output : [],
      downtime_breakdown: shiftData.downtime_breakdown && typeof shiftData.downtime_breakdown === 'object' ? (shiftData.downtime_breakdown as ProductionShift['downtime_breakdown']) : undefined,
      warehouse_synced: !!shiftData.warehouse_synced,
      warehouse_synced_at: shiftData.warehouse_synced_at || null,
      end_date:
        (shiftData.downtime_breakdown as Record<string, unknown> | null)?.to_date as string | undefined ||
        shiftData.notes?.match(/\[Kỳ:\s*([^\s]+)\s*(?:đến|->|-)\s*([^\]]+)\]/i)?.[2]?.trim() ||
        null,
      created_at: shiftData.created_at,
      updated_at: shiftData.updated_at,
    };

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

  return { shift, downtimes };
}

export async function createProductionShift(
  values: ProductionShiftFormValues,
): Promise<ProductionShift> {
  const prods = values.products_output || [];
  const finishedFromProds = prods.reduce((acc, p) => {
    return isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
  }, 0);
  const semiFinishedFromProds = prods.reduce((acc, p) => {
    return isSemiFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
  }, 0);
  const byproductFromProds = prods.reduce((acc, p) => {
    return isByProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
  }, 0);

  const productOutputTons =
    finishedFromProds > 0
      ? finishedFromProds
      : (Number(values.product_output_tons) > 0 ? Number(values.product_output_tons) : 0);
  const byproductOutputTons =
    byproductFromProds > 0
      ? byproductFromProds
      : (Number(values.byproduct_output_tons) > 0 ? Number(values.byproduct_output_tons) : 0);

  const mats = values.materials_consumption || [];
  const rawFromMats = mats.reduce((acc, m) => {
    const name = (m.resource_name || '').toLowerCase();
    const isRaw =
      m.category === 'material' ||
      name.includes('cát nguyên khai') ||
      name.includes('quặng') ||
      name.includes('nguyên khai');
    return isRaw ? acc + (Number(m.actual_quantity) || 0) : acc;
  }, 0);

  const rawInput =
    Number(values.raw_material_input_tons) > 0
      ? Number(values.raw_material_input_tons)
      : rawFromMats;

  const runningHours = Math.max(
    0,
    values.standard_shift_hours - (values.total_downtime_hours || 0),
  );
  // Công suất = Nguyên liệu cấp / Giờ chạy (TPH)
  const capacity =
    runningHours > 0 && rawInput > 0
      ? Number((rawInput / runningHours).toFixed(2))
      : (runningHours > 0 && productOutputTons > 0 ? Number((productOutputTons / runningHours).toFixed(2)) : 0);
  // Thu hồi = Thành phẩm / Nguyên liệu * 100% (nếu ca sản xuất bán thành phẩm thì tính theo bán thành phẩm)
  const recovery =
    rawInput > 0 && productOutputTons > 0
      ? Number(((productOutputTons / rawInput) * 100).toFixed(2))
      : (rawInput > 0 && semiFinishedFromProds > 0
          ? Number(((semiFinishedFromProds / rawInput) * 100).toFixed(2))
          : (Number(values.actual_recovery_rate_pct) > 0 ? Number(values.actual_recovery_rate_pct) : 0));

  const breakdown = { ...(values.downtime_breakdown || {}) };
  if (values.operator_name) {
    (breakdown as Record<string, unknown>).updated_by_name = values.operator_name;
  }

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
        running_hours: runningHours,
        raw_material_input_tons: rawInput,
        product_output_tons: productOutputTons,
        byproduct_output_tons: byproductOutputTons,
        actual_capacity_tph: capacity,
        actual_recovery_rate_pct: recovery,
        actual_quality_rate_pct: values.actual_quality_rate_pct ?? 100,
        operator_employee_id: values.operator_employee_id || null,
        notes: values.notes || null,
        materials_consumption: values.materials_consumption || [],
        products_output: values.products_output || [],
        downtime_breakdown: breakdown,
      },
    ])
    .select(
      'id, shift_code, line_id, shift_date, shift_number, standard_shift_hours, total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons, byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct, actual_quality_rate_pct, operator_employee_id, notes, materials_consumption, products_output, downtime_breakdown, created_at, updated_at',
    )
    .single();

  if (error) throw error;

  // Sync downtime records to production_shift_downtime
  const shiftId = data.id;
  if (breakdown) {
    await syncShiftDowntimeRecords(shiftId, values.line_id, values.shift_date, breakdown as unknown as ShiftDowntimeBreakdown);
  }

  return data as unknown as ProductionShift;
}

async function syncShiftDowntimeRecords(
  shiftId: string,
  lineId: string,
  shiftDate: string,
  breakdown: ShiftDowntimeBreakdown,
) {
  await supabase.from('production_shift_downtime').delete().eq('shift_id', shiftId);
  const downtimeInserts = [];
  const baseDate = new Date(`${shiftDate}T08:00:00Z`);

  if (breakdown.events && breakdown.events.length > 0) {
    for (const evt of breakdown.events) {
      const sTime = evt.start_time || '08:00';
      const eTime = evt.end_time || '08:30';
      const startIso = `${shiftDate}T${sTime}:00Z`;
      let endIso = `${shiftDate}T${eTime}:00Z`;
      if (sTime > eTime) {
        const nextDay = new Date(new Date(`${shiftDate}T00:00:00Z`).getTime() + 86400000);
        endIso = `${nextDay.toISOString().split('T')[0]}T${eTime}:00Z`;
      }
      downtimeInserts.push({
        shift_id: shiftId,
        line_id: lineId,
        machine_id: evt.machine_id || null,
        equipment_code: evt.equipment_code?.trim() || null,
        downtime_category: evt.type,
        incident_category: evt.incident_category?.trim() || null,
        shutdown_type: evt.shutdown_type?.trim() || null,
        maintenance_type: evt.maintenance_type?.trim() || null,
        start_time: startIso,
        end_time: endIso,
        duration_minutes: evt.duration_minutes || Math.round((evt.duration_hours || 0) * 60),
        reason: evt.reason?.trim() || (evt.incident_category ? `[${evt.incident_category}]` : 'Dừng máy'),
        action_taken: evt.action_taken || null,
        status: 'resolved' as const,
      });
    }
  } else {
    if (breakdown.maintenance_hours > 0) {
      downtimeInserts.push({
        shift_id: shiftId,
        line_id: lineId,
        machine_id: null,
        equipment_code: null,
        downtime_category: 'planned_maintenance' as const,
        incident_category: null,
        shutdown_type: null,
        maintenance_type: 'Bảo trì kế hoạch',
        start_time: baseDate.toISOString(),
        end_time: new Date(baseDate.getTime() + breakdown.maintenance_hours * 3600000).toISOString(),
        duration_minutes: Math.round(breakdown.maintenance_hours * 60),
        reason: breakdown.maintenance_note?.trim() || 'Bảo trì bảo dưỡng theo kế hoạch',
        action_taken: 'Đã hoàn thành bảo trì',
        status: 'resolved' as const,
      });
    }

    if (breakdown.incident_hours > 0) {
      const incCat =
        breakdown.incident_category === 'mechanical'
          ? 'Sự cố cơ khí'
          : breakdown.incident_category === 'electrical_automation'
          ? 'Sự cố điện - Tự động hóa'
          : breakdown.incident_category?.trim() || 'Sự cố cơ khí';

      downtimeInserts.push({
        shift_id: shiftId,
        line_id: lineId,
        machine_id: null,
        equipment_code: null,
        downtime_category: 'breakdown_incident' as const,
        incident_category: incCat,
        shutdown_type: null,
        maintenance_type: null,
        start_time: baseDate.toISOString(),
        end_time: new Date(baseDate.getTime() + breakdown.incident_hours * 3600000).toISOString(),
        duration_minutes: Math.round(breakdown.incident_hours * 60),
        reason: breakdown.incident_reason || `[${incCat}] Sự cố dừng máy`,
        action_taken: breakdown.incident_action || null,
        status: 'resolved' as const,
      });
    }

    if (breakdown.planned_shutdown_hours > 0) {
      downtimeInserts.push({
        shift_id: shiftId,
        line_id: lineId,
        machine_id: null,
        equipment_code: null,
        downtime_category: 'scheduled_shutdown' as const,
        incident_category: null,
        shutdown_type: 'Nghỉ trong kế hoạch',
        maintenance_type: null,
        start_time: baseDate.toISOString(),
        end_time: new Date(baseDate.getTime() + breakdown.planned_shutdown_hours * 3600000).toISOString(),
        duration_minutes: Math.round(breakdown.planned_shutdown_hours * 60),
        reason: breakdown.planned_shutdown_reason?.trim() || 'Nghỉ theo kế hoạch',
        action_taken: null,
        status: 'resolved' as const,
      });
    }
  }

  if (downtimeInserts.length > 0) {
    await supabase.from('production_shift_downtime').insert(downtimeInserts);
  }
}

export async function updateProductionShift(
  id: string,
  values: Partial<ProductionShiftFormValues>,
): Promise<ProductionShift> {
  const prods = values.products_output;
  let finishedSum: number | undefined = undefined;
  let semiFinishedSum: number | undefined = undefined;
  let byproductSum: number | undefined = undefined;
  if (prods && Array.isArray(prods)) {
    finishedSum = prods.reduce((acc, p) => {
      return isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);
    semiFinishedSum = prods.reduce((acc, p) => {
      return isSemiFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);
    byproductSum = prods.reduce((acc, p) => {
      return isByProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);
  }

  const mats = values.materials_consumption;
  let rawFromMats: number | undefined = undefined;
  if (mats && Array.isArray(mats)) {
    rawFromMats = mats.reduce((acc, m) => {
      const name = (m.resource_name || '').toLowerCase();
      const isRaw =
        m.category === 'material' ||
        name.includes('cát nguyên khai') ||
        name.includes('quặng') ||
        name.includes('nguyên khai');
      return isRaw ? acc + (Number(m.actual_quantity) || 0) : acc;
    }, 0);
  }

  const rawInput =
    values.raw_material_input_tons !== undefined && Number(values.raw_material_input_tons) > 0
      ? Number(values.raw_material_input_tons)
      : rawFromMats;

  const productOutputTons =
    values.product_output_tons !== undefined && Number(values.product_output_tons) > 0
      ? Number(values.product_output_tons)
      : finishedSum;

  const byproductOutputTons =
    values.byproduct_output_tons !== undefined && Number(values.byproduct_output_tons) > 0
      ? Number(values.byproduct_output_tons)
      : byproductSum;

  let calculatedRecovery: number | undefined = undefined;
  if (rawInput !== undefined) {
    if (rawInput > 0 && productOutputTons !== undefined && productOutputTons > 0) {
      calculatedRecovery = Number(((productOutputTons / rawInput) * 100).toFixed(2));
    } else if (rawInput > 0 && semiFinishedSum !== undefined && semiFinishedSum > 0) {
      calculatedRecovery = Number(((semiFinishedSum / rawInput) * 100).toFixed(2));
    }
  }

  const stdHours = values.standard_shift_hours !== undefined ? Number(values.standard_shift_hours) : undefined;
  const downHours = values.total_downtime_hours !== undefined ? Number(values.total_downtime_hours) : undefined;
  let calculatedRunningHours: number | undefined = undefined;
  if (stdHours !== undefined || downHours !== undefined) {
    calculatedRunningHours = Math.max(0, Number(((stdHours ?? 8) - (downHours ?? 0)).toFixed(2)));
  }

  let calculatedCapacity: number | undefined = undefined;
  if (calculatedRunningHours !== undefined && rawInput !== undefined) {
    if (calculatedRunningHours > 0 && rawInput > 0) {
      calculatedCapacity = Number((rawInput / calculatedRunningHours).toFixed(2));
    }
  }

  // Loại bỏ các trường ảo không có trong bảng production_shifts của DB (như end_date, line_name, v.v.)
  const rawValues = { ...(values as Record<string, unknown>) };
  delete rawValues.end_date;
  delete rawValues.line_name;
  delete rawValues.line_code;
  delete rawValues.operator_name;

  const breakdown = values.downtime_breakdown
    ? { ...(values.downtime_breakdown as Record<string, unknown>) }
    : undefined;
  if (breakdown && values.operator_name) {
    breakdown.updated_by_name = values.operator_name;
  }

  const updatePayload: Database['public']['Tables']['production_shifts']['Update'] = {
    ...(rawValues as unknown as Database['public']['Tables']['production_shifts']['Update']),
    ...(rawInput !== undefined ? { raw_material_input_tons: rawInput } : {}),
    ...(productOutputTons !== undefined ? { product_output_tons: productOutputTons } : {}),
    ...(byproductOutputTons !== undefined ? { byproduct_output_tons: byproductOutputTons } : {}),
    ...(calculatedRecovery !== undefined ? { actual_recovery_rate_pct: calculatedRecovery } : {}),
    ...(calculatedRunningHours !== undefined ? { running_hours: calculatedRunningHours } : {}),
    ...(calculatedCapacity !== undefined ? { actual_capacity_tph: calculatedCapacity } : {}),
    ...(breakdown ? { downtime_breakdown: breakdown as unknown as Database['public']['Tables']['production_shifts']['Update']['downtime_breakdown'] } : {}),
    updated_at: new Date().toISOString(),
  };

  delete (updatePayload as Record<string, unknown>).end_date;
  delete (updatePayload as Record<string, unknown>).status;

  const { data, error } = await supabase
    .from('production_shifts')
    .update(updatePayload)
    .eq('id', id)
    .select(
      'id, shift_code, line_id, shift_date, shift_number, standard_shift_hours, total_downtime_hours, running_hours, raw_material_input_tons, product_output_tons, byproduct_output_tons, actual_capacity_tph, actual_recovery_rate_pct, actual_quality_rate_pct, operator_employee_id, notes, materials_consumption, products_output, downtime_breakdown, created_at, updated_at',
    )
    .single();

  if (error) throw error;

  // Re-sync downtime records if breakdown is updated
  if (breakdown && values.line_id && values.shift_date) {
    await syncShiftDowntimeRecords(id, values.line_id, values.shift_date, breakdown as unknown as ShiftDowntimeBreakdown);
  }

  return data as unknown as ProductionShift;
}



export async function deleteProductionShift(id: string): Promise<void> {
  // Clean up child tables to prevent foreign key restrict errors
  await supabase.from('production_shift_receipts').delete().eq('shift_id', id);
  await supabase.from('production_shift_downtime').delete().eq('shift_id', id);

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
      employees ( first_name, last_name )
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
    operator_name: row.employees
      ? [row.employees.last_name, row.employees.first_name].filter(Boolean).join(' ') || undefined
      : undefined,
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
export async function fetchProductionMetrics(
  params?: ProductionMetricsFilterParams,
): Promise<ProductionMetrics> {
  const now = new Date();
  const selectedYears: number[] =
    Array.isArray(params?.years)
      ? params.years.map(Number)
      : params?.year !== undefined
        ? (Number(params.year) === 0 ? [] : [Number(params.year)])
        : [now.getFullYear()];

  const selectedMonths: number[] =
    Array.isArray(params?.months)
      ? params.months.map(Number)
      : params?.month !== undefined
        ? (Number(params.month) === 0 ? [] : [Number(params.month)])
        : [];

  const lineId = params?.lineId;
  const isLineFiltered = Boolean(lineId && lineId !== 'all');

  // Active production lines count
  let linesCount = 0;
  if (isLineFiltered) {
    linesCount = 1;
  } else {
    const { count } = await supabase
      .from('production_lines')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    linesCount = count || 0;
  }

  // Monthly plans query
  let plansQuery = supabase
    .from('production_monthly_plans')
    .select(
      'id, line_id, year, month, planned_output_product_tons, planned_input_material_tons, planned_recovery_rate_pct, planned_operating_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours, planned_capacity_tph, target_quality_rate_pct, status',
    );

  if (selectedYears.length > 0) {
    plansQuery = plansQuery.in('year', selectedYears);
  }
  if (selectedMonths.length > 0) {
    plansQuery = plansQuery.in('month', selectedMonths);
  }
  if (lineId && lineId !== 'all') {
    plansQuery = plansQuery.eq('line_id', lineId);
  }

  const { data: plansData } = await plansQuery;

  const totalMonthlyPlans = plansData?.length || 0;
  const monthlyPlannedOutputTons = (plansData || []).reduce(
    (sum, p) => sum + Number(p.planned_output_product_tons || 0),
    0,
  );
  const monthlyPlannedInputTons = (plansData || []).reduce(
    (sum, p) => sum + Number(p.planned_input_material_tons || 0),
    0,
  );

  const plannedRecoveryRatePct =
    plansData && plansData.length > 0
      ? Number(
          (
            plansData.reduce((sum, p) => sum + Number(p.planned_recovery_rate_pct || 0), 0) /
            plansData.length
          ).toFixed(2),
        )
      : 84.6;

  const plannedOperatingHours = (plansData || []).reduce(
    (sum, p) => sum + Number(p.planned_operating_hours || 0),
    0,
  );

  const plannedDowntimeHours = (plansData || []).reduce(
    (sum, p) =>
      sum +
      Number(p.planned_breakdown_hours || 0) +
      Number(p.planned_maintenance_hours || 0) +
      Number(p.planned_shutdown_hours || 0),
    0,
  );

  const plannedCapacityTph =
    plansData && plansData.length > 0
      ? Number(
          (
            plansData.reduce((sum, p) => sum + Number(p.planned_capacity_tph || 0), 0) /
            plansData.length
          ).toFixed(2),
        )
      : 70.0;

  const targetQualityRatePct =
    plansData && plansData.length > 0
      ? Number(
          (
            plansData.reduce((sum, p) => sum + Number(p.target_quality_rate_pct || 0), 0) /
            plansData.length
          ).toFixed(2),
        )
      : 100.0;

  // Plan consumptions for the retrieved plans
  const planIds = (plansData || []).map((p) => p.id);
  const { data: planConsData } =
    planIds.length > 0
      ? await supabase
          .from('production_plan_consumptions')
          .select('id, plan_id, resource_name, resource_type, unit_of_measure, norm_rate, planned_total_consumption')
          .in('plan_id', planIds)
      : { data: [] };

  // Active production orders
  const { count: ordersCount } = await supabase
    .from('production_orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['scheduled', 'released', 'in_progress']);

  // Shifts data query
  let shiftsQuery = supabase
    .from('production_shifts')
    .select(
      'id, line_id, shift_date, product_output_tons, raw_material_input_tons, byproduct_output_tons, total_downtime_hours, running_hours, standard_shift_hours, actual_capacity_tph, actual_recovery_rate_pct, actual_quality_rate_pct, materials_consumption, products_output, downtime_breakdown',
    )
    .order('shift_date', { ascending: false });

  if (lineId && lineId !== 'all') {
    shiftsQuery = shiftsQuery.eq('line_id', lineId);
  }

  if (selectedYears.length > 0) {
    const minYear = Math.min(...selectedYears);
    const maxYear = Math.max(...selectedYears);
    shiftsQuery = shiftsQuery
      .gte('shift_date', `${minYear}-01-01`)
      .lte('shift_date', `${maxYear}-12-31`);
  }

  const { data: rawShiftsData } = await shiftsQuery;

  // Precise in-memory filter for selected months and years
  const shifts = (rawShiftsData || []).filter((s) => {
    if (!s.shift_date) return false;
    const parts = s.shift_date.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const matchYear = selectedYears.length === 0 || selectedYears.includes(y);
    const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(m);
    return matchYear && matchMonth;
  });
  const hasShiftData = shifts.length > 0;

  // 1. Thẻ sản lượng: chỉ tính thành phẩm (loại trừ phụ phẩm, bán thành phẩm MM/Magmin/VFS/FSAP)
  const actualMonthlyOutputTons = shifts.reduce((sum, s) => {
    if (Array.isArray(s.products_output) && s.products_output.length > 0) {
      const prodsList = s.products_output as Array<{
        product_sku?: string;
        product_name?: string;
        product_type?: string;
        quantity_tons?: number;
      }>;
      const finishedSum = prodsList.reduce((acc, p) => {
        return isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
      }, 0);
      return sum + finishedSum;
    }
    return sum + Number(s.product_output_tons || 0);
  }, 0);

  const actualRawMaterialInputTons = shifts.reduce((sum, s) => {
    const direct = Number(s.raw_material_input_tons || 0);
    if (direct > 0) return sum + direct;
    const mats = Array.isArray(s.materials_consumption)
      ? (s.materials_consumption as Array<{ resource_name?: string; actual_quantity?: number }>)
      : [];
    const m = mats.find((item) =>
      (item.resource_name || '').toLowerCase().includes('cát nguyên khai') ||
      (item.resource_name || '').toLowerCase().includes('quặng'),
    );
    return sum + (Number(m?.actual_quantity) || 0);
  }, 0);

  const totalDowntimeHours = shifts.reduce(
    (sum, s) => sum + Number(s.total_downtime_hours || 0),
    0,
  );
  const actualOperatingHours = shifts.reduce(
    (sum, s) =>
      sum +
      (s.running_hours !== null && s.running_hours !== undefined
        ? Number(s.running_hours)
        : Math.max(0, Number(s.standard_shift_hours || 8) - Number(s.total_downtime_hours || 0))),
    0,
  );

  // Helper tính thời gian sự cố từ downtime_breakdown
  const getShiftIncidentHours = (s: { downtime_breakdown?: unknown }): number => {
    const breakdown = s.downtime_breakdown;
    if (!breakdown || typeof breakdown !== 'object') return 0;
    const bd = breakdown as Record<string, unknown>;
    if (bd.incident_hours !== undefined && bd.incident_hours !== null) {
      return Number(bd.incident_hours) || 0;
    }
    if (Array.isArray(bd.events)) {
      return (
        bd.events as Array<{
          type?: string;
          duration_minutes?: number;
          duration_hours?: number;
        }>
      ).reduce((sum: number, ev) => {
        if (ev.type === 'breakdown_incident') {
          const mins = Number(ev.duration_minutes) || (Number(ev.duration_hours) || 0) * 60;
          return sum + mins / 60;
        }
        return sum;
      }, 0);
    }
    return 0;
  };

  const totalIncidentHours = shifts.reduce((sum, s) => sum + getShiftIncidentHours(s), 0);

  const avgCapacityTph =
    shifts.length > 0
      ? Number(
          (
            shifts.reduce((sum, s) => {
              const runHours =
                s.running_hours !== null && s.running_hours !== undefined
                  ? Number(s.running_hours)
                  : Math.max(0, Number(s.standard_shift_hours || 8) - Number(s.total_downtime_hours || 0));
              const rawTons = Number(s.raw_material_input_tons || 0);
              if (runHours > 0 && rawTons > 0) return sum + (rawTons / runHours);
              const cap = Number(s.actual_capacity_tph || 0);
              if (cap > 0) return sum + cap;
              return sum;
            }, 0) / shifts.length
          ).toFixed(2),
        )
      : 0;

  // 2. Thẻ tỉ lệ thu hồi: chỉ tính thành phẩm / nguyên liệu
  const avgRecoveryRatePct =
    actualRawMaterialInputTons > 0 && actualMonthlyOutputTons > 0
      ? Number(((actualMonthlyOutputTons / actualRawMaterialInputTons) * 100).toFixed(2))
      : 0;

  // Computed percentages
  const outputProgressPct =
    monthlyPlannedOutputTons > 0
      ? Number(((actualMonthlyOutputTons / monthlyPlannedOutputTons) * 100).toFixed(1))
      : 0;

  const recoveryVariancePct =
    avgRecoveryRatePct > 0
      ? Number((avgRecoveryRatePct - plannedRecoveryRatePct).toFixed(1))
      : 0;

  // 3. Chỉ số A trong OEE: thời gian vận hành / (thời gian vận hành + thời gian sự cố)
  const totalAvailabilityHours = actualOperatingHours + totalIncidentHours;
  const availabilityPct =
    totalAvailabilityHours > 0
      ? Number(((actualOperatingHours / totalAvailabilityHours) * 100).toFixed(1))
      : (actualOperatingHours > 0 ? 100 : 0);

  const availabilityScore = hasShiftData ? Math.min(100, Math.max(0, availabilityPct)) : 0;

  // 4. Chỉ số P trong OEE: (sản lượng thành phẩm thực tế/ thời gian vận hành thực tế)/(sản lượng vận hành kế hoạch/thời gian vận hành kế hoạch)
  const actualProductivityTph =
    actualOperatingHours > 0 && actualMonthlyOutputTons > 0
      ? actualMonthlyOutputTons / actualOperatingHours
      : 0;

  const plannedProductivityTph =
    plannedOperatingHours > 0 && monthlyPlannedOutputTons > 0
      ? monthlyPlannedOutputTons / plannedOperatingHours
      : (plannedCapacityTph > 0 ? plannedCapacityTph * (plannedRecoveryRatePct / 100) : 60.0);

  const performanceScore =
    hasShiftData && plannedProductivityTph > 0 && actualProductivityTph > 0
      ? Math.min(100, Number(((actualProductivityTph / plannedProductivityTph) * 100).toFixed(1)))
      : 0;

  const avgShiftQualityRatePct =
    shifts.length > 0
      ? Number(
          (
            shifts.reduce((sum, s) => {
              const q = (s as unknown as { actual_quality_rate_pct?: number }).actual_quality_rate_pct;
              return sum + (q !== null && q !== undefined ? Number(q) : 100);
            }, 0) / shifts.length
          ).toFixed(1),
        )
      : 100;

  const qualityScore =
    hasShiftData
      ? targetQualityRatePct > 0
        ? Math.min(100, Number(((avgShiftQualityRatePct / targetQualityRatePct) * 100).toFixed(1)))
        : Math.min(100, avgShiftQualityRatePct)
      : 0;

  const oeePct =
    hasShiftData && availabilityScore > 0 && performanceScore > 0 && qualityScore > 0
      ? Number(
          (((availabilityScore / 100) * (performanceScore / 100) * (qualityScore / 100)) * 100).toFixed(1),
        )
      : 0;

  // ----------------------------------------------------
  // Compute Consumption Norms Comparison (Kế hoạch vs Thực tế)
  // ----------------------------------------------------
  const actualMaterialsMap = new Map<
    string,
    { totalQty: number; unit: string; category: 'material' | 'fuel' | 'supply' }
  >();

  shifts.forEach((s) => {
    const mats = Array.isArray(s.materials_consumption)
      ? (s.materials_consumption as Array<{
          resource_name?: string;
          actual_quantity?: number;
          unit_of_measure?: string;
          category?: string;
        }>)
      : [];
    mats.forEach((m) => {
      const name = String(m.resource_name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      const existing = actualMaterialsMap.get(key) || {
        totalQty: 0,
        unit: m.unit_of_measure || '',
        category: (m.category as 'material' | 'fuel' | 'supply') || 'material',
      };
      existing.totalQty += Number(m.actual_quantity || 0);
      if (m.unit_of_measure) existing.unit = m.unit_of_measure;
      actualMaterialsMap.set(key, existing);
    });
  });

  const plannedRawNorm =
    monthlyPlannedOutputTons > 0 && monthlyPlannedInputTons > 0
      ? Number((monthlyPlannedInputTons / monthlyPlannedOutputTons).toFixed(3))
      : 1.202;

  const actualRawNorm =
    actualMonthlyOutputTons > 0 && actualRawMaterialInputTons > 0
      ? Number((actualRawMaterialInputTons / actualMonthlyOutputTons).toFixed(3))
      : 0;

  const benchmarkDefinitions = [
    {
      key: 'electricity',
      resourceName: 'Điện năng tiêu thụ',
      categoryGroup: 'fuel' as const,
      unit: 'kWh/tấn',
      matchKeys: ['điện', 'electric', 'kwh', 'power'],
      defaultPlannedNorm: 12.57,
      customActualNorm: undefined as number | undefined,
      customActualTotal: undefined as number | undefined,
      customPlannedTotal: undefined as number | undefined,
    },
    {
      key: 'diesel',
      resourceName: 'Dầu Diesel (DO)',
      categoryGroup: 'fuel' as const,
      unit: 'Lít/tấn',
      matchKeys: ['diesel', 'dầu', 'do', 'fuel'],
      defaultPlannedNorm: 0.26,
      customActualNorm: undefined as number | undefined,
      customActualTotal: undefined as number | undefined,
      customPlannedTotal: undefined as number | undefined,
    },
    {
      key: 'raw_material',
      resourceName: 'Cát nguyên khai',
      categoryGroup: 'material' as const,
      unit: 'Tấn/tấn',
      matchKeys: ['cát nguyên khai', 'quặng', 'nguyên liệu'],
      defaultPlannedNorm: plannedRawNorm,
      customActualNorm: actualRawNorm,
      customActualTotal: actualRawMaterialInputTons,
      customPlannedTotal: monthlyPlannedInputTons,
    },
    {
      key: 'gravel',
      resourceName: 'Đá cuội xây dựng',
      categoryGroup: 'supply' as const,
      unit: 'kg/tấn',
      matchKeys: ['đá cuội', 'đá cuội xây dựng', 'gravel', 'cuội'],
      defaultPlannedNorm: 5.97,
      customActualNorm: undefined as number | undefined,
      customActualTotal: undefined as number | undefined,
      customPlannedTotal: undefined as number | undefined,
    },
  ];

  const consumptionNorms: ConsumptionNormMetric[] = benchmarkDefinitions.map((bm) => {
    let plannedNorm = bm.defaultPlannedNorm;
    let plannedTotal = bm.customPlannedTotal ?? 0;

    const matchingPlanCons = (planConsData || []).filter((c) =>
      bm.matchKeys.some((k) => (c.resource_name || '').toLowerCase().includes(k)),
    );
    if (matchingPlanCons.length > 0) {
      plannedTotal = matchingPlanCons.reduce(
        (sum, c) => sum + Number(c.planned_total_consumption || 0),
        0,
      );
      if (monthlyPlannedOutputTons > 0 && plannedTotal > 0) {
        plannedNorm = Number((plannedTotal / monthlyPlannedOutputTons).toFixed(2));
      } else {
        const validRates = matchingPlanCons.map((c) => Number(c.norm_rate)).filter((r) => r > 0);
        if (validRates.length > 0) {
          plannedNorm = Number((validRates.reduce((a, b) => a + b, 0) / validRates.length).toFixed(2));
        }
      }
    }

    let actualTotal = bm.customActualTotal ?? 0;
    let actualNorm = bm.customActualNorm ?? 0;

    if (bm.customActualNorm === undefined) {
      for (const [key, data] of actualMaterialsMap.entries()) {
        if (bm.matchKeys.some((k) => key.includes(k))) {
          actualTotal += data.totalQty;
        }
      }
      actualNorm =
        actualMonthlyOutputTons > 0 && actualTotal > 0
          ? Number((actualTotal / actualMonthlyOutputTons).toFixed(2))
          : 0;
    }

    const hasData = actualNorm > 0;
    let variancePct = 0;
    let status: 'better' | 'worse' | 'neutral' | 'no_data' = 'no_data';

    if (hasData && plannedNorm > 0) {
      variancePct = Number((((actualNorm - plannedNorm) / plannedNorm) * 100).toFixed(1));
      if (variancePct <= -0.5) {
        status = 'better';
      } else if (variancePct >= 0.5) {
        status = 'worse';
      } else {
        status = 'neutral';
      }
    }

    return {
      key: bm.key,
      resourceName: bm.resourceName,
      categoryGroup: bm.categoryGroup,
      unit: bm.unit,
      plannedNorm,
      actualNorm,
      variancePct,
      plannedTotal,
      actualTotal,
      status,
    };
  });

  return {
    totalMonthlyPlans,
    activeLines: linesCount || 0,
    monthlyPlannedOutputTons,
    actualMonthlyOutputTons,
    outputProgressPct,
    plannedRecoveryRatePct,
    avgRecoveryRatePct,
    recoveryVariancePct,
    plannedOperatingHours: Number(plannedOperatingHours.toFixed(1)),
    actualOperatingHours: Number(actualOperatingHours.toFixed(1)),
    plannedDowntimeHours: Number(plannedDowntimeHours.toFixed(1)),
    actualDowntimeHours: Number(totalDowntimeHours.toFixed(1)),
    availabilityPct,
    plannedCapacityTph,
    plannedProductivityTph: Number(plannedProductivityTph.toFixed(2)),
    avgCapacityTph,
    targetQualityRatePct,
    availabilityScore,
    performanceScore,
    qualityScore,
    oeePct,
    totalDowntimeHours,
    activeOrdersCount: ordersCount || 0,
    consumptionNorms,
  };
}

// ==========================================
// 7. SHIFT PLAN CONTEXT (Auto-load registered products & materials)
// ==========================================
export async function fetchShiftPlanContext(
  lineId: string,
  shiftDate: string,
): Promise<{
  products: Array<{
    productId: string;
    productName: string;
    productSku: string;
    productType?: string;
    unitOfMeasure: string;
    monthlyPlannedQty: number;
  }>;
  materials: Array<{
    materialId: string;
    resourceName: string;
    categoryGroup: 'material' | 'fuel' | 'energy' | 'supply';
    unitOfMeasure: string;
    monthlyPlannedQty: number;
  }>;
}> {
  if (!lineId || !shiftDate) {
    return { products: [], materials: [] };
  }

  try {
    const year = parseInt(shiftDate.slice(0, 4), 10);
    const month = parseInt(shiftDate.slice(5, 7), 10);
    if (isNaN(year) || isNaN(month)) {
      return { products: [], materials: [] };
    }

    const annualPlan = await fetchAnnualProductionPlan(year, lineId);
    
    // Ưu tiên các sản phẩm có chỉ tiêu kế hoạch trong tháng được liệt kê trước
    const allProducts = (annualPlan.products || []).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productSku: p.productSku,
      productType: p.productType,
      unitOfMeasure: p.unitOfMeasure,
      monthlyPlannedQty: p.months[month] || 0,
    }));
    const plannedProducts = allProducts.filter((p) => p.monthlyPlannedQty > 0);
    const products = plannedProducts.length > 0
      ? [...plannedProducts, ...allProducts.filter((p) => p.monthlyPlannedQty <= 0)]
      : allProducts;

    // Ưu tiên các mục tiêu hao có kế hoạch trong tháng được liệt kê trước
    const allMaterials = (annualPlan.materials || []).map((m) => ({
      materialId: m.materialId,
      resourceName: m.materialName,
      categoryGroup: m.categoryGroup,
      unitOfMeasure: m.unitOfMeasure,
      monthlyPlannedQty: m.months[month] || 0,
    }));
    const plannedMaterials = allMaterials.filter((m) => m.monthlyPlannedQty > 0);
    const materials = plannedMaterials.length > 0
      ? [...plannedMaterials, ...allMaterials.filter((m) => m.monthlyPlannedQty <= 0)]
      : allMaterials;

    return { products, materials };
  } catch (err) {
    console.error('fetchShiftPlanContext error:', err);
    return { products: [], materials: [] };
  }
}

// ==========================================
// 8. BATCH PRODUCTION WAREHOUSE SYNC
// ==========================================
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function batchSyncShiftsToWarehouse(payload: BatchShiftWarehouseSyncPayload): Promise<{
  success: boolean;
  transactionsCreated: number;
  shiftsUpdated: number;
}> {
  const { selected_shift_ids, products, semi_finished_products = [], byproducts, materials, notes } = payload;
  if (!selected_shift_ids || selected_shift_ids.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một ca sản xuất để nghiệm thu và sinh phiếu kho.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  // Build lookup maps for materials and products to resolve valid UUIDs
  const [matsRes, prodsRes] = await Promise.all([
    supabase.from('materials').select('id, code, name'),
    supabase.from('products').select('id, sku, name'),
  ]);

  const matMap = new Map<string, string>();
  (matsRes.data || []).forEach((m) => {
    matMap.set(m.id.toLowerCase(), m.id);
    if (m.code) matMap.set(m.code.trim().toLowerCase(), m.id);
    if (m.name) matMap.set(m.name.trim().toLowerCase(), m.id);
  });

  const prodMap = new Map<string, string>();
  (prodsRes.data || []).forEach((p) => {
    prodMap.set(p.id.toLowerCase(), p.id);
    if (p.sku) prodMap.set(p.sku.trim().toLowerCase(), p.id);
    if (p.name) prodMap.set(p.name.trim().toLowerCase(), p.id);
  });

  const resolveItemId = (item: BatchShiftWarehouseSyncItem): string | null => {
    const rawId = item.item_id?.trim();
    if (rawId && UUID_REGEX.test(rawId)) return rawId;

    if (item.item_type === 'material') {
      const cleanName = (item.item_name || '').replace(/^(material|supply|fuel):/i, '').trim().toLowerCase();
      const cleanCode = (item.item_code || '').trim().toLowerCase();
      return matMap.get(cleanCode) || matMap.get(cleanName) || null;
    } else {
      const cleanCode = (item.item_code || '').trim().toLowerCase();
      const cleanName = (item.item_name || '').trim().toLowerCase();
      return prodMap.get(cleanCode) || prodMap.get(cleanName) || null;
    }
  };

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const randomSuffix = () => Math.random().toString(36).substring(2, 6).toUpperCase();

  const txInserts: Database['public']['Tables']['inventory_transactions']['Insert'][] = [];
  let txCounter = 1;

  // 1. Inbound Finished Products (production_receipt)
  for (const item of products) {
    if (!item.warehouse_id || item.total_quantity <= 0) continue;
    const resolvedId = resolveItemId(item);
    if (!resolvedId) continue;

    const txNum = `NK-SX-${dateStr}-${pad(txCounter++)}-${randomSuffix()}`;
    const shiftCodesStr = item.shift_codes?.length ? ` [${item.shift_codes.join(', ')}]` : '';
    const locStr = item.storage_location ? ` - Vị trí: ${item.storage_location}` : '';

    txInserts.push({
      transaction_number: txNum,
      warehouse_id: item.warehouse_id,
      item_type: 'product',
      item_id: resolvedId,
      transaction_type: 'production_receipt',
      quantity: Math.abs(item.total_quantity),
      unit_cost: 0,
      reference_doc_type: 'production_shift',
      reference_doc_id: item.shift_ids?.[0] || selected_shift_ids[0],
      notes: `[Nghiệm thu SX] Nhập thành phẩm: ${item.item_name} (${item.item_code})${locStr}${shiftCodesStr}${notes ? ` - ${notes}` : ''}`,
      created_by: userId,
    });
  }

  // 1b. Inbound Semi-Finished Products (production_receipt)
  for (const item of semi_finished_products) {
    if (!item.warehouse_id || item.total_quantity <= 0) continue;
    const resolvedId = resolveItemId(item);
    if (!resolvedId) continue;

    const txNum = `NK-BTP-${dateStr}-${pad(txCounter++)}-${randomSuffix()}`;
    const shiftCodesStr = item.shift_codes?.length ? ` [${item.shift_codes.join(', ')}]` : '';
    const locStr = item.storage_location ? ` - Vị trí: ${item.storage_location}` : '';

    txInserts.push({
      transaction_number: txNum,
      warehouse_id: item.warehouse_id,
      item_type: 'product',
      item_id: resolvedId,
      transaction_type: 'production_receipt',
      quantity: Math.abs(item.total_quantity),
      unit_cost: 0,
      reference_doc_type: 'production_shift',
      reference_doc_id: item.shift_ids?.[0] || selected_shift_ids[0],
      notes: `[Nghiệm thu SX] Nhập bán thành phẩm: ${item.item_name} (${item.item_code})${locStr}${shiftCodesStr}${notes ? ` - ${notes}` : ''}`,
      created_by: userId,
    });
  }

  // 2. Inbound Byproducts (production_receipt)
  for (const item of byproducts) {
    if (!item.warehouse_id || item.total_quantity <= 0) continue;
    const resolvedId = resolveItemId(item);
    if (!resolvedId) continue;

    const txNum = `NK-PP-${dateStr}-${pad(txCounter++)}-${randomSuffix()}`;
    const shiftCodesStr = item.shift_codes?.length ? ` [${item.shift_codes.join(', ')}]` : '';
    const locStr = item.storage_location ? ` - Vị trí: ${item.storage_location}` : '';

    txInserts.push({
      transaction_number: txNum,
      warehouse_id: item.warehouse_id,
      item_type: 'byproduct',
      item_id: resolvedId,
      transaction_type: 'production_receipt',
      quantity: Math.abs(item.total_quantity),
      unit_cost: 0,
      reference_doc_type: 'production_shift',
      reference_doc_id: item.shift_ids?.[0] || selected_shift_ids[0],
      notes: `[Nghiệm thu SX] Nhập phụ phẩm: ${item.item_name} (${item.item_code})${locStr}${shiftCodesStr}${notes ? ` - ${notes}` : ''}`,
      created_by: userId,
    });
  }

  // 3. Outbound Raw Materials & Fuels (production_issue)
  for (const item of materials) {
    if (!item.warehouse_id || item.total_quantity <= 0) continue;
    const resolvedId = resolveItemId(item);
    // Bỏ qua các mục không có trong kho lưu trữ (như điện lực)
    if (!resolvedId) continue;

    const txNum = `XK-SX-${dateStr}-${pad(txCounter++)}-${randomSuffix()}`;
    const shiftCodesStr = item.shift_codes?.length ? ` [${item.shift_codes.join(', ')}]` : '';

    const isProductItem = (prodsRes.data || []).some((p) => p.id === resolvedId);
    const resolvedItemType: 'product' | 'material' = isProductItem ? 'product' : 'material';

    txInserts.push({
      transaction_number: txNum,
      warehouse_id: item.warehouse_id,
      item_type: resolvedItemType,
      item_id: resolvedId,
      transaction_type: 'production_issue',
      quantity: -Math.abs(item.total_quantity),
      unit_cost: 0,
      reference_doc_type: 'production_shift',
      reference_doc_id: item.shift_ids?.[0] || selected_shift_ids[0],
      notes: `[Nghiệm thu SX] Xuất vật tư tiêu hao: ${item.item_name} (${item.item_code})${shiftCodesStr}${notes ? ` - ${notes}` : ''}`,
      created_by: userId,
    });
  }

  // Execute transaction inserts
  if (txInserts.length > 0) {
    const { error: insertErr } = await supabase.from('inventory_transactions').insert(txInserts);
    if (insertErr) {
      throw new Error(`Lỗi sinh phiếu kho: ${insertErr.message}`);
    }
  }

  // Update production_shifts marking as synced
  const { error: updateErr } = await supabase
    .from('production_shifts')
    .update({
      warehouse_synced: true,
      warehouse_synced_at: new Date().toISOString(),
    })
    .in('id', selected_shift_ids);

  if (updateErr) {
    throw new Error(`Lỗi cập nhật trạng thái ca: ${updateErr.message}`);
  }

  return {
    success: true,
    transactionsCreated: txInserts.length,
    shiftsUpdated: selected_shift_ids.length,
  };
}

// ==============================================================================
// 12. DOWNTIME INCIDENT & PARETO ANALYTICS API
// ==============================================================================

export async function fetchDowntimeIncidents(
  filters: IncidentAnalyticsFilters = {},
): Promise<DowntimeIncidentRecord[]> {
  let query = supabase
    .from('production_shift_downtime')
    .select(`
      id,
      shift_id,
      line_id,
      machine_id,
      equipment_code,
      downtime_category,
      incident_category,
      shutdown_type,
      maintenance_type,
      start_time,
      end_time,
      duration_minutes,
      reason,
      action_taken,
      status,
      created_at,
      production_shifts:shift_id (
        shift_code,
        shift_date,
        shift_number,
        downtime_breakdown
      ),
      production_lines:line_id (
        id,
        code,
        name
      ),
      machines:machine_id (
        id,
        machine_code,
        name
      )
    `)
    .order('start_time', { ascending: false });

  if (filters.lineId && filters.lineId !== 'all') {
    query = query.eq('line_id', filters.lineId);
  }
  if (filters.downtimeType && filters.downtimeType !== 'all') {
    query = query.eq('downtime_category', filters.downtimeType);
  }
  if (filters.fromDate) {
    query = query.gte('start_time', `${filters.fromDate}T00:00:00Z`);
  }
  if (filters.toDate) {
    query = query.lte('start_time', `${filters.toDate}T23:59:59Z`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch downtime incidents:', error);
    throw new Error(error.message);
  }

  const records: DowntimeIncidentRecord[] = [];

  for (const row of (data || []) as unknown as Array<{
    id: string;
    shift_id: string;
    line_id: string;
    machine_id: string | null;
    equipment_code: string | null;
    downtime_category: string;
    incident_category: string | null;
    shutdown_type: string | null;
    maintenance_type: string | null;
    start_time: string;
    end_time: string;
    duration_minutes: number | string;
    reason: string;
    action_taken: string | null;
    status: string;
    production_shifts?: {
      shift_code?: string;
      shift_date?: string;
      shift_number?: number;
      downtime_breakdown?: {
        updated_by_name?: string;
        operator_name?: string;
      };
    } | null;
    production_lines?: {
      id?: string;
      code?: string;
      name?: string;
    } | null;
    machines?: {
      id?: string;
      machine_code?: string;
      name?: string;
    } | null;
  }>) {
    const rawReason = row.reason || '';
    let category = row.incident_category;
    let eqCode = row.equipment_code || row.machines?.machine_code || null;
    const eqName = row.machines?.name || null;

    // Fallback parsing from reason tag e.g. "[Sự cố Cơ khí] Kẹt máy nghiền (M13)"
    if (!category && rawReason.startsWith('[')) {
      const match = rawReason.match(/^\[(.*?)\]/);
      if (match && match[1]) {
        category = match[1];
      }
    }

    // Standardize legacy / English category keys to friendly Vietnamese labels
    if (category) {
      const lower = category.toLowerCase().trim();
      if (lower === 'mechanical' || lower === 'sự cố cơ khí') category = 'Sự cố cơ khí';
      else if (lower === 'electrical_automation' || lower.includes('điện')) category = 'Sự cố điện - Tự động hóa';
      else if (lower === 'quality' || lower.includes('chất lượng')) category = 'Sự cố chất lượng';
      else if (lower === 'feeding' || lower.includes('cấp liệu') || lower.includes('tắc nghẽn')) category = 'Sự cố cấp liệu / Tắc nghẽn';
      else if (lower === 'process' || lower.includes('công nghệ')) category = 'Sự cố công nghệ';
      else if (lower === 'safety' || lower.includes('an toàn')) category = 'Sự cố an toàn / Môi trường';
      else if (lower === 'other' || lower === 'khác') category = 'Sự cố khác';
    } else if (row.downtime_category === 'breakdown_incident') {
      category = 'Sự cố cơ khí';
    }

    if (!eqCode) {
      const eqMatch = rawReason.match(/\b([A-Z]{1,4}-\d{1,3}|[A-Z]\d{2,3})\b/);
      if (eqMatch && eqMatch[1]) {
        eqCode = eqMatch[1];
      }
    }

    const durMinutes = Number(row.duration_minutes) || 0;
    const durHours = Number((durMinutes / 60).toFixed(2));

    const shiftDate: string =
      row.production_shifts?.shift_date ||
      (row.start_time ? (row.start_time.split('T')[0] ?? '') : '') ||
      '';

    const shiftNumber = row.production_shifts?.shift_number || 1;
    const shiftCode =
      row.production_shifts?.shift_code ||
      `CA${shiftNumber}-${shiftDate.replace(/-/g, '')}`;

    const rec: DowntimeIncidentRecord = {
      id: row.id,
      shift_id: row.shift_id,
      shift_code: shiftCode,
      shift_date: shiftDate,
      shift_number: shiftNumber,
      line_id: row.line_id,
      line_code: row.production_lines?.code || 'LINE',
      line_name: row.production_lines?.name || 'Dây chuyền',
      type: row.downtime_category as DowntimeIncidentRecord['type'],
      machine_id: row.machine_id,
      equipment_code: eqCode,
      equipment_name: eqName,
      incident_category: category,
      shutdown_type:
        row.shutdown_type ||
        (row.downtime_category === 'scheduled_shutdown' ? 'Nghỉ trong kế hoạch' : null),
      maintenance_type:
        row.maintenance_type ||
        (row.downtime_category === 'planned_maintenance' ? 'Bảo trì kế hoạch' : null),
      reason: rawReason.replace(/^\[.*?\]\s*/, ''),
      action_taken: row.action_taken,
      duration_minutes: durMinutes,
      duration_hours: durHours,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      operator_name:
        row.production_shifts?.downtime_breakdown?.operator_name ||
        row.production_shifts?.downtime_breakdown?.updated_by_name,
    };

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const match =
        rec.reason.toLowerCase().includes(q) ||
        (rec.equipment_code && rec.equipment_code.toLowerCase().includes(q)) ||
        (rec.incident_category && rec.incident_category.toLowerCase().includes(q)) ||
        rec.line_name?.toLowerCase().includes(q) ||
        rec.shift_code?.toLowerCase().includes(q);
      if (!match) continue;
    }

    records.push(rec);
  }

  return records;
}

export function calculatePareto(
  records: DowntimeIncidentRecord[],
  dimension: 'incident_category' | 'equipment_code' = 'incident_category',
): {
  frequencyPareto: ParetoItem[];
  durationPareto: ParetoItem[];
  totalIncidents: number;
  totalHours: number;
} {
  const totalIncidents = records.length;
  const totalHours = Number(
    records.reduce((sum, r) => sum + r.duration_hours, 0).toFixed(2),
  );

  if (totalIncidents === 0) {
    return {
      frequencyPareto: [],
      durationPareto: [],
      totalIncidents: 0,
      totalHours: 0,
    };
  }

  // Group metrics by dimension
  const groups: Record<
    string,
    { key: string; label: string; count: number; duration_hours: number }
  > = {};

  for (const r of records) {
    let key = '';
    let label = '';

    if (dimension === 'incident_category') {
      if (r.type === 'breakdown_incident') {
        key = r.incident_category?.trim() || 'Sự cố khác';
        label = key;
      } else if (r.type === 'planned_maintenance') {
        key = r.maintenance_type?.trim() || 'Bảo trì kế hoạch';
        label = `[Bảo trì] ${key}`;
      } else if (r.type === 'scheduled_shutdown') {
        key = r.shutdown_type?.trim() || 'Nghỉ trong kế hoạch';
        label = `[Nghỉ KH] ${key}`;
      } else {
        key = 'Khác';
        label = 'Khác';
      }
    } else {
      // equipment_code
      if (r.equipment_code && r.equipment_code.trim()) {
        key = r.equipment_code.trim().toUpperCase();
        label = r.equipment_name ? `${key} - ${r.equipment_name}` : key;
      } else {
        key = 'TOAN_LINE';
        label = 'Toàn dây chuyền / Chưa gán thiết bị';
      }
    }

    const existing = groups[key] ?? { key, label, count: 0, duration_hours: 0 };
    existing.count += 1;
    existing.duration_hours += r.duration_hours;
    groups[key] = existing;
  }

  const groupList = Object.values(groups);

  // 1. Frequency Pareto (sorted by count descending)
  const sortedByCount = [...groupList].sort((a, b) => b.count - a.count);
  let runningCountSum = 0;
  const frequencyPareto: ParetoItem[] = sortedByCount.map((item, idx) => {
    runningCountSum += item.count;
    const percentage = Number(((item.count / totalIncidents) * 100).toFixed(1));
    const cumulative_percentage = Number(
      Math.min(100, (runningCountSum / totalIncidents) * 100).toFixed(1),
    );
    // Vital few: within 80% or first item crossing 80%
    const is_in_vital_few =
      cumulative_percentage <= 80 ||
      (idx > 0 && ((runningCountSum - item.count) / totalIncidents) * 100 < 80) ||
      idx === 0;

    return {
      key: item.key,
      label: item.label,
      count: item.count,
      duration_hours: Number(item.duration_hours.toFixed(2)),
      percentage,
      cumulative_percentage,
      is_in_vital_few,
    };
  });

  // 2. Duration Pareto (sorted by duration_hours descending)
  const sortedByDuration = [...groupList].sort(
    (a, b) => b.duration_hours - a.duration_hours,
  );
  let runningHoursSum = 0;
  const durationPareto: ParetoItem[] = sortedByDuration.map((item, idx) => {
    runningHoursSum += item.duration_hours;
    const percentage =
      totalHours > 0
        ? Number(((item.duration_hours / totalHours) * 100).toFixed(1))
        : 0;
    const cumulative_percentage =
      totalHours > 0
        ? Number(Math.min(100, (runningHoursSum / totalHours) * 100).toFixed(1))
        : 100;

    const is_in_vital_few =
      cumulative_percentage <= 80 ||
      (idx > 0 && totalHours > 0 && ((runningHoursSum - item.duration_hours) / totalHours) * 100 < 80) ||
      idx === 0;

    return {
      key: item.key,
      label: item.label,
      count: item.count,
      duration_hours: Number(item.duration_hours.toFixed(2)),
      percentage,
      cumulative_percentage,
      is_in_vital_few,
    };
  });

  return {
    frequencyPareto,
    durationPareto,
    totalIncidents,
    totalHours,
  };
}

export function generateIncidentAIInsights(
  frequencyPareto: ParetoItem[],
  durationPareto: ParetoItem[],
  totalIncidents: number,
  totalHours: number,
): IncidentAIInsight {
  const topFreq = frequencyPareto[0];
  const topDur = durationPareto[0];

  if (totalIncidents === 0 || !topFreq || !topDur) {
    return {
      vitalFewSummary: 'Chưa có đủ dữ liệu sự cố trong khoảng thời gian đã chọn để phân tích theo quy luật 80/20.',
      frequencyVsDurationComment: 'Hệ thống cần ít nhất 1 ca có phát sinh dừng máy để trích xuất quy luật phân bổ.',
      topBottleneckEquipment: 'Không xác định được thiết bị điểm nghẽn.',
      recommendations: [],
    };
  }

  // Vital few for frequency & duration
  const vitalFreq = frequencyPareto.filter((p) => p.is_in_vital_few);
  const vitalDur = durationPareto.filter((p) => p.is_in_vital_few);

  const topFreqLabels = vitalFreq.slice(0, 3).map((p) => p.label).join(', ') || topFreq.label;
  const topDurLabels = vitalDur.slice(0, 3).map((p) => p.label).join(', ') || topDur.label;

  const vitalFewSummary = `Theo quy luật Pareto 80/20: Có ${vitalDur.length || 1}/${durationPareto.length} nhóm nguyên nhân (${topDurLabels}) đang chiếm hơn 80% tổng thời gian dừng chuyền (${totalHours}h). Về tần suất lặp lại, các nguyên nhân chiếm nhiều nhất gồm (${topFreqLabels}). Tập trung giải quyết dứt điểm các nguyên nhân này sẽ phục hồi phần lớn công suất vận hành.`;

  // Compare frequency vs duration
  let frequencyVsDurationComment = '';

  if (topFreq.key === topDur.key) {
    frequencyVsDurationComment = `Nguyên nhân "${topFreq.label}" là điểm nóng nhất: đứng đầu cả về số lần dừng (${topFreq.count} lần, ${topFreq.percentage}%) lẫn thời gian dừng (${topFreq.duration_hours}h, ${topDur.percentage}%). Cần thành lập chuyên đề cải tiến ngay.`;
  } else {
    frequencyVsDurationComment = `Có sự chênh lệch đáng chú ý: "${topFreq.label}" xảy ra thường xuyên nhất (${topFreq.count} lần), nhưng "${topDur.label}" mới là nguyên nhân gây tê liệt thời gian dài nhất (${topDur.duration_hours}h). Cần chiến lược xử lý song song: chống lặp lại cho nhóm tần suất và chuẩn bị sẵn phương án xử lý nhanh cho nhóm thời lượng dài.`;
  }

  const topBottleneckEquipment = topDur.label;

  const recommendations: IncidentAIInsight['recommendations'] = [];

  // Urgent recommendation
  recommendations.push({
    priority: 'urgent',
    title: `Xử lý triệt để nguyên nhân tốn thời gian nhất: ${topDur.label}`,
    description: `Chiếm ${topDur.percentage}% tổng thời gian dừng chuyền. Yêu cầu bộ phận Cơ điện và Quản đốc kiểm tra hồ sơ sự cố, rà soát phụ tùng thay thế và lập quy trình ứng cứu sự cố không quá 30 phút.`,
    affectedKey: topDur.key,
  });

  // Frequency recommendation
  if (topFreq.key !== topDur.key) {
    recommendations.push({
      priority: 'medium',
      title: `Giảm thiểu sự cố lặp lại tần suất cao: ${topFreq.label}`,
      description: `Xuất hiện ${topFreq.count} lần trong kỳ. Cần rà soát nhật ký vận hành ca, đào tạo lại công nhân vận hành về kiểm soát liệu cấp/thao tác máy và tăng cường bôi trơn, siết ốc định kỳ ca.`,
      affectedKey: topFreq.key,
    });
  }

  // Preventive recommendation
  recommendations.push({
    priority: 'preventive',
    title: 'Chuyển đổi bảo trì phản ứng sang bảo trì ngăn ngừa (TPM)',
    description: 'Tận dụng các khoảng thời gian dừng máy do đầy kho hoặc chuyển ca để thực hiện bảo dưỡng kỹ thuật 15-30 phút, hạn chế tối đa dừng đột xuất giữa ca sản xuất.',
  });

  return {
    vitalFewSummary,
    frequencyVsDurationComment,
    topBottleneckEquipment,
    recommendations,
  };
}

