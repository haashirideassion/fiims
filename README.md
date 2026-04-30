# FIIMS — Fleet Inventory & IoT Management System

<div align="center">

![FIIMS Banner](https://img.shields.io/badge/FIIMS-Fleet%20Inventory%20%26%20IoT%20Management-blue?style=for-the-badge)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth%20%2B%20Realtime-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

**Enterprise-grade spare-parts & fleet management platform for large-scale vehicle fleets.**

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Architecture](#architecture)

</div>

---

## Overview

FIIMS was built for **Urbaser Sumeet**, a GCC waste-management joint venture operating **3,300+ vehicles** across **7 zones** and **8 warehouses** in Chennai. It replaces fragmented Excel-based tracking with a unified, role-aware web application that manages the complete lifecycle of spare parts — from vendor procurement to vehicle-level consumption.

### Key Highlights

- 🏭 **8 warehouses, 7 zones** — multi-warehouse stock management with bin-level granularity
- 🚛 **3,300+ vehicles** — full vehicle registry with service history, document tracking, and compatibility mapping
- 📦 **Complete inward flow** — Purchase Requisitions → Purchase Orders → GRN → QC → Stock
- 🔧 **Complete outward flow** — Indents → Material Issue Notes → Transfers → Scrap → Returns
- 📊 **Vendor performance** — automated scorecards, leaderboard, and defect heatmaps
- 🔁 **Lifecycle tracking** — serialised unit tracing, MTBR analytics, warranty claims
- 📈 **35+ report types** — with PDF, Excel, and Tally XML export
- 🔐 **7-role RBAC** — fine-grained row-level security enforced at the database level

---

## Features

### Master Data
| Module | Description |
|--------|-------------|
| **Warehouses** | Manage 8 warehouses with bin-rack-aisle hierarchy, GPS coordinates, in-charge contacts |
| **Spare Parts** | SKU catalogue with OEM numbers, HSN/GST, compatibility matrix, images & spec sheets |
| **Vehicle Registry** | 3,300+ vehicles with model-level compatibility, IoT/GPS IDs, document expiry alerts |
| **Vendors** | Vendor master with GSTIN, MSME flag, Udyam number, bank details (Finance-only RLS) |
| **Rate Contracts** | Multi-line contracts with quantity slabs, effective date ranges, and PDF attachments |

### Inventory Inward
| Module | Description |
|--------|-------------|
| **Purchase Requisitions** | Auto-generated on reorder trigger; multi-level approval workflow |
| **Purchase Orders** | Consolidated from PRs; linked to rate contracts for price validation |
| **GRN** | Batch and serial capture, bin assignment, barcode/QR label printing |
| **QC Inspection** | Checklist-based QC; rejection slips with debit note generation |

### Inventory Outward
| Module | Description |
|--------|-------------|
| **Indents** | Vehicle-linked demand; Breakdown indents skip the approval queue |
| **Material Issue Notes** | FIFO batch picking; digital signature capture; printable MIN |
| **Inter-Warehouse Transfers** | Realtime status updates via Supabase channels |
| **Scrap Authorization** | Value-based approval tiers; photo evidence upload |
| **Returns** | Condition-graded returns back to stock |

### Analytics & Reporting
- **Role dashboards** — tailored KPI widgets per role (Store Manager, Fleet Manager, Admin, Procurement, Maintenance)
- **Vendor Scorecards** — Quality (40%) + Timeliness (30%) + Price (30%) composite, automated via pg_cron
- **Vendor Leaderboard** — visual podium + ranked table + horizontal bar chart
- **Defect Heatmap** — part × vendor rejection rate matrix
- **SKU Lifecycle** — stock movement timeline, consumption velocity, reorder analytics
- **MTBR** — Mean Time Between Replacements analytics per vehicle model
- **Warranty Tracker** — open claims with vendor notification workflow

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | React 19 + TypeScript + Vite 6 |
| UI System | [AlignUI v1.2](https://alignui.com) (Radix + Tailwind v4) |
| Icons | `@remixicon/react` |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Barcode / QR | `react-barcode` + `qrcode.react` |
| PDF Export | `jspdf` + `jspdf-autotable` |
| Excel Export | `xlsx` |
| Date Utilities | `date-fns` |

---

## Architecture

```
src/
├── features/
│   ├── auth/                  # Login, session, role hook (Zustand + Supabase Auth)
│   ├── dashboard/             # Role-specific dashboards (5 roles)
│   ├── master/                # Warehouses, Parts, Vehicles, Vendors, Rate Contracts
│   ├── inward/                # PR → PO → GRN → QC pipeline
│   ├── outward/               # Indents → Issues → Transfers → Scrap → Returns
│   ├── vendor-performance/    # Scorecards, Leaderboard, Defect Heatmap
│   ├── lifecycle/             # SKU lifecycle, Serial tracer, MTBR, Warranty
│   ├── reports/               # 35+ report types with PDF / Excel / Tally export
│   └── settings/              # User management + immutable audit log
├── components/
│   ├── layout/                # AppShell, Sidebar (role-aware), TopBar, PageHeader
│   └── shared/                # DataTable, FilterBar, StatusBadge, FileUpload, …
├── lib/
│   ├── supabase.ts            # Single Supabase client
│   ├── types/                 # TypeScript interfaces for all entities
│   ├── hooks/                 # useWarehouseScope, useApproval, useExport
│   └── utils/                 # cn, format (₹ / date / GST), barcodeUtils
supabase/
├── migrations/
│   ├── 001_schema.sql         # 35+ tables (masters, procurement, outward, lifecycle)
│   ├── 002_rls.sql            # Row-level security policies for all 7 roles
│   └── 003_functions.sql      # Scorecard calc, MTBR, stock fn, ABC analysis
└── seed.sql                   # Demo fleet catalogue data
```

### Role-Based Access Control

| Role | Access |
|------|--------|
| `admin` | Full access across all warehouses |
| `fleet_manager` | Operations visibility + high-value approvals |
| `procurement` | PR / PO / GRN / QC + vendor management |
| `finance` | Vendor bank details + financial reports |
| `store_manager` | Write access restricted to home warehouse (enforced via RLS) |
| `maintenance_lead` | Indent creation + service history |
| `auditor` | Read-only across all tables, no mutations |

---

## Getting Started

### Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/haashirideassion/fiims.git
cd fiims
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

Run the migrations in order against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or run manually in the Supabase SQL editor:
# supabase/migrations/001_schema.sql
# supabase/migrations/002_rls.sql
# supabase/migrations/003_functions.sql
# supabase/seed.sql  (optional — loads demo data)
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Demo login (after running seed.sql)

| Email | Password | Role |
|-------|----------|------|
| `admin@fiims.in` | `demo1234` | Admin |
| `store1@fiims.in` | `demo1234` | Store Manager |
| `fleet@fiims.in` | `demo1234` | Fleet Manager |
| `procurement@fiims.in` | `demo1234` | Procurement |

---

## Database Schema

<details>
<summary>35+ tables across 6 domains</summary>

**Masters:** `warehouses`, `bin_locations`, `spare_parts`, `part_warehouse_levels`, `vehicle_models`, `vehicles`, `vehicle_documents`, `vendors`, `vendor_contacts`, `rate_contracts`, `rate_contract_lines`

**Inward:** `purchase_requisitions`, `pr_lines`, `purchase_orders`, `po_lines`, `grns`, `grn_lines`, `grn_serials`, `qc_records`, `rejection_slips`

**Outward:** `indents`, `indent_lines`, `material_issue_notes`, `min_lines`, `min_serials`, `transfers`, `transfer_lines`, `scrap_records`, `return_notes`, `return_lines`

**Lifecycle:** `serialised_units`, `serialised_unit_events`, `vendor_scorecards`, `warranty_claims`

**Security:** `users`, `audit_logs`

</details>

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

---

## License

MIT © 2025 Haashir — built for Urbaser Sumeet GCC fleet operations.
