-- ============================================================
-- FIIMS — Migration 003: PostgreSQL Functions & Triggers
-- ============================================================

-- ── Current Stock Function ────────────────────────────────

create or replace function fn_current_stock(p_part_id uuid, p_warehouse_id uuid)
returns int language plpgsql security definer as $$
declare
  v_received   int;
  v_issued     int;
  v_scrapped   int;
  v_transferred_out int;
  v_transferred_in  int;
begin
  -- Stock received via GRN (QC accepted)
  select coalesce(sum(ql.accepted_qty), 0) into v_received
  from qc_records ql
  join grn_lines gl on gl.id = ql.grn_line_id
  join grns g on g.id = gl.grn_id
  where gl.po_line_id in (
    select id from po_lines where part_id = p_part_id and destination_warehouse_id = p_warehouse_id
  );

  -- Stock issued via MIN
  select coalesce(sum(ml.qty), 0) into v_issued
  from min_lines ml
  join material_issue_notes mn on mn.id = ml.min_id
  where ml.part_id = p_part_id and mn.warehouse_id = p_warehouse_id;

  -- Stock scrapped
  select coalesce(sum(qty), 0) into v_scrapped
  from scrap_records
  where part_id = p_part_id and warehouse_id = p_warehouse_id
    and status = 'Approved';

  -- Stock transferred out
  select coalesce(sum(tl.qty_dispatched), 0) into v_transferred_out
  from transfer_lines tl
  join transfers t on t.id = tl.transfer_id
  where tl.part_id = p_part_id and t.source_wh = p_warehouse_id
    and t.status in ('In-Transit', 'Received');

  -- Stock transferred in
  select coalesce(sum(tl.qty_received), 0) into v_transferred_in
  from transfer_lines tl
  join transfers t on t.id = tl.transfer_id
  where tl.part_id = p_part_id and t.dest_wh = p_warehouse_id
    and t.status = 'Received';

  return v_received - v_issued - v_scrapped - v_transferred_out + v_transferred_in;
end;
$$;

-- ── Vendor Scorecard Function ─────────────────────────────

create or replace function fn_calculate_scorecard(
  p_vendor_id   uuid,
  p_month       int,
  p_year        int
)
returns void language plpgsql security definer as $$
declare
  v_quality_score     numeric;
  v_timeliness_score  numeric;
  v_price_score       numeric;
  v_composite_score   numeric;
  v_star_rating       numeric;
  v_txn_count         int;
  v_total_received    int;
  v_total_rejected    int;
  v_avg_days_late     numeric;
  v_price_variance    int;
  v_total_lines       int;
begin
  -- Quality score: (received - rejected) / received × 100
  select
    coalesce(sum(qr.accepted_qty + qr.rejected_qty), 0),
    coalesce(sum(qr.rejected_qty), 0)
  into v_total_received, v_total_rejected
  from qc_records qr
  join grns g on g.id = qr.grn_id
  join purchase_orders po on po.id = g.po_id
  where po.vendor_id = p_vendor_id
    and extract(month from g.grn_date) = p_month
    and extract(year from g.grn_date) = p_year;

  if v_total_received > 0 then
    v_quality_score := ((v_total_received - v_total_rejected)::numeric / v_total_received) * 100;
  else
    v_quality_score := 100;
  end if;

  -- Timeliness score: based on lead_time_days vs expected
  select coalesce(avg(greatest(0, g.lead_time_days - 7)), 0)
  into v_avg_days_late
  from grns g
  join purchase_orders po on po.id = g.po_id
  where po.vendor_id = p_vendor_id
    and extract(month from g.grn_date) = p_month
    and extract(year from g.grn_date) = p_year
    and g.lead_time_days is not null;

  v_timeliness_score := greatest(0, 100 - (v_avg_days_late * 5));

  -- Price score: lines matching contract price
  select count(*), count(*) filter (where pl.unit_price <= rcl.price * 1.05)
  into v_total_lines, v_price_variance
  from po_lines pl
  join purchase_orders po on po.id = pl.po_id
  left join rate_contract_lines rcl on rcl.id = pl.contract_line_id
  where po.vendor_id = p_vendor_id
    and extract(month from po.created_at) = p_month
    and extract(year from po.created_at) = p_year;

  if v_total_lines > 0 then
    v_price_score := (v_price_variance::numeric / v_total_lines) * 100;
  else
    v_price_score := 100;
  end if;

  -- Composite: 40% quality + 30% timeliness + 30% price
  v_composite_score := (v_quality_score * 0.4) + (v_timeliness_score * 0.3) + (v_price_score * 0.3);

  -- Star rating
  v_star_rating := round(v_composite_score / 20, 1);

  -- Transaction count
  select count(*) into v_txn_count
  from grns g
  join purchase_orders po on po.id = g.po_id
  where po.vendor_id = p_vendor_id
    and extract(month from g.grn_date) = p_month
    and extract(year from g.grn_date) = p_year;

  -- Upsert scorecard
  insert into vendor_scorecards (vendor_id, period_month, period_year, quality_score, timeliness_score, price_score, composite_score, star_rating, transaction_count)
  values (p_vendor_id, p_month, p_year, v_quality_score, v_timeliness_score, v_price_score, v_composite_score, v_star_rating, v_txn_count)
  on conflict (vendor_id, period_month, period_year) do update set
    quality_score     = excluded.quality_score,
    timeliness_score  = excluded.timeliness_score,
    price_score       = excluded.price_score,
    composite_score   = excluded.composite_score,
    star_rating       = excluded.star_rating,
    transaction_count = excluded.transaction_count;
end;
$$;

-- ── MTBR Function ─────────────────────────────────────────

create or replace function fn_mtbr(p_part_id uuid, p_model_id uuid default null)
returns numeric language plpgsql security definer as $$
declare
  v_avg_days numeric;
begin
  select avg(gap) into v_avg_days from (
    select
      extract(epoch from (issued_at - lag(issued_at) over (partition by v.id order by mn.issued_at))) / 86400 as gap
    from min_lines ml
    join min_serials ms on ms.min_line_id = ml.id
    join material_issue_notes mn on mn.id = ml.min_id
    join indents i on i.id = mn.indent_id
    join vehicles v on v.id = i.vehicle_id
    where ml.part_id = p_part_id
      and (p_model_id is null or v.model_id = p_model_id)
  ) g where gap is not null and gap > 0;

  return coalesce(v_avg_days, 0);
end;
$$;

-- ── ABC Analysis Function ─────────────────────────────────

create or replace function fn_abc_analysis(p_warehouse_id uuid, p_months int default 12)
returns table(part_id uuid, sku text, name text, total_value numeric, pct_cumulative numeric, abc_class text)
language plpgsql security definer as $$
begin
  return query
  with spend as (
    select
      ml.part_id,
      sum(ml.qty * coalesce(pl.unit_price, 0)) as total_value
    from min_lines ml
    join material_issue_notes mn on mn.id = ml.min_id
    left join indent_lines il on il.id = ml.indent_line_id
    left join po_lines pl on pl.part_id = ml.part_id
    where mn.warehouse_id = p_warehouse_id
      and mn.issued_at >= now() - (p_months || ' months')::interval
    group by ml.part_id
  ),
  ranked as (
    select
      s.part_id,
      sp.sku,
      sp.name,
      s.total_value,
      sum(s.total_value) over (order by s.total_value desc) /
        nullif(sum(s.total_value) over (), 0) * 100 as pct_cumulative
    from spend s
    join spare_parts sp on sp.id = s.part_id
  )
  select
    r.part_id,
    r.sku,
    r.name,
    r.total_value,
    r.pct_cumulative,
    case
      when r.pct_cumulative <= 80 then 'A'
      when r.pct_cumulative <= 95 then 'B'
      else 'C'
    end as abc_class
  from ranked r
  order by r.total_value desc;
end;
$$;

-- ── Audit Log Trigger ─────────────────────────────────────

create or replace function fn_audit_trigger()
returns trigger language plpgsql security definer as $$
begin
  insert into audit_logs (user_id, action, entity, entity_id, before, after, created_at)
  values (
    auth.uid(),
    tg_op || ':' || tg_table_name,
    tg_table_name,
    case tg_op when 'DELETE' then old.id else new.id end,
    case tg_op when 'INSERT' then null else row_to_json(old)::jsonb end,
    case tg_op when 'DELETE' then null else row_to_json(new)::jsonb end,
    now()
  );
  return coalesce(new, old);
end;
$$;

-- Apply audit trigger to key tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'purchase_requisitions', 'purchase_orders', 'grns', 'qc_records',
    'indents', 'material_issue_notes', 'transfers', 'scrap_records',
    'vendors', 'warehouses', 'users'
  ] loop
    execute format('
      drop trigger if exists audit_%I on %I;
      create trigger audit_%I
        after insert or update or delete on %I
        for each row execute function fn_audit_trigger();
    ', t, t, t, t);
  end loop;
end;
$$;

-- ── Reorder Check Function (called by pg_cron) ────────────

create or replace function fn_check_reorder_levels()
returns void language plpgsql security definer as $$
declare
  r record;
  v_stock int;
begin
  for r in
    select pwl.part_id, pwl.warehouse_id, pwl.reorder_qty, pwl.min_qty, w.name as wh_name
    from part_warehouse_levels pwl
    join warehouses w on w.id = pwl.warehouse_id
    where w.status = 'Active'
  loop
    v_stock := fn_current_stock(r.part_id, r.warehouse_id);
    if v_stock <= r.reorder_qty then
      -- Auto-create draft PR if none exists in last 7 days
      if not exists (
        select 1 from purchase_requisitions pr
        join pr_lines pl on pl.pr_id = pr.id
        where pl.part_id = r.part_id
          and pr.warehouse_id = r.warehouse_id
          and pr.status = 'Draft'
          and pr.created_at > now() - interval '7 days'
      ) then
        insert into purchase_requisitions (warehouse_id, status, urgency)
        values (r.warehouse_id, 'Draft', case when v_stock = 0 then 'Critical' when v_stock < r.min_qty then 'Urgent' else 'Normal' end)
        returning id into r;
      end if;
    end if;
  end loop;
end;
$$;

-- Schedule reorder check every hour (requires pg_cron extension)
-- select cron.schedule('check-reorder', '0 * * * *', 'select fn_check_reorder_levels()');

-- Schedule monthly scorecard calculation
-- select cron.schedule('monthly-scorecards', '0 2 1 * *',
--   $cron$
--     select fn_calculate_scorecard(id, extract(month from now() - interval '1 month')::int, extract(year from now() - interval '1 month')::int)
--     from vendors where status = 'Active';
--   $cron$
-- );

-- ── Stock Snapshot (daily) ────────────────────────────────

create or replace function fn_take_stock_snapshot()
returns void language plpgsql security definer as $$
declare
  r record;
begin
  for r in
    select distinct part_id, warehouse_id from part_warehouse_levels
  loop
    insert into stock_snapshots (part_id, warehouse_id, qty_on_hand, snapshot_date)
    values (r.part_id, r.warehouse_id, fn_current_stock(r.part_id, r.warehouse_id), current_date)
    on conflict do nothing;
  end loop;
end;
$$;
