import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { FileUpload } from "@/components/shared/FileUpload"
import { useAuth } from "@/features/auth/useAuth"
import { useWarehouseScope } from "@/lib/hooks/useWarehouseScope"
import { toast } from "sonner"

const SCRAP_REASONS = ["End of Life", "Damaged Beyond Repair", "Obsolete Part", "Expired Shelf Life", "Condemned After Accident", "Quality Rejection"]

const schema = z.object({
  warehouse_id: z.string().uuid(),
  part_id: z.string().uuid(),
  batch_no: z.string().optional(),
  qty: z.coerce.number<number>().min(1),
  reason_code: z.string().min(1),
  value: z.coerce.number<number>().min(0),
  photos: z.array(z.string()).optional(),
})
type FormValues = z.infer<typeof schema>

export function ScrapForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const { scopedWarehouseId } = useWarehouseScope()

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses-select"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("id, name").eq("status", "Active").order("name")
      return data ?? []
    },
  })

  const { data: parts = [] } = useQuery({
    queryKey: ["parts-select"],
    queryFn: async () => {
      const { data } = await supabase.from("spare_parts").select("id, sku, name").order("name")
      return data ?? []
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { warehouse_id: scopedWarehouseId() ?? "", photos: [] },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("scrap_records").insert({ ...values, status: "Pending Approval", created_by: user?.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scrap-records"] })
      toast.success("Scrap record submitted for approval")
      navigate("/outward/scrap")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const photos = watch("photos") ?? []

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="New Scrap Record" />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Scrap Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Warehouse" required error={errors.warehouse_id?.message}>
              <Select {...register("warehouse_id")}>
                <option value="">Select…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="Part" required error={errors.part_id?.message}>
              <Select {...register("part_id")}>
                <option value="">Select part…</option>
                {parts.map((p: any) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Batch No.">
              <Input {...register("batch_no")} placeholder="BATCH-001" />
            </Field>
            <Field label="Quantity" required error={errors.qty?.message}>
              <Input {...register("qty")} type="number" min={1} />
            </Field>
            <Field label="Book Value (₹)" required error={errors.value?.message}>
              <Input {...register("value")} type="number" step="0.01" min={0} />
            </Field>
          </div>
          <Field label="Reason" required error={errors.reason_code?.message}>
            <Select {...register("reason_code")}>
              <option value="">Select reason…</option>
              {SCRAP_REASONS.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
        </FormCard>

        <FormCard title="Evidence Photos">
          <FileUpload
            bucket="grn-photos"
            path="scrap"
            accept="image/*"
            multiple
            maxFiles={5}
            onUploaded={(urls) => setValue("photos", [...photos, ...urls])}
          />
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel="Submit for Approval" />
      </form>
    </div>
  )
}
