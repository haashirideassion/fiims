import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"

const lineSchema = z.object({
  part_id: z.string().uuid(),
  uom: z.string().min(1),
  price: z.coerce.number<number>().min(0),
})

const schema = z.object({
  vendor_id: z.string().uuid(),
  valid_from: z.string(),
  valid_until: z.string(),
  status: z.enum(["Draft", "Active", "Expired"]),
  document_url: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Add at least one line item"),
})
type FormValues = z.infer<typeof schema>

export function ContractForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id && id !== "new"

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-select"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, legal_name").eq("status", "Active").order("legal_name")
      return data ?? []
    },
  })

  const { data: parts = [] } = useQuery({
    queryKey: ["parts-select"],
    queryFn: async () => {
      const { data } = await supabase.from("spare_parts").select("id, sku, name, uom").order("name")
      return data ?? []
    },
  })

  const { data: contract } = useQuery({
    queryKey: ["rate-contract", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rate_contracts")
        .select("*, rate_contract_lines(*)")
        .eq("id", id!)
        .single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Draft", lines: [{ part_id: "", uom: "Nos", price: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  useEffect(() => {
    if (contract) {
      reset({
        vendor_id: contract.vendor_id,
        valid_from: contract.valid_from,
        valid_until: contract.valid_until,
        status: contract.status,
        document_url: contract.document_url,
        lines: contract.rate_contract_lines ?? [],
      })
    }
  }, [contract, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { lines, ...header } = values
      if (isEdit) {
        const { error } = await supabase.from("rate_contracts").update(header).eq("id", id!)
        if (error) throw error
        await supabase.from("rate_contract_lines").delete().eq("contract_id", id!)
        await supabase.from("rate_contract_lines").insert(lines.map((l) => ({ ...l, contract_id: id })))
      } else {
        const { data, error } = await supabase.from("rate_contracts").insert(header).select().single()
        if (error) throw error
        await supabase.from("rate_contract_lines").insert(lines.map((l) => ({ ...l, contract_id: data.id })))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rate-contracts"] })
      toast.success(isEdit ? "Contract updated" : "Contract created")
      navigate("/master/rate-contracts")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title={isEdit ? "Edit Rate Contract" : "New Rate Contract"} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Contract Header">
          <Field label="Vendor" required error={errors.vendor_id?.message}>
            <Select {...register("vendor_id")}>
              <option value="">Select vendor…</option>
              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.legal_name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Valid From" required error={errors.valid_from?.message}>
              <Input {...register("valid_from")} type="date" />
            </Field>
            <Field label="Valid Until" required error={errors.valid_until?.message}>
              <Input {...register("valid_until")} type="date" />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select {...register("status")}>
                <option>Draft</option>
                <option>Active</option>
                <option>Expired</option>
              </Select>
            </Field>
          </div>
          <Field label="Document URL" error={errors.document_url?.message}>
            <Input {...register("document_url")} placeholder="https://…" />
          </Field>
        </FormCard>

        <FormCard title="Line Items">
          {(errors.lines as any)?.message && (
            <p className="text-xs text-[var(--color-error-base)]">{(errors.lines as any).message}</p>
          )}
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6">
                  <Field label={i === 0 ? "Part" : ""} error={(errors.lines?.[i] as any)?.part_id?.message}>
                    <Select {...register(`lines.${i}.part_id`)}>
                      <option value="">Select part…</option>
                      {parts.map((p: any) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label={i === 0 ? "UOM" : ""}>
                    <Input {...register(`lines.${i}.uom`)} placeholder="Nos" />
                  </Field>
                </div>
                <div className="col-span-3">
                  <Field label={i === 0 ? "Unit Price (₹)" : ""} error={(errors.lines?.[i] as any)?.price?.message}>
                    <Input {...register(`lines.${i}.price`)} type="number" step="0.01" min={0} />
                  </Field>
                </div>
                <div className="col-span-1 pb-0.5">
                  <button type="button" onClick={() => remove(i)} className="p-2 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition">
                    <RiDeleteBinLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => append({ part_id: "", uom: "Nos", price: 0 })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition">
            <RiAddLine className="w-4 h-4" /> Add Line
          </button>
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel={isEdit ? "Update Contract" : "Create Contract"} />
      </form>
    </div>
  )
}
