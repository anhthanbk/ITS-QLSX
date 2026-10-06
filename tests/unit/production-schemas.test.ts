import { describe, it, expect } from 'vitest';
import {
  productionPlanSchema,
  technoEconomicNormSchema,
  productionShiftSchema,
  shiftDowntimeSchema,
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

    it('validates a shift with detailed materials, products, and downtime breakdown', () => {
      const complexShift = {
        shift_code: 'CA-20261001-LINE01-S1',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        shift_date: '2026-10-01',
        shift_number: 2,
        standard_shift_hours: 8,
        total_downtime_hours: 1.5,
        raw_material_input_tons: 500,
        product_output_tons: 400,
        byproduct_output_tons: 50,
        products_output: [
          {
            product_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            product_name: 'Cát thạch anh mịn',
            product_sku: 'CAT-01',
            quantity_tons: 300,
            is_out_of_plan: false,
          },
          {
            product_name: 'Cát thô đặc biệt',
            product_sku: 'CAT-EXTRA',
            quantity_tons: 100,
            is_out_of_plan: true,
          },
        ],
        materials_consumption: [
          {
            material_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            resource_name: 'Điện năng 3 pha',
            category: 'fuel' as const,
            unit_of_measure: 'kWh',
            planned_norm: 15000,
            actual_quantity: 14200,
          },
          {
            resource_name: 'Dầu DO máy phát phụ',
            category: 'fuel' as const,
            unit_of_measure: 'Lít',
            actual_quantity: 50,
          },
        ],
        downtime_breakdown: {
          maintenance_hours: 0.5,
          maintenance_note: 'Bôi trơn băng tải định kỳ',
          incident_hours: 1.0,
          incident_category: 'mechanical',
          incident_reason: 'Kẹt đá buồng nghiền',
          incident_action: 'Dừng cấp liệu, dùng cẩu gắp dị vật ra khỏi buồng',
          planned_shutdown_hours: 0,
          planned_shutdown_reason: '',
          total_downtime_hours: 1.5,
        },
      };

      const result = productionShiftSchema.safeParse(complexShift);
      expect(result.success).toBe(true);
    });

    it('validates a shift with multiple downtime events (maintenance, incident, planned shutdown)', () => {
      const shiftWithEvents = {
        shift_code: 'CA-20261001-LINE01-S1',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        shift_date: '2026-10-01',
        shift_number: 1,
        standard_shift_hours: 8,
        total_downtime_hours: 2.25,
        raw_material_input_tons: 600,
        product_output_tons: 480,
        byproduct_output_tons: 60,
        downtime_breakdown: {
          maintenance_hours: 0.5,
          incident_hours: 0.75,
          planned_shutdown_hours: 1.0,
          total_downtime_hours: 2.25,
          events: [
            {
              type: 'breakdown_incident' as const,
              start_time: '08:00',
              end_time: '08:45',
              duration_minutes: 45,
              duration_hours: 0.75,
              incident_category: 'Sự cố Cơ khí',
              reason: 'Kẹt đá buồng nghiền số 1',
              action_taken: 'Dừng máy, thông phễu và gắp đá quá cỡ',
            },
            {
              type: 'planned_maintenance' as const,
              start_time: '10:30',
              end_time: '11:00',
              duration_minutes: 30,
              duration_hours: 0.5,
              reason: 'Bảo dưỡng tra dầu mỡ gối trục băng tải',
              action_taken: 'Đã hoàn tất tra mỡ 4 gối trục',
            },
            {
              type: 'scheduled_shutdown' as const,
              start_time: '12:00',
              end_time: '13:00',
              duration_minutes: 60,
              duration_hours: 1.0,
              reason: 'Nghỉ tránh giờ cao điểm điện lực',
              action_taken: 'Chuyển sang chế độ không tải',
            },
          ],
        },
      };

      const result = productionShiftSchema.safeParse(shiftWithEvents);
      expect(result.success).toBe(true);
    });

    it('validates a production record across a date range with large standard and downtime hours', () => {
      const dateRangeRecord = {
        shift_code: 'KY-20261001-20261005-LINE01',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        shift_date: '2026-10-01',
        end_date: '2026-10-05',
        shift_number: 1,
        standard_shift_hours: 120, // 5 days * 24 hours
        total_downtime_hours: 36.5,
        running_hours: 83.5,
        raw_material_input_tons: 5000,
        product_output_tons: 4100,
        status: 'completed' as const,
        downtime_breakdown: {
          is_date_range: true,
          from_date: '2026-10-01',
          to_date: '2026-10-05',
          maintenance_hours: 16.5,
          incident_hours: 12.0,
          planned_shutdown_hours: 8.0,
          total_downtime_hours: 36.5,
          events: [
            {
              type: 'planned_maintenance' as const,
              duration_hours: 16.5,
              reason: 'Bảo dưỡng định kỳ cả dây chuyền trong đợt nghỉ',
            },
            {
              type: 'breakdown_incident' as const,
              duration_hours: 12.0,
              incident_category: 'Sự cố Điện',
              reason: 'Mất điện lưới diện rộng',
            },
            {
              type: 'scheduled_shutdown' as const,
              duration_hours: 8.0,
              reason: 'Nghỉ tránh giờ cao điểm và dọn vệ sinh khoáng sàng',
            },
          ],
        },
      };

      const result = productionShiftSchema.safeParse(dateRangeRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.standard_shift_hours).toBe(120);
        expect(result.data.end_date).toBe('2026-10-05');
        expect(result.data.downtime_breakdown?.is_date_range).toBe(true);
        expect(result.data.downtime_breakdown?.events?.[0]?.duration_hours).toBe(16.5);
      }
    });

    it('defaults actual_quality_rate_pct to 100% and validates boundary conditions', () => {
      const shiftWithoutQuality = {
        shift_code: 'CA-20261001-LINE01-S1',
        line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        shift_date: '2026-10-01',
        shift_number: 1,
        standard_shift_hours: 8,
        raw_material_input_tons: 100,
        product_output_tons: 80,
      };

      const result = productionShiftSchema.parse(shiftWithoutQuality);
      expect(result.actual_quality_rate_pct).toBe(100.0);

      const invalidQualityOver100 = {
        ...shiftWithoutQuality,
        actual_quality_rate_pct: 105,
      };
      expect(productionShiftSchema.safeParse(invalidQualityOver100).success).toBe(false);

      const invalidQualityNegative = {
        ...shiftWithoutQuality,
        actual_quality_rate_pct: -5,
      };
      expect(productionShiftSchema.safeParse(invalidQualityNegative).success).toBe(false);

      const validCustomQuality = {
        ...shiftWithoutQuality,
        actual_quality_rate_pct: 98.5,
      };
      expect(productionShiftSchema.parse(validCustomQuality).actual_quality_rate_pct).toBe(98.5);
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

  describe('productionShiftSchema - actual_quality_rate_pct', () => {
    const baseShift = {
      shift_code: 'CA-20261001-LINE01-S1',
      line_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      shift_date: '2026-10-01',
      shift_number: 1,
      standard_shift_hours: 8,
      raw_material_input_tons: 900,
      product_output_tons: 750,
    };

    it('defaults product quality to 100% when omitted', () => {
      const result = productionShiftSchema.safeParse(baseShift);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actual_quality_rate_pct).toBe(100);
      }
    });

    it('rejects quality outside 0-100%', () => {
      expect(productionShiftSchema.safeParse({ ...baseShift, actual_quality_rate_pct: 101 }).success).toBe(false);
      expect(productionShiftSchema.safeParse({ ...baseShift, actual_quality_rate_pct: -1 }).success).toBe(false);
      expect(productionShiftSchema.safeParse({ ...baseShift, actual_quality_rate_pct: 97.5 }).success).toBe(true);
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
