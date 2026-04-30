import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDateTime } from "@/lib/utils/format"
import { RiSearchLine } from "@remixicon/react"

export function SerialTracer() {
  const [serial, setSerial] = useState("")
  const [search, setSearch] = useState("")

  const { data: unit, isLoading, isFetching } = useQuery({
    queryKey: ["serial-trace", search],
    queryFn: async () => {
      if (!search) return null
      const { data, error } = await supabase
        .from("serialised_units")
        .select("*, spare_parts(sku, name), vehicles(reg_no)")
        .eq("serial_no", search.toUpperCase())
        .single()
      if (error) return null
      return data
    },
    enabled: !!search,
  })

  const { data: events = [] } = useQuery({
    queryKey: ["serial-events", unit?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("serialised_unit_events")
        .select("*, warehouses(name), vehicles(reg_no), users(name)")
        .eq("unit_id", unit!.id)
        .order("created_at", { ascending: true })
      return data ?? []
    },
    enabled: !!unit?.id,
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Serial Number Tracer" description="Full lifecycle history of a serialised part" />

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-soft-400)]" />
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(serial)}
            placeholder="Enter serial number…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <button onClick={() => setSearch(serial)} className="px-4 py-2 rounded-xl bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
          Trace
        </button>
      </div>

      {(isLoading || isFetching) && search && (
        <div className="h-20 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Searching…</div>
      )}

      {search && !isLoading && !isFetching && !unit && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-8 text-center">
          <p className="text-[var(--color-text-soft-400)]">No part found with serial number <strong>{search}</strong></p>
        </div>
      )}

      {unit && (
        <>
          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-[var(--color-text-strong-950)]">{unit.serial_no}</p>
                <p className="text-sm text-[var(--color-text-sub-600)]">{unit.spare_parts?.sku} — {unit.spare_parts?.name}</p>
              </div>
              <StatusBadge status={unit.current_status} />
            </div>
            {unit.vehicles && (
              <p className="text-sm text-[var(--color-text-soft-400)] mt-2">Currently fitted: {unit.vehicles.reg_no}</p>
            )}
          </div>

          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Event History</h3>
            <div className="space-y-4">
              {events.map((e: any, i: number) => (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)] shrink-0 mt-1" />
                    {i < events.length - 1 && <div className="w-0.5 flex-1 bg-[var(--color-border-soft-200)] my-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--color-text-strong-950)]">{e.event_type}</p>
                      <span className="text-xs text-[var(--color-text-soft-400)]">{formatDateTime(e.created_at)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-sub-600)] mt-0.5">
                      {e.warehouses?.name && `Warehouse: ${e.warehouses.name}`}
                      {e.vehicles?.reg_no && ` · Vehicle: ${e.vehicles.reg_no}`}
                      {e.users?.name && ` · By: ${e.users.name}`}
                    </p>
                    {e.notes && <p className="text-xs text-[var(--color-text-soft-400)] mt-0.5 italic">{e.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
