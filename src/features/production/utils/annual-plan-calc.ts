// Production Annual Plan Calculation Utilities and Formulas

import type {
  AnnualPlanTimeMonth,
  AnnualPlanMonthKPI,
  AnnualPlanProductRow,
  AnnualPlanMaterialRow,
  MaterialCategoryGroup,
} from '../types';
import { normalizeProductType } from '../types';

/**
 * Returns the number of days in a given month and year (accounts for leap years).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns total calendar hours for a given month (days * 24).
 */
export function getCalendarHours(year: number, month: number): number {
  return getDaysInMonth(year, month) * 24;
}

/**
 * Generates initial time plan for 12 months with default calendar hours.
 */
export function createDefaultTimePlan(year: number): Record<number, AnnualPlanTimeMonth> {
  const plan: Record<number, AnnualPlanTimeMonth> = {};
  for (let m = 1; m <= 12; m++) {
    const calHours = getCalendarHours(year, m);
    plan[m] = {
      month: m,
      calendarHours: calHours,
      maintenanceHours: 0,
      incidentHours: 0,
      plannedShutdownHours: 0,
      operatingHours: calHours,
    };
  }
  return plan;
}

/**
 * Computes operating hours given calendar hours and downtime categories.
 * Giờ vận hành = Tổng giờ trong tháng - (giờ bảo trì + giờ sự cố + giờ nghỉ trong kế hoạch)
 */
export function calculateOperatingHours(
  calendarHours: number,
  maintenanceHours: number,
  incidentHours: number,
  plannedShutdownHours: number,
): number {
  const totalDowntime = (maintenanceHours || 0) + (incidentHours || 0) + (plannedShutdownHours || 0);
  return Math.max(0, (calendarHours || 0) - totalDowntime);
}

/**
 * Calculates sum of product outputs for a specific month.
 */
export function sumMonthProducts(products: AnnualPlanProductRow[], month: number): number {
  return products.reduce((acc, p) => acc + (Number(p.months[month]) || 0), 0);
}

/**
 * Calculates sum of product outputs for a specific month filtered by classification:
 * 'finished_good' (thành phẩm), 'semi_finished' (bán thành phẩm), 'by_product' (phụ phẩm)
 */
export function sumMonthProductsByType(
  products: AnnualPlanProductRow[],
  month: number,
  classification: 'finished_good' | 'semi_finished' | 'by_product',
): number {
  return products
    .filter((p) => normalizeProductType(p.productType) === classification)
    .reduce((acc, p) => acc + (Number(p.months[month]) || 0), 0);
}

/**
 * Calculates sum of product outputs for the full year filtered by classification.
 */
export function sumAnnualProductsByType(
  products: AnnualPlanProductRow[],
  classification: 'finished_good' | 'semi_finished' | 'by_product',
): number {
  return products
    .filter((p) => normalizeProductType(p.productType) === classification)
    .reduce((acc, p) => {
      const rowSum = Object.values(p.months).reduce((s, v) => s + (Number(v) || 0), 0);
      return acc + rowSum;
    }, 0);
}

/**
 * Calculates sum of materials for a specific month filtered by category group.
 */
export function sumMonthMaterials(
  materials: AnnualPlanMaterialRow[],
  month: number,
  group?: 'material' | 'fuel' | 'supply',
): number {
  return materials
    .filter((m) => (group ? m.categoryGroup === group : true))
    .reduce((acc, m) => acc + (Number(m.months[month]) || 0), 0);
}

/**
 * Computes the KPI indicators for a single month:
 * 1. Công suất: nguyên liệu / giờ vận hành (tấn/h)
 * 2. Năng suất: THÀNH PHẨM / giờ vận hành (tấn/h) - chỉ chia cho thành phẩm (bỏ bán TP & phụ phẩm)
 * 3. Tỷ lệ thu hồi thành phẩm: THÀNH PHẨM / nguyên liệu * 100%
 * 4. Tỷ lệ thu hồi phụ phẩm: PHỤ PHẨM / nguyên liệu * 100%
 * 5. Định mức tiêu hao điện: tiêu hao điện (kWh) / THÀNH PHẨM (kWh/tấn TP)
 * 6. % giờ cơ cấu đối với tổng giờ tháng:
 *    - % giờ bảo trì, % giờ nghỉ trong kế hoạch, % giờ vận hành, % giờ sự cố
 * 7. Định mức KT-KT: chỉ chia cho THÀNH PHẨM (không chia cho phụ phẩm, bán thành phẩm)
 */
export function computeMonthKPI(params: {
  month: number;
  calendarHours: number;
  maintenanceHours: number;
  incidentHours: number;
  plannedShutdownHours: number;
  operatingHours: number;
  rawMaterialTons: number; // Tổng nguyên liệu (tấn)
  fuelConsumption: number; // Tổng nhiên liệu
  supplyConsumption: number; // Tổng vật tư
  totalProductTons?: number; // Tổng sản phẩm chung (tấn)
  finishedProductTons?: number; // Tổng thành phẩm (tấn) - chỉ dùng thành phẩm, không gộp bán thành phẩm / phụ phẩm
  byproductTons?: number; // Tổng phụ phẩm (tấn)
  electricityKwh?: number; // Tổng điện tiêu thụ (kWh)
}): AnnualPlanMonthKPI {
  const {
    month,
    calendarHours,
    maintenanceHours,
    incidentHours,
    plannedShutdownHours,
    operatingHours,
    rawMaterialTons,
    fuelConsumption,
    supplyConsumption,
    totalProductTons = 0,
    finishedProductTons,
    byproductTons = 0,
    electricityKwh = 0,
  } = params;

  // Sử dụng thành phẩm nếu có; nếu không có hoặc chưa phân loại thì fallback về totalProductTons
  const targetFinishedTons =
    finishedProductTons !== undefined ? finishedProductTons : totalProductTons;

  // 1. Công suất: nguyên liệu / giờ vận hành
  const capacityTph =
    operatingHours > 0 ? rawMaterialTons / operatingHours : 0;

  // 2. Năng suất: THÀNH PHẨM / giờ vận hành (chỉ tính thành phẩm)
  const productivityTph =
    operatingHours > 0 ? targetFinishedTons / operatingHours : 0;

  // 3. Tỷ lệ thu hồi thành phẩm %: (THÀNH PHẨM / nguyên liệu) * 100%
  const recoveryPct =
    rawMaterialTons > 0
      ? (targetFinishedTons / rawMaterialTons) * 100
      : 0;

  // 4. Tỷ lệ thu hồi phụ phẩm %: (PHỤ PHẨM / nguyên liệu) * 100%
  const byproductRecoveryPct =
    rawMaterialTons > 0
      ? (byproductTons / rawMaterialTons) * 100
      : 0;

  // 5. Định mức tiêu hao điện: tiêu hao điện (kWh) / THÀNH PHẨM
  const effectiveProductTons = targetFinishedTons;
  const electricityNorm =
    effectiveProductTons > 0 ? electricityKwh / effectiveProductTons : 0;

  // 6. % giờ đối với tổng giờ tháng
  const pctOperatingHours =
    calendarHours > 0 ? (operatingHours / calendarHours) * 100 : 0;
  const pctMaintenanceHours =
    calendarHours > 0 ? (maintenanceHours / calendarHours) * 100 : 0;
  const pctIncidentHours =
    calendarHours > 0 ? (incidentHours / calendarHours) * 100 : 0;
  const pctShutdownHours =
    calendarHours > 0 ? (plannedShutdownHours / calendarHours) * 100 : 0;

  // 7. Định mức KT-KT: chỉ chia cho THÀNH PHẨM
  const rawMaterialNorm =
    effectiveProductTons > 0 ? rawMaterialTons / effectiveProductTons : 0;
  const fuelNorm =
    effectiveProductTons > 0 ? fuelConsumption / effectiveProductTons : 0;
  const supplyNorm =
    effectiveProductTons > 0 ? supplyConsumption / effectiveProductTons : 0;

  return {
    month,
    capacityTph,
    productivityTph,
    recoveryPct,
    byproductRecoveryPct,
    electricityNorm,
    pctOperatingHours,
    pctMaintenanceHours,
    pctIncidentHours,
    pctShutdownHours,
    rawMaterialNorm,
    fuelNorm,
    supplyNorm,
  };
}

/**
 * Computes annual totals across 12 months.
 */
export function computeAnnualSummary(params: {
  products: AnnualPlanProductRow[];
  materials: AnnualPlanMaterialRow[];
  timePlan: Record<number, AnnualPlanTimeMonth>;
  targetQualityPct: Record<number, number>;
}) {
  const { products, materials, timePlan, targetQualityPct } = params;

  let totalCalendarHours = 0;
  let totalMaintenanceHours = 0;
  let totalIncidentHours = 0;
  let totalShutdownHours = 0;
  let totalOperatingHours = 0;

  for (let m = 1; m <= 12; m++) {
    const t = timePlan[m] || {
      calendarHours: 720,
      maintenanceHours: 0,
      incidentHours: 0,
      plannedShutdownHours: 0,
      operatingHours: 720,
    };
    totalCalendarHours += Number(t.calendarHours) || 0;
    totalMaintenanceHours += Number(t.maintenanceHours) || 0;
    totalIncidentHours += Number(t.incidentHours) || 0;
    totalShutdownHours += Number(t.plannedShutdownHours) || 0;
    totalOperatingHours += Number(t.operatingHours) || 0;
  }

  // Annual products total by classification
  const annualFinishedProductTons = sumAnnualProductsByType(products, 'finished_good');
  const annualSemiFinishedProductTons = sumAnnualProductsByType(products, 'semi_finished');
  const annualByproductTons = sumAnnualProductsByType(products, 'by_product');

  // Total of all products
  const annualTotalProductTons = products.reduce((acc, prod) => {
    const rowSum = Object.values(prod.months).reduce((s, v) => s + (Number(v) || 0), 0);
    return acc + rowSum;
  }, 0);

  // Annual raw materials total
  const annualRawMaterialTons = materials
    .filter((m) => m.categoryGroup === 'material')
    .reduce((acc, mat) => {
      const rowSum = Object.values(mat.months).reduce((s, v) => s + (Number(v) || 0), 0);
      return acc + rowSum;
    }, 0);

  // Annual fuel total
  const annualFuelConsumption = materials
    .filter((m) => m.categoryGroup === 'fuel')
    .reduce((acc, mat) => {
      const rowSum = Object.values(mat.months).reduce((s, v) => s + (Number(v) || 0), 0);
      return acc + rowSum;
    }, 0);

  // Annual supply total
  const annualSupplyConsumption = materials
    .filter((m) => m.categoryGroup === 'supply')
    .reduce((acc, mat) => {
      const rowSum = Object.values(mat.months).reduce((s, v) => s + (Number(v) || 0), 0);
      return acc + rowSum;
    }, 0);

  // Annual electricity consumption (kWh)
  const elecMaterial = materials.find(
    (m) => m.materialCode === 'ELEC-POWER' || m.materialName.toLowerCase().includes('điện'),
  );
  const annualElectricityKwh = elecMaterial
    ? Object.values(elecMaterial.months).reduce((s, v) => s + (Number(v) || 0), 0)
    : 0;

  // Average quality rate %
  let totalQualityPctSum = 0;
  let qualityMonthsCount = 0;
  for (let m = 1; m <= 12; m++) {
    const q = Number(targetQualityPct[m]);
    if (!isNaN(q) && q > 0) {
      totalQualityPctSum += q;
      qualityMonthsCount++;
    }
  }
  const avgQualityPct = qualityMonthsCount > 0 ? totalQualityPctSum / qualityMonthsCount : 0;

  // Annual KPIs calculated with annualFinishedProductTons (chỉ tính thành phẩm)
  const annualKPI = computeMonthKPI({
    month: 0,
    calendarHours: totalCalendarHours,
    maintenanceHours: totalMaintenanceHours,
    incidentHours: totalIncidentHours,
    plannedShutdownHours: totalShutdownHours,
    operatingHours: totalOperatingHours,
    rawMaterialTons: annualRawMaterialTons,
    fuelConsumption: annualFuelConsumption,
    supplyConsumption: annualSupplyConsumption,
    totalProductTons: annualTotalProductTons,
    finishedProductTons: annualFinishedProductTons,
    byproductTons: annualByproductTons,
    electricityKwh: annualElectricityKwh,
  });

  return {
    totalCalendarHours,
    totalMaintenanceHours,
    totalIncidentHours,
    totalShutdownHours,
    totalOperatingHours,
    annualTotalProductTons,
    annualFinishedProductTons,
    annualSemiFinishedProductTons,
    annualByproductTons,
    annualRawMaterialTons,
    annualFuelConsumption,
    annualSupplyConsumption,
    annualElectricityKwh,
    avgQualityPct,
    annualKPI,
  };
}

/**
 * Computes techno-economic norm for a specific individual material/fuel/supply item.
 * CÔNG THỨC: Chỉ chia cho THÀNH PHẨM (không chia cho phụ phẩm, bán thành phẩm):
 * - Nguyên liệu, Nhiên liệu & Vật tư & Điện: quantity / finishedProductTons
 */
export function computeItemNorm(
  quantity: number,
  _categoryGroup: MaterialCategoryGroup,
  finishedProductTons: number,
): number {
  const effectiveProductTons = finishedProductTons || 0;
  if (effectiveProductTons <= 0) return 0;
  return (quantity || 0) / effectiveProductTons;
}
