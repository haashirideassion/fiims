import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ExportButton } from "@/components/shared/ExportButton"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiEyeLine, RiStarFill } from "@remixicon/react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-[var(--color-text-soft-400)] text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <RiStarFill key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "text-[var(--color-warning-base)]" : "text-[var(--color-border-soft-200)]"}`} />
      ))}
    </div>
  )
}

export function VendorList() {
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").order("legal_name")
      if (error) throw error
      return data
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] })
      toast.success("Vendor deleted")
      setDeleteId(null)
    },
    onError: () => toast.error("Cannot delete — vendor has linked POs or contracts"),
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "legal_name", header: "Vendor Name" },
    { accessorKey: "gstin", header: "GSTIN", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string ?? "—"}</span> },
    { accessorKey: "credit_terms", header: "Credit Terms", cell: ({ getValue }) => getValue() ? `${getValue()} days` : "—" },
    { accessorKey: "msme_flag", header: "MSME", cell: ({ getValue }) => <StatusBadge status={getValue() ? "MSME" : "Non-MSME"} /> },
    { accessorKey: "composite_rating", header: "Rating", cell: ({ getValue }) => <StarRating rating={getValue() as number} /> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link to={`/master/vendors/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition"><RiEyeLine className="w-4 h-4" /></Link>
          <Link to={`/master/vendors/${row.original.id}/edit`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition"><RiPencilLine className="w-4 h-4" /></Link>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition"><RiDeleteBinLine className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendors"
        description="Supplier and vendor master"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={vendors} columns={["legal_name", "gstin", "status"]} filename="vendors" />
            <Link to="/master/vendors/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Add Vendor
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={vendors} isLoading={isLoading} searchPlaceholder="Search vendors…" />
      <ConfirmDialog open={!!deleteId} title="Delete Vendor" description="This will permanently remove the vendor." confirmLabel="Delete" variant="danger" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
