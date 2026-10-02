import { describe, it, expect } from 'vitest';
import {
  machineSchema,
  machineAdjustmentSchema,
  maintenancePlanSchema,
  workOrderSchema,
  workOrderStatusUpdateSchema,
} from '@/features/maintenance/validation/maintenance-schemas';

describe('Maintenance Validation Schemas', () => {
  describe('machineSchema', () => {
    it('validates valid machine data', () => {
      const valid = {
        machine_code: 'MC-TEST-01',
        name: 'Máy nghiền búa thử nghiệm',
        line_id: '11111111-1111-1111-1111-111111111111',
        department_id: '22222222-2222-2222-2222-222222222222',
        model: 'MB-500',
        serial_number: 'SN-998877',
        line_location: 'Khu vực xưởng 1',
        rated_capacity_per_hour: 45.5,
        power_rating_kw: 75,
        installation_date: '2025-06-15',
        status: 'operational' as const,
      };

      const result = machineSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.machine_code).toBe('MC-TEST-01');
        expect(result.data.rated_capacity_per_hour).toBe(45.5);
      }
    });

    it('transforms lowercase machine code to uppercase', () => {
      const valid = {
        machine_code: 'mc-conv-09',
        name: 'Băng tải cấp liệu',
      };

      const result = machineSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.machine_code).toBe('MC-CONV-09');
      }
    });

    it('rejects machine code with invalid special characters', () => {
      const invalid = {
        machine_code: 'MC@#$*!',
        name: 'Máy thử nghiệm',
      };

      const result = machineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('chỉ chứa chữ cái, số, gạch ngang');
      }
    });

    it('rejects machine code that is too short', () => {
      const invalid = {
        machine_code: 'M',
        name: 'Máy thử nghiệm',
      };

      const result = machineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative capacity or power ratings', () => {
      const invalid = {
        machine_code: 'MC-FAIL-01',
        name: 'Máy lỗi thông số',
        rated_capacity_per_hour: -10,
      };

      const result = machineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('maintenancePlanSchema', () => {
    it('validates valid maintenance plan data', () => {
      const valid = {
        plan_code: 'pm-crush-30d',
        machine_id: '11111111-1111-1111-1111-111111111111',
        title: 'Bảo dưỡng định kỳ máy nghiền 30 ngày',
        frequency_days: 30,
        standard_duration_hours: 2.5,
        is_active: true,
      };

      const result = maintenancePlanSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan_code).toBe('PM-CRUSH-30D');
        expect(result.data.frequency_days).toBe(30);
      }
    });

    it('rejects frequency less than 1 day', () => {
      const invalid = {
        plan_code: 'PM-FAIL',
        machine_id: '11111111-1111-1111-1111-111111111111',
        title: 'Bảo dưỡng sai chu kỳ',
        frequency_days: 0,
      };

      const result = maintenancePlanSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid machine_id UUID', () => {
      const invalid = {
        plan_code: 'PM-VALID',
        machine_id: 'not-a-uuid',
        title: 'Kế hoạch test',
        frequency_days: 15,
      };

      const result = maintenancePlanSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('workOrderSchema', () => {
    it('validates valid work order data', () => {
      const valid = {
        work_order_number: 'wo-2026-001',
        machine_id: '11111111-1111-1111-1111-111111111111',
        type: 'corrective_breakdown' as const,
        priority: 'high' as const,
        assigned_technician_id: '22222222-2222-2222-2222-222222222222',
        reported_issue: 'Rách băng tải bọc cao su khu vực trạm chuyển hướng',
        scheduled_date: '2026-04-10',
        status: 'open' as const,
      };

      const result = workOrderSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.work_order_number).toBe('WO-2026-001');
      }
    });

    it('rejects reported_issue shorter than 5 characters', () => {
      const invalid = {
        work_order_number: 'WO-2026-002',
        machine_id: '11111111-1111-1111-1111-111111111111',
        type: 'preventative' as const,
        priority: 'medium' as const,
        assigned_technician_id: '22222222-2222-2222-2222-222222222222',
        reported_issue: 'Hỏng',
        scheduled_date: '2026-04-10',
      };

      const result = workOrderSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative downtime minutes', () => {
      const invalid = {
        work_order_number: 'WO-2026-003',
        machine_id: '11111111-1111-1111-1111-111111111111',
        assigned_technician_id: '22222222-2222-2222-2222-222222222222',
        reported_issue: 'Sự cố vỡ khớp nối trục động cơ',
        scheduled_date: '2026-04-10',
        downtime_minutes: -30,
      };

      const result = workOrderSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('machineAdjustmentSchema', () => {
    it('validates a valid machine adjustment and improvement record', () => {
      const valid = {
        machine_id: '11111111-1111-1111-1111-111111111111',
        status_before: 'breakdown' as const,
        status_after: 'operational' as const,
        operating_condition_before: 'Băng tải bị trượt mép và rung lắc khi chạy đầy tải',
        improvement_content: 'Cải tiến con lăn tự lựa và cân chỉnh đối trọng căng băng',
        result: 'Băng chạy thẳng tâm, tốc độ ổn định đạt 1.2 m/s',
        changed_params: {
          'Tốc độ băng tải': '1.2 m/s',
          'Bề rộng băng': '650 mm',
        },
        applied_to_machine: true,
        performed_at: '2026-10-01',
      };

      const result = machineAdjustmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_before).toBe('breakdown');
        expect(result.data.status_after).toBe('operational');
        expect(result.data.applied_to_machine).toBe(true);
        expect(result.data.changed_params?.['Tốc độ băng tải']).toBe('1.2 m/s');
      }
    });

    it('rejects adjustment with invalid machine_id or short improvement content', () => {
      const invalid = {
        machine_id: 'invalid-uuid',
        status_before: 'breakdown' as const,
        status_after: 'operational' as const,
        improvement_content: 'Ngắn',
        result: '',
        performed_at: '2026-10-01',
      };

      const result = machineAdjustmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('workOrderStatusUpdateSchema', () => {
    it('validates completed status with downtime and resolution', () => {
      const valid = {
        status: 'completed' as const,
        root_cause: 'Khô mỡ ổ bi',
        resolution_summary: 'Bơm mỡ chịu nhiệt Kluber và kiểm tra chạy thử 30 phút đạt yêu cầu',
        downtime_minutes: 45,
        labor_hours: 2.5,
        spare_parts_cost: 350000,
      };

      const result = workOrderStatusUpdateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});

