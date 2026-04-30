import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ExportButton } from "@/components/shared/ExportButton"
import { formatDate, formatCurrency } from "@/lib/utils/format"
import type { ColumnDef } from "@tanstack/react-table"

// Report definitions – each maps to a Supabase query + column config
interface ReportDef {
  title: string
  description: string
  queryFn: () => Promise<any[]>
  columns: ColumnDef<any>[]
}

const REPORT_DEFS: Record<string, ReportDef> = {
  "stock-ledger": {
    title: "Stock Ledger",
    description: "Current stock quantities by part and warehouse",
    queryFn: async () => {
      const { data } = await supabase
        .from("part_warehouse_levels")
        .select("*, spare_parts(sku, name, category), warehouses(name)")
        .order("warehouses(name)")
      return data ?? []
    },
    columns: [
      { id: "sku", header: "SKU", cell: ({ row }) => row.original.spare_parts?.sku },
      { id: "part", header: "Part Name", cell: ({ row }) => row.original.spare_parts?.name },
      { id: "category", header: "Category", cell: ({ row }) => row.original.spare_parts?.category },
      { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name },
      { accessorKey: "min_qty", header: "Min Qty" },
      { accessorKey: "max_qty", header: "Max Qty" },
      { accessorKey: "reorder_qty", header: "Reorder Qty" },
    ],
  },
  "po-register": {
    title: "PO Register",
    description: "All purchase orders with status and value",
    queryFn: async () => {
      const { data } = await supabase
        .from("purchase_orders")
        .select("*, vendors(legal_name)")
        .order("created_at", { ascending: false })
      return data ?? []
    },
    columns: [
      { accessorKey: "id", header: "PO No.", cell: ({ getValue }) => `PO-${(getValue() as string).slice(0, 8).toUpperCase()}` },
      { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendors?.legal_name },
      { accessorKey: "total_value", header: "Value", cell: ({ getValue }) => formatCurrency(getValue() as number ?? 0) },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "issued_at", header: "Issued", cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : "—" },
    ],
  },
  "min-register": {
    title: "MIN Register",
    description: "All Material Issue Notes",
    queryFn: async () => {
      const { data } = await supabase
        .from("material_issue_notes")
        .select("*, warehouses(name), indents(vehicles(reg_no))")
        .order("issued_at", { ascending: false })
      return data ?? []
    },
    columns: [
      { accessorKey: "id", header: "MIN No.", cell: ({ getValue }) => `MIN-${(getValue() as string).slice(0, 8).toUpperCase()}` },
      { id: "vehicle", header: "Vehicle", cell: ({ row }) => row.original.indents?.vehicles?.reg_no ?? "—" },
      { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name },
      { accessorKey: "issued_at", header: "Issued", cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : "—" },
    ],
  },
  "scrap-register": {
    title: "Scrap Register",
    description: "All condemned stock with values",
    queryFn: async () => {
      const { data } = await supabase
        .from("scrap_records")
        .select("*, spare_parts(sku, name), warehouses(name)")
        .order("created_at", { ascending: false })
      return data ?? []
    },
    columns: [
      { id: "part", header: "Part", cell: ({ row }) => `${row.original.spare_parts?.sku} — ${row.original.spare_parts?.name}` },
      { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouses?.name },
      { accessorKey: "qty", header: "Qty" },
      { accessorKey: "value", header: "Book Value", cell: ({ getValue }) => formatCurrency(getValue() as number ?? 0) },
      { accessorKey: "reason_code", header: "Reason" },
      { accessorKey: "status", header: "Status" },
    ],
  },
  "vendor-scorecard": {
    title: "Vendor Scorecard Report",
    description: "Composite performance scores by vendor",
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_scorecards")
        .select("*, vendors(legal_name)")
        .order("composite_score", { ascending: false })
      return data ?? []
    },
    columns: [
      { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendors?.legal_name },
      { accessorKey: "period_month", header: "Month" },
      { accessorKey: "period_year", header: "Year" },
      { accessorKey: "quality_score", header: "Quality", cell: ({ getValue }) => `${Math.round(getValue() as number ?? 0)}%` },
      { accessorKey: "timeliness_score", header: "Timeliness", cell: ({ getValue }) => `${Math.round(getValue() as number ?? 0)}%` },
      { accessorKey: "price_score", header: "Price", cell: ({ getValue }) => `${Math.round(getValue() as number ?? 0)}%` },
      { accessorKey: "composite_score", header: "Composite", cell: ({ getValue }) => `${Math.round(getValue() as number ?? 0)}%` },
      { accessorKey: "star_rating", header: "Stars" },
    ],
  },
}

export function ReportViewer() {
  const { reportType } = useParams()
  const def = REPORT_DEFS[reportType ?? ""] ?? null

  const { data = [], isLoading } = useQuery({
    queryKey: ["report", reportType],
    queryFn: def?.queryFn ?? (() => Promise.resolve([])),
    enabled: !!def,
  })

  if (!def) {
    return (
      <div className="space-y-5">
        <PageHeader title="Report" />
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-12 text-center">
          <p className="text-[var(--color-text-soft-400)]">Report <strong>{reportType}</strong> is not yet configured.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={def.title}
        description={def.description}
        actions={<ExportButton data={data} columns={def.columns.map((c) => (c as any).header ?? "")} filename={reportType ?? "report"} />}
      />
      <DataTable columns={def.columns} data={data} isLoading={isLoading} searchPlaceholder={`Search ${def.title.toLowerCase()}…`} />
    </div>
  )
}
