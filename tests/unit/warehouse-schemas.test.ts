import { describe, it, expect } from 'vitest';
import {
  warehouseSchema,
  transactionSchema,
  inventoryAdjustmentSchema,
  materialSchema,
  productSchema,
} from '@/features/warehouse/validation/warehouse-schemas';

describe('Warehouse Validation Schemas', () => {
  describe('warehouseSchema', () => {
    it('validates and accepts valid warehouse data', () => {
      const valid = {
        code: 'K-NVL',
        name: 'Kho Nguyên Vật Liệu Chính',
        warehouse_type: 'raw_material' as const,
        location: 'Khu A',
        status: 'active' as const,
      };

      const result = warehouseSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('K-NVL');
        expect(result.data.name).toBe('Kho Nguyên Vật Liệu Chính');
        expect(result.data.warehouse_type).toBe('raw_material');
      }
    });

    it('transforms lowercase warehouse code to uppercase', () => {
      const input = {
        code: 'k-tp01',
        name: 'Kho Thành Phẩm 01',
        warehouse_type: 'finished_goods' as const,
        status: 'active' as const,
      };

      const result = warehouseSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('K-TP01');
      }
    });

    it('rejects warehouse code with special characters other than _ or -', () => {
      const invalid = {
        code: 'K@HO#1',
        name: 'Kho Sai Mã',
        warehouse_type: 'spare_parts' as const,
        status: 'active' as const,
      };

      const result = warehouseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('chỉ chứa chữ cái, chữ số, gạch nối và gạch dưới');
      }
    });

    it('rejects short warehouse names', () => {
      const invalid = {
        code: 'K-01',
        name: 'A',
        warehouse_type: 'quarantine' as const,
        status: 'active' as const,
      };

      const result = warehouseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('ít nhất 2 ký tự');
      }
    });

    it('validates allowed warehouse types', () => {
      const invalid = {
        code: 'K-02',
        name: 'Kho Không Hợp Lệ',
        warehouse_type: 'invalid_type',
        status: 'active',
      };

      const result = warehouseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('transactionSchema', () => {
    it('validates valid transaction data', () => {
      const valid = {
        warehouse_id: '11111111-1111-1111-1111-111111111111',
        item_type: 'material' as const,
        item_id: '22222222-2222-2222-2222-222222222222',
        transaction_type: 'inbound_receipt' as const,
        quantity: 50.5,
        unit_cost: 650000,
        notes: 'Nhập hàng từ nhà cung cấp',
      };

      const result = transactionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(50.5);
        expect(result.data.unit_cost).toBe(650000);
      }
    });

    it('rejects zero or negative quantity in transactions', () => {
      const invalid = {
        warehouse_id: '11111111-1111-1111-1111-111111111111',
        item_type: 'material' as const,
        item_id: '22222222-2222-2222-2222-222222222222',
        transaction_type: 'production_issue' as const,
        quantity: 0,
      };

      const result = transactionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('lớn hơn 0');
      }
    });

    it('rejects invalid uuid in warehouse_id', () => {
      const invalid = {
        warehouse_id: 'not-a-uuid',
        item_type: 'product' as const,
        item_id: '22222222-2222-2222-2222-222222222222',
        transaction_type: 'production_receipt' as const,
        quantity: 10,
      };

      const result = transactionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('inventoryAdjustmentSchema', () => {
    it('validates valid inventory adjustment', () => {
      const valid = {
        warehouse_id: '11111111-1111-1111-1111-111111111111',
        item_type: 'material' as const,
        item_id: '22222222-2222-2222-2222-222222222222',
        actual_quantity: 120,
        reason: 'Kiểm kê thực tế cuối tháng phát hiện thừa 5 tấn',
      };

      const result = inventoryAdjustmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actual_quantity).toBe(120);
        expect(result.data.reason).toContain('Kiểm kê thực tế');
      }
    });

    it('rejects negative actual quantity', () => {
      const invalid = {
        warehouse_id: '11111111-1111-1111-1111-111111111111',
        item_type: 'material' as const,
        item_id: '22222222-2222-2222-2222-222222222222',
        actual_quantity: -10,
        reason: 'Lý do kiểm kê',
      };

      const result = inventoryAdjustmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('không thể âm');
      }
    });

    it('rejects short reasons for adjustment', () => {
      const invalid = {
        warehouse_id: '11111111-1111-1111-1111-111111111111',
        item_type: 'material' as const,
        item_id: '22222222-2222-2222-2222-222222222222',
        actual_quantity: 100,
        reason: 'a',
      };

      const result = inventoryAdjustmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('materialSchema', () => {
    it('validates and transforms valid material data', () => {
      const valid = {
        code: 'nvl-005',
        name: 'Quặng tuyển tinh Alumina',
        category: 'raw_material' as const,
        unit_of_measure: 'tấn',
        min_stock_level: 100,
        reorder_point: 150,
        standard_cost: 850000,
        status: 'active' as const,
      };

      const result = materialSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('NVL-005');
        expect(result.data.category).toBe('raw_material');
        expect(result.data.min_stock_level).toBe(100);
      }
    });

    it('accepts new proposed material categories: packaging, consumable, fuel_energy', () => {
      const categories = ['packaging', 'consumable', 'fuel_energy'] as const;
      categories.forEach((cat) => {
        const item = {
          code: `TEST-${cat.toUpperCase()}`,
          name: `Vật tư test ${cat}`,
          category: cat,
          unit_of_measure: 'kg',
        };
        const result = materialSchema.safeParse(item);
        expect(result.success).toBe(true);
      });
    });

    it('rejects material with invalid category', () => {
      const invalid = {
        code: 'SP-01',
        name: 'Phụ tùng lỗi nhóm',
        category: 'invalid_cat' as unknown as 'raw_material',
        unit_of_measure: 'cái',
      };

      const result = materialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative stock levels', () => {
      const invalid = {
        code: 'SP-02',
        name: 'Vòng bi',
        category: 'spare_part' as const,
        unit_of_measure: 'cái',
        min_stock_level: -5,
      };

      const result = materialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('productSchema', () => {
    it('validates and accepts valid finished good product data', () => {
      const valid = {
        sku: 'al-sand-01',
        name: 'Alumina cát loại 1 (Al2O3 >= 98.6%)',
        product_type: 'finished_good' as const,
        unit_of_measure: 'Tấn',
        base_sales_price: 9500000,
        standard_cycle_time_mins: 120,
        standard_labor_cost: 450000,
        status: 'active' as const,
      };

      const result = productSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sku).toBe('AL-SAND-01');
        expect(result.data.product_type).toBe('finished_good');
        expect(result.data.base_sales_price).toBe(9500000);
      }
    });

    it('validates semi_finished and by_product types', () => {
      const semiFinished = {
        sku: 'HYD-01',
        name: 'Nhôm Hydroxit Al(OH)3 ẩm',
        product_type: 'semi_finished' as const,
        unit_of_measure: 'Tấn',
      };
      expect(productSchema.safeParse(semiFinished).success).toBe(true);

      const byProduct = {
        sku: 'RED-MUD-01',
        name: 'Bùn đỏ lắng thu hồi',
        product_type: 'by_product' as const,
        unit_of_measure: 'Tấn',
      };
      expect(productSchema.safeParse(byProduct).success).toBe(true);
    });

    it('rejects invalid product type', () => {
      const invalid = {
        sku: 'PRD-01',
        name: 'Sản phẩm lỗi loại',
        product_type: 'raw_material', // not in product_type enum
        unit_of_measure: 'Cái',
      };
      expect(productSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects negative base sales price or labor cost', () => {
      const invalidPrice = {
        sku: 'PRD-02',
        name: 'Sản phẩm giá âm',
        product_type: 'finished_good' as const,
        unit_of_measure: 'Kg',
        base_sales_price: -1000,
      };
      expect(productSchema.safeParse(invalidPrice).success).toBe(false);

      const invalidLabor = {
        sku: 'PRD-03',
        name: 'Sản phẩm nhân công âm',
        product_type: 'finished_good' as const,
        unit_of_measure: 'Kg',
        standard_labor_cost: -500,
      };
      expect(productSchema.safeParse(invalidLabor).success).toBe(false);
    });

    it('rejects invalid SKU characters', () => {
      const invalid = {
        sku: 'SKU@#$!',
        name: 'Sản phẩm sai SKU',
        product_type: 'finished_good' as const,
        unit_of_measure: 'Tấn',
      };
      const result = productSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

