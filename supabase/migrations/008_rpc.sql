-- ============================================================
-- FIIMS — Migration 008: RPC Query Functions
-- Stock ledger, vehicle history, reorder report,
-- dashboard metrics, pending approvals, GST report,
-- consumption analysis, expiring contracts.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- rpc_stock_ledger
-- Full chronological movement history for a part+warehouse.
-- Returns running balance (qty) per transaction.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_stock_ledger(
  p_part_id      uuid,
  p_warehouse_id uuid,
  p_from         date DEFAULT (CURRENT_DATE - 365),
  p_to           date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  txn_date        date,
  transaction_type text,
  reference_no    text,
  qty_in          int,
  qty_out         int,
  unit_cost       numeric,
  total_value     numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH movements AS (
    -- GRN receipts (QC accepted)
    SELECT
      g.grn_date                    AS txn_date,
      'GRN'                         AS transaction_type,
      g.grn_no                      AS reference_no,
      qr.accepted_qty               AS qty_in,
      0                             AS qty_out,
      COALESCE(pl.unit_price, 0)    AS unit_cost
    FROM qc_records qr
    JOIN grn_lines gl ON gl.id = qr.grn_line_id
    JOIN grns      g  ON g.id  = gl.grn_id
    JOIN po_lines  pl ON pl.id = gl.po_line_id
    WHERE pl.part_id = p_part_id
      AND pl.destination_warehouse_id = p_warehouse_id
      AND g.grn_date BETWEEN p_from AND p_to

    UNION ALL

    -- Issues (MIN)
    SELECT
      mn.issued_at::date,
      'Issue',
      mn.min_no,
      0,
      ml.qty,
      ml.cost_per_unit
    FROM min_lines ml
    JOIN material_issue_notes mn ON mn.id = ml.min_id
    WHERE ml.part_id     = p_part_id
      AND mn.warehouse_id = p_warehouse_id
      AND mn.issued_at::date BETWEEN p_from AND p_to

    UNION ALL

    -- Transfer In
    SELECT
      t.received_at::date,
      'Transfer In',
      t.transfer_no,
      tl.qty_received,
      0,
      0
    FROM transfer_lines tl
    JOIN transfers t ON t.id = tl.transfer_id
    WHERE tl.part_id  = p_part_id
      AND t.dest_wh   = p_warehouse_id
      AND t.status    = 'Received'
      AND t.received_at::date BETWEEN p_from AND p_to

    UNION ALL

    -- Transfer Out
    SELECT
      t.dispatched_at::date,
      'Transfer Out',
      t.transfer_no,
      0,
      tl.qty_dispatched,
      0
    FROM transfer_lines tl
    JOIN transfers t ON t.id = tl.transfer_id
    WHERE tl.part_id  = p_part_id
      AND t.source_wh = p_warehouse_id
      AND t.status    IN ('In-Transit', 'Received')
      AND t.dispatched_at::date BETWEEN p_from AND p_to

    UNION ALL

    -- Scrap
    SELECT
      sr.approved_at::date,
      'Scrap',
      sr.scrap_no,
      0,
      sr.qty,
      0
    FROM scrap_records sr
    WHERE sr.part_id      = p_part_id
      AND sr.warehouse_id  = p_warehouse_id
      AND sr.status        = 'Approved'
      AND sr.approved_at::date BETWEEN p_from AND p_to

    UNION ALL

    -- Returns
    SELECT
      rn.return_date,
      'Return',
      rn.return_no,
      rl.qty,
      0,
      0
    FROM return_lines rl
    JOIN return_notes rn ON rn.id = rl.return_id
    WHERE rl.part_id      = p_part_id
      AND rn.warehouse_id  = p_warehouse_id
      AND rn.return_date   BETWEEN p_from AND p_to
  )
  SELECT
    m.txn_date,
    m.transaction_type,
    m.reference_no,
    m.qty_in,
    m.qty_out,
    m.unit_cost,
    (m.qty_in - m.qty_out) * m.unit_cost AS total_value
  FROM movements m
  ORDER BY m.txn_date ASC, m.transaction_type ASC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_vehicle_cost_history
-- All MIN lines issued for a specific vehicle, with costs.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_vehicle_cost_history(
  p_vehicle_id uuid,
  p_from       date DEFAULT (CURRENT_DATE - 365),
  p_to         date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  issued_at   timestamptz,
  min_no      text,
  part_name   text,
  sku         text,
  qty         int,
  unit_cost   numeric,
  total_cost  numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    mn.issued_at,
    mn.min_no,
    sp.name         AS part_name,
    sp.sku,
    ml.qty,
    ml.cost_per_unit AS unit_cost,
    ml.qty * ml.cost_per_unit AS total_cost
  FROM min_lines ml
  JOIN material_issue_notes mn ON mn.id = ml.min_id
  JOIN spare_parts           sp ON sp.id = ml.part_id
  JOIN indents               i  ON i.id  = mn.indent_id
  WHERE i.vehicle_id = p_vehicle_id
    AND mn.issued_at::date BETWEEN p_from AND p_to
  ORDER BY mn.issued_at DESC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_reorder_report
-- Parts at or below their reorder level, per warehouse.
-- Optionally scoped to a single warehouse.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_reorder_report(
  p_warehouse_id uuid DEFAULT NULL
)
RETURNS TABLE (
  part_id          uuid,
  sku              text,
  part_name        text,
  category         text,
  warehouse_id     uuid,
  warehouse_name   text,
  current_stock    int,
  min_qty          int,
  reorder_qty      int,
  suggested_pr_qty int
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id           AS part_id,
    sp.sku,
    sp.name         AS part_name,
    sp.category,
    w.id            AS warehouse_id,
    w.name          AS warehouse_name,
    fn_current_stock(pwl.part_id, pwl.warehouse_id) AS current_stock,
    pwl.min_qty,
    pwl.reorder_qty,
    GREATEST(pwl.max_qty - fn_current_stock(pwl.part_id, pwl.warehouse_id), pwl.reorder_qty) AS suggested_pr_qty
  FROM part_warehouse_levels pwl
  JOIN spare_parts sp ON sp.id = pwl.part_id
  JOIN warehouses  w  ON w.id  = pwl.warehouse_id
  WHERE (p_warehouse_id IS NULL OR pwl.warehouse_id = p_warehouse_id)
    AND w.status = 'Active'
    AND fn_current_stock(pwl.part_id, pwl.warehouse_id) <= pwl.reorder_qty
  ORDER BY fn_current_stock(pwl.part_id, pwl.warehouse_id) ASC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_dashboard_metrics
-- Role-aware KPI payload for dashboards.
-- Returns a JSONB object whose keys depend on caller's role.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_dashboard_metrics()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role      text;
  v_wh_id     uuid;
  v_result    jsonb := '{}'::jsonb;
  v_wh_filter text;
BEGIN
  v_role  := auth_user_role();
  v_wh_id := auth_home_warehouse();

  -- Common KPIs for all roles
  v_result := v_result || jsonb_build_object(
    'low_stock_count',
      (SELECT COUNT(*) FROM part_warehouse_levels pwl
       WHERE fn_current_stock(pwl.part_id, pwl.warehouse_id) <= pwl.reorder_qty
         AND (v_wh_id IS NULL OR pwl.warehouse_id = v_wh_id)),
    'open_indents',
      (SELECT COUNT(*) FROM indents
       WHERE status IN ('Submitted', 'Approved')
         AND (v_wh_id IS NULL OR vehicle_id IN (
           SELECT id FROM vehicles WHERE zone IN (
             SELECT zone FROM vehicles v2
             JOIN indents i2 ON i2.vehicle_id = v2.id
             JOIN indent_lines il ON il.indent_id = i2.id
             WHERE il.warehouse_id = v_wh_id LIMIT 1
           )
         ))
      )
  );

  IF v_role IN ('admin', 'fleet_manager') THEN
    v_result := v_result || jsonb_build_object(
      'active_vendors',    (SELECT COUNT(*) FROM vendors  WHERE status = 'Approved'),
      'total_vehicles',    (SELECT COUNT(*) FROM vehicles WHERE status = 'Active'),
      'total_warehouses',  (SELECT COUNT(*) FROM warehouses WHERE status = 'Active'),
      'open_pos',          (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('Draft','Issued')),
      'monthly_spend',
        (SELECT COALESCE(SUM(ml.qty * ml.cost_per_unit), 0)
         FROM min_lines ml
         JOIN material_issue_notes mn ON mn.id = ml.min_id
         WHERE mn.issued_at >= date_trunc('month', now()))
    );
  END IF;

  IF v_role IN ('procurement', 'admin') THEN
    v_result := v_result || jsonb_build_object(
      'approved_prs',
        (SELECT COUNT(*) FROM purchase_requisitions WHERE status = 'Approved'),
      'open_pos',
        (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('Draft','Issued','Partially Received')),
      'pending_grns',
        (SELECT COUNT(*) FROM grns WHERE status IN ('QC_Pending','Draft')),
      'expiring_contracts',
        (SELECT COUNT(*) FROM rate_contracts WHERE status = 'expiring_soon')
    );
  END IF;

  IF v_role IN ('store_manager', 'admin') THEN
    v_result := v_result || jsonb_build_object(
      'warehouse_stock_value',
        (SELECT COALESCE(SUM(fn_current_stock(pwl.part_id, pwl.warehouse_id) * COALESCE(
          (SELECT unit_price FROM po_lines WHERE part_id = pwl.part_id ORDER BY (SELECT created_at FROM purchase_orders WHERE id = po_lines.po_id) DESC LIMIT 1), 0
        )), 0)
         FROM part_warehouse_levels pwl
         WHERE (v_wh_id IS NULL OR pwl.warehouse_id = v_wh_id)),
      'pending_issues',
        (SELECT COUNT(*) FROM indents WHERE status = 'Approved')
    );
  END IF;

  IF v_role IN ('maintenance_lead', 'admin') THEN
    v_result := v_result || jsonb_build_object(
      'breakdown_indents_month',
        (SELECT COUNT(*) FROM indents
         WHERE urgency = 'Breakdown'
           AND created_at >= date_trunc('month', now())),
      'vehicles_under_maintenance',
        (SELECT COUNT(*) FROM vehicles WHERE status = 'Under Maintenance'),
      'open_warranty_claims',
        (SELECT COUNT(*) FROM warranty_claims WHERE status NOT IN ('Closed', 'Rejected'))
    );
  END IF;

  IF v_role IN ('finance', 'admin') THEN
    v_result := v_result || jsonb_build_object(
      'total_po_value_month',
        (SELECT COALESCE(SUM(total_value), 0) FROM purchase_orders
         WHERE created_at >= date_trunc('month', now())),
      'total_scrap_value_month',
        (SELECT COALESCE(SUM(value), 0) FROM scrap_records
         WHERE status = 'Approved'
           AND approved_at >= date_trunc('month', now())),
      'inventory_value',
        (SELECT COALESCE(SUM(fn_current_stock(pwl.part_id, pwl.warehouse_id) * COALESCE(
          (SELECT unit_price FROM po_lines WHERE part_id = pwl.part_id ORDER BY (SELECT created_at FROM purchase_orders WHERE id = po_lines.po_id) DESC LIMIT 1), 0
        )), 0)
         FROM part_warehouse_levels pwl)
    );
  END IF;

  RETURN v_result;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_pending_approvals
-- Returns documents awaiting the current user's role action.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_pending_approvals()
RETURNS TABLE (
  entity_type      text,
  entity_id        uuid,
  entity_no        text,
  warehouse_name   text,
  urgency          text,
  created_by_name  text,
  created_at       timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role text := auth_user_role();
BEGIN
  IF v_role IN ('admin', 'procurement', 'fleet_manager') THEN
    -- PRs awaiting approval
    RETURN QUERY
    SELECT
      'Purchase Requisition'::text,
      pr.id,
      pr.pr_no,
      w.name,
      pr.urgency,
      u.name,
      pr.created_at
    FROM purchase_requisitions pr
    JOIN warehouses w ON w.id = pr.warehouse_id
    LEFT JOIN users u ON u.id = pr.created_by
    WHERE pr.status = 'Submitted'
    ORDER BY
      CASE pr.urgency WHEN 'Critical' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END,
      pr.created_at ASC;

    -- Indents awaiting approval
    RETURN QUERY
    SELECT
      'Indent'::text,
      i.id,
      i.indent_no,
      COALESCE(w.name, 'N/A'),
      i.urgency,
      u.name,
      i.created_at
    FROM indents i
    LEFT JOIN indent_lines il ON il.indent_id = i.id
    LEFT JOIN warehouses   w  ON w.id = il.warehouse_id
    LEFT JOIN users        u  ON u.id = i.created_by
    WHERE i.status = 'Submitted'
    ORDER BY
      CASE i.urgency WHEN 'Breakdown' THEN 1 ELSE 2 END,
      i.created_at ASC;
  END IF;

  IF v_role IN ('admin', 'fleet_manager') THEN
    -- Scrap records awaiting approval
    RETURN QUERY
    SELECT
      'Scrap'::text,
      sr.id,
      sr.scrap_no,
      w.name,
      'Normal'::text,
      u.name,
      sr.created_at
    FROM scrap_records sr
    JOIN warehouses w ON w.id = sr.warehouse_id
    LEFT JOIN users u ON u.id = sr.created_by
    WHERE sr.status = 'Pending Approval'
    ORDER BY sr.created_at ASC;
  END IF;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_gst_report
-- GST input credit summary from GRN receipts.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_gst_report(
  p_from date,
  p_to   date
)
RETURNS TABLE (
  vendor_name    text,
  gstin          char(15),
  grn_no         text,
  grn_date       date,
  taxable_value  numeric,
  gst_rate       numeric,
  igst           numeric,
  cgst           numeric,
  sgst           numeric,
  total_gst      numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.legal_name,
    v.gstin,
    g.grn_no,
    g.grn_date,
    SUM(gl.received_qty * pl.unit_price)                        AS taxable_value,
    sp.gst_rate,
    ROUND(SUM(gl.received_qty * pl.unit_price) * sp.gst_rate / 100, 2)  AS igst,
    0::numeric                                                   AS cgst,
    0::numeric                                                   AS sgst,
    ROUND(SUM(gl.received_qty * pl.unit_price) * sp.gst_rate / 100, 2)  AS total_gst
  FROM grn_lines gl
  JOIN grns         g  ON g.id  = gl.grn_id
  JOIN purchase_orders po ON po.id = g.po_id
  JOIN vendors      v  ON v.id  = po.vendor_id
  JOIN po_lines     pl ON pl.id = gl.po_line_id
  JOIN spare_parts  sp ON sp.id = pl.part_id
  WHERE g.grn_date BETWEEN p_from AND p_to
    AND g.status IN ('QC_Done', 'Completed')
  GROUP BY v.legal_name, v.gstin, g.grn_no, g.grn_date, sp.gst_rate
  ORDER BY g.grn_date ASC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_consumption_analysis
-- Parts consumed (MINs) grouped by part, with vehicle count
-- and total value. Optional warehouse filter.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_consumption_analysis(
  p_from         date DEFAULT (CURRENT_DATE - 90),
  p_to           date DEFAULT CURRENT_DATE,
  p_warehouse_id uuid DEFAULT NULL
)
RETURNS TABLE (
  part_id       uuid,
  sku           text,
  part_name     text,
  category      text,
  vehicle_count bigint,
  total_qty     bigint,
  total_value   numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id                              AS part_id,
    sp.sku,
    sp.name                            AS part_name,
    sp.category,
    COUNT(DISTINCT i.vehicle_id)       AS vehicle_count,
    SUM(ml.qty)::bigint                AS total_qty,
    SUM(ml.qty * ml.cost_per_unit)     AS total_value
  FROM min_lines ml
  JOIN material_issue_notes mn ON mn.id = ml.min_id
  JOIN spare_parts           sp ON sp.id = ml.part_id
  JOIN indents               i  ON i.id  = mn.indent_id
  WHERE mn.issued_at::date BETWEEN p_from AND p_to
    AND (p_warehouse_id IS NULL OR mn.warehouse_id = p_warehouse_id)
  GROUP BY sp.id, sp.sku, sp.name, sp.category
  ORDER BY SUM(ml.qty * ml.cost_per_unit) DESC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_expiring_contracts
-- Contracts expiring within p_days days.
-- Called by edge function to send alerts.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_expiring_contracts(p_days int DEFAULT 30)
RETURNS TABLE (
  contract_id    uuid,
  vendor_name    text,
  vendor_email   text,
  valid_until    date,
  days_remaining int
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    v.legal_name,
    vc.email,
    rc.valid_until,
    (rc.valid_until - CURRENT_DATE)::int AS days_remaining
  FROM rate_contracts rc
  JOIN vendors v ON v.id = rc.vendor_id
  LEFT JOIN vendor_contacts vc ON vc.vendor_id = v.id AND vc.is_primary = true
  WHERE rc.status IN ('Active', 'expiring_soon')
    AND rc.valid_until BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days)
  ORDER BY rc.valid_until ASC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_inventory_valuation
-- Current stock value by warehouse (optionally by category).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_inventory_valuation(
  p_warehouse_id uuid DEFAULT NULL
)
RETURNS TABLE (
  warehouse_id   uuid,
  warehouse_name text,
  category       text,
  part_count     bigint,
  total_qty      bigint,
  total_value    numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    sp.category,
    COUNT(DISTINCT sp.id)::bigint AS part_count,
    SUM(fn_current_stock(pwl.part_id, pwl.warehouse_id))::bigint AS total_qty,
    SUM(
      fn_current_stock(pwl.part_id, pwl.warehouse_id) *
      COALESCE(
        (SELECT unit_price FROM po_lines
         WHERE part_id = pwl.part_id
         ORDER BY (SELECT created_at FROM purchase_orders WHERE id = po_lines.po_id) DESC
         LIMIT 1),
        0
      )
    ) AS total_value
  FROM part_warehouse_levels pwl
  JOIN spare_parts sp ON sp.id = pwl.part_id
  JOIN warehouses  w  ON w.id  = pwl.warehouse_id
  WHERE (p_warehouse_id IS NULL OR pwl.warehouse_id = p_warehouse_id)
    AND w.status = 'Active'
  GROUP BY w.id, w.name, sp.category
  ORDER BY total_value DESC;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- rpc_parts_search
-- Full-text search across spare_parts using GIN index.
-- Returns ranked results.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_parts_search(p_query text)
RETURNS TABLE (
  id       uuid,
  sku      text,
  name     text,
  category text,
  uom      text,
  rank     real
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.sku,
    sp.name,
    sp.category,
    sp.uom,
    ts_rank(
      to_tsvector('english', coalesce(sp.name,'') || ' ' || coalesce(sp.sku,'') || ' ' || coalesce(sp.oem_no,'')),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM spare_parts sp
  WHERE to_tsvector('english', coalesce(sp.name,'') || ' ' || coalesce(sp.sku,'') || ' ' || coalesce(sp.oem_no,''))
    @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT 20;
END;
$$;
