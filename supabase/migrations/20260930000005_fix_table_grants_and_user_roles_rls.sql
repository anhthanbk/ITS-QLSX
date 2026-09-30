-- Migration: Fix Table Grants and User Roles RLS
-- Description: Grants table permissions to authenticated & anon roles (so RLS policies can take effect)
-- and adds policies for user_roles and role_permissions.

-- 1. Grant schema usage and table privileges to authenticated and anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

-- 2. Helper functions with search_path security
CREATE OR REPLACE FUNCTION public.has_role(p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() AND p.code = p_permission
  );
$$;

-- 3. RLS Policies for user_roles and role_permissions
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_user_roles" ON public.user_roles;
CREATE POLICY "auth_read_user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role('admin'));

DROP POLICY IF EXISTS "admin_manage_user_roles" ON public.user_roles;
CREATE POLICY "admin_manage_user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "auth_read_role_permissions" ON public.role_permissions;
CREATE POLICY "auth_read_role_permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- 4. Ensure departments, positions, employees write policies allow admin and appropriate permissions
DROP POLICY IF EXISTS "auth_write_departments" ON public.departments;
CREATE POLICY "auth_write_departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'))
WITH CHECK (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'));

DROP POLICY IF EXISTS "auth_write_positions" ON public.positions;
CREATE POLICY "auth_write_positions"
ON public.positions
FOR ALL
TO authenticated
USING (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'))
WITH CHECK (public.has_role('admin') OR public.has_permission('hr.department.manage') OR public.has_permission('master_data.manage'));

DROP POLICY IF EXISTS "auth_write_employees" ON public.employees;
CREATE POLICY "auth_write_employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.has_role('admin') OR public.has_permission('hr.employee.manage') OR public.has_permission('master_data.manage'))
WITH CHECK (public.has_role('admin') OR public.has_permission('hr.employee.manage') OR public.has_permission('master_data.manage'));
