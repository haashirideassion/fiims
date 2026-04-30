import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { useAuth } from "@/features/auth/useAuth"
import { useWarehouseScope } from "@/lib/hooks/useWarehouseScope"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"

const CONDITIONS = ["Reusable", "Needs Repair", "Scrap"]

const lineSchema = z.object({
  part_id: z.string().uuid(),
  qty: z.coerce.number<number>().min(1),
  condition_code: z.string().min(1),
})

const schema = z.object({
  min_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid(),
  return_date: z.string(),
  lines: z.array(lineSchema).min(1),
})
type FormValues = z.infer<typeof schema>

export function ReturnForm() {
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

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      warehouse_id: scopedWarehouseId() ?? "",
      return_date: new Date().toISOString().split("T")[0],
      lines: [{ part_id: "", qty: 1, condition_code: "Reusable" }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { lines, ...header } = values
      const { data: rtn, error } = await supabase
        .from("return_notes")
        .insert({ ...header, returned_by: user?.id, received_by: user?.id })
        .select().single()
      if (error) throw error
      await supabase.from("return_lines").insert(lines.map((l) => ({ ...l, return_id: rtn.id })))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["return-notes"] })
      toast.success("Return recorded")
      navigate("/outward/returns")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="New Return" />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Return Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Return To Warehouse" required error={errors.warehouse_id?.message}>
              <Select {...register("warehouse_id")}>
                <option value="">Select…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="Return Date" required error={errors.return_date?.message}>
              <Input {...register("return_date")} type="date" />
            </Field>
          </div>
        </FormCard>

        <FormCard title="Returned Items">
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <Field label={i === 0 ? "Part" : ""}>
                    <Select {...register(`lines.${i}.part_id`)}>
                      <option value="">Select part…</option>
                      {parts.map((p: any) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label={i === 0 ? "Qty" : ""}>
                    <Input {...register(`lines.${i}.qty`)} type="number" min={1} />
                  </Field>
                </div>
                <div className="col-span-4">
                  <Field label={i === 0 ? "Condition" : ""}>
                    <Select {...register(`lines.${i}.condition_code`)}>
                      {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="col-span-1">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="p-2 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition">
                      <RiDeleteBinLine className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => append({ part_id: "", qty: 1, condition_code: "Reusable" })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)]">
            <RiAddLine className="w-4 h-4" /> Add Item
          </button>
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel="Record Return" />
      </form>
    </div>
  )
}
