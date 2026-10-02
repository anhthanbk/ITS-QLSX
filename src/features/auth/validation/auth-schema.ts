import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  avatarUrl: z.string().optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .min(1, 'Vui lòng chọn ngày tháng năm sinh')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày sinh phải là YYYY-MM-DD'),
  phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  idCardNumber: z.string().max(20, 'CCCD/CMND không quá 20 ký tự').optional().or(z.literal('')),
  departmentId: z.string().min(1, 'Vui lòng chọn phòng ban ứng tuyển'),
  positionId: z.string().min(1, 'Vui lòng chọn chức danh / vị trí ứng tuyển'),
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
