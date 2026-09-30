import { describe, it, expect } from 'vitest';
import {
  employeeFormSchema,
  departmentFormSchema,
  positionFormSchema,
} from '@/features/hr/validation/hr-schemas';

describe('HR Validation Schemas', () => {
  describe('employeeFormSchema', () => {
    it('validates valid employee data', () => {
      const valid = {
        employee_code: 'EMP-010',
        first_name: 'Dũng',
        last_name: 'Hoàng Văn',
        email: 'dung.hoang@its-qlsx.vn',
        phone: '0987654321',
        department_id: '11111111-1111-1111-1111-111111111111',
        position_id: '22222222-2222-2222-2222-222222222222',
        direct_manager_id: null,
        hire_date: '2026-03-01',
        status: 'active' as const,
      };

      const result = employeeFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects employee code with invalid special characters', () => {
      const invalid = {
        employee_code: 'EMP@#$%',
        first_name: 'Nam',
        last_name: 'Lê',
        department_id: '11111111-1111-1111-1111-111111111111',
        position_id: '22222222-2222-2222-2222-222222222222',
        hire_date: '2026-03-01',
        status: 'active' as const,
      };

      const result = employeeFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('chỉ chứa chữ cái, số, gạch ngang');
      }
    });

    it('rejects invalid email format when provided', () => {
      const invalid = {
        employee_code: 'EMP-011',
        first_name: 'Nam',
        last_name: 'Lê',
        email: 'not-an-email',
        department_id: '11111111-1111-1111-1111-111111111111',
        position_id: '22222222-2222-2222-2222-222222222222',
        hire_date: '2026-03-01',
        status: 'active' as const,
      };

      const result = employeeFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('allows optional empty email and phone', () => {
      const valid = {
        employee_code: 'EMP-012',
        first_name: 'Tuấn',
        last_name: 'Phạm',
        email: '',
        phone: '',
        department_id: '11111111-1111-1111-1111-111111111111',
        position_id: '22222222-2222-2222-2222-222222222222',
        hire_date: '2026-03-01',
        status: 'on_leave' as const,
      };

      const result = employeeFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('departmentFormSchema', () => {
    it('validates correct department values', () => {
      const valid = {
        code: 'P_KCS',
        name: 'Phòng Kiểm Soát Chất Lượng',
        status: 'active' as const,
      };

      const result = departmentFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects department with code too short', () => {
      const invalid = {
        code: 'A',
        name: 'Phòng A',
        status: 'active' as const,
      };

      const result = departmentFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('positionFormSchema', () => {
    it('validates position with numeric level', () => {
      const valid = {
        code: 'NV_KCS',
        title: 'Nhân Viên KCS',
        department_id: '11111111-1111-1111-1111-111111111111',
        level: 3,
      };

      const result = positionFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects level outside range 1-10', () => {
      const invalid = {
        code: 'NV_KCS',
        title: 'Nhân Viên KCS',
        department_id: '11111111-1111-1111-1111-111111111111',
        level: 15,
      };

      const result = positionFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
