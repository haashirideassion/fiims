import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ExportButton } from "@/components/shared/ExportButton"
import { RiStarFill } from "@remixicon/react"
import type { ColumnDef } from "@tanstack/react-table"

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <RiStarFill key={i} className={`w-3.5 h-3.5 ${i < Math.round(n) ? "text-[var(--color-warning-base)]" : "text-[var(--color-border-soft-200)]"}`} />
      ))}
      <span className="ml-1 text-xs text-[var(--color-text-soft-400)]">{n.toFixed(1)}</span>
    </div>
  )
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-soft-200)]">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="text-xs text-[var(--color-text-sub-600)] w-8 text-right">{Math.round(value)}</span>
    </div>
  )
}

export function ScorecardList() {
  const currentDate = new Date()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const { data: scorecards = [], isLoading } = useQuery({
    queryKey: ["scorecards", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_scorecards")
        .select("*, vendors(legal_name)")
        .eq("period_month", month)
        .eq("period_year", year)
        .order("composite_score", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: ColumnDef<any>[] = [
    { id: "vendor", header: "Vendor", cell: ({ row }) => (
      <Link to={`/master/vendors/${row.original.vendor_id}`} className="text-[var(--color-primary-500)] hover:underline font-medium">
        {row.original.vendors?.legal_name}
      </Link>
    )},
    { accessorKey: "transaction_count", header: "Txns" },
    { accessorKey: "quality_score", header: "Quality", cell: ({ getValue }) => <ScoreBar value={getValue() as number} color="var(--color-success-base)" /> },
    { accessorKey: "timeliness_score", header: "Timeliness", cell: ({ getValue }) => <ScoreBar value={getValue() as number} color="var(--color-primary-500)" /> },
    { accessorKey: "price_score", header: "Price", cell: ({ getValue }) => <ScoreBar value={getValue() as number} color="var(--color-warning-base)" /> },
    { accessorKey: "star_rating", header: "Overall", cell: ({ getValue }) => <Stars n={getValue() as number ?? 0} /> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Scorecards"
        description={`Performance metrics for ${new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}`}
        actions={<ExportButton data={scorecards} columns={["vendor", "quality_score", "timeliness_score", "price_score", "star_rating"]} filename="vendor-scorecards" />}
      />
      {scorecards.length === 0 && !isLoading ? (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-12 text-center">
          <p className="text-[var(--color-text-soft-400)]">No scorecards computed for this period. Run the scorecard function from the database.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={scorecards} isLoading={isLoading} searchPlaceholder="Search vendors…" />
      )}
    </div>
  )
}
