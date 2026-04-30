import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ExportButton } from "@/components/shared/ExportButton"
import { formatDate } from "@/lib/utils/format"
import type { ColumnDef } from "@tanstack/react-table"

export function WarrantyTracker() {
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["warranty-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warranty_claims")
        .select("*, spare_parts(sku, name), vendors(legal_name)")
        .order("failure_date", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "Claim No.", cell: ({ getValue }) => <span className="font-mono text-xs">WRN-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "part", header: "Part", cell: ({ row }) => `${row.original.spare_parts?.sku} — ${row.original.spare_parts?.name}` },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendors?.legal_name ?? "—" },
    { accessorKey: "failure_date", header: "Failure Date", cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-sm text-[var(--color-text-sub-600)] line-clamp-1">{getValue() as string}</span> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
  ]

  const open = claims.filter((c: any) => c.status !== "Resolved" && c.status !== "Rejected")
  const resolved = claims.filter((c: any) => c.status === "Resolved")

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warranty Tracker"
        description="Part failure claims and vendor responses"
        actions={<ExportButton data={claims} columns={["id", "failure_date", "status"]} filename="warranty-claims" />}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Claims", value: open.length, color: "text-[var(--color-warning-base)]" },
          { label: "Resolved", value: resolved.length, color: "text-[var(--color-success-base)]" },
          { label: "Total Claims", value: claims.length, color: "text-[var(--color-text-strong-950)]" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <p className="text-sm text-[var(--color-text-sub-600)]">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={claims} isLoading={isLoading} searchPlaceholder="Search warranty claims…" />
    </div>
  )
}
