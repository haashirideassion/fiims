-- ============================================================
-- FIIMS — Migration 014: Add part_id to grn_lines
-- ============================================================
-- WHY
--   PostgREST resolves nested selects only through direct FK
--   columns.  grn_lines → spare_parts required a direct FK;
--   previously the only path was grn_lines → po_lines → spare_parts,
--   which PostgREST cannot traverse implicitly.
--   This also correctly supports standalone GRNs (po_line_id IS NULL)
--   where part info would otherwise be unavailable entirely.
-- ============================================================

ALTER TABLE grn_lines
  ADD COLUMN IF NOT EXISTS part_id uuid REFERENCES spare_parts(id) ON DELETE SET NULL;

-- Backfill: populate part_id from the linked po_line for all
-- existing rows that have a po_line_id but no part_id yet.
UPDATE grn_lines gl
SET    part_id = pl.part_id
FROM   po_lines pl
WHERE  gl.po_line_id = pl.id
AND    gl.part_id IS NULL;

-- Index for the new FK (query performance on joins/filters)
CREATE INDEX IF NOT EXISTS idx_grn_lines_part_id ON grn_lines(part_id);
