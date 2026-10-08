-- Migration: Add equipment_code, incident_category, shutdown_type, maintenance_type to production_shift_downtime
-- Migration date: 2026-10-07

ALTER TABLE public.production_shift_downtime
ADD COLUMN IF NOT EXISTS equipment_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS incident_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS shutdown_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(100);

-- Create indexes for performance in Pareto and analytics queries
CREATE INDEX IF NOT EXISTS idx_shift_downtime_equipment_code ON public.production_shift_downtime(equipment_code);
CREATE INDEX IF NOT EXISTS idx_shift_downtime_incident_category ON public.production_shift_downtime(incident_category);
CREATE INDEX IF NOT EXISTS idx_shift_downtime_start_time ON public.production_shift_downtime(start_time);

COMMENT ON COLUMN public.production_shift_downtime.equipment_code IS 'Equipment or machine code identifier for downtime tracking';
COMMENT ON COLUMN public.production_shift_downtime.incident_category IS 'Classification of incident: electrical, mechanical, quality, etc.';
COMMENT ON COLUMN public.production_shift_downtime.shutdown_type IS 'Sub-classification of scheduled shutdown: in_plan, full_warehouse, other';
COMMENT ON COLUMN public.production_shift_downtime.maintenance_type IS 'Sub-classification of maintenance: planned, full_warehouse_maintenance, other';
