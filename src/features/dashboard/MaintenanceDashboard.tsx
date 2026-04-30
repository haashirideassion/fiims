import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Link } from "react-router-dom"
import { RiAddLine } from "@remixicon/react"

export function MaintenanceDashboard() {
  const { data: myIndents = [] } = useQuery({
    queryKey: ["my-indents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("indents")
        .select("id, urgency, status, created_at, vehicles(reg_no)")
        .order("created_at", { ascending: false })
        .limit(10)
      return data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Dashboard"
        actions={
          <Link to="/outward/indents/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
            <RiAddLine className="w-4 h-4" /> New Indent
          </Link>
        }
      />
      <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)]">
        <div className="p-4 border-b border-[var(--color-border-soft-200)]">
          <h3 className="text-sm font-medium text-[var(--color-text-strong-950)]">Recent Indents</h3>
        </div>
        {myIndents.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-text-soft-400)] text-center">No indents yet</p>
        ) : (
          <div className="divide-y divide-[var(--color-border-soft-200)]">
            {myIndents.map((indent: any) => (
              <Link key={indent.id} to={`/outward/indents/${indent.id}`} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-soft-200)] transition">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-strong-950)]">{indent.vehicles?.reg_no ?? "—"}</p>
                  <p className="text-xs text-[var(--color-text-soft-400)]">{indent.urgency}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${indent.urgency === "Breakdown" ? "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)]" : "bg-[var(--color-info-alpha-16)] text-[var(--color-info-base)]"}`}>
                  {indent.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
