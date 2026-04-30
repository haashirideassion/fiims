import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { ApprovalTimeline } from "@/components/shared/ApprovalTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/useAuth"
import { useApproval } from "@/lib/hooks/useApproval"
import { toast } from "sonner"
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react"
import type { ApprovalEvent } from "@/lib/types"

const lineSchema = z.object({
  part_id: z.string().uuid(),
  qty_dispatched: z.coerce.number<number>().min(1),
})

const schema = z.object({
  source_wh: z.string().uuid(),
  dest_wh: z.string().uuid(),
  lines: z.array(lineSchema).min(1),
})
type FormValues = z.infer<typeof schema>

export function TransferForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, hasRole } = useAuth()
  const { formatTrail } = useApproval()
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

  const { data: transfer } = useQuery({
    queryKey: ["transfer", id],
    queryFn: async () => {
      const { data } = await supabase.from("transfers").select("*, transfer_lines(*)").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lines: [{ part_id: "", qty_dispatched: 1 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  useEffect(() => {
    if (transfer) reset({ source_wh: transfer.source_wh, dest_wh: transfer.dest_wh, lines: transfer.transfer_lines ?? [] })
  }, [transfer, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { action?: "request" | "dispatch" | "receive" }) => {
      const { lines, action, ...header } = values
      const statusMap: Record<string, string> = { request: "Requested", dispatch: "In-Transit", receive: "Received" }
      const status = statusMap[action ?? "request"] ?? "Requested"
      if (isEdit) {
        const { error } = await supabase.from("transfers").update({ ...header, status, dispatched_at: action === "dispatch" ? new Date().toISOString() : transfer?.dispatched_at }).eq("id", id!)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("transfers").insert({ ...header, status, requested_by: user?.id }).select().single()
        if (error) throw error
        await supabase.from("transfer_lines").insert(lines.map((l) => ({ ...l, transfer_id: data.id, qty_received: 0 })))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] })
      toast.success("Transfer saved")
      navigate("/outward/transfers")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const isReadOnly = isEdit && ["In-Transit", "Received", "Closed"].includes(transfer?.status)
  const canDispatch = isEdit && transfer?.status === "Approved" && hasRole("store_manager", "admin")
  const canReceive = isEdit && transfer?.status === "In-Transit"
  const trail: ApprovalEvent[] = formatTrail(transfer?.approval_trail)

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title={isEdit ? `Transfer TRF-${id?.slice(0, 8).toUpperCase()}` : "New Transfer"} actions={isEdit && <StatusBadge status={transfer?.status ?? "Requested"} />} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Route">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source Warehouse" required error={errors.source_wh?.message}>
              <Select {...register("source_wh")} disabled={isReadOnly}>
                <option value="">Select…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="Destination Warehouse" required error={errors.dest_wh?.message}>
              <Select {...register("dest_wh")} disabled={isReadOnly}>
                <option value="">Select…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
          </div>
        </FormCard>

        {!isEdit && (
          <FormCard title="Items">
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-8">
                    <Field label={i === 0 ? "Part" : ""}>
                      <Select {...register(`lines.${i}.part_id`)}>
                        <option value="">Select part…</option>
                        {parts.map((p: any) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                      </Select>
                    </Field>
                  </div>
                  <div className="col-span-3">
                    <Field label={i === 0 ? "Qty" : ""}>
                      <Input {...register(`lines.${i}.qty_dispatched`)} type="number" min={1} />
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
            <button type="button" onClick={() => append({ part_id: "", qty_dispatched: 1 })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)]">
              <RiAddLine className="w-4 h-4" /> Add Item
            </button>
          </FormCard>
        )}

        {trail.length > 0 && <FormCard title="Trail"><ApprovalTimeline trail={trail} /></FormCard>}

        {!isReadOnly && !isEdit && <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel="Request Transfer" />}

        {(canDispatch || canReceive) && (
          <div className="flex items-center justify-end gap-3">
            {canDispatch && (
              <button type="button" onClick={handleSubmit((v) => mutation.mutate({ ...v, action: "dispatch" }))} className="px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium">
                Mark Dispatched
              </button>
            )}
            {canReceive && (
              <button type="button" onClick={handleSubmit((v) => mutation.mutate({ ...v, action: "receive" }))} className="px-4 py-2 rounded-lg bg-[var(--color-success-base)] text-white text-sm font-medium">
                Confirm Receipt
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
