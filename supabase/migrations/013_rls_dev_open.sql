-- ============================================================
-- FIIMS — Migration 013: Open RLS for Development
-- ============================================================
-- WHY THIS EXISTS
--   auth_user_role() returns NULL when public.users has no
--   row for the current auth.uid() (e.g. user created before
--   migration 011 ran, or home_warehouse_id not set for a
--   store_manager).  Every write policy evaluates
--   NULL IN ('admin', ...) → FALSE → 403 on every mutation.
--
-- WHAT THIS DOES
--   1. Drops all existing role-based policies dynamically.
--   2. Replaces auth_user_role() with a NULL-safe version.
--   3. Backfills public.users for any auth.users without a
--      profile (ensures reads of own profile never fail).
--   4. Adds a single permissive FOR ALL USING (true) policy
--      per table so every authenticated user has full access.
--
-- PRODUCTION MIGRATION PATH
--   Delete or reverse this file and reinstate 002_rls.sql +
--   004_schema_fixes.sql policies once roles and warehouse
--   assignments are properly configured for all users.
-- ============================================================

-- ── 1. Drop ALL existing RLS policies (dynamic) ──────────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM   pg_policies
    WHERE  schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END
$$;

-- ── 2. NULL-safe helper functions ─────────────────────────────
-- Returns the user's role; falls back to 'store_manager' so
-- no query ever returns NULL and breaks boolean comparisons.

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'store_manager'
  )
$$;

-- Returns the user's home warehouse; NULL is safe here
-- because policies no longer depend on it.
CREATE OR REPLACE FUNCTION auth_home_warehouse()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT home_warehouse_id FROM public.users WHERE id = auth.uid()
$$;

-- ── 3. Backfill missing public.users profiles ─────────────────
-- Any auth.users row that has no public.users row gets a
-- default profile so auth_user_role() never returns NULL.

INSERT INTO public.users (id, name, role, status)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ),
  COALESCE(au.raw_user_meta_data->>'role', 'admin'),  -- default admin for dev
  'Active'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Also promote any existing profiles to admin for dev convenience
-- (remove this UPDATE in production)
UPDATE public.users
SET role = 'admin'
WHERE role = 'store_manager'
  AND home_warehouse_id IS NULL;

-- ── 4. Permissive policies — authenticated users ──────────────
-- One FOR ALL policy per table.  PostgreSQL ORs permissive
-- policies, so USING (true) guarantees access regardless of
-- any other policy that may be added later.

-- ─── System ──────────────────────────────────────────────────

CREATE POLICY "dev_open" ON users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON audit_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON stock_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Master data ─────────────────────────────────────────────

CREATE POLICY "dev_open" ON warehouses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON bin_locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON spare_parts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON part_warehouse_levels
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vehicle_models
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vehicles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vehicle_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Vendors ─────────────────────────────────────────────────

CREATE POLICY "dev_open" ON vendors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vendor_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vendor_addresses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vendor_bank_details
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON rate_contracts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON rate_contract_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON rate_contract_slabs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON vendor_scorecards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON warranty_claims
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Procurement inward ───────────────────────────────────────

CREATE POLICY "dev_open" ON purchase_requisitions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON pr_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON purchase_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON po_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON grns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON grn_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON grn_serials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON qc_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON rejection_slips
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Outward / issuance ──────────────────────────────────────

CREATE POLICY "dev_open" ON indents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON indent_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON material_issue_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON min_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON min_serials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON transfers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON transfer_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON scrap_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON return_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON return_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Lifecycle ────────────────────────────────────────────────

CREATE POLICY "dev_open" ON serialised_units
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dev_open" ON serialised_unit_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Scheduling / reporting ───────────────────────────────────

CREATE POLICY "dev_open" ON report_schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 5. Storage bucket policies ────────────────────────────────
-- Allow authenticated users to read and write all buckets.

DO $$
BEGIN
  -- grn-photos
  INSERT INTO storage.buckets (id, name, public) VALUES ('grn-photos', 'grn-photos', false)
    ON CONFLICT (id) DO NOTHING;
  -- qc-photos
  INSERT INTO storage.buckets (id, name, public) VALUES ('qc-photos', 'qc-photos', false)
    ON CONFLICT (id) DO NOTHING;
  -- part-images
  INSERT INTO storage.buckets (id, name, public) VALUES ('part-images', 'part-images', false)
    ON CONFLICT (id) DO NOTHING;
  -- documents
  INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
    ON CONFLICT (id) DO NOTHING;
  -- signatures
  INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false)
    ON CONFLICT (id) DO NOTHING;
END
$$;

-- Drop old storage policies
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, name AS bucketname FROM storage.policies sp
            JOIN storage.buckets sb ON sp.bucket_id = sb.id
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN
  NULL;  -- storage.policies doesn't exist on all Supabase tiers
END
$$;

-- Single open policy on storage.objects for all authenticated users
DROP POLICY IF EXISTS "dev_storage_open" ON storage.objects;
CREATE POLICY "dev_storage_open" ON storage.objects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
