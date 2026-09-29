-- ==============================================================================
-- Migration: 20260929000003_auth_profiles_trigger.sql
-- Description: Trigger on auth.users to auto-provision profiles and roles
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
  v_is_first_user BOOLEAN;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, avatar_url, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;

  -- Determine if this is the first user
  SELECT (COUNT(*) <= 1) INTO v_is_first_user FROM public.profiles;

  IF v_is_first_user THEN
    SELECT id INTO v_role_id FROM public.roles WHERE code = 'admin';
  ELSE
    SELECT id INTO v_role_id FROM public.roles
    WHERE code = COALESCE(NEW.raw_user_meta_data->>'role', 'operator');
  END IF;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, v_role_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
