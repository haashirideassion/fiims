import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { toast } from "sonner"

const schema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(3),
  address: z.string().min(5),
  lat: z.coerce.number<number>().optional(),
  lng: z.coerce.number<number>().optional(),
  gstin: z.string().length(15).optional().or(z.literal("")),
  in_charge: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"]),
})
type FormValues = z.infer<typeof schema>

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-text-strong-950)]">{label}</label>
      {children}
      {error && <p className="text-xs text-[var(--color-error-base)]">{error}</p>}
    </div>
  )
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-sm text-[var(--color-text-strong-950)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition ${className}`}
      {...props}
    />
  )
}

export function WarehouseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const { data: warehouse } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("*").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Active" },
  })

  useEffect(() => {
    if (warehouse) reset(warehouse)
  }, [warehouse, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        const { error } = await supabase.from("warehouses").update(values).eq("id", id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from("warehouses").insert(values)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success(isEdit ? "Warehouse updated" : "Warehouse created")
      navigate("/master/warehouses")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title={isEdit ? "Edit Warehouse" : "New Warehouse"} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code *" error={errors.code?.message}>
            <Input {...register("code")} placeholder="WH-CHN-01" />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select {...register("status")} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
        </div>
        <Field label="Name *" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Chennai Central Warehouse" />
        </Field>
        <Field label="Address *" error={errors.address?.message}>
          <Input {...register("address")} placeholder="123, Anna Salai, Chennai" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="In-Charge *" error={errors.in_charge?.message}>
            <Input {...register("in_charge")} placeholder="Name" />
          </Field>
          <Field label="Phone *" error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="+91 98765 43210" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="warehouse@urbaser.com" />
          </Field>
          <Field label="GSTIN" error={errors.gstin?.message}>
            <Input {...register("gstin")} placeholder="33XXXXX0000X1ZX" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] disabled:opacity-50 transition">
            {isSubmitting ? "Saving…" : isEdit ? "Update Warehouse" : "Create Warehouse"}
          </button>
        </div>
      </form>
    </div>
  )
}
