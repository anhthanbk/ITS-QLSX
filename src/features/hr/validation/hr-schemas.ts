import { z } from 'zod';

export const employeeFormSchema = z.object({
  employee_code: z
    .string()
    .min(2, 'Mã nhân viên tối thiểu 2 ký tự')
    .max(20, 'Mã nhân viên tối đa 20 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã nhân viên chỉ chứa chữ cái, số, gạch ngang hoặc gạch dưới'),
  first_name: z.string().min(1, 'Vui lòng nhập tên').max(50, 'Tên tối đa 50 ký tự'),
  last_name: z.string().min(1, 'Vui lòng nhập họ & tên đệm').max(50, 'Họ tối đa 50 ký tự'),
  email: z
    .string()
    .email('Định dạng email không hợp lệ')
    .max(100, 'Email tối đa 100 ký tự')
    .or(z.literal(''))
    .optional(),
  phone: z
    .string()
    .regex(/^([0-9+\s-]{9,15})?$/, 'Số điện thoại không hợp lệ')
    .or(z.literal(''))
    .optional(),
  department_id: z.string().uuid('Vui lòng chọn phòng ban hợp lệ'),
  position_id: z.string().uuid('Vui lòng chọn chức danh hợp lệ'),
  direct_manager_id: z.string().uuid().or(z.literal('')).nullable().optional(),
  hire_date: z.string().min(1, 'Vui lòng chọn ngày vào làm'),
  status: z.enum(['active', 'on_leave', 'terminated']),
  date_of_birth: z.string().or(z.literal('')).optional(),
  id_card_number: z.string().or(z.literal('')).optional(),
  avatar_url: z.string().or(z.literal('')).optional(),
  new_password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').or(z.literal('')).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const approveRegistrationSchema = z.object({
  employee_code: z
    .string()
    .min(2, 'Mã nhân viên tối thiểu 2 ký tự')
    .max(20, 'Mã nhân viên tối đa 20 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã nhân viên chỉ chứa chữ cái, số, gạch ngang hoặc gạch dưới'),
  role_code: z.string().min(1, 'Vui lòng phân vai trò hệ thống'),
  hire_date: z.string().min(1, 'Vui lòng chọn ngày chính thức vào làm'),
  department_id: z.string().uuid('Vui lòng chọn phòng ban hợp lệ').optional(),
  position_id: z.string().uuid('Vui lòng chọn chức danh hợp lệ').optional(),
  direct_manager_id: z.string().uuid().or(z.literal('')).nullable().optional(),
});

export type ApproveRegistrationFormValues = z.infer<typeof approveRegistrationSchema>;

export const rejectRegistrationSchema = z.object({
  reason: z.string().min(3, 'Vui lòng cung cấp lý do từ chối (tối thiểu 3 ký tự)').max(500),
});

export type RejectRegistrationFormValues = z.infer<typeof rejectRegistrationSchema>;


export const departmentFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Mã phòng ban tối thiểu 2 ký tự')
    .max(20, 'Mã phòng ban tối đa 20 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ chứa ký tự chữ cái, số hoặc gạch nối'),
  name: z.string().min(2, 'Tên phòng ban tối thiểu 2 ký tự').max(100, 'Tên phòng ban tối đa 100 ký tự'),
  parent_id: z.string().uuid().or(z.literal('')).nullable().optional(),
  status: z.enum(['active', 'inactive']),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const positionFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Mã chức danh tối thiểu 2 ký tự')
    .max(20, 'Mã chức danh tối đa 20 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ chứa ký tự chữ cái, số hoặc gạch nối'),
  title: z.string().min(2, 'Tên chức danh tối thiểu 2 ký tự').max(100, 'Tên chức danh tối đa 100 ký tự'),
  department_id: z.string().uuid('Vui lòng chọn phòng ban'),
  level: z.coerce.number().int().min(1, 'Cấp bậc từ 1 đến 10').max(10, 'Cấp bậc từ 1 đến 10'),
});

export type PositionFormValues = z.infer<typeof positionFormSchema>;
