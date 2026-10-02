-- Migration: 20260930000009_profile_edit_and_employee_sync.sql
-- Description: Profile editing support, admin profile management RLS, profile-to-employee sync trigger, password reset RPC, and admin update employee with profile RPC.

-- 1. RLS policy for Admin to manage profiles
DROP POLICY IF EXISTS "admin_manage_profiles" ON public.profiles;
CREATE POLICY "admin_manage_profiles" ON public.profiles
  FOR ALL
  TO authenticated
  USING (has_role('admin') OR has_permission('hr.employee.manage'))
  WITH CHECK (has_role('admin') OR has_permission('hr.employee.manage'));

-- 2. Trigger: Synchronize profile changes to employees table
CREATE OR REPLACE FUNCTION public.sync_profile_to_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name_parts TEXT[];
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  IF NEW.employee_id IS NOT NULL THEN
    v_name_parts := string_to_array(trim(COALESCE(NEW.full_name, '')), ' ');
    IF array_length(v_name_parts, 1) > 1 THEN
      v_first_name := v_name_parts[array_length(v_name_parts, 1)];
      v_last_name := array_to_string(v_name_parts[1:array_length(v_name_parts, 1)-1], ' ');
    ELSE
      v_first_name := COALESCE(NEW.full_name, '');
      v_last_name := '';
    END IF;

    UPDATE public.employees
    SET first_name = v_first_name,
        last_name = v_last_name,
        phone = COALESCE(NEW.phone, employees.phone),
        updated_at = now()
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_employee ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_employee
  AFTER UPDATE OF full_name, phone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_employee();

-- 3. Function to allow Admin to reset user password
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS BOOLEAN
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

GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;

-- 4. Function for Admin to update employee and linked profile atomically
CREATE OR REPLACE FUNCTION public.admin_update_employee_with_profile(
  p_employee_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_department_id UUID,
  p_position_id UUID,
  p_direct_manager_id UUID,
  p_hire_date DATE,
  p_status TEXT,
  p_date_of_birth DATE DEFAULT NULL,
  p_id_card_number TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_profile RECORD;
  v_full_name TEXT;
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền chỉnh sửa thông tin nhân viên.';
  END IF;

  v_full_name := trim(trim(p_last_name) || ' ' || trim(p_first_name));

  -- 1. Update employees table
  UPDATE public.employees
  SET first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      email = NULLIF(trim(p_email), ''),
      phone = NULLIF(trim(p_phone), ''),
      department_id = p_department_id,
      position_id = p_position_id,
      direct_manager_id = p_direct_manager_id,
      hire_date = p_hire_date,
      status = p_status,
      updated_at = now()
  WHERE id = p_employee_id;

  -- 2. Find linked profile
  SELECT * INTO v_profile FROM public.profiles WHERE employee_id = p_employee_id;
  
  IF FOUND THEN
    UPDATE public.profiles
    SET full_name = v_full_name,
        phone = NULLIF(trim(p_phone), ''),
        date_of_birth = p_date_of_birth,
        id_card_number = NULLIF(trim(p_id_card_number), ''),
        avatar_url = COALESCE(p_avatar_url, v_profile.avatar_url),
        department_id = p_department_id,
        position_id = p_position_id,
        updated_at = now()
    WHERE id = v_profile.id;

    -- 3. If new password provided and valid, update auth password
    IF p_new_password IS NOT NULL AND length(trim(p_new_password)) >= 6 THEN
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(trim(p_new_password), extensions.gen_salt('bf')),
          updated_at = now()
      WHERE id = v_profile.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'employee_id', p_employee_id,
    'profile_id', v_profile.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_employee_with_profile TO authenticated;
