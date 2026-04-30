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

export function POList() {
  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, vendors(legal_name)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "PO No.", cell: ({ getValue }) => <span className="font-mono text-xs">PO-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendors?.legal_name ?? "—" },
    { accessorKey: "total_value", header: "Total Value", cell: ({ getValue }) => formatCurrency(getValue() as number ?? 0) },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "issued_at", header: "Issued", cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : "—" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link to={`/inward/po/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        description="Vendor purchase orders"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={pos} columns={["id", "total_value", "status"]} filename="purchase-orders" />
            <Link to="/inward/po/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New PO
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={pos} isLoading={isLoading} searchPlaceholder="Search POs…" />
    </div>
  )
}
