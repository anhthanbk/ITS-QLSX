import { describe, it, expect } from 'vitest';
import { loginSchema, signUpSchema } from '@/features/auth/validation/auth-schema';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates a valid login payload successfully', () => {
      const result = loginSchema.safeParse({
        email: 'operator@its-qlsx.vn',
        password: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/hợp lệ/i);
      }
    });

    it('rejects short passwords', () => {
      const result = loginSchema.safeParse({
        email: 'valid@its-qlsx.vn',
        password: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/6 ký tự/i);
      }
    });
  });

  describe('signUpSchema', () => {
    it('validates a valid sign up payload with default role', () => {
      const result = signUpSchema.safeParse({
        fullName: 'Nguyễn Văn B',
        email: 'nguyenvanb@its-qlsx.vn',
        password: 'SecurePassword123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roleCode).toBe('operator');
      }
    });

    it('rejects empty full name', () => {
      const result = signUpSchema.safeParse({
        fullName: '',
        email: 'test@its-qlsx.vn',
        password: 'SecurePassword123',
      });
      expect(result.success).toBe(false);
    });
  });
});
