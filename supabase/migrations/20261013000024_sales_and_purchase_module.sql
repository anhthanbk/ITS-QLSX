-- ==============================================================================
-- Migration: 20261013000024_sales_and_purchase_module.sql
-- Description: Complete Sales and Purchase Module Tables, RLS, Permissions & Seeds
-- ==============================================================================

-- 1. Create Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  payment_terms VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0),
  received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_material ON public.purchase_order_items(material_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);

-- 4. Updated At Triggers
DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_sales_orders_updated_at ON public.sales_orders;
CREATE TRIGGER set_sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER set_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 6. Read Policies
DROP POLICY IF EXISTS "auth_read_policy" ON public.purchase_orders;
CREATE POLICY "auth_read_policy" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_read_policy" ON public.purchase_order_items;
CREATE POLICY "auth_read_policy" ON public.purchase_order_items
  FOR SELECT TO authenticated USING (true);

-- 7. Write Policies
DROP POLICY IF EXISTS "auth_write_customers" ON public.customers;
CREATE POLICY "auth_write_customers" ON public.customers
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('master_data.manage')
  )
  WITH CHECK (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('master_data.manage')
  );

DROP POLICY IF EXISTS "auth_write_suppliers" ON public.suppliers;
CREATE POLICY "auth_write_suppliers" ON public.suppliers
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('purchase.order.manage') OR
    has_permission('master_data.manage') OR
    has_permission('warehouse.transact')
  )
  WITH CHECK (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('purchase.order.manage') OR
    has_permission('master_data.manage') OR
    has_permission('warehouse.transact')
  );

DROP POLICY IF EXISTS "auth_write_sales_orders" ON public.sales_orders;
CREATE POLICY "auth_write_sales_orders" ON public.sales_orders
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('sales.order.view')
  )
  WITH CHECK (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('sales.order.view')
  );

DROP POLICY IF EXISTS "auth_write_sales_order_items" ON public.sales_order_items;
CREATE POLICY "auth_write_sales_order_items" ON public.sales_order_items
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('sales.order.view')
  )
  WITH CHECK (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('sales.order.manage') OR
    has_permission('sales.order.view')
  );

DROP POLICY IF EXISTS "auth_write_purchase_orders" ON public.purchase_orders;
CREATE POLICY "auth_write_purchase_orders" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('purchase.order.manage') OR
    has_permission('sales.order.manage') OR
    has_permission('warehouse.transact')
  )
  WITH CHECK (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('purchase.order.manage') OR
    has_permission('sales.order.manage') OR
    has_permission('warehouse.transact')
  );

DROP POLICY IF EXISTS "auth_write_purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "auth_write_purchase_order_items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('purchase.order.manage') OR
    has_permission('sales.order.manage') OR
    has_permission('warehouse.transact')
  )
  WITH CHECK (
    has_role('admin') OR
    has_role('plant_manager') OR
    has_permission('purchase.order.manage') OR
    has_permission('sales.order.manage') OR
    has_permission('warehouse.transact')
  );

-- 8. Seed Standard Permissions for Sales & Purchase
INSERT INTO public.permissions (code, module, action, description)
VALUES
  ('sales.order.view', 'sales', 'read', 'Xem danh sách và chi tiết đơn hàng bán buôn, khách hàng'),
  ('sales.order.manage', 'sales', 'manage', 'Tạo, cập nhật và quản lý đơn đặt hàng bán buôn'),
  ('sales.customer.manage', 'sales', 'manage', 'Thêm mới và cập nhật danh bạ khách hàng'),
  ('purchase.order.view', 'purchase', 'read', 'Xem đơn đặt hàng nhà cung ứng PO và thông tin NCC'),
  ('purchase.order.manage', 'purchase', 'manage', 'Tạo, cập nhật và quản lý đơn đặt hàng NCC'),
  ('purchase.supplier.manage', 'purchase', 'manage', 'Thêm mới và cập nhật nhà cung cấp')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

-- Map to Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'admin'
  AND p.code IN (
    'sales.order.view', 'sales.order.manage', 'sales.customer.manage',
    'purchase.order.view', 'purchase.order.manage', 'purchase.supplier.manage'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map to Plant Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'plant_manager'
  AND p.code IN (
    'sales.order.view', 'sales.order.manage', 'sales.customer.manage',
    'purchase.order.view', 'purchase.order.manage', 'purchase.supplier.manage'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 9. Seed Initial Customers
INSERT INTO public.customers (id, code, name, tax_id, email, phone, address, credit_limit, status)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'KH-VIG', 'Công ty Kính Nổi Viglacera', '0100106204', 'contact@viglacera-glass.vn', '0243556789', 'KCN Yên Phong, Bắc Ninh', 2000000000, 'active'),
  ('11111111-1111-1111-1111-111111111102', 'KH-RD', 'Công ty CP Bóng Đèn Phích Nước Rạng Đông', '0100378057', 'sales@rangdong.com.vn', '02438584310', '87-89 Hạ Đình, Thanh Xuân, Hà Nội', 1500000000, 'active'),
  ('11111111-1111-1111-1111-111111111103', 'KH-CHULAI', 'Công ty Kính Nổi Chu Lai (CFG)', '4000388912', 'info@chulaiglass.vn', '02353567888', 'Khu kinh tế mở Chu Lai, Núi Thành, Quảng Nam', 3000000000, 'active')
ON CONFLICT (code) DO NOTHING;

-- 10. Seed Initial Suppliers
INSERT INTO public.suppliers (id, code, name, tax_id, email, phone, address, status)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'NCC-CR', 'Công ty CP Khai Thác Khoáng Sản Cam Ranh', '4200456789', 'contact@camranh-minerals.vn', '02583856123', 'Bắc Bán Đảo Cam Ranh, Khánh Hòa', 'active'),
  ('22222222-2222-2222-2222-222222222202', 'NCC-PETRO', 'Công ty Xăng Dầu Petrolimex Khánh Hòa', '4200101010', 'khanhhoa@petrolimex.com.vn', '02583822456', 'Số 01 Trần Phú, Nha Trang, Khánh Hòa', 'active'),
  ('22222222-2222-2222-2222-222222222203', 'NCC-CKNH', 'Công ty TNHH Cơ Khí & Thiết Bị Nam Hà', '0105678912', 'sales@namha-tech.com', '02436889900', 'Cụm CN Ngọc Hồi, Thanh Trì, Hà Nội', 'active')
ON CONFLICT (code) DO NOTHING;

-- 11. Seed Initial Sales Orders & Items
INSERT INTO public.sales_orders (
  id, order_code, customer_id, order_date, promised_delivery_date,
  currency, subtotal_amount, tax_amount, total_amount, status, payment_terms, notes
)
VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    'SO-2026-001',
    '11111111-1111-1111-1111-111111111101',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '10 days',
    'VND',
    420000000,
    42000000,
    462000000,
    'confirmed',
    'Thanh toán 30 ngày sau khi giao nhận',
    'Đơn cung ứng cát thủy tinh S100 theo hợp đồng quý IV/2026'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    'SO-2026-002',
    '11111111-1111-1111-1111-111111111102',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '15 days',
    'VND',
    285000000,
    28500000,
    313500000,
    'in_production',
    'Tạm ứng 30%, thanh toán 70% khi nhận hàng',
    'Cát cao cấp S60 phục vụ dây chuyền sản xuất bóng thủy tinh'
  )
ON CONFLICT (order_code) DO NOTHING;

-- Sales Order Items
INSERT INTO public.sales_order_items (id, sales_order_id, product_id, quantity, unit_price, line_total, fulfilled_quantity)
VALUES
  (
    '44444444-4444-4444-4444-444444444401',
    '33333333-3333-3333-3333-333333333301',
    'b9554d09-fa67-4052-8693-a8a8000118a3', -- S100
    1000,
    420000,
    420000000,
    250
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    '33333333-3333-3333-3333-333333333302',
    '5505fa74-1deb-4f2a-8a17-d365c4dd923e', -- S60
    300,
    950000,
    285000000,
    0
  )
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Initial Purchase Orders & Items
INSERT INTO public.purchase_orders (
  id, po_code, supplier_id, order_date, expected_delivery_date,
  currency, subtotal_amount, tax_amount, total_amount, status, payment_terms, notes
)
VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    'PO-2026-001',
    '22222222-2222-2222-2222-222222222201',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '3 days',
    'VND',
    400000000,
    40000000,
    440000000,
    'confirmed',
    'Thanh toán 15 ngày sau khi nghiệm thu kho',
    'Thu mua Cát nguyên khai tháng 10/2026'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    'PO-2026-002',
    '22222222-2222-2222-2222-222222222202',
    CURRENT_DATE - INTERVAL '1 days',
    CURRENT_DATE + INTERVAL '5 days',
    'VND',
    110000000,
    11000000,
    121000000,
    'sent',
    'Chuyển khoản ngay khi giao hàng đến bồn chứa xưởng',
    'Dầu Diesel cấp cho máy phát và xe xúc lật mỏ'
  )
ON CONFLICT (po_code) DO NOTHING;

-- Purchase Order Items
INSERT INTO public.purchase_order_items (id, purchase_order_id, material_id, quantity, unit_price, line_total, received_quantity)
VALUES
  (
    '66666666-6666-6666-6666-666666666601',
    '55555555-5555-5555-5555-555555555501',
    '7331dc1f-0cb8-4efe-9fe1-e67b611d77d0', -- CNK
    2000,
    200000,
    400000000,
    1200
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    '55555555-5555-5555-5555-555555555502',
    '1ff239c0-45d4-4933-a548-c268e67ef092', -- DO
    5000,
    22000,
    110000000,
    0
  )
ON CONFLICT (id) DO NOTHING;
