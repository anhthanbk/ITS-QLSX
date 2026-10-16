import { z } from 'zod';

export const customerSchema = z.object({
  code: z
    .string()
    .min(2, 'Mã khách hàng phải có ít nhất 2 ký tự')
    .max(50, 'Mã khách hàng không được vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ bao gồm chữ cái, số, gạch ngang và gạch dưới'),
  name: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự').max(200, 'Tên không quá 200 ký tự'),
  tax_id: z.string().max(50, 'Mã số thuế không quá 50 ký tự').optional().or(z.literal('')),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  phone: z.string().max(30, 'Số điện thoại không quá 30 ký tự').optional().or(z.literal('')),
  address: z.string().max(500, 'Địa chỉ không quá 500 ký tự').optional().or(z.literal('')),
  credit_limit: z.coerce.number().min(0, 'Hạn mức tín dụng không được âm').default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const supplierSchema = z.object({
  code: z
    .string()
    .min(2, 'Mã nhà cung cấp phải có ít nhất 2 ký tự')
    .max(50, 'Mã không được vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ bao gồm chữ cái, số, gạch ngang và gạch dưới'),
  name: z.string().min(2, 'Tên nhà cung cấp phải có ít nhất 2 ký tự').max(200, 'Tên không quá 200 ký tự'),
  tax_id: z.string().max(50, 'Mã số thuế không quá 50 ký tự').optional().or(z.literal('')),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  phone: z.string().max(30, 'Số điện thoại không quá 30 ký tự').optional().or(z.literal('')),
  address: z.string().max(500, 'Địa chỉ không quá 500 ký tự').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const salesOrderItemSchema = z.object({
  product_id: z.string().uuid('Sản phẩm không hợp lệ'),
  quantity: z.coerce.number().positive('Số lượng phải lớn hơn 0'),
  unit_price: z.coerce.number().min(0, 'Đơn giá không được âm'),
  line_total: z.coerce.number().min(0, 'Thành tiền không được âm'),
  fulfilled_quantity: z.coerce.number().min(0, 'Số lượng đã giao không âm').default(0),
});

export type SalesOrderItemFormValues = z.infer<typeof salesOrderItemSchema>;

export const salesOrderSchema = z.object({
  order_code: z
    .string()
    .min(2, 'Mã đơn hàng phải có ít nhất 2 ký tự')
    .max(50, 'Mã không quá 50 ký tự'),
  customer_id: z.string().uuid('Vui lòng chọn khách hàng'),
  order_date: z.string().min(1, 'Vui lòng chọn ngày đặt hàng'),
  promised_delivery_date: z.string().optional().or(z.literal('')),
  currency: z.string().default('VND'),
  tax_rate: z.coerce.number().min(0).max(100).default(10),
  payment_terms: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z
    .enum([
      'draft',
      'confirmed',
      'in_production',
      'ready_to_ship',
      'shipped',
      'delivered',
      'cancelled',
    ])
    .default('draft'),
  items: z.array(salesOrderItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 mặt hàng'),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

export const purchaseOrderItemSchema = z.object({
  material_id: z.string().uuid('Nguyên vật liệu không hợp lệ'),
  quantity: z.coerce.number().positive('Số lượng phải lớn hơn 0'),
  unit_price: z.coerce.number().min(0, 'Đơn giá không được âm'),
  line_total: z.coerce.number().min(0, 'Thành tiền không được âm'),
  received_quantity: z.coerce.number().min(0, 'Số lượng đã nhận không âm').default(0),
});

export type PurchaseOrderItemFormValues = z.infer<typeof purchaseOrderItemSchema>;

export const purchaseOrderSchema = z.object({
  po_code: z
    .string()
    .min(2, 'Mã đơn mua phải có ít nhất 2 ký tự')
    .max(50, 'Mã không quá 50 ký tự'),
  supplier_id: z.string().uuid('Vui lòng chọn nhà cung cấp'),
  order_date: z.string().min(1, 'Vui lòng chọn ngày đặt mua'),
  expected_delivery_date: z.string().optional().or(z.literal('')),
  currency: z.string().default('VND'),
  tax_rate: z.coerce.number().min(0).max(100).default(10),
  payment_terms: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z
    .enum(['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'])
    .default('draft'),
  items: z.array(purchaseOrderItemSchema).min(1, 'Đơn mua phải có ít nhất 1 nguyên vật liệu'),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
