-- Migration: 20261017000027_production_patrol_areas_and_incident_logs.sql
-- Description: Create patrol areas (QR inspection zones), area-machine mappings, patrol logs, and incident reports

-- 1. Table: Khu vực tuần kiểm sản xuất (Patrol Areas / Inspection Zones)
CREATE TABLE IF NOT EXISTS public.production_patrol_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE SET NULL,
  qr_code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  order_index INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: Gán thiết bị máy móc vào khu vực tuần kiểm (Patrol Area Machines)
CREATE TABLE IF NOT EXISTS public.production_patrol_area_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.production_patrol_areas(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 1,
  inspection_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_patrol_area_machine UNIQUE (area_id, machine_id)
);

-- 3. Table: Nhật ký lượt tuần kiểm khu vực (Patrol Logs via QR scan)
CREATE TABLE IF NOT EXISTS public.production_patrol_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.production_patrol_areas(id) ON DELETE RESTRICT,
  shift_id UUID REFERENCES public.production_shifts(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  inspector_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  inspector_name VARCHAR(150) NOT NULL,
  has_issue BOOLEAN NOT NULL DEFAULT false,
  checked_machines_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: Chi tiết sự cố thiết bị phát hiện khi tuần kiểm (Patrol Device Incidents)
CREATE TABLE IF NOT EXISTS public.production_patrol_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_code VARCHAR(50) UNIQUE NOT NULL,
  patrol_log_id UUID REFERENCES public.production_patrol_logs(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.production_patrol_areas(id) ON DELETE SET NULL,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  shift_id UUID REFERENCES public.production_shifts(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reporter_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reporter_name VARCHAR(150) NOT NULL,
  condition_type VARCHAR(100) NOT NULL, -- 'Rung ồn bất thường', 'Nhiệt độ cao', 'Rách lưới sàng', 'Kẹt liệu', 'Rò rỉ dầu/nước', 'Dừng máy'
  description TEXT NOT NULL,
  resolution_type VARCHAR(50) NOT NULL CHECK (resolution_type IN ('resolved', 'temporary_fix', 'maintenance_scheduled')),
  maintenance_work_order_id UUID REFERENCES public.maintenance_work_orders(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patrol_areas_code ON public.production_patrol_areas(area_code);
CREATE INDEX IF NOT EXISTS idx_patrol_areas_qr ON public.production_patrol_areas(qr_code);
CREATE INDEX IF NOT EXISTS idx_patrol_area_machines_area ON public.production_patrol_area_machines(area_id);
CREATE INDEX IF NOT EXISTS idx_patrol_area_machines_machine ON public.production_patrol_area_machines(machine_id);
CREATE INDEX IF NOT EXISTS idx_patrol_logs_area ON public.production_patrol_logs(area_id);
CREATE INDEX IF NOT EXISTS idx_patrol_logs_scanned ON public.production_patrol_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_patrol_incidents_machine ON public.production_patrol_incidents(machine_id);
CREATE INDEX IF NOT EXISTS idx_patrol_incidents_resolution ON public.production_patrol_incidents(resolution_type);
CREATE INDEX IF NOT EXISTS idx_patrol_incidents_reported ON public.production_patrol_incidents(reported_at DESC);

-- Enable RLS
ALTER TABLE public.production_patrol_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_patrol_area_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_patrol_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_patrol_incidents ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "auth_read_patrol_areas" ON public.production_patrol_areas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_patrol_area_machines" ON public.production_patrol_area_machines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_patrol_logs" ON public.production_patrol_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_patrol_incidents" ON public.production_patrol_incidents
  FOR SELECT TO authenticated USING (true);

-- Write policies
CREATE POLICY "auth_write_patrol_areas" ON public.production_patrol_areas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_patrol_area_machines" ON public.production_patrol_area_machines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_patrol_logs" ON public.production_patrol_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_write_patrol_incidents" ON public.production_patrol_incidents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Initial Realistic Patrol Areas and Mappings for Sand Processing Plant
DO $$
DECLARE
  v_line_id UUID;
  v_area1_id UUID := 'a1000000-0000-0000-0000-000000000001';
  v_area2_id UUID := 'a1000000-0000-0000-0000-000000000002';
  v_area3_id UUID := 'a1000000-0000-0000-0000-000000000003';
  v_area4_id UUID := 'a1000000-0000-0000-0000-000000000004';
  v_area5_id UUID := 'a1000000-0000-0000-0000-000000000005';

  v_m_crush UUID;
  v_m_mag UUID;
  v_m_dryer UUID;
  v_m_screen UUID;
  v_m_pack UUID;
  v_m_pump UUID;
BEGIN
  -- Lấy dây chuyền sản xuất mẫu
  SELECT id INTO v_line_id FROM public.production_lines LIMIT 1;

  -- 1. Seed 5 Khu vực tuần kiểm lớn
  INSERT INTO public.production_patrol_areas (id, area_code, name, line_id, qr_code, description, order_index)
  VALUES
    (v_area1_id, 'KV-01-CAPLIEU', 'Khu vực 1: Trạm cấp liệu thô & Nghiền sơ cấp', v_line_id, 'ITS-AREA-KV01', 'Bao gồm phễu cấp liệu rung, băng tải nạp liệu và máy nghiền búa sơ cấp', 1),
    (v_area2_id, 'KV-02-RUASANG', 'Khu vực 2: Cụm tuyển rửa & Tuyển từ ướt', v_line_id, 'ITS-AREA-KV02', 'Bao gồm máy sàng rung rửa cát ướt và cụm máy tuyển từ tách tạp chất sắt', 2),
    (v_area3_id, 'KV-03-BOMCAT', 'Khu vực 3: Trạm bơm bùn cát & Hệ thống Cyclone', v_line_id, 'ITS-AREA-KV03', 'Bao gồm máy bơm bùn cát cao áp, cụm tách bùn Cyclone và bể cô đặc', 3),
    (v_area4_id, 'KV-04-SAYKHO', 'Khu vực 4: Cụm tháp sấy tầng sôi & Lò nhiệt', v_line_id, 'ITS-AREA-KV04', 'Bao gồm máy sấy thùng quay/tầng sôi, lò đốt nhiệt DO và hệ thống lọc bụi túi vải', 4),
    (v_area5_id, 'KV-05-DONGBAO', 'Khu vực 5: Cụm sàng phân loại khô & Đóng bao', v_line_id, 'ITS-AREA-KV05', 'Bao gồm sàng rung đa tầng phân loại cỡ hạt, silo chứa và hệ thống cân đóng bao', 5)
  ON CONFLICT (area_code) DO UPDATE
  SET name = EXCLUDED.name, qr_code = EXCLUDED.qr_code, description = EXCLUDED.description;

  -- Lấy ID các máy móc mẫu
  SELECT id INTO v_m_crush FROM public.machines WHERE machine_code = 'MC-CRUSH-01' LIMIT 1;
  SELECT id INTO v_m_mag FROM public.machines WHERE machine_code = 'MC-MAG-02' LIMIT 1;
  SELECT id INTO v_m_dryer FROM public.machines WHERE machine_code = 'MC-DRYER-01' LIMIT 1;
  SELECT id INTO v_m_screen FROM public.machines WHERE machine_code = 'MC-SCREEN-01' LIMIT 1;
  SELECT id INTO v_m_pack FROM public.machines WHERE machine_code = 'MC-PACK-01' LIMIT 1;
  SELECT id INTO v_m_pump FROM public.machines WHERE machine_code = 'MC-PUMP-01' LIMIT 1;

  -- 2. Gán máy móc vào từng khu vực
  IF v_m_crush IS NOT NULL THEN
    INSERT INTO public.production_patrol_area_machines (area_id, machine_id, sort_order, inspection_notes)
    VALUES (v_area1_id, v_m_crush, 1, 'Kiểm tra độ mài mòn búa nghiền, nhiệt độ gối bi < 75°C, độ căng đai truyền')
    ON CONFLICT (area_id, machine_id) DO NOTHING;
  END IF;

  IF v_m_mag IS NOT NULL THEN
    INSERT INTO public.production_patrol_area_machines (area_id, machine_id, sort_order, inspection_notes)
    VALUES (v_area2_id, v_m_mag, 1, 'Kiểm tra từ trường tang quay, nước rửa màng từ, tình trạng băng tải cao su')
    ON CONFLICT (area_id, machine_id) DO NOTHING;
  END IF;

  IF v_m_screen IS NOT NULL THEN
    INSERT INTO public.production_patrol_area_machines (area_id, machine_id, sort_order, inspection_notes)
    VALUES (v_area2_id, v_m_screen, 2, 'Kiểm tra rách lưới sàng, độ căng lò xo giảm chấn, tiếng ồn động cơ lệch tâm')
    ON CONFLICT (area_id, machine_id) DO NOTHING;
  END IF;

  IF v_m_pump IS NOT NULL THEN
    INSERT INTO public.production_patrol_area_machines (area_id, machine_id, sort_order, inspection_notes)
    VALUES (v_area3_id, v_m_pump, 1, 'Kiểm tra rò rỉ gioăng phớt trục bơm, áp lực xả đường ống bùn cát, nhiệt độ motor')
    ON CONFLICT (area_id, machine_id) DO NOTHING;
  END IF;

  IF v_m_dryer IS NOT NULL THEN
    INSERT INTO public.production_patrol_area_machines (area_id, machine_id, sort_order, inspection_notes)
    VALUES (v_area4_id, v_m_dryer, 1, 'Kiểm tra nhiệt độ khí lò, áp suất chênh lọc bụi, con lăn tì thùng sấy quay')
    ON CONFLICT (area_id, machine_id) DO NOTHING;
  END IF;

  IF v_m_pack IS NOT NULL THEN
    INSERT INTO public.production_patrol_area_machines (area_id, machine_id, sort_order, inspection_notes)
    VALUES (v_area5_id, v_m_pack, 1, 'Kiểm tra độ chính xác cảm biến tải cân, xi lanh kẹp bao cát, phễu xả')
    ON CONFLICT (area_id, machine_id) DO NOTHING;
  END IF;

END;
$$;
