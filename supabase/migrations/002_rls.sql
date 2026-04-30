-- ============================================================
-- FIIMS — Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table warehouses               enable row level security;
alter table bin_locations            enable row level security;
alter table spare_parts              enable row level security;
alter table part_warehouse_levels    enable row level security;
alter table vehicle_models           enable row level security;
alter table vehicles                 enable row level security;
alter table vehicle_documents        enable row level security;
alter table vendors                  enable row level security;
alter table vendor_contacts          enable row level security;
alter table vendor_addresses         enable row level security;
alter table vendor_bank_details      enable row level security;
alter table rate_contracts           enable row level security;
alter table rate_contract_lines      enable row level security;
alter table rate_contract_slabs      enable row level security;
alter table purchase_requisitions    enable row level security;
alter table pr_lines                 enable row level security;
alter table purchase_orders          enable row level security;
alter table po_lines                 enable row level security;
alter table grns                     enable row level security;
alter table grn_lines                enable row level security;
alter table grn_serials              enable row level security;
alter table qc_records               enable row level security;
alter table rejection_slips          enable row level security;
alter table indents                  enable row level security;
alter table indent_lines             enable row level security;
alter table material_issue_notes     enable row level security;
alter table min_lines                enable row level security;
alter table min_serials              enable row level security;
alter table transfers                enable row level security;
alter table transfer_lines           enable row level security;
alter table scrap_records            enable row level security;
alter table return_notes             enable row level security;
alter table return_lines             enable row level security;
alter table serialised_units         enable row level security;
alter table serialised_unit_events   enable row level security;
alter table vendor_scorecards        enable row level security;
alter table warranty_claims          enable row level security;
alter table users                    enable row level security;
alter table audit_logs               enable row level security;
alter table stock_snapshots          enable row level security;

-- ── Helper function: get current user's role ──────────────

create or replace function auth_user_role()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid()
$$;

create or replace function auth_home_warehouse()
returns uuid language sql stable security definer as $$
  select home_warehouse_id from users where id = auth.uid()
$$;

-- ── Users table ──────────────────────────────────────────

-- Users can read their own profile
create policy "users_select_own" on users
  for select using (id = auth.uid());

-- Admin can read all users
create policy "users_select_admin" on users
  for select using (auth_user_role() = 'admin');

-- Admin can manage users
create policy "users_insert_admin" on users
  for insert with check (auth_user_role() = 'admin');

create policy "users_update_admin" on users
  for update using (auth_user_role() = 'admin');

-- ── Master data: read by all authenticated users ──────────

create policy "warehouses_select" on warehouses
  for select using (auth.uid() is not null);

create policy "warehouses_write_admin" on warehouses
  for all using (auth_user_role() in ('admin'));

create policy "bin_locations_select" on bin_locations
  for select using (auth.uid() is not null);

create policy "spare_parts_select" on spare_parts
  for select using (auth.uid() is not null);

create policy "spare_parts_write" on spare_parts
  for all using (auth_user_role() in ('admin', 'procurement'));

create policy "part_warehouse_levels_select" on part_warehouse_levels
  for select using (auth.uid() is not null);

create policy "vehicle_models_select" on vehicle_models
  for select using (auth.uid() is not null);

create policy "vehicles_select" on vehicles
  for select using (auth.uid() is not null);

create policy "vehicles_write" on vehicles
  for all using (auth_user_role() in ('admin', 'fleet_manager'));

create policy "vehicle_documents_select" on vehicle_documents
  for select using (auth.uid() is not null);

create policy "vendors_select" on vendors
  for select using (auth.uid() is not null);

create policy "vendors_write" on vendors
  for all using (auth_user_role() in ('admin', 'procurement', 'finance'));

create policy "vendor_contacts_select" on vendor_contacts
  for select using (auth.uid() is not null);

create policy "vendor_addresses_select" on vendor_addresses
  for select using (auth.uid() is not null);

-- Bank details: Finance and Admin only
create policy "vendor_bank_select" on vendor_bank_details
  for select using (auth_user_role() in ('admin', 'finance'));

create policy "rate_contracts_select" on rate_contracts
  for select using (auth.uid() is not null);

create policy "rate_contracts_write" on rate_contracts
  for all using (auth_user_role() in ('admin', 'procurement', 'finance'));

create policy "rate_contract_lines_select" on rate_contract_lines
  for select using (auth.uid() is not null);

create policy "rate_contract_slabs_select" on rate_contract_slabs
  for select using (auth.uid() is not null);

-- ── Procurement ───────────────────────────────────────────

-- PRs: store managers see only their warehouse
create policy "prs_select" on purchase_requisitions
  for select using (
    auth_user_role() in ('admin', 'fleet_manager', 'procurement', 'finance', 'auditor')
    or (auth_user_role() = 'store_manager' and warehouse_id = auth_home_warehouse())
    or created_by = auth.uid()
  );

create policy "prs_insert" on purchase_requisitions
  for insert with check (
    auth_user_role() in ('admin', 'store_manager', 'procurement')
    and (auth_user_role() != 'store_manager' or warehouse_id = auth_home_warehouse())
  );

create policy "prs_update" on purchase_requisitions
  for update using (
    auth_user_role() in ('admin', 'fleet_manager', 'procurement')
    or created_by = auth.uid()
  );

create policy "pr_lines_select" on pr_lines
  for select using (auth.uid() is not null);

create policy "pr_lines_write" on pr_lines
  for all using (auth.uid() is not null);

create policy "pos_select" on purchase_orders
  for select using (auth.uid() is not null);

create policy "pos_write" on purchase_orders
  for all using (auth_user_role() in ('admin', 'procurement', 'finance'));

create policy "po_lines_select" on po_lines
  for select using (auth.uid() is not null);

create policy "po_lines_write" on po_lines
  for all using (auth_user_role() in ('admin', 'procurement'));

-- GRNs: store managers see only their warehouse
create policy "grns_select" on grns
  for select using (
    auth_user_role() in ('admin', 'procurement', 'finance', 'auditor', 'fleet_manager')
    or (auth_user_role() = 'store_manager' and warehouse_id = auth_home_warehouse())
  );

create policy "grns_write" on grns
  for all using (
    auth_user_role() in ('admin', 'procurement')
    or (auth_user_role() = 'store_manager' and warehouse_id = auth_home_warehouse())
  );

create policy "grn_lines_select" on grn_lines
  for select using (auth.uid() is not null);

create policy "grn_lines_write" on grn_lines
  for all using (auth.uid() is not null);

create policy "grn_serials_select" on grn_serials
  for select using (auth.uid() is not null);

create policy "qc_records_select" on qc_records
  for select using (auth.uid() is not null);

create policy "qc_records_write" on qc_records
  for all using (auth_user_role() in ('admin', 'store_manager', 'procurement'));

create policy "rejection_slips_select" on rejection_slips
  for select using (auth.uid() is not null);

-- ── Outward ──────────────────────────────────────────────

create policy "indents_select" on indents
  for select using (auth.uid() is not null);

create policy "indents_insert" on indents
  for insert with check (auth.uid() is not null);

create policy "indents_update" on indents
  for update using (
    auth_user_role() in ('admin', 'fleet_manager', 'store_manager')
    or created_by = auth.uid()
  );

create policy "indent_lines_select" on indent_lines
  for select using (auth.uid() is not null);

create policy "indent_lines_write" on indent_lines
  for all using (auth.uid() is not null);

create policy "mins_select" on material_issue_notes
  for select using (auth.uid() is not null);

create policy "mins_write" on material_issue_notes
  for all using (auth_user_role() in ('admin', 'store_manager'));

create policy "min_lines_select" on min_lines
  for select using (auth.uid() is not null);

create policy "min_lines_write" on min_lines
  for all using (auth.uid() is not null);

create policy "transfers_select" on transfers
  for select using (auth.uid() is not null);

create policy "transfers_write" on transfers
  for all using (
    auth_user_role() in ('admin', 'fleet_manager')
    or (auth_user_role() = 'store_manager' and (
      source_wh = auth_home_warehouse() or dest_wh = auth_home_warehouse()
    ))
  );

create policy "transfer_lines_select" on transfer_lines
  for select using (auth.uid() is not null);

create policy "transfer_lines_write" on transfer_lines
  for all using (auth.uid() is not null);

create policy "scrap_select" on scrap_records
  for select using (auth.uid() is not null);

create policy "scrap_write" on scrap_records
  for all using (
    auth_user_role() in ('admin', 'fleet_manager')
    or (auth_user_role() = 'store_manager' and warehouse_id = auth_home_warehouse())
  );

create policy "returns_select" on return_notes
  for select using (auth.uid() is not null);

create policy "returns_write" on return_notes
  for all using (auth_user_role() in ('admin', 'store_manager'));

create policy "return_lines_select" on return_lines
  for select using (auth.uid() is not null);

create policy "return_lines_write" on return_lines
  for all using (auth.uid() is not null);

-- ── Lifecycle & Performance ──────────────────────────────

create policy "serialised_units_select" on serialised_units
  for select using (auth.uid() is not null);

create policy "serialised_unit_events_select" on serialised_unit_events
  for select using (auth.uid() is not null);

create policy "vendor_scorecards_select" on vendor_scorecards
  for select using (auth.uid() is not null);

create policy "warranty_claims_select" on warranty_claims
  for select using (auth.uid() is not null);

create policy "warranty_claims_write" on warranty_claims
  for all using (auth_user_role() in ('admin', 'fleet_manager', 'maintenance_lead'));

-- ── Audit Log: append-only ────────────────────────────────

create policy "audit_logs_select" on audit_logs
  for select using (auth_user_role() in ('admin', 'auditor'));

create policy "audit_logs_insert" on audit_logs
  for insert with check (auth.uid() is not null);

-- No UPDATE or DELETE policies on audit_logs — intentionally omitted

create policy "stock_snapshots_select" on stock_snapshots
  for select using (auth.uid() is not null);
