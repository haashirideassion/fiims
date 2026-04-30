import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Select, FormCard } from "@/components/shared/FormField"
import { Input } from "@/components/shared/FormField"
import { ApprovalTimeline } from "@/components/shared/ApprovalTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/useAuth"
import { useApproval } from "@/lib/hooks/useApproval"
import { useWarehouseScope } from "@/lib/hooks/useWarehouseScope"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import type { ApprovalEvent } from "@/lib/types"

const lineSchema = z.object({
  part_id: z.string().uuid(),
  qty: z.coerce.number<number>().min(1),
  suggested_vendor_id: z.string().optional(),
  notes: z.string().optional(),
})

const schema = z.object({
  warehouse_id: z.string().uuid(),
  urgency: z.enum(["Normal", "Urgent", "Critical"]),
  lines: z.array(lineSchema).min(1, "Add at least one item"),
})
type FormValues = z.infer<typeof schema>

export function PRForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, hasRole } = useAuth()
  const { scopedWarehouseId } = useWarehouseScope()
  const { appendApproval, formatTrail } = useApproval()
  const isEdit = !!id && id !== "new"

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

  const { data: pr } = useQuery({
    queryKey: ["pr", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchase_requisitions")
        .select("*, pr_lines(*)")
        .eq("id", id!)
        .single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: "Normal", warehouse_id: scopedWarehouseId() ?? "", lines: [{ part_id: "", qty: 1, notes: "" }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  useEffect(() => {
    if (pr) reset({ warehouse_id: pr.warehouse_id, urgency: pr.urgency, lines: pr.pr_lines ?? [] })
  }, [pr, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { action?: "draft" | "submit" }) => {
      const { lines, action, ...header } = values
      const status = action === "submit" ? "Submitted" : "Draft"
      if (isEdit) {
        const { error } = await supabase.from("purchase_requisitions").update({ ...header, status }).eq("id", id!)
        if (error) throw error
        await supabase.from("pr_lines").delete().eq("pr_id", id!)
        await supabase.from("pr_lines").insert(lines.map((l) => ({ ...l, pr_id: id })))
      } else {
        const { data, error } = await supabase.from("purchase_requisitions").insert({ ...header, status, created_by: user?.id }).select().single()
        if (error) throw error
        await supabase.from("pr_lines").insert(lines.map((l) => ({ ...l, pr_id: data.id })))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requisitions"] })
      toast.success("PR saved")
      navigate("/inward/pr")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const approveMut = useMutation({
    mutationFn: async ({ action, reason }: { action: "Approved" | "Rejected"; reason?: string }) => {
      const event = appendApproval(pr?.approval_trail ?? [], action, user?.name ?? "User", reason)
      const { error } = await supabase.from("purchase_requisitions")
        .update({ approval_trail: event, status: action === "Approved" ? "Approved" : "Rejected" })
        .eq("id", id!)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pr", id] })
      toast.success("Decision recorded")
    },
  })

  const canApprove = isEdit && pr?.status === "Submitted" && hasRole("fleet_manager", "admin")
  const isReadOnly = isEdit && ["Approved", "Rejected"].includes(pr?.status)
  const trail: ApprovalEvent[] = formatTrail(pr?.approval_trail)

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={isEdit ? `PR ${id?.slice(0, 8).toUpperCase()}` : "New Purchase Requisition"}
        actions={isEdit && <StatusBadge status={pr?.status ?? "Draft"} />}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Request Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Warehouse" required error={errors.warehouse_id?.message}>
              <Select {...register("warehouse_id")} disabled={isReadOnly}>
                <option value="">Select warehouse…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="Urgency" required error={errors.urgency?.message}>
              <Select {...register("urgency")} disabled={isReadOnly}>
                <option>Normal</option>
                <option>Urgent</option>
                <option>Critical</option>
              </Select>
            </Field>
          </div>
        </FormCard>

        <FormCard title="Items">
          {(errors.lines as any)?.message && <p className="text-xs text-[var(--color-error-base)]">{(errors.lines as any).message}</p>}
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6">
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
                <div className="col-span-3">
                  <Field label={i === 0 ? "Notes" : ""}>
                    <Input {...register(`lines.${i}.notes`)} placeholder="Optional" disabled={isReadOnly} />
                  </Field>
                </div>
                {!isReadOnly && (
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
            <button type="button" onClick={() => append({ part_id: "", qty: 1, notes: "" })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition">
              <RiAddLine className="w-4 h-4" /> Add Item
            </button>
          )}
        </FormCard>

        {trail.length > 0 && (
          <FormCard title="Approval Trail">
            <ApprovalTimeline trail={trail} />
          </FormCard>
        )}

        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
              Save Draft
            </button>
            <button type="button" disabled={isSubmitting} onClick={handleSubmit((v) => mutation.mutate({ ...v, action: "submit" }))} className="px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] disabled:opacity-50 transition">
              Submit for Approval
            </button>
          </div>
        )}

        {canApprove && (
          <FormCard title="Approval Decision">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => approveMut.mutate({ action: "Approved" })} className="px-4 py-2 rounded-lg bg-[var(--color-success-base)] text-white text-sm font-medium hover:opacity-90 transition">
                Approve
              </button>
              <button type="button" onClick={() => approveMut.mutate({ action: "Rejected", reason: "Does not meet criteria" })} className="px-4 py-2 rounded-lg bg-[var(--color-error-base)] text-white text-sm font-medium hover:opacity-90 transition">
                Reject
              </button>
            </div>
          </FormCard>
        )}
      </form>
    </div>
  )
}
