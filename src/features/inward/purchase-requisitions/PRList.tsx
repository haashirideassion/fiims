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

export function PRList() {
  const { data: prs = [], isLoading } = useQuery({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select("*, warehouses(name), users!created_by(name)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "PR No.", cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name ?? "—" },
    { id: "created_by", header: "Raised By", cell: ({ row }) => row.original.users?.name ?? "—" },
    { accessorKey: "urgency", header: "Urgency", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "created_at", header: "Date", cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link to={`/inward/pr/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Requisitions"
        description="Warehouse stock replenishment requests"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={prs} columns={["id", "urgency", "status", "created_at"]} filename="purchase-requisitions" />
            <Link to="/inward/pr/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New PR
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={prs} isLoading={isLoading} searchPlaceholder="Search PRs…" />
    </div>
  )
}
