import { describe, it, expect } from 'vitest';
import {
  getDaysInMonth,
  getCalendarHours,
  calculateOperatingHours,
  computeMonthKPI,
  computeAnnualSummary,
  createDefaultTimePlan,
  computeItemNorm,
  sumMonthProductsByType,
  sumAnnualProductsByType,
} from '@/features/production/utils/annual-plan-calc';
import type {
  AnnualPlanProductRow,
  AnnualPlanMaterialRow,
} from '@/features/production/types';

describe('Annual Production Plan Calculation Formulas & Utilities', () => {
  describe('Calendar & Time Calculations', () => {
    it('accurately calculates days and hours for 28/29/30/31 day months', () => {
      // January (31 days)
      expect(getDaysInMonth(2026, 1)).toBe(31);
      expect(getCalendarHours(2026, 1)).toBe(31 * 24); // 744h

      // February non-leap year (28 days)
      expect(getDaysInMonth(2026, 2)).toBe(28);
      expect(getCalendarHours(2026, 2)).toBe(28 * 24); // 672h

      // February leap year (29 days)
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getCalendarHours(2024, 2)).toBe(29 * 24); // 696h

      // April (30 days)
      expect(getDaysInMonth(2026, 4)).toBe(30);
      expect(getCalendarHours(2026, 4)).toBe(30 * 24); // 720h
    });

    it('calculates operating hours correctly as calendar - downtime', () => {
      // 744 calendar - (24 maintenance + 12 incident + 8 shutdown) = 700 operating
      const op = calculateOperatingHours(744, 24, 12, 8);
      expect(op).toBe(700);

      // Never returns negative numbers even if downtime exceeds calendar
      expect(calculateOperatingHours(720, 500, 300, 100)).toBe(0);
    });

    it('initializes default 12-month time plan with proper calendar hours', () => {
      const plan = createDefaultTimePlan(2026);
      expect(Object.keys(plan)).toHaveLength(12);
      expect(plan[1]?.calendarHours).toBe(744);
      expect(plan[2]?.calendarHours).toBe(672);
      expect(plan[3]?.calendarHours).toBe(744);
      expect(plan[4]?.calendarHours).toBe(720);
      expect(plan[1]?.operatingHours).toBe(744);
    });
  });

  describe('KPIs and Norms Formulas', () => {
    it('computes Công suất, Năng suất, Thu hồi, và Định mức KT-KT accurately', () => {
      // Month with:
      // calendar = 720h, maintenance = 24h, incident = 12h, shutdown = 14h -> operating = 670h
      // raw material = 70,000 tons
      // total product = 55,000 tons
      // fuel = 15,000 liters
      // supply = 2,500 units
      const kpi = computeMonthKPI({
        month: 1,
        calendarHours: 720,
        maintenanceHours: 24,
        incidentHours: 12,
        plannedShutdownHours: 14,
        operatingHours: 670,
        rawMaterialTons: 70000,
        fuelConsumption: 15000,
        supplyConsumption: 2500,
        totalProductTons: 55000,
      });

      // 1. Công suất: nguyên liệu * 0.95 / giờ vận hành
      const expectedCapacity = (70000 * 0.95) / 670;
      expect(kpi.capacityTph).toBeCloseTo(expectedCapacity, 4);

      // 2. Năng suất: tổng sản phẩm * 0.955 / giờ vận hành
      const expectedProductivity = (55000 * 0.955) / 670;
      expect(kpi.productivityTph).toBeCloseTo(expectedProductivity, 4);

      // 3. Tỷ lệ thu hồi thành phẩm %: (tổng sản phẩm * 0.955) / (nguyên liệu * 0.95) * 100%
      const expectedRecoveryPct = ((55000 * 0.955) / (70000 * 0.95)) * 100;
      expect(kpi.recoveryPct).toBeCloseTo(expectedRecoveryPct, 4);

      // 4. % Giờ
      expect(kpi.pctOperatingHours).toBeCloseTo((670 / 720) * 100, 2);
      expect(kpi.pctMaintenanceHours).toBeCloseTo((24 / 720) * 100, 2);
      expect(kpi.pctIncidentHours).toBeCloseTo((12 / 720) * 100, 2);
      expect(kpi.pctShutdownHours).toBeCloseTo((14 / 720) * 100, 2);

      // 5. Định mức KT-KT:
      // Tiêu hao nguyên liệu: tiêu hao nguyên liệu * 0.95 / (tổng sản phẩm * 0.955)
      const effectiveProduct = 55000 * 0.955;
      expect(kpi.rawMaterialNorm).toBeCloseTo((70000 * 0.95) / effectiveProduct, 4);
      // Tiêu hao nhiên liệu: tiêu hao nhiên liệu / (tổng sản phẩm * 0.955)
      expect(kpi.fuelNorm).toBeCloseTo(15000 / effectiveProduct, 4);
      // Tiêu hao vật tư: tiêu hao vật tư / (tổng sản phẩm * 0.955)
      expect(kpi.supplyNorm).toBeCloseTo(2500 / effectiveProduct, 4);
    });

    it('handles zero operating hours and zero production without division by zero errors', () => {
      const kpi = computeMonthKPI({
        month: 5,
        calendarHours: 744,
        maintenanceHours: 744,
        incidentHours: 0,
        plannedShutdownHours: 0,
        operatingHours: 0,
        rawMaterialTons: 0,
        fuelConsumption: 0,
        supplyConsumption: 0,
        totalProductTons: 0,
      });

      expect(kpi.capacityTph).toBe(0);
      expect(kpi.productivityTph).toBe(0);
      expect(kpi.recoveryPct).toBe(0);
      expect(kpi.rawMaterialNorm).toBe(0);
      expect(kpi.fuelNorm).toBe(0);
      expect(kpi.supplyNorm).toBe(0);
    });
  });

  describe('Annual Summary Aggregations', () => {
    it('computes annual totals and overall KPIs correctly', () => {
      const mockProducts: AnnualPlanProductRow[] = [
        {
          productId: 'prod-1',
          productName: 'Cát thạch anh mịn',
          productSku: 'CAT-01',
          unitOfMeasure: 'tấn',
          months: { 1: 5000, 2: 5000, 3: 5000, 4: 5000, 5: 5000, 6: 5000, 7: 5000, 8: 5000, 9: 5000, 10: 5000, 11: 5000, 12: 5000 },
        },
      ];

      const mockMaterials: AnnualPlanMaterialRow[] = [
        {
          materialId: 'mat-1',
          materialName: 'Quặng thạch anh thô',
          materialCode: 'NL-01',
          category: 'raw_material',
          categoryGroup: 'material',
          unitOfMeasure: 'tấn',
          months: { 1: 6000, 2: 6000, 3: 6000, 4: 6000, 5: 6000, 6: 6000, 7: 6000, 8: 6000, 9: 6000, 10: 6000, 11: 6000, 12: 6000 },
        },
        {
          materialId: 'mat-2',
          materialName: 'Dầu Diesel DO',
          materialCode: 'DO-01',
          category: 'fuel_energy',
          categoryGroup: 'fuel',
          unitOfMeasure: 'lít',
          months: { 1: 1000, 2: 1000, 3: 1000, 4: 1000, 5: 1000, 6: 1000, 7: 1000, 8: 1000, 9: 1000, 10: 1000, 11: 1000, 12: 1000 },
        },
      ];

      const timePlan = createDefaultTimePlan(2026);
      const qualityPct: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) qualityPct[m] = 99.5;

      const summary = computeAnnualSummary({
        products: mockProducts,
        materials: mockMaterials,
        timePlan,
        targetQualityPct: qualityPct,
      });

      expect(summary.annualTotalProductTons).toBe(60000); // 5000 * 12
      expect(summary.annualRawMaterialTons).toBe(72000);   // 6000 * 12
      expect(summary.annualFuelConsumption).toBe(12000);   // 1000 * 12
      expect(summary.totalCalendarHours).toBe(8760);       // 365 * 24
      expect(summary.avgQualityPct).toBeCloseTo(99.5, 2);
      expect(summary.annualKPI.capacityTph).toBeGreaterThan(0);
      expect(summary.annualKPI.productivityTph).toBeGreaterThan(0);
    });
  });

  describe('Individual Material Item Norms', () => {
    it('calculates correct norm for raw materials: (quantity * 0.95) / (totalProduct * 0.955)', () => {
      const quantity = 5000;
      const totalProductTons = 4000;
      const norm = computeItemNorm(quantity, 'material', totalProductTons);
      const expected = (5000 * 0.95) / (4000 * 0.955);
      expect(norm).toBeCloseTo(expected, 4);
    });

    it('calculates correct norm for fuel and supplies: quantity / (totalProduct * 0.955)', () => {
      const fuelQty = 1200;
      const totalProductTons = 4000;
      const fuelNorm = computeItemNorm(fuelQty, 'fuel', totalProductTons);
      expect(fuelNorm).toBeCloseTo(1200 / (4000 * 0.955), 4);

      const supplyQty = 350;
      const supplyNorm = computeItemNorm(supplyQty, 'supply', totalProductTons);
      expect(supplyNorm).toBeCloseTo(350 / (4000 * 0.955), 4);
    });

    it('returns 0 when total product output is zero', () => {
      expect(computeItemNorm(5000, 'material', 0)).toBe(0);
      expect(computeItemNorm(1200, 'fuel', 0)).toBe(0);
    });
  });

  describe('Product Categorization & Finished Goods Only Calculations', () => {
    const mixedProducts: AnnualPlanProductRow[] = [
      {
        productId: 'prod-tp-1',
        productName: 'Cát thạch anh mịn xuất khẩu',
        productSku: 'CAT-TP-01',
        unitOfMeasure: 'tấn',
        productType: 'finished_good',
        months: { 1: 3000, 2: 3000, 3: 3000, 4: 3000, 5: 3000, 6: 3000, 7: 3000, 8: 3000, 9: 3000, 10: 3000, 11: 3000, 12: 3000 },
      },
      {
        productId: 'prod-btp-1',
        productName: 'Bột thạch anh sơ chế',
        productSku: 'CAT-BTP-01',
        unitOfMeasure: 'tấn',
        productType: 'semi_finished',
        months: { 1: 1500, 2: 1500, 3: 1500, 4: 1500, 5: 1500, 6: 1500, 7: 1500, 8: 1500, 9: 1500, 10: 1500, 11: 1500, 12: 1500 },
      },
      {
        productId: 'prod-pp-1',
        productName: 'Bùn lắng & Cát phế',
        productSku: 'CAT-PP-01',
        unitOfMeasure: 'tấn',
        productType: 'by_product',
        months: { 1: 500, 2: 500, 3: 500, 4: 500, 5: 500, 6: 500, 7: 500, 8: 500, 9: 500, 10: 500, 11: 500, 12: 500 },
      },
    ];

    it('correctly aggregates monthly and annual products by classification type', () => {
      // Month 1
      expect(sumMonthProductsByType(mixedProducts, 1, 'finished_good')).toBe(3000);
      expect(sumMonthProductsByType(mixedProducts, 1, 'semi_finished')).toBe(1500);
      expect(sumMonthProductsByType(mixedProducts, 1, 'by_product')).toBe(500);

      // Annual
      expect(sumAnnualProductsByType(mixedProducts, 'finished_good')).toBe(36000);
      expect(sumAnnualProductsByType(mixedProducts, 'semi_finished')).toBe(18000);
      expect(sumAnnualProductsByType(mixedProducts, 'by_product')).toBe(6000);
    });

    it('calculates productivity, recovery rate, and norms dividing ONLY by finished goods (excluding semi-finished & by-products)', () => {
      // Total products: 3000 TP + 1500 BTP + 500 PP = 5000 tons
      // Finished product alone: 3000 tons
      // Raw materials: 4000 tons
      // Operating hours: 500 h
      const kpi = computeMonthKPI({
        month: 1,
        calendarHours: 720,
        maintenanceHours: 100,
        incidentHours: 50,
        plannedShutdownHours: 70,
        operatingHours: 500,
        rawMaterialTons: 4000,
        fuelConsumption: 2000,
        supplyConsumption: 100,
        totalProductTons: 5000,
        finishedProductTons: 3000, // Explicitly pass finished goods
      });

      // Năng suất: chỉ chia cho 3000 * 0.955
      const expectedProductivity = (3000 * 0.955) / 500;
      expect(kpi.productivityTph).toBeCloseTo(expectedProductivity, 4);

      // Tỷ lệ thu hồi thành phẩm %: (3000 * 0.955) / (4000 * 0.95) * 100%
      const expectedRecoveryPct = ((3000 * 0.955) / (4000 * 0.95)) * 100;
      expect(kpi.recoveryPct).toBeCloseTo(expectedRecoveryPct, 4);

      // Định mức nguyên liệu: chỉ chia cho 3000 * 0.955 (không chia cho 5000 * 0.955)
      const expectedRawMaterialNorm = (4000 * 0.95) / (3000 * 0.955);
      expect(kpi.rawMaterialNorm).toBeCloseTo(expectedRawMaterialNorm, 4);

      // computeItemNorm function also divides only by finishedProductTons
      const fuelNorm = computeItemNorm(2000, 'fuel', 3000);
      expect(fuelNorm).toBeCloseTo(2000 / (3000 * 0.955), 4);
    });

    it('computes byproduct recovery rate and electricity norm accurately', () => {
      const kpi = computeMonthKPI({
        month: 2,
        calendarHours: 672,
        maintenanceHours: 20,
        incidentHours: 10,
        plannedShutdownHours: 10,
        operatingHours: 632,
        rawMaterialTons: 5000,
        fuelConsumption: 1000,
        supplyConsumption: 200,
        totalProductTons: 4000,
        finishedProductTons: 3500,
        byproductTons: 400,
        electricityKwh: 35000,
      });

      // Tỷ lệ thu hồi phụ phẩm % = (400 * 0.955) / (5000 * 0.95) * 100%
      const expectedByproductRecovery = ((400 * 0.955) / (5000 * 0.95)) * 100;
      expect(kpi.byproductRecoveryPct).toBeCloseTo(expectedByproductRecovery, 4);

      // Định mức tiêu hao điện = 35000 / (3500 * 0.955) kWh/tấn TP
      const expectedElectricityNorm = 35000 / (3500 * 0.955);
      expect(kpi.electricityNorm).toBeCloseTo(expectedElectricityNorm, 4);
    });

    it('computeAnnualSummary passes finished goods to annual KPI', () => {
      const mockMaterials: AnnualPlanMaterialRow[] = [
        {
          materialId: 'mat-elec',
          materialName: 'Điện năng tiêu thụ (Điện sản xuất)',
          materialCode: 'ELEC-POWER',
          category: 'fuel_energy',
          categoryGroup: 'fuel',
          unitOfMeasure: 'kWh',
          months: { 1: 50000, 2: 50000, 3: 50000, 4: 50000, 5: 50000, 6: 50000, 7: 50000, 8: 50000, 9: 50000, 10: 50000, 11: 50000, 12: 50000 },
        },
      ];

      const timePlan = createDefaultTimePlan(2026);
      const qualityPct: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) qualityPct[m] = 99.0;

      const summary = computeAnnualSummary({
        products: mixedProducts,
        materials: mockMaterials,
        timePlan,
        targetQualityPct: qualityPct,
      });

      expect(summary.annualFinishedProductTons).toBe(36000);
      expect(summary.annualSemiFinishedProductTons).toBe(18000);
      expect(summary.annualByproductTons).toBe(6000);
      expect(summary.annualTotalProductTons).toBe(60000);

      // Annual byproduct recovery % in annualKPI
      expect(summary.annualKPI.byproductRecoveryPct).toBe(0); // mockMaterials has no raw material

      // Annual electricity norm in annualKPI
      expect(summary.annualKPI.electricityNorm).toBeCloseTo((50000 * 12) / (36000 * 0.955), 4);

      // Electricity norm divided only by finished goods (36,000 tons)
      const elecNorm = computeItemNorm(summary.annualFuelConsumption, 'fuel', summary.annualFinishedProductTons);
      expect(elecNorm).toBeCloseTo((50000 * 12) / (36000 * 0.955), 4);
    });
  });
});

