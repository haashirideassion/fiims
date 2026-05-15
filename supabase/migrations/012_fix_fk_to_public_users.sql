-- ============================================================
-- FIIMS — Migration 012: Fix FK references to public.users
--
-- ROOT CAUSE: All user-reference columns (created_by, issued_by,
-- etc.) were declared as REFERENCES auth.users(id). PostgREST
-- only auto-discovers relationships inside the public schema,
-- so queries like users!created_by(name) return PGRST200.
--
-- FIX: Drop every FK that points to auth.users on non-profile
-- tables, then re-add them pointing to public.users(id).
-- The users.id -> auth.users(id) link (the profile table itself)
-- is intentionally kept intact.
-- ============================================================

-- ── Step 1: Dynamically drop all FKs to auth.users ───────────
-- (handles any constraint name PostgreSQL auto-assigned)

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
         AND rc.constraint_schema = tc.table_schema
    JOIN information_schema.table_constraints tc2
      ON tc2.constraint_name = rc.unique_constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema    = 'public'
      AND tc2.table_schema   = 'auth'
      AND tc2.table_name     = 'users'
      AND tc.table_name     != 'users'   -- keep users.id -> auth.users
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      r.table_name, r.constraint_name
    );
    RAISE NOTICE 'Dropped % on %', r.constraint_name, r.table_name;
  END LOOP;
END;
$$;

-- ── Step 2: Re-add all FKs pointing to public.users ──────────

ALTER TABLE warehouses
  ADD CONSTRAINT warehouses_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE spare_parts
  ADD CONSTRAINT spare_parts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE purchase_requisitions
  ADD CONSTRAINT purchase_requisitions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT purchase_requisitions_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE grns
  ADD CONSTRAINT grns_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE qc_records
  ADD CONSTRAINT qc_records_inspector_id_fkey
  FOREIGN KEY (inspector_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE indents
  ADD CONSTRAINT indents_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE material_issue_notes
  ADD CONSTRAINT material_issue_notes_issued_by_fkey
  FOREIGN KEY (issued_by) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT material_issue_notes_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE transfers
  ADD CONSTRAINT transfers_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT transfers_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE scrap_records
  ADD CONSTRAINT scrap_records_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE return_notes
  ADD CONSTRAINT return_notes_returned_by_fkey
  FOREIGN KEY (returned_by) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT return_notes_received_by_fkey
  FOREIGN KEY (received_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE serialised_unit_events
  ADD CONSTRAINT serialised_unit_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE report_schedules
  ADD CONSTRAINT report_schedules_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
