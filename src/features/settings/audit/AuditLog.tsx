import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ExportButton } from "@/components/shared/ExportButton"
import { formatDateTime } from "@/lib/utils/format"
import { RiShieldCheckLine } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

export function AuditLog() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, users(name)")
        .order("created_at", { ascending: false })
        .limit(500)
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "created_at", header: "Timestamp", cell: ({ getValue }) => <span className="font-mono text-xs">{formatDateTime(getValue() as string)}</span> },
    { id: "user", header: "User", cell: ({ row }) => row.original.users?.name ?? "—" },
    { accessorKey: "action", header: "Action", cell: ({ getValue }) => <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(getValue() as string).startsWith("DELETE") ? "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)]" : (getValue() as string).startsWith("INSERT") ? "bg-[var(--color-success-alpha-16)] text-[var(--color-success-base)]" : "bg-[var(--color-warning-alpha-16)] text-[var(--color-warning-base)]"}`}>{getValue() as string}</span> },
    { accessorKey: "entity", header: "Entity" },
    { accessorKey: "entity_id", header: "Entity ID", cell: ({ getValue }) => <span className="font-mono text-xs text-[var(--color-text-soft-400)]">{(getValue() as string)?.slice(0, 8).toUpperCase()}</span> },
    { accessorKey: "ip_address", header: "IP Address", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string ?? "—"}</span> },
    {
      id: "details", header: "Details",
      cell: ({ row }) => (
        <button
          onClick={() => setExpanded(expanded === row.original.id ? null : row.original.id)}
          className="text-xs text-[var(--color-primary-500)] hover:underline"
        >
          {expanded === row.original.id ? "Hide" : "View diff"}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        description="Immutable record of all data changes"
        actions={<ExportButton data={logs} columns={["created_at", "user", "action", "entity", "entity_id", "ip_address"]} filename="audit-log" />}
      />

      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-success-alpha-16)] border border-[var(--color-success-alpha-24)] rounded-xl text-sm text-[var(--color-success-base)]">
        <RiShieldCheckLine className="w-4 h-4 shrink-0" />
        Audit logs are append-only. No entries can be modified or deleted.
      </div>

      <DataTable columns={columns} data={logs} isLoading={isLoading} searchPlaceholder="Search audit log…" />

      {expanded && (() => {
        const log = logs.find((l: any) => l.id === expanded)
        if (!log) return null
        return (
          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Change Details — {log.entity} {log.entity_id?.slice(0, 8).toUpperCase()}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--color-text-soft-400)] uppercase mb-2">Before</p>
                <pre className="text-xs bg-[var(--color-bg-weak-50)] rounded-lg p-3 overflow-auto max-h-60 text-[var(--color-text-sub-600)]">
                  {log.before ? JSON.stringify(log.before, null, 2) : "null"}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-soft-400)] uppercase mb-2">After</p>
                <pre className="text-xs bg-[var(--color-bg-weak-50)] rounded-lg p-3 overflow-auto max-h-60 text-[var(--color-text-sub-600)]">
                  {log.after ? JSON.stringify(log.after, null, 2) : "null"}
                </pre>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
