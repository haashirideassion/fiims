import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"

import { ExportButton } from "@/components/shared/ExportButton"
import { formatDate } from "@/lib/utils/format"
import { RiAddLine, RiEyeLine } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

export function ReturnList() {
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["return-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_notes")
        .select("*, warehouses(name), users!returned_by(name)")
        .order("return_date", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "Return No.", cell: ({ getValue }) => <span className="font-mono text-xs">RTN-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name ?? "—" },
    { id: "returned_by", header: "Returned By", cell: ({ row }) => row.original.users?.name ?? "—" },
    { accessorKey: "return_date", header: "Date", cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/outward/returns/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Returns"
        description="Parts returned from vehicles to warehouse"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={returns} columns={["id", "return_date"]} filename="return-notes" />
            <Link to="/outward/returns/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New Return
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={returns} isLoading={isLoading} searchPlaceholder="Search returns…" />
    </div>
  )
}
