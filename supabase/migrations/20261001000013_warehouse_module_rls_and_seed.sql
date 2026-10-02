-- Migration: 20261001000013_warehouse_module_rls_and_seed.sql
-- Description: Configure RLS policies for warehouses, inventory_transactions and inventory_stock_balance, and seed initial warehouses/materials/transactions.

-- 1. Ensure RLS is enabled
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_balance ENABLE ROW LEVEL SECURITY;

-- 2. Warehouses RLS policies
DROP POLICY IF EXISTS "auth_read_warehouses" ON public.warehouses;
CREATE POLICY "auth_read_warehouses" ON public.warehouses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_write_warehouses" ON public.warehouses;
CREATE POLICY "auth_write_warehouses" ON public.warehouses
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

-- 3. Inventory Transactions RLS policies
DROP POLICY IF EXISTS "auth_read_inventory_tx" ON public.inventory_transactions;
CREATE POLICY "auth_read_inventory_tx" ON public.inventory_transactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_write_inventory_tx" ON public.inventory_transactions;
CREATE POLICY "auth_write_inventory_tx" ON public.inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role('admin') OR 
    has_role('plant_manager') OR 
    has_role('warehouse_keeper') OR 
    has_permission('warehouse.transact')
  );

-- 4. Inventory Stock Balance RLS policies
DROP POLICY IF EXISTS "auth_read_inventory_balance" ON public.inventory_stock_balance;
CREATE POLICY "auth_read_inventory_balance" ON public.inventory_stock_balance
  FOR SELECT TO authenticated USING (true);
