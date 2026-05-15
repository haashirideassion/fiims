-- ============================================================
-- FIIMS — Migration 004: Schema Fixes
-- Adds missing columns, corrects enum constraints,
-- and adds missing RLS write policies.
-- ============================================================

-- ── Warehouses: add city, pincode, operational_hours ─────────

ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city               text;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS pincode            text;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS operational_hours  text;

-- ── Vendors: fix status enum, add categories array ──────────

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_status_check
  CHECK (status IN ('Probation', 'Approved', 'Blacklisted'));

-- Migrate existing rows from old enum values to new ones
UPDATE vendors SET status = 'Approved'   WHERE status = 'Active';
UPDATE vendors SET status = 'Probation'  WHERE status = 'Under Review';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS categories text[];

-- ── Spare Parts: add created_by ─────────────────────────────

ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- ── Purchase Requisitions: add pr_no, rejection_reason ──────

ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS pr_no            text UNIQUE;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ── Purchase Orders: add po_no ───────────────────────────────

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_no text UNIQUE;

-- ── PO Lines: add received_qty ───────────────────────────────

ALTER TABLE po_lines ADD COLUMN IF NOT EXISTS received_qty int NOT NULL DEFAULT 0;

-- ── GRNs: add grn_no ─────────────────────────────────────────

ALTER TABLE grns ADD COLUMN IF NOT EXISTS grn_no text UNIQUE;

-- ── Indent Lines: add issued_qty ─────────────────────────────

ALTER TABLE indent_lines ADD COLUMN IF NOT EXISTS issued_qty int NOT NULL DEFAULT 0;

-- ── Material Issue Notes: add min_no ─────────────────────────

ALTER TABLE material_issue_notes ADD COLUMN IF NOT EXISTS min_no text UNIQUE;

-- ── MIN Lines: add cost_per_unit ─────────────────────────────

ALTER TABLE min_lines ADD COLUMN IF NOT EXISTS cost_per_unit numeric(12,2) NOT NULL DEFAULT 0;

-- ── Transfers: add transfer_no, required_by, reason ─────────

ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_no text UNIQUE;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS required_by date;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS reason      text;

-- ── Scrap Records: add scrap_no ──────────────────────────────

ALTER TABLE scrap_records ADD COLUMN IF NOT EXISTS scrap_no text UNIQUE;

-- ── Return Notes: add return_no ──────────────────────────────

ALTER TABLE return_notes ADD COLUMN IF NOT EXISTS return_no text UNIQUE;

-- ── Warranty Claims: add claim_no, days_in_service ───────────

ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS claim_no        text UNIQUE;
ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS days_in_service int;

-- ── Vendor Addresses: add city, pincode, gstin ───────────────

ALTER TABLE vendor_addresses ADD COLUMN IF NOT EXISTS city    text;
ALTER TABLE vendor_addresses ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE vendor_addresses ADD COLUMN IF NOT EXISTS gstin   char(15);

-- ── Rate Contracts: add 'expiring_soon' to status enum ───────

ALTER TABLE rate_contracts DROP CONSTRAINT IF EXISTS rate_contracts_status_check;
ALTER TABLE rate_contracts ADD CONSTRAINT rate_contracts_status_check
  CHECK (status IN ('Draft', 'Active', 'expiring_soon', 'Expired'));

-- ── Report Schedules: add missing columns ────────────────────

ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS day_of_week   int CHECK (day_of_week  BETWEEN 0 AND 6);
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS day_of_month  int CHECK (day_of_month BETWEEN 1 AND 31);
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS time          text;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS format        text CHECK (format IN ('excel', 'pdf', 'csv'));
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS filters       jsonb DEFAULT '{}'::jsonb;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT true;

-- ── Missing RLS Write Policies ────────────────────────────────

-- vendor_contacts: admin/procurement/finance can write
CREATE POLICY "vendor_contacts_write" ON vendor_contacts
  FOR ALL USING (auth_user_role() IN ('admin', 'procurement', 'finance'));

-- vendor_addresses: admin/procurement/finance can write
CREATE POLICY "vendor_addresses_write" ON vendor_addresses
  FOR ALL USING (auth_user_role() IN ('admin', 'procurement', 'finance'));

-- vendor_bank_details: admin/finance can write
CREATE POLICY "vendor_bank_write" ON vendor_bank_details
  FOR ALL USING (auth_user_role() IN ('admin', 'finance'));

-- rate_contract_lines: admin/procurement/finance can write
CREATE POLICY "rate_contract_lines_write" ON rate_contract_lines
  FOR ALL USING (auth_user_role() IN ('admin', 'procurement', 'finance'));

-- rate_contract_slabs: admin/procurement/finance can write
CREATE POLICY "rate_contract_slabs_write" ON rate_contract_slabs
  FOR ALL USING (auth_user_role() IN ('admin', 'procurement', 'finance'));

-- part_warehouse_levels: admin/procurement can write
CREATE POLICY "part_warehouse_levels_write" ON part_warehouse_levels
  FOR ALL USING (auth_user_role() IN ('admin', 'procurement'));

-- vehicle_models: admin only
CREATE POLICY "vehicle_models_write" ON vehicle_models
  FOR ALL USING (auth_user_role() = 'admin');

-- vehicle_documents: admin/fleet_manager can write
CREATE POLICY "vehicle_documents_write" ON vehicle_documents
  FOR ALL USING (auth_user_role() IN ('admin', 'fleet_manager'));

-- grn_serials: any authenticated can write (part of GRN creation)
CREATE POLICY "grn_serials_write" ON grn_serials
  FOR ALL USING (auth.uid() IS NOT NULL);

-- min_serials: any authenticated can write (part of MIN creation)
CREATE POLICY "min_serials_write" ON min_serials
  FOR ALL USING (auth.uid() IS NOT NULL);

-- serialised_units: admin/store_manager/procurement can write
CREATE POLICY "serialised_units_write" ON serialised_units
  FOR ALL USING (auth_user_role() IN ('admin', 'store_manager', 'procurement'));

-- serialised_unit_events: any authenticated can insert (trigger also inserts)
CREATE POLICY "serialised_unit_events_insert" ON serialised_unit_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- stock_snapshots: any authenticated can insert (used by cron & triggers)
CREATE POLICY "stock_snapshots_insert" ON stock_snapshots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- report_schedules: admin can write; others can read (already covered)
CREATE POLICY "report_schedules_write" ON report_schedules
  FOR ALL USING (auth_user_role() = 'admin');

-- rejection_slips: admin/store_manager/procurement can write
CREATE POLICY "rejection_slips_write" ON rejection_slips
  FOR ALL USING (auth_user_role() IN ('admin', 'store_manager', 'procurement'));
