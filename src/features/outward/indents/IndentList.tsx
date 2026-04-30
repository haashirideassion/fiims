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

export function IndentList() {
  const { data: indents = [], isLoading } = useQuery({
    queryKey: ["indents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indents")
        .select("*, vehicles(reg_no), users!created_by(name)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "Indent No.", cell: ({ getValue }) => <span className="font-mono text-xs">IND-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "vehicle", header: "Vehicle", cell: ({ row }) => row.original.vehicles?.reg_no ?? "—" },
    { id: "raised_by", header: "Raised By", cell: ({ row }) => row.original.users?.name ?? "—" },
    {
      accessorKey: "urgency", header: "Urgency",
      cell: ({ getValue }) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getValue() === "Breakdown" ? "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)]" : "bg-[var(--color-warning-alpha-16)] text-[var(--color-warning-base)]"}`}>
          {getValue() as string}
        </span>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "created_at", header: "Date", cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/outward/indents/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition inline-flex">
          <RiEyeLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Indents"
        description="Material requisitions from maintenance teams"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={indents} columns={["id", "urgency", "status", "created_at"]} filename="indents" />
            <Link to="/outward/indents/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Raise Indent
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={indents} isLoading={isLoading} searchPlaceholder="Search indents…" />
    </div>
  )
}
