-- ==============================================================================
-- Migration: 20260929000002_seed_roles_permissions.sql
-- Description: Seed initial standard roles, permissions and mappings
-- ==============================================================================

-- 1. Insert Standard Roles
INSERT INTO public.roles (code, name, description)
VALUES
  ('admin', 'Quản trị hệ thống', 'Toàn quyền cấu hình, phân quyền và quản trị hệ thống'),
  ('plant_manager', 'Quản đốc nhà máy', 'Duyệt kế hoạch sản xuất, giám sát OEE, ký duyệt số liệu ca'),
  ('production_lead', 'Trưởng ca / Quản lý sản xuất', 'Lập kế hoạch, điều hành phân công ca, giám sát downtime'),
  ('operator', 'Công nhân vận hành', 'Ghi nhận số đo cân/điện, cập nhật sản lượng và nhật ký ca'),
  ('qc_inspector', 'Kiểm tra chất lượng (KCS)', 'Kiểm tra chất lượng nguyên liệu, thành phẩm, lập phiếu KCS'),
  ('warehouse_keeper', 'Thủ kho', 'Quản lý tồn kho, xác nhận phiếu nhập/xuất kho thành phẩm và phụ phẩm'),
  ('maintenance_tech', 'Kỹ thuật bảo trì', 'Tiếp nhận phiếu sửa chữa, bảo dưỡng thiết bị, xử lý dừng máy'),
  ('safety_officer', 'Cán bộ An toàn HSSE', 'Giám sát an toàn lao động, điều tra sự cố môi trường'),
  ('accountant', 'Kế toán giá thành', 'Hạch toán chi phí sản xuất, tính giá thành theo đơn/lô')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Insert Standard Permissions
INSERT INTO public.permissions (code, module, action, description)
VALUES
  -- Production Planning
  ('production.plan.read', 'production', 'read', 'Xem kế hoạch sản xuất theo line'),
  ('production.plan.create', 'production', 'create', 'Lập và chỉnh sửa kế hoạch sản xuất'),
  ('production.plan.approve', 'production', 'approve', 'Phê duyệt kế hoạch sản xuất tháng'),

  -- Shift Execution
  ('production.shift.read', 'production', 'read', 'Xem báo cáo vận hành ca'),
  ('production.shift.write', 'production', 'create', 'Nhập chỉ số cân, điện, sản lượng ca'),
  ('production.shift.verify', 'production', 'approve', 'Xác nhận và khóa số liệu ca vận hành'),

  -- Master Data & Norms
  ('master_data.read', 'master_data', 'read', 'Xem danh mục dây chuyền, máy móc, sản phẩm, vật tư'),
  ('master_data.manage', 'master_data', 'update', 'Thêm mới và cập nhật danh mục, định mức kinh tế kỹ thuật'),

  -- Warehouse & Inventory
  ('warehouse.read', 'warehouse', 'read', 'Xem tồn kho và lịch sử giao dịch kho'),
  ('warehouse.transact', 'warehouse', 'create', 'Thực hiện xuất nhập kho và ký nhận thành phẩm/phụ phẩm'),

  -- Quality & KCS
  ('quality.read', 'quality', 'read', 'Xem biên bản KCS và tiêu chuẩn chất lượng'),
  ('quality.inspect', 'quality', 'create', 'Lập biên bản kiểm tra chất lượng và đánh giá lô hàng'),

  -- Maintenance
  ('maintenance.read', 'maintenance', 'read', 'Xem lịch bảo trì và tình trạng thiết bị'),
  ('maintenance.manage', 'maintenance', 'update', 'Tạo và cập nhật phiếu sửa chữa, bảo dưỡng'),

  -- Mining
  ('mining.read', 'mining', 'read', 'Xem nhật ký khai thác và điểm mỏ'),
  ('mining.log', 'mining', 'create', 'Ghi nhật ký khai thác và vận tải quặng'),

  -- HSSE
  ('hsse.read', 'hsse', 'read', 'Xem báo cáo sự cố an toàn môi trường'),
  ('hsse.report', 'hsse', 'create', 'Báo cáo sự cố an toàn lao động'),

  -- Financial Costing
  ('financial.read', 'financial', 'read', 'Xem phân tích giá thành và tiêu hao'),
  ('financial.manage', 'financial', 'update', 'Hạch toán chi phí sản xuất'),

  -- System Audit
  ('audit.read', 'system', 'read', 'Xem nhật ký kiểm toán hệ thống')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

-- 3. Map Permissions to Admin Role (Admin has ALL permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Map Permissions to Plant Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
  'production.plan.read', 'production.plan.create', 'production.plan.approve',
  'production.shift.read', 'production.shift.verify',
  'master_data.read', 'warehouse.read', 'quality.read', 'maintenance.read',
  'mining.read', 'hsse.read', 'financial.read', 'audit.read'
)
WHERE r.code = 'plant_manager'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Map Permissions to Production Lead
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
  'production.plan.read', 'production.plan.create',
  'production.shift.read', 'production.shift.write', 'production.shift.verify',
  'master_data.read', 'warehouse.read', 'quality.read', 'maintenance.read'
)
WHERE r.code = 'production_lead'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. Map Permissions to Operator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
  'production.plan.read',
  'production.shift.read', 'production.shift.write',
  'master_data.read'
)
WHERE r.code = 'operator'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 7. Helper Function: get_user_permissions(user_id)
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_code VARCHAR(100),
  role_code VARCHAR(50)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT p.code AS permission_code, r.code AS role_code
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  JOIN public.role_permissions rp ON r.id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id;
$$;
