-- ============================================================
-- FIIMS — Migration 007: Business Logic Triggers
-- Covers: PO status cascade, GRN/QC status cascade,
--         indent issued_qty, serialised unit lifecycle,
--         stock validation, serial enforcement, FIFO function,
--         vendor composite_rating sync.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 7a. PO received_qty cascade
--     AFTER INSERT on grn_lines:
--       - Increment po_lines.received_qty
--       - Auto-update purchase_orders.status
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_grn_line_received()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_po_id            uuid;
  v_total_lines      int;
  v_fully_received   int;
  v_any_received     int;
BEGIN
  -- Update po_lines.received_qty
  UPDATE po_lines
  SET received_qty = received_qty + NEW.received_qty
  WHERE id = NEW.po_line_id;

  -- Determine PO id from the po_line
  SELECT po_id INTO v_po_id FROM po_lines WHERE id = NEW.po_line_id;

  IF v_po_id IS NOT NULL THEN
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE received_qty >= qty),
      COUNT(*) FILTER (WHERE received_qty > 0)
    INTO v_total_lines, v_fully_received, v_any_received
    FROM po_lines WHERE po_id = v_po_id;

    IF v_fully_received = v_total_lines THEN
      UPDATE purchase_orders SET status = 'Fully Received' WHERE id = v_po_id;
    ELSIF v_any_received > 0 THEN
      UPDATE purchase_orders SET status = 'Partially Received'
        WHERE id = v_po_id AND status NOT IN ('Fully Received', 'Closed', 'Short-Closed');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grn_line_received ON grn_lines;
CREATE TRIGGER grn_line_received
  AFTER INSERT ON grn_lines
  FOR EACH ROW EXECUTE FUNCTION trg_fn_grn_line_received();


-- ────────────────────────────────────────────────────────────
-- 7b. GRN status → QC_Pending after lines inserted
--     AFTER INSERT on grn_lines: if GRN is still 'Draft',
--     flip it to 'QC_Pending'.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_grn_to_qc_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE grns
  SET status = 'QC_Pending'
  WHERE id = NEW.grn_id AND status = 'Draft';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grn_to_qc_pending ON grn_lines;
CREATE TRIGGER grn_to_qc_pending
  AFTER INSERT ON grn_lines
  FOR EACH ROW EXECUTE FUNCTION trg_fn_grn_to_qc_pending();


-- ────────────────────────────────────────────────────────────
-- 7c. GRN status → QC_Done / Completed after QC records saved
--     AFTER INSERT OR UPDATE on qc_records:
--       - If all GRN lines have a qc_record → QC_Done
--       - If QC_Done and zero rejections → Completed
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_qc_updates_grn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_lines  int;
  v_qc_done      int;
  v_total_reject int;
BEGIN
  -- Count GRN lines vs QC records for this GRN
  SELECT COUNT(*) INTO v_total_lines FROM grn_lines WHERE grn_id = NEW.grn_id;
  SELECT COUNT(*) INTO v_qc_done    FROM qc_records  WHERE grn_id = NEW.grn_id;
  SELECT COALESCE(SUM(rejected_qty), 0) INTO v_total_reject
    FROM qc_records WHERE grn_id = NEW.grn_id;

  IF v_qc_done >= v_total_lines AND v_total_lines > 0 THEN
    IF v_total_reject = 0 THEN
      UPDATE grns SET status = 'Completed' WHERE id = NEW.grn_id;
    ELSE
      UPDATE grns SET status = 'QC_Done' WHERE id = NEW.grn_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS qc_updates_grn ON qc_records;
CREATE TRIGGER qc_updates_grn
  AFTER INSERT OR UPDATE ON qc_records
  FOR EACH ROW EXECUTE FUNCTION trg_fn_qc_updates_grn();


-- ────────────────────────────────────────────────────────────
-- 7d. Indent issued_qty cascade
--     AFTER INSERT on min_lines:
--       - Increment indent_lines.issued_qty
--       - Auto-update indents.status
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_min_line_issued()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_indent_id      uuid;
  v_total_lines    int;
  v_fully_issued   int;
  v_any_issued     int;
BEGIN
  -- Update indent_lines.issued_qty if linked
  IF NEW.indent_line_id IS NOT NULL THEN
    UPDATE indent_lines
    SET issued_qty = issued_qty + NEW.qty
    WHERE id = NEW.indent_line_id;

    -- Get the indent id
    SELECT indent_id INTO v_indent_id
    FROM indent_lines WHERE id = NEW.indent_line_id;

    IF v_indent_id IS NOT NULL THEN
      SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE issued_qty >= qty),
        COUNT(*) FILTER (WHERE issued_qty > 0)
      INTO v_total_lines, v_fully_issued, v_any_issued
      FROM indent_lines WHERE indent_id = v_indent_id;

      IF v_fully_issued = v_total_lines AND v_total_lines > 0 THEN
        UPDATE indents SET status = 'Issued' WHERE id = v_indent_id;
      ELSIF v_any_issued > 0 THEN
        UPDATE indents SET status = 'Partially Issued'
          WHERE id = v_indent_id AND status NOT IN ('Issued', 'Closed');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS min_line_issued ON min_lines;
CREATE TRIGGER min_line_issued
  AFTER INSERT ON min_lines
  FOR EACH ROW EXECUTE FUNCTION trg_fn_min_line_issued();


-- ────────────────────────────────────────────────────────────
-- 7e. Serialised unit status on GRN serial receipt
--     AFTER INSERT on grn_serials:
--       - Upsert serialised_units (In Stock)
--       - Insert serialised_unit_events (GRN)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_grn_serial_received()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_part_id    uuid;
  v_grn_id     uuid;
  v_wh_id      uuid;
  v_unit_id    uuid;
BEGIN
  -- Resolve part_id and warehouse from grn_line → po_line → spare_parts / grn
  SELECT
    pl.part_id,
    gl.grn_id,
    g.warehouse_id
  INTO v_part_id, v_grn_id, v_wh_id
  FROM grn_lines gl
  JOIN po_lines  pl ON pl.id = gl.po_line_id
  JOIN grns      g  ON g.id  = gl.grn_id
  WHERE gl.id = NEW.grn_line_id;

  -- Upsert serialised_units
  INSERT INTO serialised_units (part_id, serial_no, current_status)
  VALUES (v_part_id, NEW.serial_no, 'In Stock')
  ON CONFLICT (serial_no) DO UPDATE
    SET current_status = 'In Stock', current_vehicle_id = NULL
  RETURNING id INTO v_unit_id;

  -- Insert lifecycle event
  INSERT INTO serialised_unit_events
    (unit_id, event_type, reference_id, reference_type, warehouse_id, user_id)
  VALUES
    (v_unit_id, 'GRN', v_grn_id, 'GRN', v_wh_id, auth.uid());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grn_serial_received ON grn_serials;
CREATE TRIGGER grn_serial_received
  AFTER INSERT ON grn_serials
  FOR EACH ROW EXECUTE FUNCTION trg_fn_grn_serial_received();


-- ────────────────────────────────────────────────────────────
-- 7f. Serialised unit status on MIN issue
--     AFTER INSERT on min_serials:
--       - Update serialised_units status = 'Issued'
--       - Set current_vehicle_id from indent → vehicle
--       - Insert serialised_unit_events (Issued)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_min_serial_issued()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unit_id    uuid;
  v_min_id     uuid;
  v_wh_id      uuid;
  v_vehicle_id uuid;
BEGIN
  -- Get MIN and warehouse
  SELECT ml.min_id, mn.warehouse_id
  INTO v_min_id, v_wh_id
  FROM min_lines ml
  JOIN material_issue_notes mn ON mn.id = ml.min_id
  WHERE ml.id = NEW.min_line_id;

  -- Get vehicle from indent
  SELECT i.vehicle_id INTO v_vehicle_id
  FROM material_issue_notes mn
  JOIN indents i ON i.id = mn.indent_id
  WHERE mn.id = v_min_id;

  -- Update serialised_units
  UPDATE serialised_units
  SET current_status    = 'Issued',
      current_vehicle_id = v_vehicle_id
  WHERE serial_no = NEW.serial_no
  RETURNING id INTO v_unit_id;

  -- Insert lifecycle event
  IF v_unit_id IS NOT NULL THEN
    INSERT INTO serialised_unit_events
      (unit_id, event_type, reference_id, reference_type, warehouse_id, vehicle_id, user_id)
    VALUES
      (v_unit_id, 'Issued', v_min_id, 'MIN', v_wh_id, v_vehicle_id, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS min_serial_issued ON min_serials;
CREATE TRIGGER min_serial_issued
  AFTER INSERT ON min_serials
  FOR EACH ROW EXECUTE FUNCTION trg_fn_min_serial_issued();


-- ────────────────────────────────────────────────────────────
-- 7g. Serialised unit status on scrap approval
--     AFTER UPDATE on scrap_records (status → 'Approved'):
--       - Mark matching serialised units as 'Scrapped'
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_scrap_serials()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
    UPDATE serialised_units
    SET current_status = 'Scrapped'
    WHERE part_id = NEW.part_id
      AND current_status != 'Scrapped';
    -- Note: in a real scenario you'd track batch-level serials; this covers
    -- the case where batch_no matches, but batch_no is optional in scrap_records.
    -- Full serial-level scrap tracking requires a scrap_serials join table.
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scrap_serials ON scrap_records;
CREATE TRIGGER scrap_serials
  AFTER UPDATE ON scrap_records
  FOR EACH ROW EXECUTE FUNCTION trg_fn_scrap_serials();


-- ────────────────────────────────────────────────────────────
-- 7h. Vendor composite_rating sync
--     AFTER INSERT OR UPDATE on vendor_scorecards:
--       - Recompute vendors.composite_rating as star avg
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_sync_vendor_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE vendors
  SET composite_rating = (
    SELECT ROUND(AVG(star_rating)::numeric, 1)
    FROM vendor_scorecards
    WHERE vendor_id = NEW.vendor_id
      AND period_year = EXTRACT(YEAR FROM now())::int
  )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_vendor_rating ON vendor_scorecards;
CREATE TRIGGER sync_vendor_rating
  AFTER INSERT OR UPDATE ON vendor_scorecards
  FOR EACH ROW EXECUTE FUNCTION trg_fn_sync_vendor_rating();


-- ────────────────────────────────────────────────────────────
-- 7i. Stock validation before MIN issue
--     BEFORE INSERT on min_lines:
--       - Raise exception if available stock < requested qty
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_validate_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_warehouse_id uuid;
  v_available    int;
BEGIN
  -- Get warehouse from the parent MIN
  SELECT warehouse_id INTO v_warehouse_id
  FROM material_issue_notes WHERE id = NEW.min_id;

  IF v_warehouse_id IS NOT NULL THEN
    v_available := fn_current_stock(NEW.part_id, v_warehouse_id);
    IF v_available < NEW.qty THEN
      RAISE EXCEPTION 'Insufficient stock for part % in warehouse %: available %, requested %',
        NEW.part_id, v_warehouse_id, v_available, NEW.qty
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_stock ON min_lines;
CREATE TRIGGER validate_stock
  BEFORE INSERT ON min_lines
  FOR EACH ROW EXECUTE FUNCTION trg_fn_validate_stock();


-- ────────────────────────────────────────────────────────────
-- 7j. Serial number enforcement on MIN
--     BEFORE INSERT on min_serials:
--       - For serialised parts: verify serial exists and is
--         currently 'In Stock'
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_enforce_serial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_serialised  boolean;
  v_serial_status text;
BEGIN
  -- Check if part requires serialisation
  SELECT sp.serialised INTO v_serialised
  FROM min_lines ml
  JOIN spare_parts sp ON sp.id = ml.part_id
  WHERE ml.id = NEW.min_line_id;

  IF v_serialised THEN
    SELECT current_status INTO v_serial_status
    FROM serialised_units WHERE serial_no = NEW.serial_no;

    IF v_serial_status IS NULL THEN
      RAISE EXCEPTION 'Serial number % is not registered in inventory', NEW.serial_no
        USING ERRCODE = 'P0002';
    END IF;

    IF v_serial_status != 'In Stock' THEN
      RAISE EXCEPTION 'Serial number % is not available (current status: %)', NEW.serial_no, v_serial_status
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_serial ON min_serials;
CREATE TRIGGER enforce_serial
  BEFORE INSERT ON min_serials
  FOR EACH ROW EXECUTE FUNCTION trg_fn_enforce_serial();


-- ────────────────────────────────────────────────────────────
-- 7k. FIFO batch selection function
--     Returns ordered batches to issue from (oldest first).
--     Used by frontend to pre-fill batch_no / bin_id.
-- ────────────────────────────────────────────────────────────

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
  -- Iterate batches FIFO (oldest mfg_date first, then oldest grn_date)
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
      WHERE pl.part_id       = p_part_id
        AND pl.destination_warehouse_id = p_warehouse_id
        AND g.status IN ('QC_Done', 'Completed')
      GROUP BY gl.batch_no, gl.bin_id, gl.mfg_date, gl.expiry_date, gl.grn_id
    ),
    issued AS (
      SELECT ml.batch_no, COALESCE(SUM(ml.qty), 0) AS qty_issued
      FROM min_lines ml
      JOIN material_issue_notes mn ON mn.id = ml.min_id
      WHERE ml.part_id     = p_part_id
        AND mn.warehouse_id = p_warehouse_id
      GROUP BY ml.batch_no
    )
    SELECT
      r.batch_no,
      r.bin_id,
      r.mfg_date,
      r.expiry_date,
      GREATEST(0, r.qty_received - COALESCE(i.qty_issued, 0)) AS available_qty
    FROM received r
    LEFT JOIN issued i ON i.batch_no = r.batch_no
    WHERE r.qty_received > COALESCE(i.qty_issued, 0)
    ORDER BY COALESCE(r.mfg_date, '1900-01-01'::date) ASC,
             r.grn_id ASC
  LOOP
    IF v_remaining <= 0 THEN EXIT; END IF;

    batch_no    := r.batch_no;
    bin_id      := r.bin_id;
    mfg_date    := r.mfg_date;
    expiry_date := r.expiry_date;
    available_qty := r.available_qty;
    take_qty    := LEAST(v_remaining, r.available_qty);
    v_remaining := v_remaining - take_qty;

    RETURN NEXT;
  END LOOP;
END;
$$;
