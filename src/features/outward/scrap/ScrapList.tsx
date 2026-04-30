import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ExportButton } from "@/components/shared/ExportButton"
import { formatDate, formatCurrency } from "@/lib/utils/format"
import { RiAddLine, RiEyeLine } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

export function ScrapList() {
  const { data: scraps = [], isLoading } = useQuery({
    queryKey: ["scrap-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrap_records")
        .select("*, warehouses(name), spare_parts(sku, name)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "Scrap No.", cell: ({ getValue }) => <span className="font-mono text-xs">SCR-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "part", header: "Part", cell: ({ row }) => `${row.original.spare_parts?.sku} — ${row.original.spare_parts?.name}` },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name ?? "—" },
    { accessorKey: "qty", header: "Qty" },
    { accessorKey: "value", header: "Value", cell: ({ getValue }) => formatCurrency(getValue() as number ?? 0) },
    { accessorKey: "reason_code", header: "Reason" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "created_at", header: "Date", cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/outward/scrap/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Scrap Records"
        description="Condemned and written-off stock"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={scraps} columns={["id", "qty", "value", "reason_code", "status"]} filename="scrap-records" />
            <Link to="/outward/scrap/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New Scrap
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={scraps} isLoading={isLoading} searchPlaceholder="Search scrap records…" />
    </div>
  )
}
