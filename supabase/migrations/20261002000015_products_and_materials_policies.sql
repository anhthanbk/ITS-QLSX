-- Migration: 20261002000015_products_and_materials_policies.sql
-- Description: Configure RLS write policies for materials and products tables

-- 1. Materials write policy for authorized roles
DROP POLICY IF EXISTS "auth_write_materials" ON public.materials;
CREATE POLICY "auth_write_materials" ON public.materials
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('warehouse_keeper') OR 
    has_permission('warehouse.transact') OR 
    has_permission('master_data.manage')
  )
  WITH CHECK (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('warehouse_keeper') OR 
    has_permission('warehouse.transact') OR 
    has_permission('master_data.manage')
  );

-- 2. Products write policy for authorized roles
DROP POLICY IF EXISTS "auth_write_products" ON public.products;
CREATE POLICY "auth_write_products" ON public.products
  FOR ALL TO authenticated
  USING (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('warehouse_keeper') OR 
    has_permission('warehouse.transact') OR 
    has_permission('master_data.manage')
  )
  WITH CHECK (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('warehouse_keeper') OR 
    has_permission('warehouse.transact') OR 
    has_permission('master_data.manage')
  );
