import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"

function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "var(--color-bg-soft-200)"
  const intensity = Math.min(1, value / max)
  const r = Math.round(239 + (220 - 239) * intensity)
  const g = Math.round(68 + (38 - 68) * intensity)
  const b = Math.round(68 + (38 - 68) * intensity)
  return `rgb(${r},${g},${b})`
}

export function DefectHeatmap() {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["defect-heatmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qc_records")
        .select("rejected_qty, reason_code, grns(purchase_orders(vendors(id, legal_name)))")
        .gt("rejected_qty", 0)
      if (error) throw error
      return data
    },
  })

  // Aggregate: vendor × reason_code → total rejections
  const vendors = Array.from(new Set(raw.map((r: any) => r.grns?.purchase_orders?.vendors?.legal_name).filter(Boolean))) as string[]
  const reasons = Array.from(new Set(raw.map((r: any) => r.reason_code).filter(Boolean))) as string[]

  const matrix: Record<string, Record<string, number>> = {}
  for (const v of vendors) matrix[v] = {}
  for (const r of raw as any[]) {
    const v = r.grns?.purchase_orders?.vendors?.legal_name
    const rc = r.reason_code
    if (v && rc) matrix[v][rc] = (matrix[v][rc] ?? 0) + r.rejected_qty
  }

  const maxVal = Math.max(1, ...vendors.flatMap((v) => reasons.map((rc) => matrix[v]?.[rc] ?? 0)))

  return (
    <div className="space-y-5">
      <PageHeader title="Defect Heatmap" description="Rejection volume by vendor and defect type" />
      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
      ) : vendors.length === 0 ? (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-12 text-center">
          <p className="text-[var(--color-text-soft-400)]">No rejection data found</p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-soft-200)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-soft-400)] uppercase">Vendor</th>
                {reasons.map((rc) => (
                  <th key={rc} className="px-3 py-3 text-center text-xs font-medium text-[var(--color-text-soft-400)] uppercase whitespace-nowrap">{rc}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor} className="border-b border-[var(--color-border-soft-200)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-text-strong-950)] whitespace-nowrap">{vendor}</td>
                  {reasons.map((rc) => {
                    const val = matrix[vendor]?.[rc] ?? 0
                    return (
                      <td key={rc} className="px-3 py-3 text-center" title={`${val} rejections`}>
                        <div
                          className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold"
                          style={{ background: heatColor(val, maxVal), color: val > maxVal * 0.5 ? "white" : "var(--color-text-strong-950)" }}
                        >
                          {val > 0 ? val : "—"}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border-soft-200)]">
            <span className="text-xs text-[var(--color-text-soft-400)]">Low</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div key={t} className="w-6 h-3 rounded" style={{ background: heatColor(t * maxVal, maxVal) }} />
              ))}
            </div>
            <span className="text-xs text-[var(--color-text-soft-400)]">High</span>
          </div>
        </div>
      )}
    </div>
  )
}
