import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard } from "@/components/shared/FormField"
import { ApprovalTimeline } from "@/components/shared/ApprovalTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/useAuth"
import { useApproval } from "@/lib/hooks/useApproval"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import type { ApprovalEvent } from "@/lib/types"

const lineSchema = z.object({
  part_id: z.string().uuid(),
  qty: z.coerce.number<number>().min(1),
  warehouse_id: z.string().uuid(),
})

const schema = z.object({
  vehicle_id: z.string().uuid(),
  urgency: z.enum(["Breakdown", "Scheduled"]),
  reason: z.string().min(5),
  lines: z.array(lineSchema).min(1, "Add at least one part"),
})
type FormValues = z.infer<typeof schema>

export function IndentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, hasRole } = useAuth()
  const { appendApproval, formatTrail } = useApproval()
  const isEdit = !!id && id !== "new"

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-select"],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("id, reg_no").eq("status", "Active").order("reg_no")
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

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses-select"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("id, name").eq("status", "Active").order("name")
      return data ?? []
    },
  })

  const { data: indent } = useQuery({
    queryKey: ["indent", id],
    queryFn: async () => {
      const { data } = await supabase.from("indents").select("*, indent_lines(*)").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: "Scheduled", lines: [{ part_id: "", qty: 1, warehouse_id: "" }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  useEffect(() => {
    if (indent) reset({ vehicle_id: indent.vehicle_id, urgency: indent.urgency, reason: indent.reason, lines: indent.indent_lines ?? [] })
  }, [indent, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { action?: "draft" | "submit" }) => {
      const { lines, action, ...header } = values
      const status = action === "submit" ? "Submitted" : "Draft"
      // Breakdown indents skip approval
      const finalStatus = header.urgency === "Breakdown" ? "Approved" : status
      if (isEdit) {
        const { error } = await supabase.from("indents").update({ ...header, status: finalStatus }).eq("id", id!)
        if (error) throw error
        await supabase.from("indent_lines").delete().eq("indent_id", id!)
        await supabase.from("indent_lines").insert(lines.map((l) => ({ ...l, indent_id: id })))
      } else {
        const { data, error } = await supabase.from("indents").insert({ ...header, status: finalStatus, created_by: user?.id }).select().single()
        if (error) throw error
        await supabase.from("indent_lines").insert(lines.map((l) => ({ ...l, indent_id: data.id })))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indents"] })
      toast.success("Indent saved")
      navigate("/outward/indents")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const approveMut = useMutation({
    mutationFn: async ({ action, reason }: { action: "Approved" | "Rejected"; reason?: string }) => {
      const event = appendApproval(indent?.approval_trail ?? [], action, user?.name ?? "User", reason)
      const { error } = await supabase.from("indents").update({ approval_trail: event, status: action }).eq("id", id!)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["indent", id] }); toast.success("Decision recorded") },
  })

  const isReadOnly = isEdit && ["Approved", "Issued", "Rejected"].includes(indent?.status)
  const canApprove = isEdit && indent?.status === "Submitted" && hasRole("fleet_manager", "admin")
  const trail: ApprovalEvent[] = formatTrail(indent?.approval_trail)

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title={isEdit ? `Indent IND-${id?.slice(0, 8).toUpperCase()}` : "Raise Indent"} actions={isEdit && <StatusBadge status={indent?.status ?? "Draft"} />} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Request Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle" required error={errors.vehicle_id?.message}>
              <Select {...register("vehicle_id")} disabled={isReadOnly}>
                <option value="">Select vehicle…</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.reg_no}</option>)}
              </Select>
            </Field>
            <Field label="Type" required error={errors.urgency?.message}>
              <Select {...register("urgency")} disabled={isReadOnly}>
                <option>Scheduled</option>
                <option>Breakdown</option>
              </Select>
            </Field>
          </div>
          <Field label="Reason / Description" required error={errors.reason?.message}>
            <Input {...register("reason")} placeholder="Describe the maintenance need…" disabled={isReadOnly} />
          </Field>
        </FormCard>

        <FormCard title="Parts Required">
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <Field label={i === 0 ? "Part" : ""}>
                    <Select {...register(`lines.${i}.part_id`)} disabled={isReadOnly}>
                      <option value="">Select part…</option>
                      {parts.map((p: any) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label={i === 0 ? "Qty" : ""}>
                    <Input {...register(`lines.${i}.qty`)} type="number" min={1} disabled={isReadOnly} />
                  </Field>
                </div>
                <div className="col-span-4">
                  <Field label={i === 0 ? "From Warehouse" : ""}>
                    <Select {...register(`lines.${i}.warehouse_id`)} disabled={isReadOnly}>
                      <option value="">Select…</option>
                      {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </Select>
                  </Field>
                </div>
                {!isReadOnly && fields.length > 1 && (
                  <div className="col-span-1">
                    <button type="button" onClick={() => remove(i)} className="p-2 rounded-lg hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition">
                      <RiDeleteBinLine className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!isReadOnly && (
            <button type="button" onClick={() => append({ part_id: "", qty: 1, warehouse_id: "" })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)]">
              <RiAddLine className="w-4 h-4" /> Add Part
            </button>
          )}
        </FormCard>

        {trail.length > 0 && <FormCard title="Approval Trail"><ApprovalTimeline trail={trail} /></FormCard>}

        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">Save Draft</button>
            <button type="button" onClick={handleSubmit((v) => mutation.mutate({ ...v, action: "submit" }))} className="px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">Submit</button>
          </div>
        )}

        {canApprove && (
          <FormCard title="Approval">
            <div className="flex gap-3">
              <button type="button" onClick={() => approveMut.mutate({ action: "Approved" })} className="px-4 py-2 rounded-lg bg-[var(--color-success-base)] text-white text-sm font-medium">Approve</button>
              <button type="button" onClick={() => approveMut.mutate({ action: "Rejected" })} className="px-4 py-2 rounded-lg bg-[var(--color-error-base)] text-white text-sm font-medium">Reject</button>
            </div>
          </FormCard>
        )}
      </form>
    </div>
  )
}
