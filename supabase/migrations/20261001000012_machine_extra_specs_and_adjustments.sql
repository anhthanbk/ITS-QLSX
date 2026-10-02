-- Migration: 20261001000012_machine_extra_specs_and_adjustments.sql
-- Description: Add extra_specs JSONB column to machines and create machine_adjustments table with RLS

-- 1. Add extra_specs column to public.machines
ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS extra_specs JSONB DEFAULT '{}'::jsonb;

-- 2. Create machine_adjustments table
CREATE TABLE IF NOT EXISTS public.machine_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  status_before VARCHAR(30) NOT NULL CHECK (status_before IN ('operational', 'in_maintenance', 'breakdown', 'standby', 'decommissioned')),
  status_after VARCHAR(30) NOT NULL CHECK (status_after IN ('operational', 'in_maintenance', 'breakdown', 'standby', 'decommissioned')),
  operating_condition_before TEXT,
  improvement_content TEXT NOT NULL,
  result TEXT NOT NULL,
  changed_params JSONB DEFAULT '{}'::jsonb,
  applied_to_machine BOOLEAN NOT NULL DEFAULT true,
  performed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by machine_id and performed_at
CREATE INDEX IF NOT EXISTS idx_machine_adjustments_machine_id 
ON public.machine_adjustments(machine_id);

CREATE INDEX IF NOT EXISTS idx_machine_adjustments_performed_at 
ON public.machine_adjustments(performed_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.machine_adjustments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Read Policy: Authenticated users can view adjustments
DROP POLICY IF EXISTS "auth_read_machine_adjustments" ON public.machine_adjustments;
CREATE POLICY "auth_read_machine_adjustments"
ON public.machine_adjustments
FOR SELECT
TO authenticated
USING (true);

-- 5. RLS Write Policy: Admin, plant manager, maintenance tech or users with maintenance permissions
DROP POLICY IF EXISTS "auth_write_machine_adjustments" ON public.machine_adjustments;
CREATE POLICY "auth_write_machine_adjustments"
ON public.machine_adjustments
FOR ALL
TO authenticated
USING (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.machine.manage')
)
WITH CHECK (
  public.has_role('admin') 
  OR public.has_role('maintenance_tech')
  OR public.has_role('plant_manager')
  OR public.has_permission('maintenance.manage') 
  OR public.has_permission('maintenance.machine.manage')
);

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_machine_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_machine_adjustments_updated_at ON public.machine_adjustments;
CREATE TRIGGER trigger_set_machine_adjustments_updated_at
BEFORE UPDATE ON public.machine_adjustments
FOR EACH ROW
EXECUTE FUNCTION public.set_machine_adjustments_updated_at();

-- 7. Seed sample extra_specs and adjustment records for existing seed machines
UPDATE public.machines
SET extra_specs = '{"Tốc độ băng tải": "1.2 m/s", "Bề rộng băng": "650 mm", "Chiều dài tải": "40 m", "Loại con lăn": "Con lăn thép bọc cao su phi 89"}'::jsonb
WHERE machine_code = 'MC-CONV-03' AND (extra_specs IS NULL OR extra_specs = '{}'::jsonb);

UPDATE public.machines
SET extra_specs = '{"Số lượng búa đập": "24 búa", "Vật liệu búa": "Thép đúc hợp kim Mangan", "Khe hở ghi xả": "25 mm", "Tốc độ trục": "980 rpm"}'::jsonb
WHERE machine_code = 'MC-CRUSH-01' AND (extra_specs IS NULL OR extra_specs = '{}'::jsonb);

-- Sample adjustment log for MC-CONV-03
DO $$
DECLARE
  v_conv_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_conv_id FROM public.machines WHERE machine_code = 'MC-CONV-03' LIMIT 1;
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    INSERT INTO public.machine_adjustments (
      machine_id, status_before, status_after,
      operating_condition_before, improvement_content, result,
      changed_params, applied_to_machine, performed_at, created_by
    ) VALUES (
      v_conv_id,
      'breakdown',
      'operational',
      'Băng tải chạy lệch tâm 15mm khi mang tải nặng 50 tấn/h, gây trượt mép và hao mòn con lăn biên.',
      'Cải tiến cụm con lăn tự lựa trung tâm, thay con lăn gạt liệu cao su PU và cân chỉnh lại đối trọng căng băng.',
      'Băng chạy thẳng tâm tuyệt đối, không còn hiện tượng sàng lắc, tốc độ ổn định đạt 1.2 m/s.',
      '{"Tốc độ băng tải": "1.2 m/s", "Tình trạng": "Hoạt động ổn định"}'::jsonb,
      true,
      CURRENT_DATE - INTERVAL '5 days',
      v_user_id
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
