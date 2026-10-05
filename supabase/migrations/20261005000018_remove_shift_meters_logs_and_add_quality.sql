-- Migration: 20261005000018_remove_shift_meters_logs_and_add_quality.sql
-- Description: Drop unused production_shift_meter_readings and production_shift_logs tables; add actual_quality_rate_pct to production_shifts

-- 1. Drop unused tables and their indexes/triggers
DROP TABLE IF EXISTS public.production_shift_meter_readings CASCADE;
DROP TABLE IF EXISTS public.production_shift_logs CASCADE;

-- 2. Add actual_quality_rate_pct to production_shifts defaulting to 100%
ALTER TABLE public.production_shifts 
ADD COLUMN IF NOT EXISTS actual_quality_rate_pct NUMERIC(5, 2) DEFAULT 100.00 
CHECK (actual_quality_rate_pct >= 0 AND actual_quality_rate_pct <= 100);

UPDATE public.production_shifts 
SET actual_quality_rate_pct = 100.00 
WHERE actual_quality_rate_pct IS NULL;
