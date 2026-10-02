-- Migration: 20260930000010_account_lifecycle_and_rejection_flow.sql
-- Description: RPCs for safe employee/account deletion, candidate registration deletion, and rejected profile resubmission.

-- 1. RPC: admin_delete_employee_and_account
CREATE OR REPLACE FUNCTION public.admin_delete_employee_and_account(
  p_employee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_profile_id UUID;
  v_has_tx BOOLEAN := FALSE;
  v_mode TEXT;
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền xóa nhân viên hoặc tài khoản.';
  END IF;

  -- 1. Find linked profile_id / auth.users id
  SELECT id INTO v_profile_id FROM public.profiles WHERE employee_id = p_employee_id;

  -- 2. Clear circular manager links in departments and employees
  UPDATE public.departments SET manager_employee_id = NULL WHERE manager_employee_id = p_employee_id;
  UPDATE public.employees SET direct_manager_id = NULL WHERE direct_manager_id = p_employee_id;

  -- 3. Check transactional records with foreign keys
  -- Quality inspections (RESTRICT)
  IF EXISTS (SELECT 1 FROM public.quality_inspections WHERE inspector_id = p_employee_id) THEN
    v_has_tx := TRUE;
  END IF;

  -- Shift reports
  IF NOT v_has_tx AND EXISTS (SELECT 1 FROM public.shift_reports WHERE supervisor_employee_id = p_employee_id OR operator_employee_id = p_employee_id) THEN
    v_has_tx := TRUE;
  END IF;

  -- Warehouse transactions
  IF NOT v_has_tx AND EXISTS (SELECT 1 FROM public.warehouse_transactions WHERE received_by_employee_id = p_employee_id) THEN
    v_has_tx := TRUE;
  END IF;

  -- Maintenance orders
  IF NOT v_has_tx AND EXISTS (SELECT 1 FROM public.maintenance_orders WHERE assigned_technician_id = p_employee_id) THEN
    v_has_tx := TRUE;
  END IF;

  -- 4. Delete auth user account if linked
  IF v_profile_id IS NOT NULL THEN
    -- Unlink employee_id from profile first so cascade doesn't error
    UPDATE public.profiles SET employee_id = NULL WHERE id = v_profile_id;
    -- Delete from auth.users (cascades to profiles, user_roles, tokens)
    DELETE FROM auth.users WHERE id = v_profile_id;
  END IF;

  -- 5. Employee record disposition
  IF v_has_tx THEN
    UPDATE public.employees
    SET status = 'terminated',
        updated_at = now()
    WHERE id = p_employee_id;
    v_mode := 'terminated';
  ELSE
    DELETE FROM public.employees WHERE id = p_employee_id;
    v_mode := 'deleted';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'employee_id', p_employee_id,
    'profile_id', v_profile_id,
    'mode', v_mode
  );
END;
$$;

-- 2. RPC: admin_delete_registration_profile
CREATE OR REPLACE FUNCTION public.admin_delete_registration_profile(
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage')) THEN
    RAISE EXCEPTION 'Bạn không có quyền xóa hồ sơ đăng ký.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ đăng ký.';
  END IF;

  IF v_profile.employee_id IS NOT NULL THEN
    RAISE EXCEPTION 'Hồ sơ này đã trở thành nhân viên chính thức. Vui lòng quản lý tại danh mục Nhân Sự.';
  END IF;

  -- Delete from auth.users (cascades to profiles, user_roles)
  DELETE FROM auth.users WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$$;

-- 3. RPC: resubmit_rejected_registration
CREATE OR REPLACE FUNCTION public.resubmit_rejected_registration(
  p_full_name TEXT,
  p_date_of_birth DATE,
  p_id_card_number TEXT,
  p_phone TEXT,
  p_department_id UUID,
  p_position_id UUID,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_temp_code TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để thực hiện.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người dùng.';
  END IF;

  IF v_profile.status != 'rejected' THEN
    RAISE EXCEPTION 'Hồ sơ không ở trạng thái bị từ chối.';
  END IF;

  -- Recalculate temp employee code if dept or pos changed
  IF p_department_id IS DISTINCT FROM v_profile.department_id OR p_position_id IS DISTINCT FROM v_profile.position_id THEN
    v_temp_code := public.generate_employee_code(p_department_id, p_position_id);
  ELSE
    v_temp_code := COALESCE(v_profile.temp_employee_code, public.generate_employee_code(p_department_id, p_position_id));
  END IF;

  UPDATE public.profiles
  SET full_name = COALESCE(p_full_name, full_name),
      date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
      id_card_number = COALESCE(p_id_card_number, id_card_number),
      phone = COALESCE(p_phone, phone),
      department_id = p_department_id,
      position_id = p_position_id,
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      temp_employee_code = v_temp_code,
      status = 'pending',
      rejection_reason = NULL,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'temp_employee_code', v_temp_code,
    'status', 'pending'
  );
END;
$$;

-- 4. Grants
GRANT EXECUTE ON FUNCTION public.admin_delete_employee_and_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_registration_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_rejected_registration(TEXT, DATE, TEXT, TEXT, UUID, UUID, TEXT) TO authenticated;
