import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ExportButton } from "@/components/shared/ExportButton"
import { RiAddLine, RiPencilLine, RiDeleteBinLine } from "@remixicon/react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils/format"
import type { ColumnDef } from "@tanstack/react-table"

export function ContractList() {
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["rate-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_contracts")
        .select("*, vendors(legal_name)")
        .order("valid_from", { ascending: false })
      if (error) throw error
      return data
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rate_contracts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rate-contracts"] })
      toast.success("Contract deleted")
      setDeleteId(null)
    },
    onError: () => toast.error("Cannot delete — contract has linked PO lines"),
  })

  const columns: ColumnDef<any>[] = [
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendors?.legal_name ?? "—" },
    { accessorKey: "valid_from", header: "Valid From", cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: "valid_until", header: "Valid Until", cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: "expiry",
      header: "Days Left",
      cell: ({ row }) => {
        const days = Math.ceil((new Date(row.original.valid_until).getTime() - Date.now()) / 86400000)
        return <span className={days < 30 ? "text-[var(--color-warning-base)] font-medium" : "text-[var(--color-text-sub-600)]"}>{days > 0 ? `${days}d` : "Expired"}</span>
      },
    },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link to={`/master/rate-contracts/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition"><RiPencilLine className="w-4 h-4" /></Link>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition"><RiDeleteBinLine className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rate Contracts"
        description="Vendor price agreements"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={contracts} columns={["vendor", "valid_from", "valid_until", "status"]} filename="rate-contracts" />
            <Link to="/master/rate-contracts/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> New Contract
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={contracts} isLoading={isLoading} searchPlaceholder="Search contracts…" />
      <ConfirmDialog open={!!deleteId} title="Delete Contract" description="All associated line items will also be removed." confirmLabel="Delete" variant="danger" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
