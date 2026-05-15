import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"

import { RiPencilLine } from "@remixicon/react"
import type { SparePart } from "@/lib/types"

function DetailRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === null || value === undefined ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[var(--color-border-soft-200)] last:border-0">
      <span className="w-40 shrink-0 text-sm text-[var(--color-text-soft-400)]">{label}</span>
      <span className="text-sm text-[var(--color-text-strong-950)]">{display}</span>
    </div>
  )
}

export function PartDetail() {
  const { id } = useParams()

  const { data: part, isLoading } = useQuery({
    queryKey: ["part", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_parts").select("*").eq("id", id!).single()
      if (error) throw error
      return data as SparePart
    },
  })

  const { data: levels = [] } = useQuery({
    queryKey: ["part-levels", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("part_warehouse_levels")
        .select("*, warehouses(name)")
        .eq("part_id", id!)
      return data ?? []
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!part) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-error-base)]">Part not found</div>

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={part.name}
        description={part.sku}
        backTo="/master/parts"
        backLabel="Parts"
        actions={
          <Link to={`/master/parts/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
            <RiPencilLine className="w-4 h-4" /> Edit
          </Link>
        }
      />

      <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Part Details</h3>
        <DetailRow label="SKU" value={part.sku} />
        <DetailRow label="Category" value={part.category} />
        <DetailRow label="OEM No." value={part.oem_no} />
        <DetailRow label="UOM" value={part.uom} />
        <DetailRow label="HSN Code" value={part.hsn} />
        <DetailRow label="GST Rate" value={part.gst_rate ? `${part.gst_rate}%` : undefined} />
        <DetailRow label="Serialised" value={part.serialised} />
        <DetailRow label="Shelf Life Tracking" value={part.shelf_life_flag} />
      </div>

      {levels.length > 0 && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Stock Levels by Warehouse</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-soft-200)]">
                {["Warehouse", "Min Qty", "Max Qty", "Reorder Qty"].map((h) => (
                  <th key={h} className="text-left pb-3 text-xs font-medium text-[var(--color-text-soft-400)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levels.map((l: any) => (
                <tr key={l.id} className="border-b border-[var(--color-border-soft-200)] last:border-0">
                  <td className="py-3 text-[var(--color-text-strong-950)]">{l.warehouses?.name}</td>
                  <td className="py-3 text-[var(--color-text-sub-600)]">{l.min_qty}</td>
                  <td className="py-3 text-[var(--color-text-sub-600)]">{l.max_qty}</td>
                  <td className="py-3 text-[var(--color-text-sub-600)]">{l.reorder_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {part.images && part.images.length > 0 && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Images</h3>
          <div className="flex flex-wrap gap-3">
            {part.images.map((url: string, i: number) => (
              <img key={i} src={url} alt={`Part image ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-[var(--color-border-soft-200)]" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
