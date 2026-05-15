-- ============================================================
-- FIIMS — Migration 009: Realtime Publications + Storage RLS
-- ============================================================

-- ── Realtime ──────────────────────────────────────────────────
-- Enable Postgres replication on tables that the frontend
-- subscribes to via supabase.channel().on('postgres_changes'...)

ALTER PUBLICATION supabase_realtime ADD TABLE stock_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE indents;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_requisitions;
ALTER PUBLICATION supabase_realtime ADD TABLE transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE material_issue_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE grns;

-- ── Storage Bucket Policies ───────────────────────────────────
-- Buckets must be created via Dashboard or CLI:
--   supabase storage create part-images   --public
--   supabase storage create grn-photos
--   supabase storage create qc-photos
--   supabase storage create documents
--   supabase storage create signatures
--
-- The SQL below creates storage.objects RLS policies for each bucket.

-- ── part-images (public read, write by admin/procurement) ─────

CREATE POLICY "part_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'part-images');

CREATE POLICY "part_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'part-images'
    AND auth.uid() IS NOT NULL
    AND auth_user_role() IN ('admin', 'procurement')
  );

CREATE POLICY "part_images_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'part-images'
    AND auth_user_role() IN ('admin', 'procurement')
  );

CREATE POLICY "part_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'part-images'
    AND auth_user_role() IN ('admin', 'procurement')
  );

-- ── grn-photos (authenticated read, write by store_manager/procurement/admin) ─

CREATE POLICY "grn_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'grn-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "grn_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'grn-photos'
    AND auth.uid() IS NOT NULL
    AND auth_user_role() IN ('admin', 'procurement', 'store_manager')
  );

CREATE POLICY "grn_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'grn-photos'
    AND auth_user_role() IN ('admin', 'procurement', 'store_manager')
  );

-- ── qc-photos (authenticated read, write by store_manager/procurement/admin) ──

CREATE POLICY "qc_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qc-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "qc_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'qc-photos'
    AND auth.uid() IS NOT NULL
    AND auth_user_role() IN ('admin', 'procurement', 'store_manager')
  );

CREATE POLICY "qc_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'qc-photos'
    AND auth_user_role() IN ('admin', 'procurement', 'store_manager')
  );

-- ── documents (PDFs: contracts, POs, spec sheets) ─────────────

CREATE POLICY "documents_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "documents_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND auth_user_role() IN ('admin', 'procurement', 'finance')
  );

CREATE POLICY "documents_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth_user_role() IN ('admin', 'procurement', 'finance')
  );

-- ── signatures (MIN digital signatures) ───────────────────────

CREATE POLICY "signatures_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signatures' AND auth.uid() IS NOT NULL);

CREATE POLICY "signatures_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures'
    AND auth.uid() IS NOT NULL
    AND auth_user_role() IN ('admin', 'store_manager')
  );
