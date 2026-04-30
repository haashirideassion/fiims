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

export function TransferList() {
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select("*, source:warehouses!source_wh(name), dest:warehouses!dest_wh(name)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "Transfer No.", cell: ({ getValue }) => <span className="font-mono text-xs">TRF-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "source", header: "From", cell: ({ row }) => row.original.source?.name ?? "—" },
    { id: "dest", header: "To", cell: ({ row }) => row.original.dest?.name ?? "—" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "dispatched_at", header: "Dispatched", cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : "—" },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/outward/transfers/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transfers"
        description="Inter-warehouse stock movements"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={transfers} columns={["id", "status"]} filename="transfers" />
            <Link to="/outward/transfers/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New Transfer
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={transfers} isLoading={isLoading} searchPlaceholder="Search transfers…" />
    </div>
  )
}
