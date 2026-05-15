-- ============================================================
-- FIIMS — User Seed
-- Run this in the Supabase SQL Editor AFTER creating each
-- user via Authentication → Users → "Add User" in the Dashboard.
--
-- OR use the create_demo_user() helper below to create both
-- the auth user and the profile in one call (requires service role).
--
-- Step 1: Go to Supabase Dashboard → Authentication → Users
-- Step 2: "Add User" for each email below (set password to "demo1234")
-- Step 3: Copy each user's UUID from the dashboard
-- Step 4: Run the INSERT below substituting the real UUIDs
-- ============================================================

-- After you have the UUIDs, insert profiles like this:
-- Replace each '<UUID>' with the actual UUID from Auth → Users

-- Example (edit UUIDs before running):
/*
INSERT INTO public.users (id, name, role, home_warehouse_id, status) VALUES
  ('<admin-uuid>',       'Admin User',      'admin',            NULL,                                  'Active'),
  ('<store-uuid>',       'Store Manager',   'store_manager',    '22222222-0000-0000-0000-000000000008', 'Active'),
  ('<fleet-uuid>',       'Fleet Manager',   'fleet_manager',    NULL,                                  'Active'),
  ('<procurement-uuid>', 'Procurement',     'procurement',      NULL,                                  'Active'),
  ('<finance-uuid>',     'Finance',         'finance',          NULL,                                  'Active'),
  ('<maintenance-uuid>', 'Maintenance Lead','maintenance_lead', NULL,                                  'Active'),
  ('<auditor-uuid>',     'Auditor',         'auditor',          NULL,                                  'Active')
ON CONFLICT (id) DO UPDATE
  SET name = excluded.name, role = excluded.role,
      home_warehouse_id = excluded.home_warehouse_id;
*/

-- ── Quick fix: backfill profiles for ALL existing auth users ──
-- Run this if you already created users via the Dashboard and
-- are still seeing the 406 error. It inserts a default profile
-- with role 'store_manager' for anyone missing one.

INSERT INTO public.users (id, name, role, status)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    SPLIT_PART(au.email, '@', 1)
  ),
  COALESCE(au.raw_user_meta_data->>'role', 'admin'),
  'Active'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ── After running the above, update role for specific users ───
-- UPDATE public.users SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
