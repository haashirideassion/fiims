-- ============================================================
-- FIIMS — Migration 015: Fix rpc_fifo_batch alias conflict
-- ============================================================
-- WHY
--   The CTE inside the FOR loop used "r" as a table alias
--   (FROM received r), which conflicts with the PL/pgSQL loop
--   variable "r record".  PostgreSQL resolves "r.batch_no" in
--   the SELECT as the unassigned record variable rather than
--   the CTE row alias, raising:
--     55000: record "r" is not assigned yet
--
-- FIX
--   Rename the CTE alias from "r" to "b" throughout the
--   inner SELECT so it no longer shadows the loop variable.
-- ============================================================

CREATE OR REPLACE FUNCTION rpc_fifo_batch(
  p_part_id      uuid,
  p_warehouse_id uuid,
  p_qty_needed   int
)
RETURNS TABLE (
  batch_no      text,
  bin_id        uuid,
  mfg_date      date,
  expiry_date   date,
  available_qty int,
  take_qty      int
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_remaining int := p_qty_needed;
  r           record;
BEGIN
  FOR r IN
    WITH received AS (
      SELECT
        gl.batch_no,
        gl.bin_id,
        gl.mfg_date,
        gl.expiry_date,
        gl.grn_id,
        COALESCE(SUM(qr.accepted_qty), 0) AS qty_received
      FROM grn_lines gl
      LEFT JOIN qc_records qr ON qr.grn_line_id = gl.id
      JOIN grns g ON g.id = gl.grn_id
      JOIN po_lines pl ON pl.id = gl.po_line_id
      WHERE pl.part_id                    = p_part_id
        AND pl.destination_warehouse_id   = p_warehouse_id
        AND g.status IN ('QC_Done', 'Completed')
      GROUP BY gl.batch_no, gl.bin_id, gl.mfg_date, gl.expiry_date, gl.grn_id
    ),
    issued AS (
      SELECT ml.batch_no, COALESCE(SUM(ml.qty), 0) AS qty_issued
      FROM min_lines ml
      JOIN material_issue_notes mn ON mn.id = ml.min_id
      WHERE ml.part_id      = p_part_id
        AND mn.warehouse_id = p_warehouse_id
      GROUP BY ml.batch_no
    )
    SELECT
      b.batch_no,
      b.bin_id,
      b.mfg_date,
      b.expiry_date,
      GREATEST(0, b.qty_received - COALESCE(i.qty_issued, 0)) AS available_qty
    FROM received b
    LEFT JOIN issued i ON i.batch_no = b.batch_no
    WHERE b.qty_received > COALESCE(i.qty_issued, 0)
    ORDER BY COALESCE(b.mfg_date, '1900-01-01'::date) ASC,
             b.grn_id ASC
  LOOP
    IF v_remaining <= 0 THEN EXIT; END IF;

    batch_no      := r.batch_no;
    bin_id        := r.bin_id;
    mfg_date      := r.mfg_date;
    expiry_date   := r.expiry_date;
    available_qty := r.available_qty;
    take_qty      := LEAST(v_remaining, r.available_qty);
    v_remaining   := v_remaining - take_qty;

    RETURN NEXT;
  END LOOP;
END;
$$;
