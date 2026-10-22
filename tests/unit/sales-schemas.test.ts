import { describe, it, expect } from 'vitest';
import {
  customerSchema,
  supplierSchema,
  salesOrderItemSchema,
  salesOrderSchema,
  purchaseOrderItemSchema,
  purchaseOrderSchema,
} from '@/features/sales/validation/sales-schemas';

describe('Sales and Purchase Schemas', () => {
  describe('customerSchema', () => {
    it('accepts valid customer data', () => {
      const valid = {
        code: 'KH-VIG',
        name: 'Công ty Kính Nổi Viglacera',
        tax_id: '0100106204',
        email: 'contact@viglacera-glass.vn',
        phone: '0243556789',
        address: 'KCN Yên Phong, Bắc Ninh',
        credit_limit: 2000000000,
        status: 'active' as const,
      };

      const result = customerSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('KH-VIG');
        expect(result.data.credit_limit).toBe(2000000000);
      }
    });

    it('rejects short customer code', () => {
      const invalid = {
        code: 'K',
        name: 'Công ty ABC',
      };

      const result = customerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('ít nhất 2 ký tự');
      }
    });

    it('rejects invalid email', () => {
      const invalid = {
        code: 'KH-TEST',
        name: 'Khách hàng test',
        email: 'not-an-email',
      };

      const result = customerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('Email không đúng định dạng');
      }
    });

    it('rejects negative credit limit', () => {
      const invalid = {
        code: 'KH-TEST',
        name: 'Khách hàng test',
        credit_limit: -500000,
      };

      const result = customerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('supplierSchema', () => {
    it('accepts valid supplier data', () => {
      const valid = {
        code: 'NCC-PETRO',
        name: 'Petrolimex Khánh Hòa',
        tax_id: '4200101010',
        email: 'khanhhoa@petrolimex.com.vn',
        phone: '02583822456',
        address: 'Nha Trang, Khánh Hòa',
        status: 'active' as const,
      };

      const result = supplierSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('NCC-PETRO');
      }
    });

    it('rejects invalid characters in supplier code', () => {
      const invalid = {
        code: 'NCC @#$',
        name: 'Nhà cung cấp sai mã',
      };

      const result = supplierSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('chữ cái, số');
      }
    });
  });

  describe('salesOrderSchema', () => {
    const validCustomerId = '11111111-1111-1111-1111-111111111101';
    const validProductId = 'b9554d09-fa67-4052-8693-a8a8000118a3';

    it('accepts valid sales order with line items', () => {
      const valid = {
        order_code: 'SO-2026-001',
        customer_id: validCustomerId,
        order_date: '2026-10-15',
        promised_delivery_date: '2026-10-30',
        currency: 'VND',
        tax_rate: 10,
        payment_terms: '30 ngày',
        status: 'confirmed' as const,
        items: [
          {
            product_id: validProductId,
            quantity: 1000,
            unit_price: 420000,
            line_total: 420000000,
            fulfilled_quantity: 0,
          },
        ],
      };

      const result = salesOrderSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order_code).toBe('SO-2026-001');
        expect(result.data.items.length).toBe(1);
      }
    });

    it('rejects sales order with empty items list', () => {
      const invalid = {
        order_code: 'SO-EMPTY',
        customer_id: validCustomerId,
        order_date: '2026-10-15',
        items: [],
      };

      const result = salesOrderSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('ít nhất 1 mặt hàng');
      }
    });

    it('rejects item with non-positive quantity', () => {
      const invalidItem = {
        product_id: validProductId,
        quantity: 0,
        unit_price: 100000,
        line_total: 0,
      };

      const result = salesOrderItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('accepts sales order with logistics and transport information', () => {
      const valid = {
        order_code: 'SO-LOGISTICS-001',
        customer_id: validCustomerId,
        order_date: '2026-10-17',
        status: 'confirmed' as const,
        carrier_name: 'Công ty Vận tải Hải Vân',
        vehicle_plate: '29C-888.99',
        driver_info: 'Nguyễn Văn Tài - 0987654321',
        delivery_location: 'Kho tổng Viglacera Bắc Ninh',
        items: [
          {
            product_id: validProductId,
            quantity: 500,
            unit_price: 150000,
            line_total: 75000000,
          },
        ],
      };

      const result = salesOrderSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.carrier_name).toBe('Công ty Vận tải Hải Vân');
        expect(result.data.vehicle_plate).toBe('29C-888.99');
        expect(result.data.driver_info).toBe('Nguyễn Văn Tài - 0987654321');
        expect(result.data.delivery_location).toBe('Kho tổng Viglacera Bắc Ninh');
      }
    });
  });

  describe('purchaseOrderSchema', () => {
    const validSupplierId = '22222222-2222-2222-2222-222222222201';
    const validMaterialId = '7331dc1f-0cb8-4efe-9fe1-e67b611d77d0';

    it('accepts valid purchase order', () => {
      const valid = {
        po_code: 'PO-2026-001',
        supplier_id: validSupplierId,
        order_date: '2026-10-15',
        expected_delivery_date: '2026-10-25',
        currency: 'VND',
        tax_rate: 10,
        payment_terms: '15 ngày sau nghiệm thu',
        status: 'confirmed' as const,
        items: [
          {
            material_id: validMaterialId,
            quantity: 2000,
            unit_price: 200000,
            line_total: 400000000,
            received_quantity: 0,
          },
        ],
      };

      const result = purchaseOrderSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.po_code).toBe('PO-2026-001');
        expect(result.data.items[0]?.quantity).toBe(2000);
      }
    });

    it('rejects purchase order with invalid status', () => {
      const invalid = {
        po_code: 'PO-BAD-STATUS',
        supplier_id: validSupplierId,
        order_date: '2026-10-15',
        status: 'invalid_status',
        items: [
          {
            material_id: validMaterialId,
            quantity: 100,
            unit_price: 50000,
            line_total: 5000000,
          },
        ],
      };

      const result = purchaseOrderSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects purchase order item with negative unit price', () => {
      const invalidItem = {
        material_id: validMaterialId,
        quantity: 10,
        unit_price: -100,
        line_total: 0,
      };

      const result = purchaseOrderItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });
});
