import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ExportButton } from "@/components/shared/ExportButton"
import { formatDate } from "@/lib/utils/format"
import { RiAddLine, RiEyeLine } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

export function GRNList() {
  const { data: grns = [], isLoading } = useQuery({
    queryKey: ["grns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grns")
        .select("*, purchase_orders(id, vendors(legal_name)), warehouses(name)")
        .order("grn_date", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "GRN No.", cell: ({ getValue }) => <span className="font-mono text-xs">GRN-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.purchase_orders?.vendors?.legal_name ?? "—" },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name ?? "—" },
    { accessorKey: "grn_date", header: "Date", cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: "lead_time_days", header: "Lead Time", cell: ({ getValue }) => getValue() ? `${getValue()}d` : "—" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/inward/grn/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Goods Receipt Notes"
        description="Record incoming stock against purchase orders"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={grns} columns={["id", "grn_date", "status"]} filename="grns" />
            <Link to="/inward/grn/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New GRN
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={grns} isLoading={isLoading} searchPlaceholder="Search GRNs…" />
    </div>
  )
}
