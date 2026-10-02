-- Migration: 20260930000008_candidate_avatar_storage.sql
-- Setup public avatars bucket in Supabase storage and update get_pending_registrations

-- 1. Create public avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Storage RLS policies for avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Avatars'
  ) THEN
    CREATE POLICY "Public Access Avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can upload avatar'
  ) THEN
    CREATE POLICY "Anyone can upload avatar" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can update avatar'
  ) THEN
    CREATE POLICY "Anyone can update avatar" ON storage.objects
      FOR UPDATE USING (bucket_id = 'avatars');
  END IF;
END $$;

-- 3. Update get_pending_registrations to return avatar_url
DROP FUNCTION IF EXISTS public.get_pending_registrations();

CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(200),
  avatar_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(30),
  date_of_birth DATE,
  id_card_number VARCHAR(30),
  department_id UUID,
  position_id UUID,
  temp_employee_code VARCHAR(50),
  status VARCHAR(20),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  department_name TEXT,
  department_code TEXT,
  position_title TEXT,
  position_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (public.has_role('admin') OR public.has_permission('hr.employee.manage') OR public.has_permission('hr.employee.read')) THEN
    RAISE EXCEPTION 'Bạn không có quyền xem danh sách chờ phê duyệt.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    u.email::VARCHAR(255),
    p.phone,
    p.date_of_birth,
    p.id_card_number,
    p.department_id,
    p.position_id,
    p.temp_employee_code,
    p.status,
    p.rejection_reason,
    p.created_at,
    d.name::TEXT AS department_name,
    d.code::TEXT AS department_code,
    pos.title::TEXT AS position_title,
    pos.code::TEXT AS position_code
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.departments d ON d.id = p.department_id
  LEFT JOIN public.positions pos ON pos.id = p.position_id
  WHERE p.status IN ('pending', 'rejected')
  ORDER BY p.created_at DESC;
END;
$$;
