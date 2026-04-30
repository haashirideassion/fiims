import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"

import { formatDate } from "@/lib/utils/format"
import { RiArrowRightLine } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

export function IssueQueue() {
  const { data: indents = [], isLoading } = useQuery({
    queryKey: ["issue-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indents")
        .select("*, vehicles(reg_no), users!created_by(name)")
        .eq("status", "Approved")
        .order("created_at", { ascending: true })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "id", header: "Indent Ref.", cell: ({ getValue }) => <span className="font-mono text-xs">IND-{(getValue() as string).slice(0, 8).toUpperCase()}</span> },
    { id: "vehicle", header: "Vehicle", cell: ({ row }) => row.original.vehicles?.reg_no ?? "—" },
    { id: "raised_by", header: "Raised By", cell: ({ row }) => row.original.users?.name ?? "—" },
    {
      accessorKey: "urgency", header: "Urgency",
      cell: ({ getValue }) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getValue() === "Breakdown" ? "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)]" : "bg-[var(--color-warning-alpha-16)] text-[var(--color-warning-base)]"}`}>
          {getValue() as string}
        </span>
      ),
    },
    { accessorKey: "created_at", header: "Raised On", cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Link to={`/outward/issues/${row.original.id}`} className="flex items-center gap-1 text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition">
          Issue Parts <RiArrowRightLine className="w-4 h-4" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Issue Queue" description="Approved indents ready to issue" />
      {indents.length === 0 && !isLoading ? (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-12 text-center">
          <p className="text-[var(--color-text-soft-400)]">No approved indents pending issue</p>
        </div>
      ) : (
        <DataTable columns={columns} data={indents} isLoading={isLoading} searchPlaceholder="Search queue…" />
      )}
    </div>
  )
}
