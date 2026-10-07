-- Drop verified_by column from production_shifts as shift verification has been removed
ALTER TABLE production_shifts DROP COLUMN IF EXISTS verified_by;
