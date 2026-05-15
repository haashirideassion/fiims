import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { formatDate } from "@/lib/utils/format"

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--color-border-soft-200)] last:border-0">
      <span className="text-sm text-[var(--color-text-soft-400)]">{label}</span>
      <span className="text-sm text-[var(--color-text-strong-950)] font-medium">{value}</span>
    </div>
  )
}

export function ReturnDetail() {
  const { id } = useParams()

  const { data: rtn, isLoading } = useQuery({
    queryKey: ["return-note", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_notes")
        .select("*, warehouses(name), users!returned_by(name), return_lines(*, spare_parts(sku, name))")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data
    },
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!rtn) return null

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`RTN-${(id ?? "").slice(0, 8).toUpperCase()}`}
        description="Return note details"
        backTo="/outward/returns"
        backLabel="Returns"
      />

      <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6 space-y-0.5">
        <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Return Details</h3>
        <Row label="Warehouse" value={rtn.warehouses?.name} />
        <Row label="Returned By" value={rtn.users?.name} />
        <Row label="Return Date" value={formatDate(rtn.return_date)} />
        {rtn.min_id && <Row label="MIN Reference" value={`MIN-${rtn.min_id.slice(0, 8).toUpperCase()}`} />}
      </div>

      <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Returned Items</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-soft-200)]">
              <th className="text-left py-2 text-[var(--color-text-soft-400)] font-medium">Part</th>
              <th className="text-right py-2 text-[var(--color-text-soft-400)] font-medium">Qty</th>
              <th className="text-right py-2 text-[var(--color-text-soft-400)] font-medium">Condition</th>
            </tr>
          </thead>
          <tbody>
            {(rtn.return_lines ?? []).map((line: any) => (
              <tr key={line.id} className="border-b border-[var(--color-border-soft-200)] last:border-0">
                <td className="py-2 text-[var(--color-text-strong-950)]">
                  <span className="font-mono text-xs text-[var(--color-text-soft-400)] mr-2">{line.spare_parts?.sku}</span>
                  {line.spare_parts?.name}
                </td>
                <td className="py-2 text-right text-[var(--color-text-strong-950)]">{line.qty}</td>
                <td className="py-2 text-right text-[var(--color-text-soft-400)]">{line.condition_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
