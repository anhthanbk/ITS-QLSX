import { describe, it, expect } from 'vitest';
import {
  productionPlanSchema,
  technoEconomicNormSchema,
  productionShiftSchema,
  shiftDowntimeSchema,
  shiftMeterSchema,
  shiftLogSchema,
  productionOrderSchema,
  productionBatchSchema,
} from '@/features/production/validation/production-schemas';

describe('Production Module Validation Schemas', () => {
  describe('productionPlanSchema', () => {
    it('validates a correct production plan', () => {
      const validPlan = {
        plan_code: 'KH-2026-10-LINE01',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        year: 2026,
        month: 10,
        planned_capacity_tph: 120,
        planned_recovery_rate_pct: 85.5,
        total_calendar_hours: 744,
        planned_breakdown_hours: 12,
        planned_maintenance_hours: 24,
        planned_shutdown_hours: 12,
        target_quality_rate_pct: 99.5,
        planned_input_material_tons: 70000,
        planned_output_product_tons: 59850,
        planned_byproduct_tons: 6500,
        status: 'draft' as const,
        notes: 'Kế hoạch sản xuất mẫu',
      };

      const result = productionPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it('rejects invalid plan code or negative numbers', () => {
      const invalidPlan = {
        plan_code: 'K', // too short
        line_id: 'invalid-uuid',
        year: 2018, // must be >= 2020
        month: 13, // invalid month
        planned_capacity_tph: -5,
        planned_recovery_rate_pct: 120, // max 100
        total_calendar_hours: 0,
      };

      const result = productionPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.errors.map((e) => e.path[0]);
        expect(errorPaths).toContain('plan_code');
        expect(errorPaths).toContain('line_id');
        expect(errorPaths).toContain('year');
        expect(errorPaths).toContain('month');
        expect(errorPaths).toContain('planned_capacity_tph');
        expect(errorPaths).toContain('planned_recovery_rate_pct');
      }
    });
  });

  describe('technoEconomicNormSchema', () => {
    it('validates a correct techno-economic norm', () => {
      const validNorm = {
        norm_code: 'DM-DIEN-01',
        resource_type: 'electricity' as const,
        resource_name: 'Điện năng tiêu thụ',
        unit_of_measure: 'kWh/Tấn',
        norm_rate: 18.5,
        effective_from: '2026-01-01',
        is_active: true,
      };

      const result = technoEconomicNormSchema.safeParse(validNorm);
      expect(result.success).toBe(true);
    });

    it('rejects invalid resource type or zero/negative rate', () => {
      const invalidNorm = {
        norm_code: 'DM',
        resource_type: 'invalid_type',
        resource_name: '',
        unit_of_measure: '',
        norm_rate: 0,
        effective_from: '',
      };

      const result = technoEconomicNormSchema.safeParse(invalidNorm);
      expect(result.success).toBe(false);
    });
  });

  describe('productionShiftSchema', () => {
    it('validates a correct production shift', () => {
      const validShift = {
        shift_code: 'CA-20261001-LINE01-S1',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        shift_date: '2026-10-01',
        shift_number: 1,
        standard_shift_hours: 8,
        total_downtime_hours: 0.5,
        raw_material_input_tons: 900,
        product_output_tons: 750,
        byproduct_output_tons: 100,
        status: 'completed' as const,
      };

      const result = productionShiftSchema.safeParse(validShift);
      expect(result.success).toBe(true);
    });

    it('rejects shift numbers outside 1-3', () => {
      const invalidShift = {
        shift_code: 'CA-01',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        shift_date: '2026-10-01',
        shift_number: 4, // invalid
        standard_shift_hours: 8,
        raw_material_input_tons: 100,
        product_output_tons: 80,
      };

      const result = productionShiftSchema.safeParse(invalidShift);
      expect(result.success).toBe(false);
    });
  });

  describe('shiftDowntimeSchema', () => {
    it('validates downtime with positive duration and valid category', () => {
      const validDowntime = {
        shift_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        line_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        downtime_category: 'breakdown_incident' as const,
        start_time: '2026-10-01T08:00:00Z',
        end_time: '2026-10-01T08:45:00Z',
        duration_minutes: 45,
        reason: 'Hỏng bạc đạn mô tơ bơm nước tuần hoàn',
        status: 'resolved' as const,
      };

      const result = shiftDowntimeSchema.safeParse(validDowntime);
      expect(result.success).toBe(true);
    });
  });

  describe('shiftMeterSchema & shiftLogSchema', () => {
    it('validates meter reading and consumption calculation', () => {
      const validMeter = {
        shift_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        meter_code: 'DH-DIEN-01',
        meter_name: 'Đồng hồ điện trạm biến áp',
        meter_type: 'electric_meter' as const,
        start_reading: 1000,
        end_reading: 1150,
        multiplier: 1.0,
        consumed_quantity: 150,
        unit_of_measure: 'kWh',
        notes: '',
      };

      const result = shiftMeterSchema.safeParse(validMeter);
      expect(result.success).toBe(true);
    });

    it('validates shift handover log', () => {
      const validLog = {
        shift_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        log_time: '2026-10-01T08:00:00Z',
        change_type: 'management_directive' as const,
        content: 'Bàn giao ca 1 sang ca 2, hệ thống tuyển rửa chạy ổn định.',
      };

      const result = shiftLogSchema.safeParse(validLog);
      expect(result.success).toBe(true);
    });
  });

  describe('productionOrderSchema & productionBatchSchema', () => {
    it('validates production order creation', () => {
      const validOrder = {
        order_number: 'LSX-202610-001',
        product_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        target_quantity: 5000,
        planned_start_date: '2026-10-01T00:00:00Z',
        planned_end_date: '2026-10-08T00:00:00Z',
        priority: 'high' as const,
        status: 'scheduled' as const,
      };

      const result = productionOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('validates batch creation with positive planned quantity', () => {
      const validBatch = {
        batch_number: 'LO-202610-1001',
        production_order_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        planned_quantity: 500,
        shift: 'shift_1' as const,
        status: 'pending' as const,
      };

      const result = productionBatchSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });
  });
});
