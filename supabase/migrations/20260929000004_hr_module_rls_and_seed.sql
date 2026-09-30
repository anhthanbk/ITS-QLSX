-- Migration: HR Module RLS Policies and Seed Data
-- Description: Sets up security helper functions, RLS write policies, and starter departments/positions.

-- 1. Security Definer Helper Functions
CREATE OR REPLACE FUNCTION public.has_role(p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.code = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() AND p.code = p_permission
  );
$$;

-- 2. Seed HR Permissions
INSERT INTO public.permissions (code, module, action, description)
VALUES
  ('hr.employee.read', 'hr', 'read', 'Xem danh sách và hồ sơ nhân sự'),
  ('hr.employee.manage', 'hr', 'manage', 'Thêm, sửa, xóa thông tin nhân sự'),
  ('hr.department.manage', 'hr', 'manage', 'Quản lý cơ cấu phòng ban và chức danh')
ON CONFLICT (code) DO NOTHING;

-- Map HR permissions to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'admin' AND p.code IN ('hr.employee.read', 'hr.employee.manage', 'hr.department.manage')
ON CONFLICT DO NOTHING;

-- Map HR read permission to plant_manager role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'plant_manager' AND p.code IN ('hr.employee.read')
ON CONFLICT DO NOTHING;

-- 3. RLS Write Policies for departments
DROP POLICY IF EXISTS "auth_write_departments" ON public.departments;
CREATE POLICY "auth_write_departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'))
WITH CHECK (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'));

-- RLS Write Policies for positions
DROP POLICY IF EXISTS "auth_write_positions" ON public.positions;
CREATE POLICY "auth_write_positions"
ON public.positions
FOR ALL
TO authenticated
USING (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'))
WITH CHECK (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'));

-- RLS Write Policies for employees
DROP POLICY IF EXISTS "auth_write_employees" ON public.employees;
CREATE POLICY "auth_write_employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.has_role('admin') OR public.has_permission('hr.employee.manage') OR public.has_permission('master_data.manage'))
WITH CHECK (public.has_role('admin') OR public.has_permission('hr.employee.manage') OR public.has_permission('master_data.manage'));

-- 4. Starter Seed Data for Departments and Positions (if empty)
DO $$
DECLARE
  v_dept_board uuid;
  v_dept_prod uuid;
  v_dept_maint uuid;
  v_dept_qc uuid;
  v_dept_wh uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.departments LIMIT 1) THEN
    -- Departments
    INSERT INTO public.departments (id, code, name, status)
    VALUES (gen_random_uuid(), 'BGD', 'Ban Giám Đốc', 'active')
    RETURNING id INTO v_dept_board;

    INSERT INTO public.departments (id, code, name, status)
    VALUES (gen_random_uuid(), 'SX', 'Phòng Sản Xuất', 'active')
    RETURNING id INTO v_dept_prod;

    INSERT INTO public.departments (id, code, name, status)
    VALUES (gen_random_uuid(), 'KTBT', 'Phòng Kỹ Thuật & Bảo Trì', 'active')
    RETURNING id INTO v_dept_maint;

    INSERT INTO public.departments (id, code, name, status)
    VALUES (gen_random_uuid(), 'KCS', 'Phòng Quản Lý Chất Lượng (KCS)', 'active')
    RETURNING id INTO v_dept_qc;

    INSERT INTO public.departments (id, code, name, status)
    VALUES (gen_random_uuid(), 'KHO', 'Phòng Kho Vận & Vật Tư', 'active')
    RETURNING id INTO v_dept_wh;

    -- Positions
    INSERT INTO public.positions (code, title, department_id, level)
    VALUES
      ('GDBT', 'Giám Đốc Điều Hành Nhà Máy', v_dept_board, 5),
      ('QD_SX', 'Quản Đốc Phân Xưởng', v_dept_prod, 4),
      ('TC_SX', 'Trưởng Ca Sản Xuất', v_dept_prod, 3),
      ('NV_LINE', 'Công Nhân Vận Hành Dây Chuyền', v_dept_prod, 1),
      ('TP_KT', 'Trưởng Phòng Kỹ Thuật', v_dept_maint, 4),
      ('KS_BT', 'Kỹ Sư Cơ Điện & Bảo Trì', v_dept_maint, 2),
      ('TP_KCS', 'Trưởng Bộ Phận KCS', v_dept_qc, 4),
      ('NV_KCS', 'Nhân Viên Kiểm Phẩm KCS', v_dept_qc, 2),
      ('TP_KHO', 'Trưởng Bộ Phận Kho', v_dept_wh, 4),
      ('TT_KHO', 'Thủ Kho Nguyên Liệu & Thành Phẩm', v_dept_wh, 2);

    -- Seed 2 Initial Demo Employees
    INSERT INTO public.employees (
      employee_code, first_name, last_name, email, phone, department_id, position_id, status
    )
    SELECT
      'EMP-001', 'Văn An', 'Nguyễn', 'an.nguyen@its-qlsx.vn', '0901234567',
      v_dept_prod, p.id, 'active'
    FROM public.positions p WHERE p.code = 'QD_SX' LIMIT 1;

    INSERT INTO public.employees (
      employee_code, first_name, last_name, email, phone, department_id, position_id, status
    )
    SELECT
      'EMP-002', 'Thị Mai', 'Trần', 'mai.tran@its-qlsx.vn', '0912345678',
      v_dept_qc, p.id, 'active'
    FROM public.positions p WHERE p.code = 'NV_KCS' LIMIT 1;
  END IF;
END $$;
