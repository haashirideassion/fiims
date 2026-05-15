import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate, formatCurrency } from "@/lib/utils/format"

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--color-border-soft-200)] last:border-0">
      <span className="text-sm text-[var(--color-text-soft-400)]">{label}</span>
      <span className="text-sm text-[var(--color-text-strong-950)] font-medium">{value}</span>
    </div>
  )
}

export function ScrapDetail() {
  const { id } = useParams()

  const { data: scrap, isLoading } = useQuery({
    queryKey: ["scrap-record", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrap_records")
        .select("*, warehouses(name), spare_parts(sku, name), users!created_by(name)")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data
    },
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!scrap) return null

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`SCR-${(id ?? "").slice(0, 8).toUpperCase()}`}
        description="Scrap record details"
        backTo="/outward/scrap"
        backLabel="Scrap Records"
        actions={<StatusBadge status={scrap.status ?? "Pending Approval"} />}
      />

      <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6 space-y-0.5">
        <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Scrap Details</h3>
        <Row label="Part" value={scrap.spare_parts ? `${scrap.spare_parts.sku} — ${scrap.spare_parts.name}` : undefined} />
        <Row label="Warehouse" value={scrap.warehouses?.name} />
        <Row label="Batch No." value={scrap.batch_no} />
        <Row label="Quantity" value={scrap.qty} />
        <Row label="Book Value" value={formatCurrency(scrap.value ?? 0)} />
        <Row label="Reason" value={scrap.reason_code} />
        <Row label="Recorded By" value={scrap.users?.name} />
        <Row label="Date" value={formatDate(scrap.created_at)} />
      </div>

      {(scrap.photos ?? []).length > 0 && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Evidence Photos</h3>
          <div className="flex flex-wrap gap-3">
            {(scrap.photos as string[]).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Evidence ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-[var(--color-border-soft-200)]" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
