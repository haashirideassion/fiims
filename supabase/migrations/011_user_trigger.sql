-- ============================================================
-- FIIMS — Migration 011: Auto-create user profile on signup
-- Creates a row in public.users whenever a new auth.users
-- record is inserted (i.e., every time someone signs up or
-- is created via the Supabase Dashboard / Admin API).
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, role, status)
  VALUES (
    NEW.id,
    -- Use display name from metadata if provided, else derive from email
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    -- Allow role to be passed in metadata at signup; default to 'store_manager'
    COALESCE(NEW.raw_user_meta_data->>'role', 'store_manager'),
    'Active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (fires on every new signup / user creation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ── Backfill: create profiles for any existing auth users ─────
-- This inserts a default profile for every auth user that does not yet
-- have a row in public.users. Run once after applying this migration.

INSERT INTO public.users (id, name, role, status)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    SPLIT_PART(au.email, '@', 1)
  ),
  COALESCE(au.raw_user_meta_data->>'role', 'store_manager'),
  'Active'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;
