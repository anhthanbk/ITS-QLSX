-- Migration: 20261007000021_add_warehouse_sync_to_production_shifts.sql
-- Description: Add warehouse sync tracking columns to production_shifts

ALTER TABLE public.production_shifts
  ADD COLUMN IF NOT EXISTS warehouse_synced BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS warehouse_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prod_shifts_wh_synced 
  ON public.production_shifts(warehouse_synced);
