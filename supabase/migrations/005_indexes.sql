-- ============================================================
-- FIIMS — Migration 005: Performance Indexes
-- ============================================================

-- ── Warehouses ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_warehouses_status     ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_city       ON warehouses(city);

-- ── Bin Locations ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bin_locations_warehouse ON bin_locations(warehouse_id);

-- ── Spare Parts ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_spare_parts_category  ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_serialised ON spare_parts(serialised);

-- Full-text search index on name + sku + oem_no
CREATE INDEX IF NOT EXISTS idx_spare_parts_fts ON spare_parts
  USING GIN (to_tsvector('english',
    coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(oem_no, '')
  ));

-- ── Part Warehouse Levels ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pwl_part      ON part_warehouse_levels(part_id);
CREATE INDEX IF NOT EXISTS idx_pwl_warehouse ON part_warehouse_levels(warehouse_id);

-- ── Vehicles ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status   ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_zone     ON vehicles(zone);

-- ── Vehicle Documents ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle  ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_expiry   ON vehicle_documents(expiry_date);

-- ── Vendors ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

-- ── Vendor Contacts ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);

-- ── Vendor Addresses ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendor_addresses_vendor ON vendor_addresses(vendor_id);

-- ── Vendor Bank Details ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendor_bank_vendor ON vendor_bank_details(vendor_id);

-- ── Rate Contracts ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rate_contracts_vendor      ON rate_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rate_contracts_status      ON rate_contracts(status);
CREATE INDEX IF NOT EXISTS idx_rate_contracts_valid_until ON rate_contracts(valid_until);

-- ── Rate Contract Lines ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rcl_contract ON rate_contract_lines(contract_id);
CREATE INDEX IF NOT EXISTS idx_rcl_part     ON rate_contract_lines(part_id);

-- ── Rate Contract Slabs ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rcs_line ON rate_contract_slabs(line_id);

-- ── Purchase Requisitions ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pr_warehouse   ON purchase_requisitions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pr_status      ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_pr_created_by  ON purchase_requisitions(created_by);
CREATE INDEX IF NOT EXISTS idx_pr_created_at  ON purchase_requisitions(created_at DESC);
-- Partial index for reorder check (only Draft PRs matter for duplicate check)
CREATE INDEX IF NOT EXISTS idx_pr_draft_warehouse ON purchase_requisitions(warehouse_id)
  WHERE status = 'Draft';

-- ── PR Lines ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pr_lines_pr   ON pr_lines(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_lines_part ON pr_lines(part_id);

-- ── Purchase Orders ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_po_vendor     ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_status     ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at DESC);

-- ── PO Lines ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_po_lines_po          ON po_lines(po_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_part        ON po_lines(part_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_dest_wh     ON po_lines(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_contract    ON po_lines(contract_line_id);

-- ── GRNs ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grns_po          ON grns(po_id);
CREATE INDEX IF NOT EXISTS idx_grns_warehouse   ON grns(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_grns_status      ON grns(status);
CREATE INDEX IF NOT EXISTS idx_grns_grn_date    ON grns(grn_date DESC);
CREATE INDEX IF NOT EXISTS idx_grns_created_by  ON grns(created_by);

-- ── GRN Lines ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grn_lines_grn      ON grn_lines(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_lines_po_line  ON grn_lines(po_line_id);
CREATE INDEX IF NOT EXISTS idx_grn_lines_bin      ON grn_lines(bin_id);
-- For FIFO: order by mfg_date or expiry_date
CREATE INDEX IF NOT EXISTS idx_grn_lines_mfg_date    ON grn_lines(mfg_date ASC);
CREATE INDEX IF NOT EXISTS idx_grn_lines_expiry_date ON grn_lines(expiry_date ASC);

-- ── GRN Serials ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_grn_serials_line ON grn_serials(grn_line_id);

-- ── QC Records ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_qc_grn      ON qc_records(grn_id);
CREATE INDEX IF NOT EXISTS idx_qc_grn_line ON qc_records(grn_line_id);
CREATE INDEX IF NOT EXISTS idx_qc_date     ON qc_records(qc_date DESC);

-- ── Rejection Slips ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rejection_qc ON rejection_slips(qc_record_id);

-- ── Indents ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_indents_vehicle    ON indents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_indents_status     ON indents(status);
CREATE INDEX IF NOT EXISTS idx_indents_urgency    ON indents(urgency);
CREATE INDEX IF NOT EXISTS idx_indents_created_by ON indents(created_by);
CREATE INDEX IF NOT EXISTS idx_indents_created_at ON indents(created_at DESC);

-- ── Indent Lines ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_indent_lines_indent    ON indent_lines(indent_id);
CREATE INDEX IF NOT EXISTS idx_indent_lines_part      ON indent_lines(part_id);
CREATE INDEX IF NOT EXISTS idx_indent_lines_warehouse ON indent_lines(warehouse_id);

-- ── Material Issue Notes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_min_indent    ON material_issue_notes(indent_id);
CREATE INDEX IF NOT EXISTS idx_min_warehouse ON material_issue_notes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_min_issued_at ON material_issue_notes(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_min_issued_by ON material_issue_notes(issued_by);

-- ── MIN Lines ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_min_lines_min        ON min_lines(min_id);
CREATE INDEX IF NOT EXISTS idx_min_lines_part       ON min_lines(part_id);
CREATE INDEX IF NOT EXISTS idx_min_lines_indent_line ON min_lines(indent_line_id);
CREATE INDEX IF NOT EXISTS idx_min_lines_bin        ON min_lines(bin_id);

-- ── MIN Serials ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_min_serials_line   ON min_serials(min_line_id);
CREATE INDEX IF NOT EXISTS idx_min_serials_serial ON min_serials(serial_no);

-- ── Transfers ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transfers_source_wh    ON transfers(source_wh);
CREATE INDEX IF NOT EXISTS idx_transfers_dest_wh      ON transfers(dest_wh);
CREATE INDEX IF NOT EXISTS idx_transfers_status       ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_requested_by ON transfers(requested_by);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at   ON transfers(created_at DESC);

-- ── Transfer Lines ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transfer_lines_transfer ON transfer_lines(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_lines_part     ON transfer_lines(part_id);

-- ── Scrap Records ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scrap_warehouse  ON scrap_records(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_scrap_part       ON scrap_records(part_id);
CREATE INDEX IF NOT EXISTS idx_scrap_status     ON scrap_records(status);
CREATE INDEX IF NOT EXISTS idx_scrap_created_at ON scrap_records(created_at DESC);

-- ── Return Notes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_return_notes_min       ON return_notes(min_id);
CREATE INDEX IF NOT EXISTS idx_return_notes_warehouse ON return_notes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_return_notes_date      ON return_notes(return_date DESC);

-- ── Return Lines ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_return_lines_return ON return_lines(return_id);
CREATE INDEX IF NOT EXISTS idx_return_lines_part   ON return_lines(part_id);

-- ── Serialised Units ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_su_part           ON serialised_units(part_id);
CREATE INDEX IF NOT EXISTS idx_su_current_status ON serialised_units(current_status);
CREATE INDEX IF NOT EXISTS idx_su_vehicle        ON serialised_units(current_vehicle_id);

-- ── Serialised Unit Events ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sue_unit       ON serialised_unit_events(unit_id);
CREATE INDEX IF NOT EXISTS idx_sue_event_type ON serialised_unit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sue_warehouse  ON serialised_unit_events(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sue_vehicle    ON serialised_unit_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sue_created_at ON serialised_unit_events(created_at DESC);

-- ── Vendor Scorecards ─────────────────────────────────────────
-- Composite for "latest scorecard for vendor" queries
CREATE INDEX IF NOT EXISTS idx_vs_vendor_period ON vendor_scorecards(vendor_id, period_year DESC, period_month DESC);

-- ── Warranty Claims ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wc_part       ON warranty_claims(part_id);
CREATE INDEX IF NOT EXISTS idx_wc_vendor     ON warranty_claims(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wc_status     ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_wc_min        ON warranty_claims(min_id);
CREATE INDEX IF NOT EXISTS idx_wc_created_at ON warranty_claims(created_at DESC);

-- ── Audit Logs ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ── Stock Snapshots ───────────────────────────────────────────
-- Composite for trend queries: "stock over time for part+warehouse"
CREATE INDEX IF NOT EXISTS idx_ss_part_wh_date ON stock_snapshots(part_id, warehouse_id, snapshot_date DESC);
