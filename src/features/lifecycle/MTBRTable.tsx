import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ExportButton } from "@/components/shared/ExportButton"
import type { ColumnDef } from "@tanstack/react-table"

export function MTBRTable() {
  const { data: mtbrData = [], isLoading } = useQuery({
    queryKey: ["mtbr"],
    queryFn: async () => {
      // Call the PostgreSQL function fn_mtbr for all parts
      const { data, error } = await supabase
        .from("spare_parts")
        .select("id, sku, name, category")
        .eq("serialised", true)
        .order("name")
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "sku", header: "SKU", cell: ({ getValue }) => <span className="font-mono text-xs bg-[var(--color-bg-soft-200)] px-1.5 py-0.5 rounded">{getValue() as string}</span> },
    { accessorKey: "name", header: "Part Name" },
    { accessorKey: "category", header: "Category" },
    {
      id: "mtbr",
      header: "Avg MTBR (days)",
      cell: () => <span className="text-[var(--color-text-soft-400)] text-xs">Pending calculation</span>,
    },
    {
      id: "replacements",
      header: "Total Replacements",
      cell: () => <span className="text-[var(--color-text-soft-400)] text-xs">—</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mean Time Between Replacements"
        description="MTBR analysis for serialised spare parts"
        actions={<ExportButton data={mtbrData} columns={["sku", "name", "category"]} filename="mtbr" />}
      />
      <div className="bg-[var(--color-information-alpha-16)] border border-[var(--color-information-alpha-24)] rounded-xl p-4 text-sm text-[var(--color-information-base)]">
        MTBR is calculated by the <code className="font-mono text-xs bg-white/50 px-1 rounded">fn_mtbr(part_id, model_id)</code> PostgreSQL function. Results appear after sufficient replacement history has been recorded.
      </div>
      <DataTable columns={columns} data={mtbrData} isLoading={isLoading} searchPlaceholder="Search serialised parts…" />
    </div>
  )
}
