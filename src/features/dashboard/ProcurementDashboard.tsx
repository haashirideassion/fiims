import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"

export function ProcurementDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["procurement-stats"],
    queryFn: async () => {
      const [openPRs, openPOs, pendingGRNs] = await Promise.all([
        supabase.from("purchase_requisitions").select("*", { count: "exact", head: true }).eq("status", "Approved"),
        supabase.from("purchase_orders").select("*", { count: "exact", head: true }).eq("status", "Issued"),
        supabase.from("grns").select("*", { count: "exact", head: true }).eq("status", "Draft"),
      ])
      return {
        openPRs: openPRs.count ?? 0,
        openPOs: openPOs.count ?? 0,
        pendingGRNs: pendingGRNs.count ?? 0,
      }
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Procurement Dashboard" description="Purchase pipeline overview" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Approved PRs (not PO'd)", value: stats?.openPRs ?? 0 },
          { label: "Open Purchase Orders", value: stats?.openPOs ?? 0 },
          { label: "GRNs Pending Receipt", value: stats?.pendingGRNs ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <p className="text-sm text-[var(--color-text-sub-600)] mb-2">{s.label}</p>
            <p className="text-2xl font-semibold text-[var(--color-text-strong-950)]">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
