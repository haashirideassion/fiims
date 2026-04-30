-- ============================================================
-- FIIMS — Fleet Inventory & IoT Management System
-- Migration 001: Core Schema
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

-- ── Warehouses & Bins ──────────────────────────────────────

create table if not exists warehouses (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  address       text,
  lat           numeric(10,7),
  lng           numeric(10,7),
  gstin         char(15),
  in_charge     text,
  phone         text,
  email         text,
  status        text not null default 'Active' check (status in ('Active','Inactive')),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create table if not exists bin_locations (
  id            uuid primary key default gen_random_uuid(),
  warehouse_id  uuid not null references warehouses(id) on delete cascade,
  aisle         text not null,
  rack          text not null,
  bin           text not null,
  capacity      int,
  unique(warehouse_id, aisle, rack, bin)
);

-- ── Spare Parts ───────────────────────────────────────────

create table if not exists spare_parts (
  id              uuid primary key default gen_random_uuid(),
  sku             text not null unique,
  name            text not null,
  category        text not null,
  oem_no          text,
  alternate_skus  text[],
  uom             text not null default 'Nos',
  hsn             text,
  gst_rate        numeric(5,2) default 18,
  serialised      boolean not null default false,
  shelf_life_flag boolean not null default false,
  spec_sheet_url  text,
  images          text[],
  created_at      timestamptz not null default now()
);

create table if not exists part_warehouse_levels (
  id            uuid primary key default gen_random_uuid(),
  part_id       uuid not null references spare_parts(id) on delete cascade,
  warehouse_id  uuid not null references warehouses(id) on delete cascade,
  min_qty       int not null default 0,
  max_qty       int not null default 0,
  reorder_qty   int not null default 0,
  unique(part_id, warehouse_id)
);

-- ── Vehicles ──────────────────────────────────────────────

create table if not exists vehicle_models (
  id                uuid primary key default gen_random_uuid(),
  make              text not null,
  model             text not null,
  category          text not null check (category in ('BOV','HMV','LMV','Sweeper','Tractor','Other')),
  body_manufacturer text
);

create table if not exists part_vehicle_compatibility (
  part_id         uuid not null references spare_parts(id) on delete cascade,
  model_id        uuid not null references vehicle_models(id) on delete cascade,
  oem_or_equivalent text,
  primary key (part_id, model_id)
);

create table if not exists vehicles (
  id            uuid primary key default gen_random_uuid(),
  reg_no        text not null unique,
  chassis_no    text not null unique,
  engine_no     text not null,
  model_id      uuid references vehicle_models(id),
  zone          text,
  year          int,
  gps_id        text,
  iot_id        text,
  status        text not null default 'Active',
  odometer      int default 0,
  acquired_at   date,
  created_at    timestamptz not null default now()
);

create table if not exists vehicle_documents (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  doc_type      text not null,
  url           text,
  expiry_date   date,
  uploaded_at   timestamptz default now()
);

-- ── Vendors & Contracts ──────────────────────────────────

create table if not exists vendors (
  id               uuid primary key default gen_random_uuid(),
  legal_name       text not null,
  gstin            char(15),
  pan              char(10),
  msme_flag        boolean default false,
  udyam_no         text,
  credit_terms     int default 30,
  status           text not null default 'Active' check (status in ('Active','Blacklisted','Under Review')),
  composite_rating numeric(3,1),
  created_at       timestamptz not null default now()
);

create table if not exists vendor_contacts (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references vendors(id) on delete cascade,
  name          text not null,
  phone         text,
  email         text,
  is_primary    boolean default false
);

create table if not exists vendor_addresses (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references vendors(id) on delete cascade,
  type          text check (type in ('billing','shipping')),
  address       text not null
);

create table if not exists vendor_bank_details (
  id                   uuid primary key default gen_random_uuid(),
  vendor_id            uuid not null references vendors(id) on delete cascade,
  bank_name            text,
  account_no_encrypted text,
  ifsc                 char(11)
);

create table if not exists rate_contracts (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references vendors(id),
  valid_from    date not null,
  valid_until   date not null,
  document_url  text,
  status        text not null default 'Draft' check (status in ('Draft','Active','Expired')),
  created_at    timestamptz not null default now()
);

create table if not exists rate_contract_lines (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references rate_contracts(id) on delete cascade,
  part_id       uuid not null references spare_parts(id),
  uom           text not null default 'Nos',
  price         numeric(12,2) not null
);

create table if not exists rate_contract_slabs (
  id            uuid primary key default gen_random_uuid(),
  line_id       uuid not null references rate_contract_lines(id) on delete cascade,
  qty_from      int not null,
  qty_to        int,
  price         numeric(12,2) not null
);

-- ── Procurement ───────────────────────────────────────────

create table if not exists purchase_requisitions (
  id              uuid primary key default gen_random_uuid(),
  warehouse_id    uuid not null references warehouses(id),
  status          text not null default 'Draft',
  urgency         text not null default 'Normal' check (urgency in ('Normal','Urgent','Critical')),
  approval_trail  jsonb default '[]'::jsonb,
  created_by      uuid references auth.users(id),
  submitted_at    timestamptz,
  approved_by     uuid references auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists pr_lines (
  id                   uuid primary key default gen_random_uuid(),
  pr_id                uuid not null references purchase_requisitions(id) on delete cascade,
  part_id              uuid not null references spare_parts(id),
  qty                  int not null,
  suggested_vendor_id  uuid references vendors(id),
  notes                text
);

create table if not exists purchase_orders (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references vendors(id),
  status          text not null default 'Draft',
  pr_refs         uuid[],
  approval_trail  jsonb default '[]'::jsonb,
  created_by      uuid references auth.users(id),
  issued_at       timestamptz,
  total_value     numeric(14,2) default 0,
  created_at      timestamptz not null default now()
);

create table if not exists po_lines (
  id                       uuid primary key default gen_random_uuid(),
  po_id                    uuid not null references purchase_orders(id) on delete cascade,
  part_id                  uuid not null references spare_parts(id),
  qty                      int not null,
  unit_price               numeric(12,2) not null,
  destination_warehouse_id uuid references warehouses(id),
  contract_line_id         uuid references rate_contract_lines(id)
);

create table if not exists grns (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid references purchase_orders(id),
  warehouse_id    uuid not null references warehouses(id),
  status          text not null default 'Draft',
  created_by      uuid references auth.users(id),
  grn_date        date not null default current_date,
  lead_time_days  int,
  created_at      timestamptz not null default now()
);

create table if not exists grn_lines (
  id            uuid primary key default gen_random_uuid(),
  grn_id        uuid not null references grns(id) on delete cascade,
  po_line_id    uuid references po_lines(id),
  received_qty  int not null,
  batch_no      text,
  mfg_date      date,
  expiry_date   date,
  bin_id        uuid references bin_locations(id),
  photos        text[]
);

create table if not exists grn_serials (
  id            uuid primary key default gen_random_uuid(),
  grn_line_id   uuid not null references grn_lines(id) on delete cascade,
  serial_no     text not null unique
);

create table if not exists qc_records (
  id                uuid primary key default gen_random_uuid(),
  grn_id            uuid not null references grns(id),
  grn_line_id       uuid references grn_lines(id),
  accepted_qty      int not null default 0,
  rejected_qty      int not null default 0,
  reason_code       text,
  checklist_results jsonb,
  photos            text[],
  inspector_id      uuid references auth.users(id),
  qc_date           date not null default current_date,
  created_at        timestamptz not null default now()
);

create table if not exists rejection_slips (
  id                  uuid primary key default gen_random_uuid(),
  qc_record_id        uuid not null references qc_records(id),
  debit_note_no       text,
  vendor_notified_at  timestamptz,
  replacement_grn_id  uuid references grns(id)
);

-- ── Outward ──────────────────────────────────────────────

create table if not exists indents (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid references vehicles(id),
  urgency         text not null default 'Scheduled' check (urgency in ('Breakdown','Scheduled')),
  reason          text,
  status          text not null default 'Draft',
  approval_trail  jsonb default '[]'::jsonb,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create table if not exists indent_lines (
  id            uuid primary key default gen_random_uuid(),
  indent_id     uuid not null references indents(id) on delete cascade,
  part_id       uuid not null references spare_parts(id),
  qty           int not null,
  warehouse_id  uuid references warehouses(id)
);

create table if not exists material_issue_notes (
  id            uuid primary key default gen_random_uuid(),
  indent_id     uuid references indents(id),
  warehouse_id  uuid references warehouses(id),
  issued_by     uuid references auth.users(id),
  recipient_id  uuid references auth.users(id),
  signature_url text,
  issued_at     timestamptz not null default now()
);

create table if not exists min_lines (
  id              uuid primary key default gen_random_uuid(),
  min_id          uuid not null references material_issue_notes(id) on delete cascade,
  indent_line_id  uuid references indent_lines(id),
  part_id         uuid not null references spare_parts(id),
  qty             int not null,
  batch_no        text,
  bin_id          uuid references bin_locations(id)
);

create table if not exists min_serials (
  id          uuid primary key default gen_random_uuid(),
  min_line_id uuid not null references min_lines(id) on delete cascade,
  serial_no   text not null
);

create table if not exists transfers (
  id                  uuid primary key default gen_random_uuid(),
  source_wh           uuid not null references warehouses(id),
  dest_wh             uuid not null references warehouses(id),
  status              text not null default 'Requested',
  requested_by        uuid references auth.users(id),
  approved_by         uuid references auth.users(id),
  approval_trail      jsonb default '[]'::jsonb,
  transporter_details jsonb,
  dispatched_at       timestamptz,
  received_at         timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists transfer_lines (
  id              uuid primary key default gen_random_uuid(),
  transfer_id     uuid not null references transfers(id) on delete cascade,
  part_id         uuid not null references spare_parts(id),
  qty_dispatched  int not null,
  qty_received    int not null default 0,
  variance_flag   boolean default false
);

create table if not exists scrap_records (
  id              uuid primary key default gen_random_uuid(),
  warehouse_id    uuid not null references warehouses(id),
  part_id         uuid not null references spare_parts(id),
  batch_no        text,
  qty             int not null,
  reason_code     text,
  value           numeric(12,2) default 0,
  photos          text[],
  approval_trail  jsonb default '[]'::jsonb,
  status          text not null default 'Pending Approval',
  approved_at     timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create table if not exists return_notes (
  id            uuid primary key default gen_random_uuid(),
  min_id        uuid references material_issue_notes(id),
  warehouse_id  uuid references warehouses(id),
  returned_by   uuid references auth.users(id),
  received_by   uuid references auth.users(id),
  return_date   date not null default current_date,
  created_at    timestamptz not null default now()
);

create table if not exists return_lines (
  id              uuid primary key default gen_random_uuid(),
  return_id       uuid not null references return_notes(id) on delete cascade,
  part_id         uuid not null references spare_parts(id),
  qty             int not null,
  condition_code  text
);

-- ── Lifecycle & Performance ──────────────────────────────

create table if not exists serialised_units (
  id                uuid primary key default gen_random_uuid(),
  part_id           uuid not null references spare_parts(id),
  serial_no         text not null unique,
  current_status    text not null default 'In Stock',
  current_vehicle_id uuid references vehicles(id)
);

create table if not exists serialised_unit_events (
  id              uuid primary key default gen_random_uuid(),
  unit_id         uuid not null references serialised_units(id) on delete cascade,
  event_type      text not null,
  reference_id    uuid,
  reference_type  text,
  warehouse_id    uuid references warehouses(id),
  vehicle_id      uuid references vehicles(id),
  user_id         uuid references auth.users(id),
  photos          text[],
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists vendor_scorecards (
  id                uuid primary key default gen_random_uuid(),
  vendor_id         uuid not null references vendors(id),
  period_month      int not null check (period_month between 1 and 12),
  period_year       int not null,
  quality_score     numeric(5,2),
  timeliness_score  numeric(5,2),
  price_score       numeric(5,2),
  composite_score   numeric(5,2),
  star_rating       numeric(3,1),
  transaction_count int default 0,
  unique(vendor_id, period_month, period_year)
);

create table if not exists warranty_claims (
  id            uuid primary key default gen_random_uuid(),
  min_id        uuid references material_issue_notes(id),
  part_id       uuid not null references spare_parts(id),
  vendor_id     uuid references vendors(id),
  failure_date  date not null,
  description   text,
  photos        text[],
  status        text not null default 'Open',
  claim_trail   jsonb default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- ── Users & Audit ────────────────────────────────────────

create table if not exists users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  name                 text not null,
  role                 text not null,
  home_warehouse_id    uuid references warehouses(id),
  allowed_warehouses   uuid[],
  mfa_enabled          boolean default false,
  status               text not null default 'Active',
  created_at           timestamptz not null default now()
);

create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip_address  inet,
  device      text,
  created_at  timestamptz not null default now()
);

-- ── Stock Snapshots (for lifecycle chart) ─────────────────

create table if not exists stock_snapshots (
  id            uuid primary key default gen_random_uuid(),
  part_id       uuid not null references spare_parts(id),
  warehouse_id  uuid not null references warehouses(id),
  qty_on_hand   int not null default 0,
  snapshot_date date not null default current_date
);

-- ── Report Schedules ──────────────────────────────────────

create table if not exists report_schedules (
  id            uuid primary key default gen_random_uuid(),
  report_type   text not null,
  frequency     text not null check (frequency in ('daily','weekly','monthly')),
  recipients    text[],
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
