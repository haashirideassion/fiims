import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/useAuth"
import { PageHeader } from "@/components/layout/PageHeader"
import { RiBox3Line, RiAlertLine, RiArrowUpLine, RiArrowDownLine } from "@remixicon/react"

interface StatCard {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

function StatCard({ label, value, sub, icon, trend }: StatCard) {
  return (
    <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-text-sub-600)]">{label}</span>
        <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-alpha-10)] flex items-center justify-center text-[var(--color-primary-500)]">
          {icon}
        </span>
      </div>
      <div className="text-2xl font-semibold text-[var(--color-text-strong-950)]">{value}</div>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <RiArrowUpLine className="w-3 h-3 text-[var(--color-success-base)]" />}
          {trend === "down" && <RiArrowDownLine className="w-3 h-3 text-[var(--color-error-base)]" />}
          <span className="text-xs text-[var(--color-text-soft-400)]">{sub}</span>
        </div>
      )}
    </div>
  )
}

export function StoreManagerDashboard() {
  const { user } = useAuth()
  const warehouseId = user?.home_warehouse_id

  const { data: lowStockCount = 0 } = useQuery({
    queryKey: ["low-stock-count", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return 0
      const { count } = await supabase
        .from("part_warehouse_levels")
        .select("*", { count: "exact", head: true })
        .eq("warehouse_id", warehouseId)
      return count ?? 0
    },
    enabled: !!warehouseId,
  })

  const { data: pendingPRs = 0 } = useQuery({
    queryKey: ["pending-prs", warehouseId],
    queryFn: async () => {
      const { count } = await supabase
        .from("purchase_requisitions")
        .select("*", { count: "exact", head: true })
        .eq("warehouse_id", warehouseId!)
        .eq("status", "Submitted")
      return count ?? 0
    },
    enabled: !!warehouseId,
  })

  const { data: pendingQC = 0 } = useQuery({
    queryKey: ["pending-qc", warehouseId],
    queryFn: async () => {
      const { count } = await supabase
        .from("grns")
        .select("*", { count: "exact", head: true })
        .eq("warehouse_id", warehouseId!)
        .eq("status", "Pending QC")
      return count ?? 0
    },
    enabled: !!warehouseId,
  })

  const { data: pendingIndents = 0 } = useQuery({
    queryKey: ["pending-indents", warehouseId],
    queryFn: async () => {
      const { count } = await supabase
        .from("indents")
        .select("*", { count: "exact", head: true })
        .eq("status", "Approved")
      return count ?? 0
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Store Dashboard" description="Warehouse inventory overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Low Stock SKUs" value={lowStockCount} sub="Needs reorder" icon={<RiAlertLine className="w-4 h-4" />} trend="down" />
        <StatCard label="Pending PRs" value={pendingPRs} sub="Awaiting approval" icon={<RiBox3Line className="w-4 h-4" />} />
        <StatCard label="Pending QC" value={pendingQC} sub="GRNs to inspect" icon={<RiBox3Line className="w-4 h-4" />} />
        <StatCard label="Open Indents" value={pendingIndents} sub="Ready to issue" icon={<RiBox3Line className="w-4 h-4" />} />
      </div>
    </div>
  )
}
