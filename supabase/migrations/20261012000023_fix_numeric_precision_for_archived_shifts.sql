-- Migration: 20261012000023_fix_numeric_precision_for_archived_shifts.sql
-- Description: Expand numeric precision for production_shifts to prevent "numeric field overflow"
-- when archiving / backfilling past years data (e.g., year 2025 with 8760 hours or large volume).

-- 1. Drop trigger(s) that depend on columns before altering column type
DROP TRIGGER IF EXISTS trg_calc_shift_running_hours ON public.production_shifts;

-- 2. Drop dependent view first
DROP VIEW IF EXISTS public.v_production_plan_vs_actual;

-- 3. Drop generated column running_hours
ALTER TABLE public.production_shifts DROP COLUMN IF EXISTS running_hours;

-- 3. Expand precision of numeric columns in production_shifts:
-- standard_shift_hours: from NUMERIC(4,2) (max 99.99h) to NUMERIC(10,2) (hỗ trợ nhập theo kỳ/tháng 720h, cả năm 8760h)
-- total_downtime_hours: from NUMERIC(5,2) to NUMERIC(10,2)
-- actual_recovery_rate_pct: from NUMERIC(5,2) to NUMERIC(10,2) (tránh overflow khi tỷ lệ thu hồi vượt 999.99%)
-- actual_capacity_tph: ensure NUMERIC(10,2)
ALTER TABLE public.production_shifts 
  ALTER COLUMN standard_shift_hours TYPE NUMERIC(10, 2),
  ALTER COLUMN total_downtime_hours TYPE NUMERIC(10, 2),
  ALTER COLUMN actual_recovery_rate_pct TYPE NUMERIC(10, 2),
  ALTER COLUMN actual_capacity_tph TYPE NUMERIC(10, 2);

-- 4. Re-create running_hours with NUMERIC(10, 2)
ALTER TABLE public.production_shifts 
  ADD COLUMN running_hours NUMERIC(10, 2) GENERATED ALWAYS AS (
    standard_shift_hours - total_downtime_hours
  ) STORED;

-- 5. Update fn_sync_shift_downtime trigger function to use NUMERIC(10, 2)
CREATE OR REPLACE FUNCTION public.fn_sync_shift_downtime()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_shift_id UUID;
  v_total_hours NUMERIC(10, 2);
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

-- 6. Re-create view v_production_plan_vs_actual
CREATE OR REPLACE VIEW public.v_production_plan_vs_actual AS
WITH actual_monthly AS (
  SELECT ps.line_id,
    EXTRACT(year FROM ps.shift_date)::integer AS year,
    EXTRACT(month FROM ps.shift_date)::integer AS month,
    count(ps.id) AS total_shifts_run,
    sum(ps.running_hours) AS actual_running_hours,
    sum(ps.total_downtime_hours) AS actual_downtime_hours,
    sum(ps.raw_material_input_tons) AS actual_input_tons,
    sum(ps.product_output_tons) AS actual_product_tons,
    sum(ps.byproduct_output_tons) AS actual_byproduct_tons,
    CASE
      WHEN sum(ps.running_hours) > 0::numeric THEN round(sum(ps.product_output_tons) / sum(ps.running_hours), 2)
      ELSE 0::numeric
    END AS actual_avg_capacity_tph,
    CASE
      WHEN sum(ps.raw_material_input_tons) > 0::numeric THEN round(sum(ps.product_output_tons) / sum(ps.raw_material_input_tons) * 100::numeric, 2)
      ELSE 0::numeric
    END AS actual_recovery_rate_pct
  FROM public.production_shifts ps
  GROUP BY ps.line_id, (EXTRACT(year FROM ps.shift_date)), (EXTRACT(month FROM ps.shift_date))
), downtime_by_category AS (
  SELECT pmp.id AS plan_id,
    COALESCE(sum(
      CASE
        WHEN dt_1.downtime_category::text = 'breakdown_incident'::text THEN dt_1.duration_minutes / 60.0
        ELSE 0::numeric
      END), 0::numeric) AS actual_breakdown_hours,
    COALESCE(sum(
      CASE
        WHEN dt_1.downtime_category::text = 'planned_maintenance'::text THEN dt_1.duration_minutes / 60.0
        ELSE 0::numeric
      END), 0::numeric) AS actual_maintenance_hours,
    COALESCE(sum(
      CASE
        WHEN dt_1.downtime_category::text = 'scheduled_shutdown'::text THEN dt_1.duration_minutes / 60.0
        ELSE 0::numeric
      END), 0::numeric) AS actual_shutdown_hours
  FROM public.production_monthly_plans pmp
    JOIN public.production_shifts ps ON pmp.line_id = ps.line_id AND pmp.year::numeric = EXTRACT(year FROM ps.shift_date) AND pmp.month::numeric = EXTRACT(month FROM ps.shift_date)
    LEFT JOIN public.production_shift_downtime dt_1 ON ps.id = dt_1.shift_id
  GROUP BY pmp.id
)
SELECT p.id AS plan_id,
  p.plan_code,
  pl.name AS line_name,
  p.year,
  p.month,
  p.total_calendar_hours,
  p.planned_operating_hours,
  COALESCE(a.actual_running_hours, 0::numeric) AS actual_running_hours,
  round(COALESCE(a.actual_running_hours, 0::numeric) - p.planned_operating_hours, 2) AS variance_operating_hours,
  p.planned_breakdown_hours,
  COALESCE(dt.actual_breakdown_hours, 0::numeric) AS actual_breakdown_hours,
  p.planned_maintenance_hours,
  COALESCE(dt.actual_maintenance_hours, 0::numeric) AS actual_maintenance_hours,
  p.planned_capacity_tph,
  COALESCE(a.actual_avg_capacity_tph, 0::numeric) AS actual_avg_capacity_tph,
  p.planned_recovery_rate_pct,
  COALESCE(a.actual_recovery_rate_pct, 0::numeric) AS actual_recovery_rate_pct,
  round(COALESCE(a.actual_recovery_rate_pct, 0::numeric) - p.planned_recovery_rate_pct, 2) AS variance_recovery_rate,
  p.planned_output_product_tons,
  COALESCE(a.actual_product_tons, 0::numeric) AS actual_product_tons,
  round(COALESCE(a.actual_product_tons, 0::numeric) - p.planned_output_product_tons, 3) AS variance_product_tons,
  CASE
    WHEN p.planned_output_product_tons > 0::numeric THEN round(COALESCE(a.actual_product_tons, 0::numeric) / p.planned_output_product_tons * 100::numeric, 2)
    ELSE 0::numeric
  END AS yield_fulfillment_pct,
  p.planned_byproduct_tons,
  COALESCE(a.actual_byproduct_tons, 0::numeric) AS actual_byproduct_tons,
  p.status AS plan_status
FROM public.production_monthly_plans p
  JOIN public.production_lines pl ON p.line_id = pl.id
  LEFT JOIN actual_monthly a ON p.line_id = a.line_id AND p.year = a.year AND p.month = a.month
  LEFT JOIN downtime_by_category dt ON p.id = dt.plan_id;
