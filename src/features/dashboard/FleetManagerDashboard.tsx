import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { RiCarLine, RiToolsLine, RiAlertLine, RiTimeLine } from "@remixicon/react"

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-text-sub-600)]">{label}</span>
        <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-alpha-10)] flex items-center justify-center text-[var(--color-primary-500)]">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-[var(--color-text-strong-950)]">{value}</div>
    </div>
  )
}

export function FleetManagerDashboard() {
  const { data: activeVehicles = 0 } = useQuery({
    queryKey: ["active-vehicles"],
    queryFn: async () => {
      const { count } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "Active")
      return count ?? 0
    },
  })

  const { data: breakdownIndents = 0 } = useQuery({
    queryKey: ["breakdown-indents"],
    queryFn: async () => {
      const { count } = await supabase.from("indents").select("*", { count: "exact", head: true }).eq("urgency", "Breakdown").neq("status", "Issued")
      return count ?? 0
    },
  })

  const { data: pendingApprovals = 0 } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { count } = await supabase.from("indents").select("*", { count: "exact", head: true }).eq("status", "Submitted")
      return count ?? 0
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet Dashboard" description="Vehicle and maintenance overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Vehicles" value={activeVehicles} icon={<RiCarLine className="w-4 h-4" />} />
        <StatCard label="Breakdown Indents" value={breakdownIndents} icon={<RiAlertLine className="w-4 h-4" />} />
        <StatCard label="Pending Approvals" value={pendingApprovals} icon={<RiTimeLine className="w-4 h-4" />} />
        <StatCard label="Maintenance Indents" value={0} icon={<RiToolsLine className="w-4 h-4" />} />
      </div>
    </div>
  )
}
