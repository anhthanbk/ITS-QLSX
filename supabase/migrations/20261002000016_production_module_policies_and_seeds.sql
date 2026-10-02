-- Migration: 20261002000016_production_module_policies_and_seeds.sql
-- Description: Add write RLS policies for production_lines, production_orders, production_batches and seed master production lines

-- 1. Policies for production_lines
DROP POLICY IF EXISTS "auth_write_production_lines" ON public.production_lines;
CREATE POLICY "auth_write_production_lines" ON public.production_lines
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('production_lead') OR 
    has_permission('master_data.manage')
  )
  WITH CHECK (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('production_lead') OR 
    has_permission('master_data.manage')
  );

-- 2. Policies for production_orders
DROP POLICY IF EXISTS "auth_write_production_orders" ON public.production_orders;
CREATE POLICY "auth_write_production_orders" ON public.production_orders
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('production_lead') OR 
    has_permission('production.plan.create') OR
    has_permission('master_data.manage')
  )
  WITH CHECK (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('production_lead') OR 
    has_permission('production.plan.create') OR
    has_permission('master_data.manage')
  );

-- 3. Policies for production_batches
DROP POLICY IF EXISTS "auth_write_production_batches" ON public.production_batches;
CREATE POLICY "auth_write_production_batches" ON public.production_batches
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('production_lead') OR 
    has_role('operator') OR 
    has_permission('production.shift.write') OR
    has_permission('master_data.manage')
  )
  WITH CHECK (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('production_lead') OR 
    has_role('operator') OR 
    has_permission('production.shift.write') OR
    has_permission('master_data.manage')
  );

-- 4. Seed initial Production Lines if empty
INSERT INTO public.production_lines (code, name, department_id, designed_capacity_tph, standard_shift_hours, shifts_per_day, status)
SELECT 
  'LINE-01', 
  'Dây chuyền Tuyển & Rửa Cát thạch anh Thô', 
  d.id, 
  120.00, 
  8.00, 
  3, 
  'active'
FROM public.departments d
WHERE d.code = 'SX'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.production_lines (code, name, department_id, designed_capacity_tph, standard_shift_hours, shifts_per_day, status)
SELECT 
  'LINE-02', 
  'Dây chuyền Phân ly & Nghiền Bột thạch anh Mịn', 
  d.id, 
  65.00, 
  8.00, 
  3, 
  'active'
FROM public.departments d
WHERE d.code = 'SX'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.production_lines (code, name, department_id, designed_capacity_tph, standard_shift_hours, shifts_per_day, status)
SELECT 
  'LINE-03', 
  'Dây chuyền Đóng gói & Bốc xếp Tự động', 
  d.id, 
  80.00, 
  8.00, 
  3, 
  'active'
FROM public.departments d
WHERE d.code = 'SX'
ON CONFLICT (code) DO NOTHING;
