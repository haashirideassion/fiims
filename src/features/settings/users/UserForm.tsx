import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { toast } from "sonner"

const ROLES = [
  { value: "store_manager", label: "Store Manager" },
  { value: "maintenance_lead", label: "Maintenance Lead" },
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "admin", label: "Admin" },
  { value: "procurement", label: "Procurement" },
  { value: "finance", label: "Finance" },
  { value: "auditor", label: "Auditor" },
]

const schema = z.object({
  name: z.string().min(2),
  role: z.string().min(1),
  home_warehouse_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"]),
  mfa_enabled: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id && id !== "new"

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses-select"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("id, name").eq("status", "Active").order("name")
      return data ?? []
    },
  })

  const { data: user } = useQuery({
    queryKey: ["user-detail", id],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("*").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Active", mfa_enabled: false },
  })

  useEffect(() => {
    if (user) reset(user)
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        const { error } = await supabase.from("users").update(values).eq("id", id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from("users").insert(values)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success(isEdit ? "User updated" : "User created")
      navigate("/settings/users")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const selectedRole = watch("role")
  const needsWarehouse = ["store_manager", "maintenance_lead"].includes(selectedRole)

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title={isEdit ? "Edit User" : "New User"} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="User Details">
          <Field label="Full Name" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="First Last" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role" required error={errors.role?.message}>
              <Select {...register("role")}>
                <option value="">Select role…</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select {...register("status")}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </Field>
          </div>
          {needsWarehouse && (
            <Field label="Home Warehouse" error={errors.home_warehouse_id?.message}>
              <Select {...register("home_warehouse_id")}>
                <option value="">Select warehouse…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-sub-600)] cursor-pointer">
            <input type="checkbox" {...register("mfa_enabled")} className="w-4 h-4 rounded accent-[var(--color-primary-500)]" />
            Require Multi-Factor Authentication (MFA)
          </label>
        </FormCard>
        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel={isEdit ? "Update User" : "Create User"} />
      </form>
    </div>
  )
}
