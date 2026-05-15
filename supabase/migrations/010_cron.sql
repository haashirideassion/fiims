-- ============================================================
-- FIIMS — Migration 010: Activate Cron Jobs (pg_cron)
-- Requires pg_cron extension (declared in 001_schema.sql).
-- Run this migration AFTER deploying to Supabase — pg_cron
-- requires the project's Postgres instance to be running.
-- ============================================================

-- Remove any existing schedules first (idempotent)
SELECT cron.unschedule('check-reorder')        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-reorder');
SELECT cron.unschedule('monthly-scorecards')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-scorecards');
SELECT cron.unschedule('daily-snapshot')       WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-snapshot');
SELECT cron.unschedule('update-contract-status') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-contract-status');

-- ── Check reorder levels — every hour ─────────────────────────
SELECT cron.schedule(
  'check-reorder',
  '0 * * * *',
  'SELECT fn_check_reorder_levels()'
);

-- ── Calculate vendor scorecards — 1st of every month, 02:00 ──
SELECT cron.schedule(
  'monthly-scorecards',
  '0 2 1 * *',
  $cron$
    SELECT fn_calculate_scorecard(
      id,
      EXTRACT(month FROM now() - INTERVAL '1 month')::int,
      EXTRACT(year  FROM now() - INTERVAL '1 month')::int
    )
    FROM vendors
    WHERE status = 'Approved';
  $cron$
);

-- ── Take daily stock snapshot — every night at 23:00 ──────────
SELECT cron.schedule(
  'daily-snapshot',
  '0 23 * * *',
  'SELECT fn_take_stock_snapshot()'
);

-- ── Auto-update rate_contract status — every midnight ─────────
SELECT cron.schedule(
  'update-contract-status',
  '0 0 * * *',
  $cron$
    UPDATE rate_contracts
    SET status = CASE
      WHEN valid_until < CURRENT_DATE              THEN 'Expired'
      WHEN valid_until <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'Active'
    END
    WHERE status NOT IN ('Draft', 'Expired')
       OR (status = 'expiring_soon' AND valid_until >= CURRENT_DATE);
  $cron$
);
