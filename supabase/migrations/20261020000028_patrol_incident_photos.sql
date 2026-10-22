-- Migration: 20261020000028_patrol_incident_photos.sql
-- Thêm cột hình ảnh sự cố và hình ảnh sau khắc phục cho bảng production_patrol_incidents
-- Tạo bucket incident-photos trong Supabase Storage

ALTER TABLE production_patrol_incidents 
ADD COLUMN IF NOT EXISTS incident_image_url TEXT,
ADD COLUMN IF NOT EXISTS resolution_image_url TEXT;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies cho bucket incident-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Incident Photos'
  ) THEN
    CREATE POLICY "Public Access Incident Photos" ON storage.objects
      FOR SELECT USING (bucket_id = 'incident-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Upload Incident Photos'
  ) THEN
    CREATE POLICY "Authenticated Upload Incident Photos" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'incident-photos' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Update Incident Photos'
  ) THEN
    CREATE POLICY "Authenticated Update Incident Photos" ON storage.objects
      FOR UPDATE USING (bucket_id = 'incident-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;
