import { z } from 'zod';

export const warehouseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mã kho phải có ít nhất 2 ký tự')
    .max(50, 'Mã kho không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã kho chỉ chứa chữ cái, chữ số, gạch nối và gạch dưới')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Tên kho phải có ít nhất 2 ký tự')
    .max(150, 'Tên kho không vượt quá 150 ký tự'),
  warehouse_type: z.enum([
    'raw_material',
    'finished_goods',
    'quarantine',
    'spare_parts',
    'transit',
    'byproduct',
  ]),
  location: z.string().trim().max(200, 'Vị trí không vượt quá 200 ký tự').nullable().optional(),
  manager_employee_id: z.string().uuid('Người quản lý không hợp lệ').nullable().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

export type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export const transactionSchema = z
  .object({
    warehouse_id: z.string().uuid('Vui lòng chọn kho liên quan'),
    destination_warehouse_id: z.string().uuid('Vui lòng chọn kho nhận').nullable().optional().or(z.literal('')),
    item_type: z.enum(['material', 'product', 'byproduct']),
    item_id: z.string().uuid('Vui lòng chọn mặt hàng'),
    transaction_type: z.enum([
      'inbound_receipt',
      'production_issue',
      'production_receipt',
      'warehouse_transfer',
      'inventory_adjustment',
      'scrap_disposal',
      'sales_dispatch',
    ]),
    quantity: z.coerce.number().positive('Số lượng giao dịch phải lớn hơn 0'),
    unit_cost: z.coerce.number().min(0, 'Đơn giá không thể âm').default(0),
    notes: z.string().trim().max(500, 'Ghi chú không vượt quá 500 ký tự').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.transaction_type === 'warehouse_transfer') {
        return !!data.destination_warehouse_id && data.destination_warehouse_id !== data.warehouse_id;
      }
      return true;
    },
    {
      message: 'Kho nhận hàng phải khác kho xuất hàng',
      path: ['destination_warehouse_id'],
    }
  );

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const warehouseTransferSchema = z
  .object({
    from_warehouse_id: z.string().uuid('Vui lòng chọn kho xuất'),
    to_warehouse_id: z.string().uuid('Vui lòng chọn kho nhận'),
    item_type: z.enum(['material', 'product', 'byproduct']),
    item_id: z.string().uuid('Vui lòng chọn mặt hàng'),
    quantity: z.coerce.number().positive('Số lượng chuyển kho phải lớn hơn 0'),
    notes: z.string().trim().max(500, 'Ghi chú không vượt quá 500 ký tự').nullable().optional(),
  })
  .refine((data) => data.from_warehouse_id !== data.to_warehouse_id, {
    message: 'Kho nhận hàng phải khác kho xuất hàng',
    path: ['to_warehouse_id'],
  });

export type WarehouseTransferFormValues = z.infer<typeof warehouseTransferSchema>;

export const inventoryAdjustmentSchema = z.object({
  warehouse_id: z.string().uuid('Vui lòng chọn kho'),
  item_type: z.enum(['material', 'product', 'byproduct']),
  item_id: z.string().uuid('Vui lòng chọn mặt hàng'),
  actual_quantity: z.coerce.number().min(0, 'Số lượng kiểm kê thực tế không thể âm'),
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do kiểm kê / điều chỉnh').max(500),
});

export type InventoryAdjustmentFormValues = z.infer<typeof inventoryAdjustmentSchema>;

export const materialSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mã vật tư phải có ít nhất 2 ký tự')
    .max(50, 'Mã vật tư không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã vật tư chỉ chứa chữ cái, chữ số, gạch nối và gạch dưới')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Tên vật tư phải có ít nhất 2 ký tự')
    .max(255, 'Tên vật tư không vượt quá 255 ký tự'),
  category: z.enum(
    ['raw_material', 'chemical', 'spare_part', 'packaging', 'consumable', 'fuel_energy', 'other'],
    {
      required_error: 'Vui lòng chọn nhóm phân loại vật tư',
    }
  ),
  unit_of_measure: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập đơn vị tính')
    .max(50, 'Đơn vị tính không quá 50 ký tự'),
  min_stock_level: z.coerce.number().min(0, 'Định mức tồn tối thiểu không được âm').default(0),
  max_stock_level: z.coerce
    .number()
    .min(0, 'Tồn kho tối đa không được âm')
    .nullable()
    .optional(),
  reorder_point: z.coerce.number().min(0, 'Điểm đặt hàng lại không được âm').default(0),
  standard_cost: z.coerce.number().min(0, 'Đơn giá định mức không được âm').default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;

export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, 'Mã SKU sản phẩm phải có ít nhất 2 ký tự')
    .max(50, 'Mã SKU không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã SKU chỉ chứa chữ cái, chữ số, gạch nối và gạch dưới')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự')
    .max(200, 'Tên sản phẩm không vượt quá 200 ký tự'),
  product_type: z.enum(['finished_good', 'semi_finished', 'by_product'], {
    required_error: 'Vui lòng chọn loại sản phẩm',
  }),
  unit_of_measure: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập đơn vị tính')
    .max(20, 'Đơn vị tính không quá 20 ký tự'),
  base_sales_price: z.coerce.number().min(0, 'Giá bán niêm yết không được âm').default(0),
  standard_cycle_time_mins: z.coerce.number().min(0, 'Chu kỳ sản xuất không được âm').default(0),
  standard_labor_cost: z.coerce.number().min(0, 'Chi phí nhân công không được âm').default(0),
  status: z.enum(['active', 'discontinued']).default('active'),
});

export type ProductFormValues = z.infer<typeof productSchema>;

