-- Migration: 20260930000007_self_registration_approval_flow.sql
-- Description: Self-registration with Approval Workflow, auto-generated employee codes, and gatekeeper.

-- 1. Drop old unused RPCs from previous option
DROP FUNCTION IF EXISTS public.admin_provision_employee_account(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_unlink_employee_account(UUID);
DROP FUNCTION IF EXISTS public.admin_toggle_user_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_change_user_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_reset_user_password(UUID, TEXT);

-- 2. Alter public.profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS temp_employee_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('pending', 'active', 'suspended', 'rejected'));
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Sequence for registration count
CREATE SEQUENCE IF NOT EXISTS public.employee_reg_seq START WITH 1 INCREMENT BY 1;

-- 4. Function to generate Employee Code: [Dept]-[Pos]-[Seq]
CREATE OR REPLACE FUNCTION public.generate_employee_code(p_dept_id UUID, p_pos_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_dept_code TEXT;
  v_pos_code TEXT;
  v_seq BIGINT;
BEGIN
  SELECT code INTO v_dept_code FROM public.departments WHERE id = p_dept_id;
  SELECT code INTO v_pos_code FROM public.positions WHERE id = p_pos_id;
  v_seq := nextval('public.employee_reg_seq');
  
  RETURN COALESCE(v_dept_code, 'VP') || '-' || COALESCE(v_pos_code, 'NV') || '-' || LPAD(v_seq::text, 3, '0');
END;
$$;

-- 5. Updated handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_role_id UUID;
  v_dept_id UUID;
  v_pos_id UUID;
  v_dob DATE;
  v_phone TEXT;
  v_id_card TEXT;
  v_temp_code TEXT;
  v_status TEXT;
BEGIN
  -- Check if this is the very first user (bootstrapping admin)
  SELECT (COUNT(*) <= 0) INTO v_is_first_user FROM public.profiles;

  IF v_is_first_user THEN
    v_status := 'active';
    v_temp_code := 'ADMIN-001';
  ELSE
    v_status := 'pending';
    BEGIN
      v_dept_id := (NEW.raw_user_meta_data->>'department_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_dept_id := NULL;
    END;

    BEGIN
      v_pos_id := (NEW.raw_user_meta_data->>'position_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_pos_id := NULL;
    END;

    BEGIN
      v_dob := (NEW.raw_user_meta_data->>'date_of_birth')::DATE;
    EXCEPTION WHEN OTHERS THEN
      v_dob := NULL;
    END;

    v_phone := NEW.raw_user_meta_data->>'phone';
    v_id_card := NEW.raw_user_meta_data->>'id_card_number';

    -- Generate temporary employee code
    v_temp_code := public.generate_employee_code(v_dept_id, v_pos_id);
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    phone,
    date_of_birth,
    id_card_number,
    department_id,
    position_id,
    temp_employee_code,
    status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    v_phone,
    v_dob,
    v_id_card,
    v_dept_id,
    v_pos_id,
    v_temp_code,
    v_status
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth),
      department_id = COALESCE(EXCLUDED.department_id, profiles.department_id),
      position_id = COALESCE(EXCLUDED.position_id, profiles.position_id),
      temp_employee_code = COALESCE(EXCLUDED.temp_employee_code, profiles.temp_employee_code);

  -- If first user, assign admin role
  IF v_is_first_user THEN
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'admin';
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (NEW.id, v_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC: admin_approve_registration
CREATE OR REPLACE FUNCTION public.admin_approve_registration(
  p_profile_id UUID,
  p_employee_code TEXT,
  p_role_code TEXT,
  p_hire_date DATE DEFAULT CURRENT_DATE,
  p_department_id UUID DEFAULT NULL,
  p_position_id UUID DEFAULT NULL,
  p_direct_manager_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_profile RECORD;
  v_user_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_name_parts TEXT[];
  v_role_id UUID;
  v_new_emp_id UUID;
  v_final_dept_id UUID;
  v_final_pos_id UUID;
BEGIN
  -- 1. Check permissions
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền xét duyệt hồ sơ đăng ký.';
  END IF;

  -- 2. Fetch profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người dùng.';
  END IF;

  IF v_profile.status = 'active' AND v_profile.employee_id IS NOT NULL THEN
    RAISE EXCEPTION 'Hồ sơ này đã được phê duyệt và liên kết nhân viên.';
  END IF;

  -- 3. Fetch user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_profile_id;

  -- 4. Split full_name into last_name and first_name
  v_name_parts := string_to_array(trim(v_profile.full_name), ' ');
  IF array_length(v_name_parts, 1) > 1 THEN
    v_first_name := v_name_parts[array_length(v_name_parts, 1)];
    v_last_name := array_to_string(v_name_parts[1:array_length(v_name_parts, 1)-1], ' ');
  ELSE
    v_first_name := v_profile.full_name;
    v_last_name := '';
  END IF;

  -- 5. Determine department & position
  v_final_dept_id := COALESCE(p_department_id, v_profile.department_id);
  v_final_pos_id := COALESCE(p_position_id, v_profile.position_id);

  IF v_final_dept_id IS NULL THEN
    SELECT id INTO v_final_dept_id FROM public.departments LIMIT 1;
  END IF;
  IF v_final_pos_id IS NULL THEN
    SELECT id INTO v_final_pos_id FROM public.positions LIMIT 1;
  END IF;

  -- 6. Validate role
  SELECT id INTO v_role_id FROM public.roles WHERE code = p_role_code;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Vai trò hệ thống không hợp lệ: %', p_role_code;
  END IF;

  -- 7. Insert into public.employees
  INSERT INTO public.employees (
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    department_id,
    position_id,
    direct_manager_id,
    hire_date,
    status
  ) VALUES (
    trim(p_employee_code),
    v_first_name,
    v_last_name,
    v_user_email,
    v_profile.phone,
    v_final_dept_id,
    v_final_pos_id,
    p_direct_manager_id,
    COALESCE(p_hire_date, CURRENT_DATE),
    'active'
  )
  RETURNING id INTO v_new_emp_id;

  -- 8. Update profile: link to employee, set active, clear rejection
  UPDATE public.profiles
  SET employee_id = v_new_emp_id,
      status = 'active',
      department_id = v_final_dept_id,
      position_id = v_final_pos_id,
      temp_employee_code = NULL,
      rejection_reason = NULL,
      updated_at = now()
  WHERE id = p_profile_id;

  -- 9. Assign user role
  DELETE FROM public.user_roles WHERE user_id = p_profile_id;
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (p_profile_id, v_role_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'employee_id', v_new_emp_id,
    'employee_code', p_employee_code,
    'user_id', p_profile_id,
    'role_code', p_role_code
  );
END;
$$;

-- 7. RPC: admin_reject_registration
CREATE OR REPLACE FUNCTION public.admin_reject_registration(
  p_profile_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền từ chối hồ sơ đăng ký.';
  END IF;

  UPDATE public.profiles
  SET status = 'rejected',
      rejection_reason = p_reason,
      updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

-- 8. RPC: get_pending_registrations
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(30),
  date_of_birth DATE,
  id_card_number VARCHAR(30),
  department_id UUID,
  position_id UUID,
  temp_employee_code VARCHAR(50),
  status VARCHAR(20),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  department_name TEXT,
  department_code TEXT,
  position_title TEXT,
  position_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage') OR public.has_permission('hr.employee.read')) THEN
    RAISE EXCEPTION 'Bạn không có quyền xem danh sách chờ phê duyệt.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email::VARCHAR(255),
    p.phone,
    p.date_of_birth,
    p.id_card_number,
    p.department_id,
    p.position_id,
    p.temp_employee_code,
    p.status,
    p.rejection_reason,
    p.created_at,
    d.name::TEXT AS department_name,
    d.code::TEXT AS department_code,
    pos.title::TEXT AS position_title,
    pos.code::TEXT AS position_code
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.departments d ON d.id = p.department_id
  LEFT JOIN public.positions pos ON pos.id = p.position_id
  WHERE p.status IN ('pending', 'rejected')
  ORDER BY p.created_at DESC;
END;
$$;

-- 9. Grants
GRANT USAGE, SELECT ON SEQUENCE public.employee_reg_seq TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_employee_code TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_registrations TO authenticated;

-- 10. Anon read policies for active departments and positions (for signup form)
DROP POLICY IF EXISTS "anon_read_active_departments" ON public.departments;
CREATE POLICY "anon_read_active_departments" ON public.departments
FOR SELECT TO anon
USING (status = 'active');

DROP POLICY IF EXISTS "anon_read_active_positions" ON public.positions;
CREATE POLICY "anon_read_active_positions" ON public.positions
FOR SELECT TO anon
USING (true);
