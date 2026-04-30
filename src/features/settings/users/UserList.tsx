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
import type { ColumnDef } from "@tanstack/react-table"

const ROLE_LABELS: Record<string, string> = {
  store_manager: "Store Manager",
  maintenance_lead: "Maintenance Lead",
  fleet_manager: "Fleet Manager",
  admin: "Admin",
  procurement: "Procurement",
  finance: "Finance",
  auditor: "Auditor",
}

export function UserList() {
  const qc = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*, warehouses!home_warehouse_id(name)").order("name")
      if (error) throw error
      return data
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("users").update({ status: "Inactive" }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deactivated")
      setDeleteId(null)
    },
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "role", header: "Role", cell: ({ getValue }) => ROLE_LABELS[getValue() as string] ?? getValue() as string },
    { id: "warehouse", header: "Home Warehouse", cell: ({ row }) => row.original.warehouses?.name ?? "—" },
    { accessorKey: "mfa_enabled", header: "MFA", cell: ({ getValue }) => <StatusBadge status={getValue() ? "Enabled" : "Disabled"} /> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link to={`/settings/users/${row.original.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-soft-200)] text-[var(--color-text-soft-400)] transition"><RiPencilLine className="w-4 h-4" /></Link>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition"><RiDeleteBinLine className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Manage user accounts and role assignments"
        actions={
          <div className="flex items-center gap-2">
            <ExportButton data={users} columns={["name", "role", "status"]} filename="users" />
            <Link to="/settings/users/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Add User
            </Link>
          </div>
        }
      />
      <DataTable columns={columns} data={users} isLoading={isLoading} searchPlaceholder="Search users…" />
      <ConfirmDialog open={!!deleteId} title="Deactivate User" description="The user will be marked inactive and lose access." confirmLabel="Deactivate" variant="danger" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
