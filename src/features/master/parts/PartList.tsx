import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ExportButton } from "@/components/shared/ExportButton"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiEyeLine } from "@remixicon/react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import type { SparePart } from "@/lib/types"

export function PartList() {
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spare_parts").select("*").order("name")
      if (error) throw error
      return data as SparePart[]
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spare_parts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] })
      toast.success("Part deleted")
      setDeleteId(null)
    },
    onError: () => toast.error("Cannot delete — part may have stock transactions"),
  })

  const columns: ColumnDef<SparePart>[] = [
    { accessorKey: "sku", header: "SKU", cell: ({ getValue }) => <span className="font-mono text-xs bg-[var(--color-bg-soft-200)] px-1.5 py-0.5 rounded">{getValue() as string}</span> },
    { accessorKey: "name", header: "Part Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "uom", header: "UOM" },
    { accessorKey: "oem_no", header: "OEM No." },
    {
      accessorKey: "serialised",
      header: "Serialised",
      cell: ({ getValue }) => <StatusBadge status={getValue() ? "Yes" : "No"} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link to={`/master/parts/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition">
            <RiEyeLine className="w-4 h-4" />
          </Link>
          <Link to={`/master/parts/${row.original.id}/edit`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition">
            <RiPencilLine className="w-4 h-4" />
          </Link>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition">
            <RiDeleteBinLine className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const exportData = parts.map((p) => ({ SKU: p.sku, Name: p.name, Category: p.category, UOM: p.uom, "OEM No": p.oem_no, Serialised: p.serialised ? "Yes" : "No" }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Spare Parts"
        description="Master catalogue of all spare parts"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={exportData} columns={["SKU", "Name", "Category", "UOM", "OEM No", "Serialised"]} filename="spare-parts" />
            <Link to="/master/parts/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Add Part
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={parts} isLoading={isLoading} searchPlaceholder="Search by name, SKU or OEM no…" />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Part"
        description="This will permanently remove the part from the catalogue."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
