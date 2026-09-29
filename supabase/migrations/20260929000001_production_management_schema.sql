-- ==============================================================================
-- Migration: 20260929000001_production_management_schema.sql
-- Description: Complete Production Management System (ITS-QLSX) Schema
-- Engine: PostgreSQL 17 / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. COMMON TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 3. IDENTITY, ROLES, PERMISSIONS & CORE HR
-- ==============================================================================

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role Permissions Junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_employee_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Positions
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(30),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
  direct_manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add circular FK for Department Manager
ALTER TABLE public.departments
  DROP CONSTRAINT IF EXISTS fk_departments_manager;
ALTER TABLE public.departments
  ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Profiles (1-to-1 with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID UNIQUE REFERENCES public.employees(id) ON DELETE SET NULL,
  full_name VARCHAR(200) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ==============================================================================
-- 4. MASTER DATA (Suppliers, Customers, Materials, Products, BOM, Warehouses)
-- ==============================================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  tax_id VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(30),
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  tax_id VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(30),
  address TEXT,
  credit_limit NUMERIC(15, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  min_stock_level NUMERIC(15, 4) NOT NULL DEFAULT 0,
  max_stock_level NUMERIC(15, 4),
  reorder_point NUMERIC(15, 4) NOT NULL DEFAULT 0,
  standard_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
  preferred_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  product_type VARCHAR(30) NOT NULL CHECK (product_type IN ('finished_good', 'semi_finished', 'by_product')),
  unit_of_measure VARCHAR(20) NOT NULL,
  standard_cycle_time_mins NUMERIC(10, 2) DEFAULT 0,
  standard_labor_cost NUMERIC(15, 2) DEFAULT 0,
  base_sales_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS public.bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity_required NUMERIC(15, 4) NOT NULL CHECK (quantity_required > 0),
  scrap_tolerance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (scrap_tolerance_pct >= 0),
  version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, material_id, version)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  warehouse_type VARCHAR(30) NOT NULL CHECK (warehouse_type IN ('raw_material', 'finished_goods', 'quarantine', 'spare_parts', 'transit', 'byproduct')),
  location TEXT,
  manager_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory Transactions Ledger
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('material', 'product', 'byproduct')),
  item_id UUID NOT NULL,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('inbound_receipt', 'production_issue', 'production_receipt', 'warehouse_transfer', 'inventory_adjustment', 'scrap_disposal', 'sales_dispatch')),
  quantity NUMERIC(15, 4) NOT NULL,
  unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
  reference_doc_type VARCHAR(50),
  reference_doc_id UUID,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materialized Inventory Stock Balance
CREATE TABLE IF NOT EXISTS public.inventory_stock_balance (
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('material', 'product', 'byproduct')),
  item_id UUID NOT NULL,
  current_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  last_transaction_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, item_type, item_id)
);

-- Inventory Balance Trigger Function
CREATE OR REPLACE FUNCTION public.fn_sync_inventory_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.inventory_stock_balance (
    warehouse_id, item_type, item_id, current_quantity, last_transaction_at
  ) VALUES (
    NEW.warehouse_id, NEW.item_type, NEW.item_id, NEW.quantity, NEW.created_at
  )
  ON CONFLICT (warehouse_id, item_type, item_id) DO UPDATE
  SET
    current_quantity = public.inventory_stock_balance.current_quantity + NEW.quantity,
    last_transaction_at = NEW.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inventory_balance ON public.inventory_transactions;
CREATE TRIGGER trg_sync_inventory_balance
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_inventory_balance();

-- ==============================================================================
-- 5. PRODUCTION LINES & TECHNO-ECONOMIC NORMS
-- ==============================================================================

-- Production Lines
CREATE TABLE IF NOT EXISTS public.production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designed_capacity_tph NUMERIC(10, 2) NOT NULL DEFAULT 0,
  standard_shift_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.0,
  shifts_per_day INT NOT NULL DEFAULT 3,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Techno-Economic Norms (Định mức kinh tế kỹ thuật)
CREATE TABLE IF NOT EXISTS public.techno_economic_norms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  norm_code VARCHAR(50) UNIQUE NOT NULL,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_name VARCHAR(150) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  norm_rate NUMERIC(12, 4) NOT NULL CHECK (norm_rate > 0),
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. PRODUCTION PLANNING (Monthly Plans, Product Allocation, By-products, Consumptions)
-- ==============================================================================

-- Monthly Production Plan by Line
CREATE TABLE IF NOT EXISTS public.production_monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  line_id UUID NOT NULL REFERENCES public.production_lines(id) ON DELETE RESTRICT,
  year INT NOT NULL CHECK (year >= 2020),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  planned_capacity_tph NUMERIC(10, 2) NOT NULL,
  planned_recovery_rate_pct NUMERIC(5, 2) NOT NULL CHECK (planned_recovery_rate_pct BETWEEN 0 AND 100),
  total_calendar_hours NUMERIC(8, 2) NOT NULL,
  planned_breakdown_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  planned_maintenance_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  planned_shutdown_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  planned_operating_hours NUMERIC(8, 2) GENERATED ALWAYS AS (
    total_calendar_hours - (planned_breakdown_hours + planned_maintenance_hours + planned_shutdown_hours)
  ) STORED,
  target_quality_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (target_quality_rate_pct BETWEEN 0 AND 100),
  planned_input_material_tons NUMERIC(15, 3) NOT NULL DEFAULT 0,
  planned_output_product_tons NUMERIC(15, 3) NOT NULL DEFAULT 0,
  planned_byproduct_tons NUMERIC(15, 3) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'cancelled')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (line_id, year, month)
);

-- Plan Product Allocations
CREATE TABLE IF NOT EXISTS public.production_plan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.production_monthly_plans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  allocation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (allocation_pct BETWEEN 0 AND 100),
  planned_quantity_tons NUMERIC(15, 3) NOT NULL CHECK (planned_quantity_tons >= 0),
  target_quality_standard TEXT,
  notes TEXT,
  UNIQUE (plan_id, product_id)
);

-- Plan By-products
CREATE TABLE IF NOT EXISTS public.production_plan_byproducts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.production_monthly_plans(id) ON DELETE CASCADE,
  byproduct_name VARCHAR(150) NOT NULL,
  ratio_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  planned_quantity_tons NUMERIC(15, 3) NOT NULL CHECK (planned_quantity_tons >= 0),
  destination_storage TEXT,
  notes TEXT
);

-- Plan Consumptions (calculated from Techno-Economic Norms)
CREATE TABLE IF NOT EXISTS public.production_plan_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.production_monthly_plans(id) ON DELETE CASCADE,
  norm_id UUID REFERENCES public.techno_economic_norms(id) ON DELETE SET NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_name VARCHAR(150) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  norm_rate NUMERIC(12, 4) NOT NULL,
  planned_total_consumption NUMERIC(18, 4) NOT NULL,
  estimated_unit_price NUMERIC(15, 2) DEFAULT 0,
  estimated_total_cost NUMERIC(18, 2) DEFAULT 0
);

-- ==============================================================================
-- 7. MACHINES & PRODUCTION EXECUTION (Orders, Batches)
-- ==============================================================================

-- Machines
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  model VARCHAR(100),
  serial_number VARCHAR(100),
  line_location VARCHAR(100),
  rated_capacity_per_hour NUMERIC(12, 2) DEFAULT 0,
  power_rating_kw NUMERIC(10, 2),
  installation_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'in_maintenance', 'breakdown', 'standby', 'decommissioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Orders (Work Orders)
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  production_plan_id UUID REFERENCES public.production_monthly_plans(id) ON DELETE SET NULL,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  bom_id UUID REFERENCES public.bill_of_materials(id) ON DELETE RESTRICT,
  target_quantity NUMERIC(15, 4) NOT NULL CHECK (target_quantity > 0),
  completed_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (completed_quantity >= 0),
  scrap_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (scrap_quantity >= 0),
  planned_start_date TIMESTAMPTZ NOT NULL,
  planned_end_date TIMESTAMPTZ NOT NULL,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'released', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Batches
CREATE TABLE IF NOT EXISTS public.production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  operator_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  planned_quantity NUMERIC(15, 4) NOT NULL,
  actual_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  scrap_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  shift VARCHAR(20) CHECK (shift IN ('shift_1', 'shift_2', 'shift_3', 'night')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. SHIFT EXECUTION & TRACKING (Shifts, Meter Readings, Receipts, Downtime, Logs)
-- ==============================================================================

-- Shift Performance Record
CREATE TABLE IF NOT EXISTS public.production_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_code VARCHAR(50) UNIQUE NOT NULL,
  line_id UUID NOT NULL REFERENCES public.production_lines(id) ON DELETE RESTRICT,
  shift_date DATE NOT NULL,
  shift_number INT NOT NULL CHECK (shift_number IN (1, 2, 3)),
  standard_shift_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
  total_downtime_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  running_hours NUMERIC(5, 2) GENERATED ALWAYS AS (
    standard_shift_hours - total_downtime_hours
  ) STORED,
  raw_material_input_tons NUMERIC(15, 3) NOT NULL DEFAULT 0,
  product_output_tons NUMERIC(15, 3) NOT NULL DEFAULT 0,
  byproduct_output_tons NUMERIC(15, 3) NOT NULL DEFAULT 0,
  actual_capacity_tph NUMERIC(10, 2) DEFAULT 0,
  actual_recovery_rate_pct NUMERIC(5, 2) DEFAULT 0,
  operator_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'verified')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (line_id, shift_date, shift_number)
);

-- Shift Meter & Scale Readings (Cân, điện, than, dầu, hóa chất)
CREATE TABLE IF NOT EXISTS public.production_shift_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.production_shifts(id) ON DELETE CASCADE,
  meter_code VARCHAR(50) NOT NULL,
  meter_name VARCHAR(150) NOT NULL,
  meter_type VARCHAR(50) NOT NULL CHECK (meter_type IN (
    'input_scale', 'output_scale', 'electric_meter', 'diesel_meter', 'coal_scale', 'water_meter', 'chemical_meter'
  )),
  start_reading NUMERIC(18, 4) NOT NULL,
  end_reading NUMERIC(18, 4) NOT NULL,
  multiplier NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  consumed_quantity NUMERIC(18, 4) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  notes TEXT
);

-- Shift Receipts (Nhập kho thành phẩm và phụ phẩm theo ca)
CREATE TABLE IF NOT EXISTS public.production_shift_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_code VARCHAR(50) UNIQUE NOT NULL,
  shift_id UUID NOT NULL REFERENCES public.production_shifts(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('main_product', 'byproduct')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  byproduct_name VARCHAR(150),
  quantity_tons NUMERIC(15, 3) NOT NULL CHECK (quantity_tons > 0),
  batch_number VARCHAR(50),
  received_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  quality_status VARCHAR(20) NOT NULL DEFAULT 'passed' CHECK (quality_status IN ('passed', 'quarantined', 'failed')),
  receipt_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Shift Downtime Tracking (Dừng chuyền sự cố, bảo trì, nghỉ kế hoạch)
CREATE TABLE IF NOT EXISTS public.production_shift_downtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.production_shifts(id) ON DELETE CASCADE,
  line_id UUID NOT NULL REFERENCES public.production_lines(id) ON DELETE RESTRICT,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  downtime_category VARCHAR(30) NOT NULL CHECK (downtime_category IN (
    'breakdown_incident', 'planned_maintenance', 'scheduled_shutdown', 'no_material', 'power_outage', 'operational_pause'
  )),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes NUMERIC(8, 2) NOT NULL CHECK (duration_minutes >= 0),
  reason TEXT NOT NULL,
  action_taken TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'resolved' CHECK (status IN ('resolved', 'pending', 'waiting_parts')),
  reported_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shift Logs (Nhật ký vận hành: thay đổi thông số, điều chỉnh máy, chỉ đạo)
CREATE TABLE IF NOT EXISTS public.production_shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.production_shifts(id) ON DELETE CASCADE,
  log_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
    'process_parameter', 'equipment_adjustment', 'feed_ore_variation', 'safety_notice', 'management_directive', 'other'
  )),
  content TEXT NOT NULL,
  changed_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Downtime Sync Trigger to update total_downtime_hours in production_shifts
CREATE OR REPLACE FUNCTION public.fn_sync_shift_downtime()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_shift_id UUID;
  v_total_hours NUMERIC(5, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_shift_id := OLD.shift_id;
  ELSE
    v_shift_id := NEW.shift_id;
  END IF;

  SELECT COALESCE(ROUND(SUM(duration_minutes) / 60.0, 2), 0)
  INTO v_total_hours
  FROM public.production_shift_downtime
  WHERE shift_id = v_shift_id;

  UPDATE public.production_shifts
  SET
    total_downtime_hours = LEAST(v_total_hours, standard_shift_hours),
    actual_capacity_tph = CASE
      WHEN (standard_shift_hours - LEAST(v_total_hours, standard_shift_hours)) > 0
      THEN ROUND(product_output_tons / (standard_shift_hours - LEAST(v_total_hours, standard_shift_hours)), 2)
      ELSE 0
    END
  WHERE id = v_shift_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_shift_downtime ON public.production_shift_downtime;
CREATE TRIGGER trg_sync_shift_downtime
  AFTER INSERT OR UPDATE OR DELETE ON public.production_shift_downtime
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_shift_downtime();

-- ==============================================================================
-- 9. MAINTENANCE, MINING, QUALITY, HSSE, SALES, FINANCIAL & AUDIT
-- ==============================================================================

-- Maintenance Plans
CREATE TABLE IF NOT EXISTS public.maintenance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  frequency_days INT NOT NULL CHECK (frequency_days > 0),
  last_performed_date DATE,
  next_due_date DATE NOT NULL,
  standard_duration_hours NUMERIC(6, 2) DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance Work Orders
CREATE TABLE IF NOT EXISTS public.maintenance_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  maintenance_plan_id UUID REFERENCES public.maintenance_plans(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('preventative', 'corrective_breakdown', 'predictive', 'calibration')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reported_issue TEXT,
  root_cause TEXT,
  resolution_summary TEXT,
  downtime_minutes INT NOT NULL DEFAULT 0,
  labor_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  spare_parts_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_parts', 'completed', 'cancelled')),
  scheduled_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mining Sites
CREATE TABLE IF NOT EXISTS public.mining_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  location_coordinates VARCHAR(100),
  mineral_type VARCHAR(100) NOT NULL,
  estimated_reserves_tons NUMERIC(18, 2) DEFAULT 0,
  supervisor_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (status IN ('prospecting', 'operational', 'paused', 'rehabilitating', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mining Extraction Logs
CREATE TABLE IF NOT EXISTS public.mining_extraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_number VARCHAR(50) UNIQUE NOT NULL,
  mining_site_id UUID NOT NULL REFERENCES public.mining_sites(id) ON DELETE RESTRICT,
  extraction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift VARCHAR(20) NOT NULL CHECK (shift IN ('shift_1', 'shift_2', 'shift_3', 'night')),
  equipment_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  operator_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  raw_volume_extracted_tons NUMERIC(15, 3) NOT NULL CHECK (raw_volume_extracted_tons >= 0),
  waste_volume_tons NUMERIC(15, 3) NOT NULL DEFAULT 0 CHECK (waste_volume_tons >= 0),
  haul_trucks_count INT DEFAULT 0,
  destination_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quality Standards
CREATE TABLE IF NOT EXISTS public.quality_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_code VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  parameter_name VARCHAR(100) NOT NULL,
  min_acceptable_value NUMERIC(12, 4),
  max_acceptable_value NUMERIC(12, 4),
  target_value NUMERIC(12, 4),
  unit VARCHAR(30),
  inspection_method TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (product_id IS NOT NULL OR material_id IS NOT NULL)
);

-- Quality Inspections
CREATE TABLE IF NOT EXISTS public.quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number VARCHAR(50) UNIQUE NOT NULL,
  inspection_type VARCHAR(30) NOT NULL CHECK (inspection_type IN ('incoming_material', 'in_process_batch', 'final_product', 'pre_dispatch')),
  batch_id UUID REFERENCES public.production_batches(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  inspector_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  sample_size NUMERIC(12, 4) NOT NULL,
  defective_count NUMERIC(12, 4) NOT NULL DEFAULT 0,
  result VARCHAR(20) NOT NULL CHECK (result IN ('passed', 'failed', 'conditional_pass', 'quarantined')),
  measurements_data JSONB,
  evidence_file_urls TEXT[],
  remarks TEXT,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HSSE Incidents
CREATE TABLE IF NOT EXISTS public.hsse_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  incident_type VARCHAR(30) NOT NULL CHECK (incident_type IN ('near_miss', 'first_aid', 'lost_time_injury', 'environmental_spill', 'property_damage', 'security_breach')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  incident_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(200) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  involved_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reported_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  immediate_actions_taken TEXT,
  root_cause_analysis TEXT,
  corrective_preventative_actions TEXT,
  days_lost INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'under_investigation', 'actions_pending', 'closed')),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  promised_delivery_date DATE,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_production', 'ready_to_ship', 'shipped', 'delivered', 'cancelled')),
  payment_terms VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales Order Items
CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0),
  fulfilled_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Financial Production Cost Accounting
CREATE TABLE IF NOT EXISTS public.financial_production_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  raw_material_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  direct_labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  machine_overhead_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  energy_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_actual_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(15, 4) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. PLAN VS. ACTUAL COMPARISON VIEW
-- ==============================================================================

CREATE OR REPLACE VIEW public.v_production_plan_vs_actual AS
WITH actual_monthly AS (
  SELECT
    ps.line_id,
    EXTRACT(YEAR FROM ps.shift_date)::INT AS year,
    EXTRACT(MONTH FROM ps.shift_date)::INT AS month,
    COUNT(ps.id) AS total_shifts_run,
    SUM(ps.running_hours) AS actual_running_hours,
    SUM(ps.total_downtime_hours) AS actual_downtime_hours,
    SUM(ps.raw_material_input_tons) AS actual_input_tons,
    SUM(ps.product_output_tons) AS actual_product_tons,
    SUM(ps.byproduct_output_tons) AS actual_byproduct_tons,
    CASE
      WHEN SUM(ps.running_hours) > 0
      THEN ROUND((SUM(ps.product_output_tons) / SUM(ps.running_hours)), 2)
      ELSE 0
    END AS actual_avg_capacity_tph,
    CASE
      WHEN SUM(ps.raw_material_input_tons) > 0
      THEN ROUND(((SUM(ps.product_output_tons) / SUM(ps.raw_material_input_tons)) * 100), 2)
      ELSE 0
    END AS actual_recovery_rate_pct
  FROM public.production_shifts ps
  GROUP BY ps.line_id, EXTRACT(YEAR FROM ps.shift_date), EXTRACT(MONTH FROM ps.shift_date)
),
downtime_by_category AS (
  SELECT
    pmp.id AS plan_id,
    COALESCE(SUM(CASE WHEN dt.downtime_category = 'breakdown_incident' THEN dt.duration_minutes / 60.0 ELSE 0 END), 0) AS actual_breakdown_hours,
    COALESCE(SUM(CASE WHEN dt.downtime_category = 'planned_maintenance' THEN dt.duration_minutes / 60.0 ELSE 0 END), 0) AS actual_maintenance_hours,
    COALESCE(SUM(CASE WHEN dt.downtime_category = 'scheduled_shutdown' THEN dt.duration_minutes / 60.0 ELSE 0 END), 0) AS actual_shutdown_hours
  FROM public.production_monthly_plans pmp
  JOIN public.production_shifts ps ON pmp.line_id = ps.line_id
    AND pmp.year = EXTRACT(YEAR FROM ps.shift_date)
    AND pmp.month = EXTRACT(MONTH FROM ps.shift_date)
  LEFT JOIN public.production_shift_downtime dt ON ps.id = dt.shift_id
  GROUP BY pmp.id
)
SELECT
  p.id AS plan_id,
  p.plan_code,
  pl.name AS line_name,
  p.year,
  p.month,
  p.total_calendar_hours,
  p.planned_operating_hours,
  COALESCE(a.actual_running_hours, 0) AS actual_running_hours,
  ROUND(COALESCE(a.actual_running_hours, 0) - p.planned_operating_hours, 2) AS variance_operating_hours,
  p.planned_breakdown_hours,
  COALESCE(dt.actual_breakdown_hours, 0) AS actual_breakdown_hours,
  p.planned_maintenance_hours,
  COALESCE(dt.actual_maintenance_hours, 0) AS actual_maintenance_hours,
  p.planned_capacity_tph,
  COALESCE(a.actual_avg_capacity_tph, 0) AS actual_avg_capacity_tph,
  p.planned_recovery_rate_pct,
  COALESCE(a.actual_recovery_rate_pct, 0) AS actual_recovery_rate_pct,
  ROUND(COALESCE(a.actual_recovery_rate_pct, 0) - p.planned_recovery_rate_pct, 2) AS variance_recovery_rate,
  p.planned_output_product_tons,
  COALESCE(a.actual_product_tons, 0) AS actual_product_tons,
  ROUND(COALESCE(a.actual_product_tons, 0) - p.planned_output_product_tons, 3) AS variance_product_tons,
  CASE
    WHEN p.planned_output_product_tons > 0
    THEN ROUND(((COALESCE(a.actual_product_tons, 0) / p.planned_output_product_tons) * 100), 2)
    ELSE 0
  END AS yield_fulfillment_pct,
  p.planned_byproduct_tons,
  COALESCE(a.actual_byproduct_tons, 0) AS actual_byproduct_tons,
  p.status AS plan_status
FROM public.production_monthly_plans p
JOIN public.production_lines pl ON p.line_id = pl.id
LEFT JOIN actual_monthly a ON p.line_id = a.line_id AND p.year = a.year AND p.month = a.month
LEFT JOIN downtime_by_category dt ON p.id = dt.plan_id;

-- ==============================================================================
-- 11. INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON public.materials(preferred_supplier_id);
CREATE INDEX IF NOT EXISTS idx_bom_product ON public.bill_of_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_material ON public.bill_of_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_warehouse ON public.inventory_transactions(warehouse_id, item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created ON public.inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prod_plans_line_date ON public.production_monthly_plans(line_id, year, month);
CREATE INDEX IF NOT EXISTS idx_prod_shifts_line_date ON public.production_shifts(line_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_meters_shift ON public.production_shift_meter_readings(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_receipts_shift ON public.production_shift_receipts(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_downtime_shift ON public.production_shift_downtime(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_logs_shift ON public.production_shift_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_machines_line ON public.machines(line_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_prod_orders_plan ON public.production_orders(production_plan_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status ON public.production_orders(status);
CREATE INDEX IF NOT EXISTS idx_prod_batches_order ON public.production_batches(production_order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_machine ON public.maintenance_work_orders(machine_id);
CREATE INDEX IF NOT EXISTS idx_mining_site_date ON public.mining_extraction_logs(mining_site_id, extraction_date DESC);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_batch ON public.quality_inspections(batch_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_order ON public.sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- ==============================================================================
-- 12. SECURITY DEFINER HELPER & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.authorize(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.code = required_permission
  );
$$;

-- Enable RLS on ALL tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'roles', 'permissions', 'role_permissions', 'departments', 'positions',
    'employees', 'profiles', 'user_roles', 'suppliers', 'customers',
    'materials', 'products', 'bill_of_materials', 'warehouses',
    'inventory_transactions', 'inventory_stock_balance', 'production_lines',
    'techno_economic_norms', 'production_monthly_plans', 'production_plan_products',
    'production_plan_byproducts', 'production_plan_consumptions', 'machines',
    'production_orders', 'production_batches', 'production_shifts',
    'production_shift_meter_readings', 'production_shift_receipts',
    'production_shift_downtime', 'production_shift_logs', 'maintenance_plans',
    'maintenance_work_orders', 'mining_sites', 'mining_extraction_logs',
    'quality_standards', 'quality_inspections', 'hsse_incidents',
    'sales_orders', 'sales_order_items', 'financial_production_costs', 'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END;
$$;

-- Allow authenticated users to read master data & active production entities
DO $$
DECLARE
  tbl text;
  public_read_tables text[] := ARRAY[
    'roles', 'permissions', 'departments', 'positions', 'employees',
    'profiles', 'suppliers', 'customers', 'materials', 'products',
    'bill_of_materials', 'warehouses', 'production_lines', 'machines',
    'techno_economic_norms', 'production_monthly_plans', 'production_plan_products',
    'production_plan_byproducts', 'production_plan_consumptions', 'production_orders',
    'production_batches', 'production_shifts', 'production_shift_meter_readings',
    'production_shift_receipts', 'production_shift_downtime', 'production_shift_logs',
    'maintenance_plans', 'maintenance_work_orders', 'mining_sites',
    'mining_extraction_logs', 'quality_standards', 'quality_inspections',
    'sales_orders', 'sales_order_items', 'inventory_stock_balance'
  ];
BEGIN
  FOREACH tbl IN ARRAY public_read_tables LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "auth_read_policy" ON public.%I;
       CREATE POLICY "auth_read_policy" ON public.%I FOR SELECT TO authenticated USING (true);',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- Allow authenticated users to insert / update production shifts, logs, meters, receipts, downtime
CREATE POLICY "auth_write_production_shifts" ON public.production_shifts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_shift_meters" ON public.production_shift_meter_readings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_shift_receipts" ON public.production_shift_receipts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_shift_downtime" ON public.production_shift_downtime
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_shift_logs" ON public.production_shift_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_plans" ON public.production_monthly_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_plan_products" ON public.production_plan_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_plan_byproducts" ON public.production_plan_byproducts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_plan_consumptions" ON public.production_plan_consumptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_norms" ON public.techno_economic_norms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_inventory_tx" ON public.inventory_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- User Profiles self-update policy
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.profiles;
CREATE POLICY "users_manage_own_profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Audit logs are insert-only by database triggers/authenticated system
DROP POLICY IF EXISTS "audit_logs_read" ON public.audit_logs;
CREATE POLICY "audit_logs_read" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);
