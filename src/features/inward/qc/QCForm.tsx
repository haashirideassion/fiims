import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { FileUpload } from "@/components/shared/FileUpload"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/useAuth"
import { toast } from "sonner"

const lineSchema = z.object({
  grn_line_id: z.string().min(1),
  accepted_qty: z.coerce.number<number>().min(0),
  rejected_qty: z.coerce.number<number>().min(0),
  reason_code: z.string().optional(),
})

const schema = z.object({
  qc_date: z.string(),
  lines: z.array(lineSchema).min(1),
  photos: z.array(z.string()).optional(),
})
type FormValues = z.infer<typeof schema>

const REJECTION_CODES = ["Damaged in Transit", "Wrong Part", "Substandard Quality", "Expired Shelf Life", "Incorrect Quantity", "Missing Documentation"]

export function QCForm() {
  const { id } = useParams()  // grn id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const { data: grn, isLoading } = useQuery({
    queryKey: ["grn-qc", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grns")
        .select("*, grn_lines(*, spare_parts(sku, name)), purchase_orders(vendors(legal_name))")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      qc_date: new Date().toISOString().split("T")[0],
      lines: [],
      photos: [],
    },
    values: grn ? {
      qc_date: new Date().toISOString().split("T")[0],
      photos: [],
      lines: (grn.grn_lines ?? []).map((l: any) => ({
        grn_line_id: l.id,
        accepted_qty: l.received_qty,
        rejected_qty: 0,
        reason_code: "",
      })),
    } : undefined,
  })

  const { fields } = useFieldArray({ control, name: "lines" })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const totalRejected = values.lines.reduce((s, l) => s + l.rejected_qty, 0)
      // Insert QC record for each line
      for (const line of values.lines) {
        const { error } = await supabase.from("qc_records").insert({
          grn_id: id,
          grn_line_id: line.grn_line_id,
          accepted_qty: line.accepted_qty,
          rejected_qty: line.rejected_qty,
          reason_code: line.reason_code,
          photos: values.photos,
          inspector_id: user?.id,
          qc_date: values.qc_date,
        })
        if (error) throw error
      }
      // Update GRN status
      const newStatus = totalRejected > 0 ? "Partially Accepted" : "QC Done"
      const { error } = await supabase.from("grns").update({ status: newStatus }).eq("id", id!)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qc-queue"] })
      qc.invalidateQueries({ queryKey: ["grns"] })
      toast.success("QC inspection recorded")
      navigate("/inward/qc")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!grn) return null

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={`QC Inspection — GRN-${id?.slice(0, 8).toUpperCase()}`}
        description={`Vendor: ${grn.purchase_orders?.vendors?.legal_name ?? "—"}`}
        actions={<StatusBadge status={grn.status} />}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Inspection Details">
          <Field label="Inspection Date" required>
            <Input {...register("qc_date")} type="date" />
          </Field>
        </FormCard>

        <FormCard title="Line-by-Line Inspection">
          <div className="space-y-4">
            {fields.map((field, i) => {
              const grnLine = grn.grn_lines?.[i]
              const rejQty = watch(`lines.${i}.rejected_qty`)
              return (
                <div key={field.id} className="border border-[var(--color-border-soft-200)] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-strong-950)]">{grnLine?.spare_parts?.sku} — {grnLine?.spare_parts?.name}</p>
                      <p className="text-xs text-[var(--color-text-soft-400)]">Received: {grnLine?.received_qty} · Batch: {grnLine?.batch_no ?? "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Accepted Qty" error={(errors.lines?.[i] as any)?.accepted_qty?.message}>
                      <Input {...register(`lines.${i}.accepted_qty`)} type="number" min={0} />
                    </Field>
                    <Field label="Rejected Qty" error={(errors.lines?.[i] as any)?.rejected_qty?.message}>
                      <Input {...register(`lines.${i}.rejected_qty`)} type="number" min={0} />
                    </Field>
                    {rejQty > 0 && (
                      <Field label="Rejection Reason">
                        <Select {...register(`lines.${i}.reason_code`)}>
                          <option value="">Select…</option>
                          {REJECTION_CODES.map((r) => <option key={r}>{r}</option>)}
                        </Select>
                      </Field>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </FormCard>

        <FormCard title="Evidence Photos">
          <FileUpload
            bucket="grn-photos"
            path={`qc/${id}`}
            accept="image/*"
            multiple
            maxFiles={10}
            onUploaded={(urls) => {
              const current = watch("photos") ?? []
              setValue("photos", [...current, ...urls])
            }}
          />
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel="Submit QC Report" />
      </form>
    </div>
  )
}
