import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/useAuth"
import { toast } from "sonner"
import { RiPrinterLine } from "@remixicon/react"

const lineSchema = z.object({
  indent_line_id: z.string().uuid(),
  part_id: z.string().uuid(),
  qty: z.coerce.number<number>().min(1),
  batch_no: z.string().optional(),
  bin_id: z.string().optional(),
})

const schema = z.object({
  recipient_id: z.string().uuid().optional(),
  lines: z.array(lineSchema).min(1),
})
type FormValues = z.infer<typeof schema>

export function IssueForm() {
  const { id } = useParams()  // indent id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const { data: indent, isLoading } = useQuery({
    queryKey: ["indent-issue", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indents")
        .select("*, vehicles(reg_no), indent_lines(*, spare_parts(sku, name), warehouses(name))")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: users = [] } = useQuery({
    queryKey: ["users-select"],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("id, name").order("name")
      return data ?? []
    },
  })

  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { lines: [] },
    values: indent ? {
      recipient_id: undefined,
      lines: (indent.indent_lines ?? []).map((l: any) => ({
        indent_line_id: l.id,
        part_id: l.part_id,
        qty: l.qty,
        batch_no: "",
        bin_id: "",
      })),
    } : undefined,
  })

  const { fields } = useFieldArray({ control, name: "lines" })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: min, error: minErr } = await supabase
        .from("material_issue_notes")
        .insert({ indent_id: id, warehouse_id: indent?.indent_lines?.[0]?.warehouse_id, issued_by: user?.id, recipient_id: values.recipient_id })
        .select().single()
      if (minErr) throw minErr

      await supabase.from("min_lines").insert(values.lines.map((l) => ({ ...l, min_id: min.id })))
      await supabase.from("indents").update({ status: "Issued" }).eq("id", id!)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issue-queue"] })
      qc.invalidateQueries({ queryKey: ["indents"] })
      toast.success("Material Issue Note created")
      navigate("/outward/issues")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!indent) return null

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`Issue Parts — IND-${id?.slice(0, 8).toUpperCase()}`}
        description={`Vehicle: ${indent.vehicles?.reg_no}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={indent.status} />
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm hover:bg-[var(--color-bg-soft-200)] transition">
              <RiPrinterLine className="w-4 h-4" /> Print MIN
            </button>
          </div>
        }
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Issue Details">
          <Field label="Recipient">
            <Select {...register("recipient_id")}>
              <option value="">Select recipient…</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
        </FormCard>

        <FormCard title="Items to Issue">
          <div className="space-y-3">
            {fields.map((field, i) => {
              const indentLine = indent.indent_lines?.[i]
              return (
                <div key={field.id} className="border border-[var(--color-border-soft-200)] rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-strong-950)]">{indentLine?.spare_parts?.sku} — {indentLine?.spare_parts?.name}</p>
                    <p className="text-xs text-[var(--color-text-soft-400)]">From: {indentLine?.warehouses?.name} · Requested: {indentLine?.qty}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Issue Qty">
                      <Input {...register(`lines.${i}.qty`)} type="number" min={1} max={indentLine?.qty} />
                    </Field>
                    <Field label="Batch No.">
                      <Input {...register(`lines.${i}.batch_no`)} placeholder="BATCH-001" />
                    </Field>
                    <Field label="Bin">
                      <Input {...register(`lines.${i}.bin_id`)} placeholder="A-01-01" />
                    </Field>
                  </div>
                </div>
              )
            })}
          </div>
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel="Confirm Issue & Generate MIN" />
      </form>
    </div>
  )
}
