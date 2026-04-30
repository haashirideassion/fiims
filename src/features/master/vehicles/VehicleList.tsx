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

export function VehicleList() {
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_models(make, model, category)")
        .order("reg_no")
      if (error) throw error
      return data
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehicle deleted")
      setDeleteId(null)
    },
    onError: () => toast.error("Cannot delete — vehicle has linked transactions"),
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "reg_no", header: "Reg No.", cell: ({ getValue }) => <span className="font-mono text-xs font-semibold">{getValue() as string}</span> },
    { id: "model", header: "Make / Model", cell: ({ row }) => `${row.original.vehicle_models?.make ?? ""} ${row.original.vehicle_models?.model ?? ""}` },
    { id: "category", header: "Category", cell: ({ row }) => row.original.vehicle_models?.category ?? "—" },
    { accessorKey: "zone", header: "Zone" },
    { accessorKey: "year", header: "Year" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link to={`/master/vehicles/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition"><RiEyeLine className="w-4 h-4" /></Link>
          <Link to={`/master/vehicles/${row.original.id}/edit`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition"><RiPencilLine className="w-4 h-4" /></Link>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition"><RiDeleteBinLine className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vehicles"
        description="Fleet vehicle registry"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={vehicles} columns={["reg_no", "zone", "year", "status"]} filename="vehicles" />
            <Link to="/master/vehicles/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Add Vehicle
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={vehicles} isLoading={isLoading} searchPlaceholder="Search by reg no, zone…" />
      <ConfirmDialog open={!!deleteId} title="Delete Vehicle" description="This will permanently remove the vehicle." confirmLabel="Delete" variant="danger" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
