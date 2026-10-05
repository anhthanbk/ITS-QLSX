-- Migration: Add JSONB detail columns to production_shifts for materials consumption, products output, and downtime breakdown
ALTER TABLE public.production_shifts
ADD COLUMN IF NOT EXISTS materials_consumption JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS products_output JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS downtime_breakdown JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.production_shifts.materials_consumption IS 'Detailed consumption of materials, fuels, and energy during the shift';
COMMENT ON COLUMN public.production_shifts.products_output IS 'Detailed output of registered and out-of-plan products in the shift';
COMMENT ON COLUMN public.production_shifts.downtime_breakdown IS 'Breakdown of downtime: maintenance, incidents (with type, reason, action), and scheduled shutdowns';
