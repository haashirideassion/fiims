import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate } from "@/lib/utils/format"
import { RiArrowRightLine } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

export function QCQueue() {
  const { data: grns = [], isLoading } = useQuery({
    queryKey: ["qc-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grns")
        .select("*, warehouses(name), purchase_orders(vendors(legal_name))")
        .in("status", ["Received", "Pending QC"])
        .order("grn_date", { ascending: true })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "GRN Ref.", cell: ({ getValue }) => <span className="font-mono text-xs">GRN-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.purchase_orders?.vendors?.legal_name ?? "—" },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name ?? "—" },
    { accessorKey: "grn_date", header: "Received On", cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/inward/qc/${row.original.id}`} className="flex items-center gap-1 text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition">
          Inspect <RiArrowRightLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="QC Queue" description="GRNs awaiting quality inspection" />
      {grns.length === 0 && !isLoading ? (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-12 text-center">
          <p className="text-[var(--color-text-soft-400)]">No GRNs pending QC inspection</p>
        </div>
      ) : (
        <DataTable columns={columns} data={grns} isLoading={isLoading} searchPlaceholder="Search queue…" />
      )}
    </div>
  )
}
