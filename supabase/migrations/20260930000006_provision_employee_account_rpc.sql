-- Migration: 20260930000006_provision_employee_account_rpc.sql
-- Description: RPC functions allowing admin to provision, link, manage and reset accounts for HR employees.

-- 1. Function to provision or link an account to an employee
CREATE OR REPLACE FUNCTION public.admin_provision_employee_account(
  p_employee_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_role_code TEXT DEFAULT 'operator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_employee RECORD;
  v_user_id UUID;
  v_role_id UUID;
  v_existing_profile_id UUID;
  v_other_emp_id UUID;
  v_norm_email TEXT;
BEGIN
  -- 1. Check permissions (must be admin or have hr.employee.manage)
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền cấp tài khoản hệ thống.';
  END IF;

  -- 2. Verify employee exists
  SELECT * INTO v_employee FROM public.employees WHERE id = p_employee_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ nhân viên.';
  END IF;

  -- 3. Normalize email
  v_norm_email := lower(trim(COALESCE(p_email, v_employee.email)));
  IF v_norm_email IS NULL OR v_norm_email = '' THEN
    RAISE EXCEPTION 'Vui lòng cung cấp email hợp lệ để tạo tài khoản.';
  END IF;

  -- 4. Check if employee already has a linked profile
  SELECT id INTO v_existing_profile_id FROM public.profiles WHERE employee_id = p_employee_id;
  IF v_existing_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Nhân viên này đã được liên kết với một tài khoản hệ thống.';
  END IF;

  -- 5. Check if role exists
  SELECT id INTO v_role_id FROM public.roles WHERE code = p_role_code;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Vai trò hệ thống không hợp lệ: %', p_role_code;
  END IF;

  -- 6. Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_norm_email;

  IF v_user_id IS NOT NULL THEN
    -- User already exists: check if linked to another employee
    SELECT employee_id INTO v_other_emp_id FROM public.profiles WHERE id = v_user_id;
    IF v_other_emp_id IS NOT NULL AND v_other_emp_id <> p_employee_id THEN
      RAISE EXCEPTION 'Email % đã được liên kết với một nhân viên khác.', v_norm_email;
    END IF;

    -- Link profile
    UPDATE public.profiles
    SET employee_id = p_employee_id,
        full_name = v_employee.last_name || ' ' || v_employee.first_name,
        phone = COALESCE(v_employee.phone, phone),
        status = 'active',
        updated_at = now()
    WHERE id = v_user_id;

    -- Update password if provided
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 6 THEN
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(trim(p_password), extensions.gen_salt('bf')),
          updated_at = now()
      WHERE id = v_user_id;
    END IF;
  ELSE
    -- User does not exist in auth.users: validate password
    IF p_password IS NULL OR length(trim(p_password)) < 6 THEN
      RAISE EXCEPTION 'Mật khẩu phải có tối thiểu 6 ký tự.';
    END IF;

    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_norm_email,
      extensions.crypt(trim(p_password), extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', v_employee.last_name || ' ' || v_employee.first_name,
        'role', p_role_code,
        'employee_id', p_employee_id
      ),
      'authenticated',
      'authenticated',
      now(),
      now()
    );

    -- Ensure profile exists and is linked
    INSERT INTO public.profiles (id, full_name, employee_id, phone, status)
    VALUES (
      v_user_id,
      v_employee.last_name || ' ' || v_employee.first_name,
      p_employee_id,
      v_employee.phone,
      'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET employee_id = p_employee_id,
        full_name = EXCLUDED.full_name,
        status = 'active';
  END IF;

  -- 7. Assign role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- 8. Also update employee email if it was empty
  IF v_employee.email IS NULL OR v_employee.email = '' THEN
    UPDATE public.employees
    SET email = v_norm_email, updated_at = now()
    WHERE id = p_employee_id;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'employee_id', p_employee_id,
    'email', v_norm_email,
    'role_code', p_role_code
  );
END;
$$;

-- 2. Function to unlink account from employee
CREATE OR REPLACE FUNCTION public.admin_unlink_employee_account(p_employee_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền quản lý tài khoản nhân sự.';
  END IF;

  UPDATE public.profiles
  SET employee_id = NULL,
      updated_at = now()
  WHERE employee_id = p_employee_id;

  RETURN true;
END;
$$;

-- 3. Function to toggle user status (active / suspended)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(p_user_id UUID, p_status TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền quản trị trạng thái tài khoản.';
  END IF;

  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ: %', p_status;
  END IF;

  UPDATE public.profiles
  SET status = p_status,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- 4. Function to change user role
CREATE OR REPLACE FUNCTION public.admin_change_user_role(p_user_id UUID, p_new_role_code TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền thay đổi vai trò tài khoản.';
  END IF;

  SELECT id INTO v_role_id FROM public.roles WHERE code = p_new_role_code;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Vai trò không hợp lệ: %', p_new_role_code;
  END IF;

  -- Replace user roles
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  INSERT INTO public.user_roles (user_id, role_id) VALUES (p_user_id, v_role_id);

  RETURN true;
END;
$$;

-- 5. Function to reset user password
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền đặt lại mật khẩu.';
  END IF;

  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(trim(p_new_password), extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- Grant EXECUTE to authenticated
GRANT EXECUTE ON FUNCTION public.admin_provision_employee_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unlink_employee_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password TO authenticated;
