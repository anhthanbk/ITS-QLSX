-- Migration: 20260930000011_maintenance_module_rls_and_seed.sql
-- Description: Configure RLS write policies and seed initial machines, maintenance plans, and work orders for Maintenance Module

-- 1. Ensure write policies for public.machines
DROP POLICY IF EXISTS "auth_write_machines" ON public.machines;
CREATE POLICY "auth_write_machines"
ON public.machines
FOR ALL
TO authenticated
USING (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.machine.manage')
  OR public.has_permission('master_data.manage')
)
WITH CHECK (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.machine.manage')
  OR public.has_permission('master_data.manage')
);

-- 2. Ensure write policies for public.maintenance_plans
DROP POLICY IF EXISTS "auth_write_maintenance_plans" ON public.maintenance_plans;
CREATE POLICY "auth_write_maintenance_plans"
ON public.maintenance_plans
FOR ALL
TO authenticated
USING (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.schedule.manage')
  OR public.has_permission('master_data.manage')
)
WITH CHECK (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.schedule.manage')
  OR public.has_permission('master_data.manage')
);

-- 3. Ensure write policies for public.maintenance_work_orders
DROP POLICY IF EXISTS "auth_write_maintenance_work_orders" ON public.maintenance_work_orders;
CREATE POLICY "auth_write_maintenance_work_orders"
ON public.maintenance_work_orders
FOR ALL
TO authenticated
USING (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.order.manage')
)
WITH CHECK (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.order.manage')
);

-- 4. Bổ sung các permissions cho phân hệ Bảo trì nếu chưa có
INSERT INTO public.permissions (code, module, action, description)
VALUES
  ('maintenance.machine.view', 'maintenance', 'read', 'Xem danh mục thiết bị máy móc'),
  ('maintenance.machine.manage', 'maintenance', 'update', 'Thêm mới và chỉnh sửa thiết bị máy móc'),
  ('maintenance.schedule.view', 'maintenance', 'read', 'Xem kế hoạch và lịch bảo dưỡng PM'),
  ('maintenance.schedule.manage', 'maintenance', 'update', 'Lập và cập nhật lịch bảo dưỡng PM'),
  ('maintenance.order.view', 'maintenance', 'read', 'Xem phiếu sửa chữa và sự cố thiết bị'),
  ('maintenance.order.manage', 'maintenance', 'update', 'Tạo và cập nhật tiến độ phiếu sửa chữa')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

-- Gán quyền cho role admin và maintenance_tech
DO $$
DECLARE
  v_admin_role_id UUID;
  v_tech_role_id UUID;
  v_pm_role_id UUID;
  p_code TEXT;
  v_perm_id UUID;
  v_perm_codes TEXT[] := ARRAY[
    'maintenance.read', 'maintenance.manage',
    'maintenance.machine.view', 'maintenance.machine.manage',
    'maintenance.schedule.view', 'maintenance.schedule.manage',
    'maintenance.order.view', 'maintenance.order.manage'
  ];
BEGIN
  SELECT id INTO v_admin_role_id FROM public.roles WHERE code = 'admin';
  SELECT id INTO v_tech_role_id FROM public.roles WHERE code = 'maintenance_tech';
  SELECT id INTO v_pm_role_id FROM public.roles WHERE code = 'plant_manager';

  FOREACH p_code IN ARRAY v_perm_codes LOOP
    SELECT id INTO v_perm_id FROM public.permissions WHERE code = p_code;
    IF v_perm_id IS NOT NULL THEN
      -- Map to admin
      IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_admin_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
      END IF;

      -- Map to maintenance_tech
      IF v_tech_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_tech_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
      END IF;

      -- Map to plant_manager
      IF v_pm_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_pm_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 5. Seed initial realistic industrial equipment (Machines) for factory
DO $$
DECLARE
  v_dept_ktbt_id UUID;
  v_m1_id UUID := 'e1000000-0000-0000-0000-000000000001';
  v_m2_id UUID := 'e1000000-0000-0000-0000-000000000002';
  v_m3_id UUID := 'e1000000-0000-0000-0000-000000000003';
  v_m4_id UUID := 'e1000000-0000-0000-0000-000000000004';
  v_m5_id UUID := 'e1000000-0000-0000-0000-000000000005';
  v_tech_emp_id UUID;
BEGIN
  -- Lấy phòng Kỹ Thuật & Bảo Trì
  SELECT id INTO v_dept_ktbt_id FROM public.departments WHERE code = 'KTBT' LIMIT 1;
  IF v_dept_ktbt_id IS NULL THEN
    SELECT id INTO v_dept_ktbt_id FROM public.departments WHERE code = 'SX' LIMIT 1;
  END IF;

  -- Lấy kỹ thuật viên mẫu nếu có
  SELECT id INTO v_tech_emp_id FROM public.employees LIMIT 1;

  -- Machine 1: Máy nghiền búa sơ cấp
  INSERT INTO public.machines (
    id, machine_code, name, department_id, model, serial_number, line_location,
    rated_capacity_per_hour, power_rating_kw, installation_date, status
  ) VALUES (
    v_m1_id, 'MC-CRUSH-01', 'Máy nghiền búa sơ cấp', v_dept_ktbt_id,
    'HAMMER-1200HD', 'SN-2023-CR01', 'Khu vực nghiền thô - Phân xưởng 1',
    45.5, 75.0, '2023-03-15', 'operational'
  ) ON CONFLICT (machine_code) DO UPDATE
  SET name = EXCLUDED.name, status = EXCLUDED.status;

  -- Machine 2: Máy tuyển từ ướt băng chuyền
  INSERT INTO public.machines (
    id, machine_code, name, department_id, model, serial_number, line_location,
    rated_capacity_per_hour, power_rating_kw, installation_date, status
  ) VALUES (
    v_m2_id, 'MC-MAG-02', 'Máy tuyển từ ướt băng chuyền', v_dept_ktbt_id,
    'MAG-SEP-3000', 'SN-2023-MG02', 'Dây chuyền tuyển quặng từ tính',
    30.0, 45.0, '2023-04-10', 'operational'
  ) ON CONFLICT (machine_code) DO UPDATE
  SET name = EXCLUDED.name, status = EXCLUDED.status;

  -- Machine 3: Máy sấy thùng quay công nghiệp
  INSERT INTO public.machines (
    id, machine_code, name, department_id, model, serial_number, line_location,
    rated_capacity_per_hour, power_rating_kw, installation_date, status
  ) VALUES (
    v_m3_id, 'MC-DRYER-01', 'Máy sấy thùng quay công nghiệp', v_dept_ktbt_id,
    'ROTARY-DRY-15', 'SN-2023-DR01', 'Khu vực sấy thành phẩm',
    25.0, 90.0, '2023-05-20', 'in_maintenance'
  ) ON CONFLICT (machine_code) DO UPDATE
  SET name = EXCLUDED.name, status = EXCLUDED.status;

  -- Machine 4: Băng tải cấp liệu B650
  INSERT INTO public.machines (
    id, machine_code, name, department_id, model, serial_number, line_location,
    rated_capacity_per_hour, power_rating_kw, installation_date, status
  ) VALUES (
    v_m4_id, 'MC-CONV-03', 'Hệ thống băng tải cấp liệu B650', v_dept_ktbt_id,
    'CONV-B650-L40', 'SN-2022-CV03', 'Cụm vận chuyển trung chuyển',
    60.0, 22.0, '2022-11-05', 'operational'
  ) ON CONFLICT (machine_code) DO UPDATE
  SET name = EXCLUDED.name, status = EXCLUDED.status;

  -- Machine 5: Máy nén khí trục vít trung tâm
  INSERT INTO public.machines (
    id, machine_code, name, department_id, model, serial_number, line_location,
    rated_capacity_per_hour, power_rating_kw, installation_date, status
  ) VALUES (
    v_m5_id, 'MC-COMP-01', 'Máy nén khí trục vít trung tâm', v_dept_ktbt_id,
    'SCREW-AIR-55KW', 'SN-2024-AC01', 'Trạm khí nén trung tâm',
    0.0, 55.0, '2024-01-12', 'breakdown'
  ) ON CONFLICT (machine_code) DO UPDATE
  SET name = EXCLUDED.name, status = EXCLUDED.status;

  -- 6. Seed Maintenance Plans (PM Schedules)
  INSERT INTO public.maintenance_plans (
    plan_code, machine_id, title, frequency_days, last_performed_date, next_due_date, standard_duration_hours, is_active
  ) VALUES
    ('PM-CRUSH-M', v_m1_id, 'Bảo dưỡng định kỳ hàng tháng: Kiểm tra búa đập & bôi trơn ổ đỡ', 30, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 3.5, true),
    ('PM-MAG-Q', v_m2_id, 'Kiểm tra cường độ từ trường & căn chỉnh khe hở làm việc', 90, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '30 days', 2.0, true),
    ('PM-DRYER-M', v_m3_id, 'Kiểm tra vòng lăn, bánh răng dẫn động và hệ thống vòi đốt', 30, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE + INTERVAL '2 days', 4.0, true),
    ('PM-COMP-W', v_m5_id, 'Xả nước bình tích áp & kiểm tra mức dầu bôi trơn máy nén', 7, CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '1 day', 1.0, true)
  ON CONFLICT (plan_code) DO NOTHING;

  -- 7. Seed Sample Work Orders (Phiếu sửa chữa & sự cố)
  INSERT INTO public.maintenance_work_orders (
    work_order_number, machine_id, type, priority, assigned_technician_id,
    reported_issue, root_cause, resolution_summary, downtime_minutes, labor_hours, spare_parts_cost,
    status, scheduled_date, completed_at
  ) VALUES
    (
      'WO-2026-001', v_m3_id, 'preventative', 'medium', v_tech_emp_id,
      'Bảo dưỡng định kỳ tháng 9 cụm truyền động máy sấy',
      'Định kỳ hao mòn mỡ bôi trơn bạc đạn',
      'Đã thay mỡ bôi trơn chịu nhiệt, siết lại bu lông đế móng',
      120, 2.5, 450000,
      'in_progress', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL
    ),
    (
      'WO-2026-002', v_m5_id, 'corrective_breakdown', 'critical', v_tech_emp_id,
      'Máy nén khí ngắt sự cố do quá nhiệt đầu nén trục vít (Trip 105°C)',
      'Tắc két giải nhiệt dầu bôi trơn do bụi bám lâu ngày',
      NULL,
      180, 4.0, 1200000,
      'open', CURRENT_TIMESTAMP, NULL
    ),
    (
      'WO-2026-003', v_m1_id, 'preventative', 'low', v_tech_emp_id,
      'Căn chỉnh khe hở tấm lót nghiền và đảo chiều đầu búa',
      'Độ mòn tự nhiên sau 500 giờ vận hành',
      'Đã đảo đầu 12 búa nghiền, điều chỉnh khe hở xả về 25mm chuẩn',
      90, 3.0, 0,
      'completed', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '2 hours'
    )
  ON CONFLICT (work_order_number) DO NOTHING;

END;
$$;
