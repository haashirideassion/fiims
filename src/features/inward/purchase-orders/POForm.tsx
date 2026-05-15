import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard } from "@/components/shared/FormField"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ApprovalTimeline } from "@/components/shared/ApprovalTimeline"
import { useAuth } from "@/features/auth/useAuth"
import { useApproval } from "@/lib/hooks/useApproval"
import { formatCurrency } from "@/lib/utils/format"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import type { ApprovalEvent } from "@/lib/types"

const lineSchema = z.object({
  part_id: z.string().min(1, "Please select a part"),
  qty: z.coerce.number<number>().min(1),
  unit_price: z.coerce.number<number>().min(0),
  destination_warehouse_id: z.string().min(1, "Please select a warehouse"),
})

const schema = z.object({
  vendor_id: z.string().min(1, "Please select a vendor"),
  lines: z.array(lineSchema).min(1, "Add at least one line"),
})
type FormValues = z.infer<typeof schema>

export function POForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, hasRole } = useAuth()
  const { appendApproval, formatTrail } = useApproval()
  const isEdit = !!id && id !== "new"

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-select"],
    queryFn: async () => {
      // Vendors use "Approved" status (not "Active") — filter to show only approvable vendors
      const { data } = await supabase
        .from("vendors")
        .select("id, legal_name")
        .in("status", ["Approved"])
        .order("legal_name")
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

  const { data: po } = useQuery({
    queryKey: ["po", id],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("*, po_lines(*)").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vendor_id: "", lines: [{ part_id: "", qty: 1, unit_price: 0, destination_warehouse_id: "" }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })
  const lines = watch("lines")
  const total = lines?.reduce((s, l) => s + ((l.qty ?? 0) * (l.unit_price ?? 0)), 0) ?? 0

  useEffect(() => {
    if (po) reset({ vendor_id: po.vendor_id, lines: po.po_lines ?? [] })
  }, [po, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { action?: "draft" | "issue" }) => {
      const { lines, action, ...header } = values
      const totalValue = lines.reduce((s, l) => s + l.qty * l.unit_price, 0)
      const status = action === "issue" ? "Issued" : "Draft"
      if (isEdit) {
        const { error } = await supabase.from("purchase_orders").update({ ...header, total_value: totalValue, status }).eq("id", id!)
        if (error) throw error
        await supabase.from("po_lines").delete().eq("po_id", id!)
        await supabase.from("po_lines").insert(lines.map((l) => ({ ...l, po_id: id })))
      } else {
        const { data, error } = await supabase.from("purchase_orders").insert({ ...header, total_value: totalValue, status, created_by: user?.id }).select().single()
        if (error) throw error
        await supabase.from("po_lines").insert(lines.map((l) => ({ ...l, po_id: data.id })))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] })
      toast.success("PO saved")
      navigate("/inward/po")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const approveMut = useMutation({
    mutationFn: async (action: "Approved" | "Rejected") => {
      const event = appendApproval(po?.approval_trail ?? [], action, user?.name ?? "User")
      const { error } = await supabase.from("purchase_orders").update({ approval_trail: event, status: action === "Approved" ? "Approved" : "Rejected" }).eq("id", id!)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["po", id] }); toast.success("Decision recorded") },
  })

  const isReadOnly = isEdit && ["Approved", "Issued", "Received", "Closed"].includes(po?.status)
  const canApprove = isEdit && po?.status === "Draft" && hasRole("admin")
  const trail: ApprovalEvent[] = formatTrail(po?.approval_trail)

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title={isEdit ? `PO ${id?.slice(0, 8).toUpperCase()}` : "New Purchase Order"} actions={isEdit && <StatusBadge status={po?.status ?? "Draft"} />} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Order Details">
          <Field label="Vendor" required error={errors.vendor_id?.message}>
            <Select {...register("vendor_id")} disabled={isReadOnly}>
              <option value="">Select vendor…</option>
              {vendors.length === 0
                ? <option disabled>No approved vendors available</option>
                : vendors.map((v: any) => <option key={v.id} value={v.id}>{v.legal_name}</option>)
              }
            </Select>
          </Field>
        </FormCard>

        <FormCard title="Line Items">
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <Field label={i === 0 ? "Part" : ""} error={(errors.lines?.[i] as any)?.part_id?.message}>
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
                <div className="col-span-2">
                  <Field label={i === 0 ? "Unit Price" : ""}>
                    <Input {...register(`lines.${i}.unit_price`)} type="number" step="0.01" disabled={isReadOnly} />
                  </Field>
                </div>
                <div className="col-span-3">
                  <Field label={i === 0 ? "Destination WH" : ""} error={(errors.lines?.[i] as any)?.destination_warehouse_id?.message}>
                    <Select {...register(`lines.${i}.destination_warehouse_id`)} disabled={isReadOnly}>
                      <option value="">Select…</option>
                      {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </Select>
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
            <button type="button" onClick={() => append({ part_id: "", qty: 1, unit_price: 0, destination_warehouse_id: "" })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)]">
              <RiAddLine className="w-4 h-4" /> Add Line
            </button>
          )}
          <div className="flex justify-end pt-2">
            <p className="text-sm font-semibold text-[var(--color-text-strong-950)]">Total: {formatCurrency(total)}</p>
          </div>
        </FormCard>

        {trail.length > 0 && <FormCard title="Approval Trail"><ApprovalTimeline trail={trail} /></FormCard>}

        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">Save Draft</button>
            <button type="button" onClick={handleSubmit((v) => mutation.mutate({ ...v, action: "issue" }))} className="px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition">Issue PO</button>
          </div>
        )}

        {canApprove && (
          <FormCard title="Admin Approval">
            <div className="flex gap-3">
              <button type="button" onClick={() => approveMut.mutate("Approved")} className="px-4 py-2 rounded-lg bg-[var(--color-success-base)] text-white text-sm font-medium">Approve</button>
              <button type="button" onClick={() => approveMut.mutate("Rejected")} className="px-4 py-2 rounded-lg bg-[var(--color-error-base)] text-white text-sm font-medium">Reject</button>
            </div>
          </FormCard>
        )}
      </form>
    </div>
  )
}
