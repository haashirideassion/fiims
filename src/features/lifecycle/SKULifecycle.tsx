import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { formatDate } from "@/lib/utils/format"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export function SKULifecycle() {
  const { id } = useParams()  // part id

  const { data: part, isLoading } = useQuery({
    queryKey: ["part", id],
    queryFn: async () => {
      const { data } = await supabase.from("spare_parts").select("*").eq("id", id!).single()
      return data
    },
  })

  const { data: stockHistory = [] } = useQuery({
    queryKey: ["stock-history", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("stock_snapshots")
        .select("snapshot_date, qty_on_hand, warehouse_id, warehouses(name)")
        .eq("part_id", id!)
        .order("snapshot_date")
        .limit(90)
      return data ?? []
    },
    enabled: !!id,
  })

  const { data: issuedHistory = [] } = useQuery({
    queryKey: ["issued-history", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("min_lines")
        .select("qty, material_issue_notes(issued_at)")
        .eq("part_id", id!)
        .order("created_at")
        .limit(50)
      return data ?? []
    },
    enabled: !!id,
  })

  const chartData = stockHistory.reduce((acc: any[], row: any) => {
    const date = row.snapshot_date
    const existing = acc.find((d) => d.date === date)
    if (existing) {
      existing.qty += row.qty_on_hand
    } else {
      acc.push({ date, qty: row.qty_on_hand })
    }
    return acc
  }, [])

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!part) return null

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title={`${part.sku} — Lifecycle`} description={part.name} />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Issued", value: issuedHistory.reduce((s: number, l: any) => s + l.qty, 0) },
          { label: "Last Issued", value: issuedHistory[issuedHistory.length - 1]?.material_issue_notes?.issued_at ? formatDate(issuedHistory[issuedHistory.length - 1].material_issue_notes.issued_at) : "—" },
          { label: "Category", value: part.category },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <p className="text-sm text-[var(--color-text-sub-600)]">{s.label}</p>
            <p className="text-xl font-semibold text-[var(--color-text-strong-950)] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Stock Level Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft-200)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="qty" stroke="#335cff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stockHistory.length === 0 && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-12 text-center">
          <p className="text-[var(--color-text-soft-400)]">No stock history snapshots available for this part</p>
        </div>
      )}
    </div>
  )
}
