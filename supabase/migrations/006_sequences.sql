-- ============================================================
-- FIIMS — Migration 006: Document Number Sequences & Triggers
-- Auto-generates human-readable document numbers
-- e.g. PR-2026-00001, PO-2026-00001, GRN-2026-00001
-- ============================================================

-- ── Sequences ────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS fiims_pr_seq       START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_po_seq       START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_grn_seq      START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_min_seq      START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_indent_seq   START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_transfer_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_scrap_seq    START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_return_seq   START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS fiims_claim_seq    START 1 INCREMENT 1;

-- ── Generic document number function ─────────────────────────
-- Returns prefix-YYYY-00001 format

CREATE OR REPLACE FUNCTION fn_next_doc_no(p_prefix text, p_seq regclass)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN format('%s-%s-%05s',
    p_prefix,
    EXTRACT(YEAR FROM now())::text,
    nextval(p_seq)::text
  );
END;
$$;

-- ── Trigger functions (one per document type) ─────────────────

CREATE OR REPLACE FUNCTION trg_set_pr_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pr_no IS NULL THEN
    NEW.pr_no := fn_next_doc_no('PR', 'fiims_pr_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_po_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.po_no IS NULL THEN
    NEW.po_no := fn_next_doc_no('PO', 'fiims_po_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_grn_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.grn_no IS NULL THEN
    NEW.grn_no := fn_next_doc_no('GRN', 'fiims_grn_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_min_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.min_no IS NULL THEN
    NEW.min_no := fn_next_doc_no('MIN', 'fiims_min_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_indent_no()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_no text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'indents' AND column_name = 'indent_no'
  ) THEN
    RETURN NEW;
  END IF;
  -- indents table has indent_no column added by the ALTER below
  IF NEW.indent_no IS NULL THEN
    NEW.indent_no := fn_next_doc_no('IND', 'fiims_indent_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_transfer_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.transfer_no IS NULL THEN
    NEW.transfer_no := fn_next_doc_no('TRF', 'fiims_transfer_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_scrap_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.scrap_no IS NULL THEN
    NEW.scrap_no := fn_next_doc_no('SCR', 'fiims_scrap_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_return_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.return_no IS NULL THEN
    NEW.return_no := fn_next_doc_no('RET', 'fiims_return_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_claim_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.claim_no IS NULL THEN
    NEW.claim_no := fn_next_doc_no('WCL', 'fiims_claim_seq');
  END IF;
  RETURN NEW;
END;
$$;

-- ── Add indent_no column (the only doc-no not yet added) ──────

ALTER TABLE indents ADD COLUMN IF NOT EXISTS indent_no text UNIQUE;

-- Rewrite the indent trigger function now that column is confirmed present
CREATE OR REPLACE FUNCTION trg_set_indent_no()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.indent_no IS NULL THEN
    NEW.indent_no := fn_next_doc_no('IND', 'fiims_indent_seq');
  END IF;
  RETURN NEW;
END;
$$;

-- ── Attach BEFORE INSERT triggers ────────────────────────────

DROP TRIGGER IF EXISTS set_pr_no       ON purchase_requisitions;
DROP TRIGGER IF EXISTS set_po_no       ON purchase_orders;
DROP TRIGGER IF EXISTS set_grn_no      ON grns;
DROP TRIGGER IF EXISTS set_min_no      ON material_issue_notes;
DROP TRIGGER IF EXISTS set_indent_no   ON indents;
DROP TRIGGER IF EXISTS set_transfer_no ON transfers;
DROP TRIGGER IF EXISTS set_scrap_no    ON scrap_records;
DROP TRIGGER IF EXISTS set_return_no   ON return_notes;
DROP TRIGGER IF EXISTS set_claim_no    ON warranty_claims;

CREATE TRIGGER set_pr_no
  BEFORE INSERT ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION trg_set_pr_no();

CREATE TRIGGER set_po_no
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION trg_set_po_no();

CREATE TRIGGER set_grn_no
  BEFORE INSERT ON grns
  FOR EACH ROW EXECUTE FUNCTION trg_set_grn_no();

CREATE TRIGGER set_min_no
  BEFORE INSERT ON material_issue_notes
  FOR EACH ROW EXECUTE FUNCTION trg_set_min_no();

CREATE TRIGGER set_indent_no
  BEFORE INSERT ON indents
  FOR EACH ROW EXECUTE FUNCTION trg_set_indent_no();

CREATE TRIGGER set_transfer_no
  BEFORE INSERT ON transfers
  FOR EACH ROW EXECUTE FUNCTION trg_set_transfer_no();

CREATE TRIGGER set_scrap_no
  BEFORE INSERT ON scrap_records
  FOR EACH ROW EXECUTE FUNCTION trg_set_scrap_no();

CREATE TRIGGER set_return_no
  BEFORE INSERT ON return_notes
  FOR EACH ROW EXECUTE FUNCTION trg_set_return_no();

CREATE TRIGGER set_claim_no
  BEFORE INSERT ON warranty_claims
  FOR EACH ROW EXECUTE FUNCTION trg_set_claim_no();
