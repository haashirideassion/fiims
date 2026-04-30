import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTable } from "@/components/shared/DataTable"
import { ExportButton } from "@/components/shared/ExportButton"
import { RiAddLine, RiPencilLine, RiDeleteBinLine } from "@remixicon/react"
import { useState } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import type { Warehouse } from "@/lib/types"

export function WarehouseList() {
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("*").order("name")
      if (error) throw error
      return data as Warehouse[]
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warehouses").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Warehouse deleted")
      setDeleteId(null)
    },
    onError: () => toast.error("Failed to delete warehouse"),
  })

  const columns: ColumnDef<Warehouse>[] = [
    { accessorKey: "code", header: "Code", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "in_charge", header: "In-Charge" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link to={`/master/warehouses/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition">
            <RiPencilLine className="w-4 h-4" />
          </Link>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition">
            <RiDeleteBinLine className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const exportData = warehouses.map((w) => ({ Code: w.code, Name: w.name, Address: w.address, "In-Charge": w.in_charge, Phone: w.phone, Status: w.status }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warehouses"
        description="Manage warehouse locations and bin hierarchy"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={exportData} columns={["Code", "Name", "Address", "In-Charge", "Phone", "Status"]} filename="warehouses" />
            <Link to="/master/warehouses/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Add Warehouse
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={warehouses} isLoading={isLoading} searchPlaceholder="Search warehouses…" />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Warehouse"
        description="This action cannot be undone. All bin locations will also be removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
