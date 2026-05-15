import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate } from "@/lib/utils/format"
import { RiPencilLine } from "@remixicon/react"

export function VehicleDetail() {
  const { id } = useParams()

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_models(make, model, category, body_manufacturer)")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: docs = [] } = useQuery({
    queryKey: ["vehicle-docs", id],
    queryFn: async () => {
      const { data } = await supabase.from("vehicle_documents").select("*").eq("vehicle_id", id!)
      return data ?? []
    },
    enabled: !!id,
  })

  const { data: serviceHistory = [] } = useQuery({
    queryKey: ["vehicle-service", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("indents")
        .select("id, urgency, status, created_at")
        .eq("vehicle_id", id!)
        .order("created_at", { ascending: false })
        .limit(10)
      return data ?? []
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!vehicle) return null


  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={vehicle.reg_no}
        description={`${vehicle.vehicle_models?.make} ${vehicle.vehicle_models?.model} · ${vehicle.zone}`}
        backTo="/master/vehicles"
        backLabel="Vehicles"
        actions={
          <Link to={`/master/vehicles/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
            <RiPencilLine className="w-4 h-4" /> Edit
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)]">Identity</h3>
          {[
            ["Reg No.", vehicle.reg_no],
            ["Chassis No.", vehicle.chassis_no],
            ["Engine No.", vehicle.engine_no],
            ["Make / Model", `${vehicle.vehicle_models?.make} ${vehicle.vehicle_models?.model}`],
            ["Category", vehicle.vehicle_models?.category],
            ["Year", vehicle.year],
            ["Zone", vehicle.zone],
            ["Odometer", vehicle.odometer ? `${vehicle.odometer} km` : "—"],
            ["Status", null],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center justify-between text-sm border-b border-[var(--color-border-soft-200)] pb-2 last:border-0">
              <span className="text-[var(--color-text-soft-400)]">{label}</span>
              {label === "Status" ? <StatusBadge status={vehicle.status} /> : <span className="text-[var(--color-text-strong-950)]">{value as string ?? "—"}</span>}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Documents</h3>
            {docs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-soft-400)]">No documents uploaded</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((d: any) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-strong-950)]">{d.doc_type}</span>
                    <span className={`text-xs ${d.expiry_date && new Date(d.expiry_date) < new Date() ? "text-[var(--color-error-base)]" : "text-[var(--color-text-soft-400)]"}`}>
                      {d.expiry_date ? `Expires ${formatDate(d.expiry_date)}` : "No expiry"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Recent Service</h3>
            {serviceHistory.length === 0 ? (
              <p className="text-sm text-[var(--color-text-soft-400)]">No service history</p>
            ) : (
              <ul className="space-y-2">
                {serviceHistory.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between text-sm border-b border-[var(--color-border-soft-200)] pb-2 last:border-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${s.urgency === "Breakdown" ? "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)]" : "bg-[var(--color-bg-soft-200)] text-[var(--color-text-sub-600)]"}`}>{s.urgency}</span>
                    <span className="text-[var(--color-text-soft-400)] text-xs">{formatDate(s.created_at)}</span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
