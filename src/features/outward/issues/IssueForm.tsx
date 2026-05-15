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
import { RiPrinterLine, RiStackLine } from "@remixicon/react"

interface BinLocation {
  id: string
  aisle: string
  rack: string
  bin: string
  warehouse_id: string
}

const lineSchema = z.object({
  indent_line_id: z.string().min(1),
  part_id: z.string().min(1),
  qty: z.coerce.number<number>().min(1),
  batch_no: z.string().optional(),
  bin_id: z.string().optional(),
})

const schema = z.object({
  recipient_id: z.string().optional(),
  lines: z.array(lineSchema).min(1),
})
type FormValues = z.infer<typeof schema>

interface FifoBatch {
  batch_no: string | null
  bin_id: string | null
  mfg_date: string | null
  expiry_date: string | null
  available_qty: number
  take_qty: number
}

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
        .select("*, vehicles(reg_no), indent_lines(*, spare_parts(sku, name, serialised), warehouses(name))")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data
    },
  })

  // Fetch FIFO batches for all indent lines once indent is loaded
  const { data: fifoBatches = {} } = useQuery({
    queryKey: ["fifo-batches", id],
    enabled: !!indent?.indent_lines?.length,
    queryFn: async () => {
      const result: Record<string, FifoBatch[]> = {}
      await Promise.all(
        (indent!.indent_lines as any[]).map(async (line: any) => {
          if (!line.warehouse_id) return
          const { data } = await supabase.rpc("rpc_fifo_batch", {
            p_part_id:      line.part_id,
            p_warehouse_id: line.warehouse_id,
            p_qty_needed:   line.qty,
          })
          result[line.id] = (data as FifoBatch[]) ?? []
        })
      )
      return result
    },
  })

  const { data: users = [] } = useQuery({
    queryKey: ["users-select"],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("id, name").order("name")
      return data ?? []
    },
  })

  // Collect unique warehouse IDs from indent lines to fetch bins for those warehouses
  const warehouseIds: string[] = indent
    ? [...new Set((indent.indent_lines as any[]).map((l: any) => l.warehouse_id).filter(Boolean))]
    : []

  const { data: binLocations = [] } = useQuery<BinLocation[]>({
    queryKey: ["bin-locations", warehouseIds],
    enabled: warehouseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bin_locations")
        .select("id, aisle, rack, bin, warehouse_id")
        .in("warehouse_id", warehouseIds)
        .order("aisle")
        .order("rack")
        .order("bin")
      if (error) throw error
      return (data ?? []) as BinLocation[]
    },
  })

  const { register, handleSubmit, control, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { lines: [] },
    values: indent ? {
      recipient_id: undefined,
      lines: (indent.indent_lines ?? []).map((l: any) => {
        const fifo = (fifoBatches[l.id] ?? [])[0]
        return {
          indent_line_id: l.id,
          part_id:        l.part_id,
          qty:            l.qty,
          batch_no:       fifo?.batch_no ?? "",
          bin_id:         fifo?.bin_id   ?? "",
        }
      }),
    } : undefined,
  })

  const { fields } = useFieldArray({ control, name: "lines" })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Resolve warehouse from first indent line (all lines use same warehouse per indent)
      const warehouseId = (indent?.indent_lines as any[])?.[0]?.warehouse_id

      const { data: min, error: minErr } = await supabase
        .from("material_issue_notes")
        .insert({
          indent_id:    id,
          warehouse_id: warehouseId,
          issued_by:    user?.id,
          recipient_id: values.recipient_id,
        })
        .select()
        .single()
      if (minErr) throw minErr

      const { error: linesErr } = await supabase.from("min_lines").insert(
        values.lines.map((l) => ({
          min_id:         min.id,
          indent_line_id: l.indent_line_id,
          part_id:        l.part_id,
          qty:            l.qty,
          batch_no:       l.batch_no || null,
          bin_id:         l.bin_id || null,
        }))
      )
      if (linesErr) throw linesErr
      // Indent status is now updated by the DB trigger (trg_fn_min_line_issued)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issue-queue"] })
      qc.invalidateQueries({ queryKey: ["indents"] })
      toast.success("Material Issue Note created")
      navigate("/outward/issues")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return (
    <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  )
  if (!indent) return null

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`Issue Parts — ${indent.indent_no ?? `IND-${id?.slice(0, 8).toUpperCase()}`}`}
        description={`Vehicle: ${indent.vehicles?.reg_no}`}
        backTo="/outward/issues"
        backLabel="Issue Queue"
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={indent.status} />
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm hover:bg-[var(--color-bg-soft-200)] transition"
            >
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
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </Field>
        </FormCard>

        <FormCard title="Items to Issue">
          <div className="space-y-3">
            {fields.map((field, i) => {
              const indentLine  = (indent.indent_lines as any[])?.[i]
              const fifo        = (fifoBatches[indentLine?.id] ?? [])
              const firstBatch  = fifo[0]
              const hasMultiple = fifo.length > 1

              return (
                <div key={field.id} className="border border-[var(--color-border-soft-200)] rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-strong-950)]">
                        {indentLine?.spare_parts?.sku} — {indentLine?.spare_parts?.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-soft-400)]">
                        From: {indentLine?.warehouses?.name} · Requested: {indentLine?.qty}
                        {indentLine?.spare_parts?.serialised && (
                          <span className="ml-2 text-amber-600 font-medium">· Serialised</span>
                        )}
                      </p>
                    </div>
                    {firstBatch && (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <RiStackLine className="w-3 h-3" />
                        FIFO: {firstBatch.available_qty} avail
                        {firstBatch.expiry_date && ` · exp ${firstBatch.expiry_date}`}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Issue Qty">
                      <Input
                        {...register(`lines.${i}.qty`)}
                        type="number"
                        min={1}
                        max={indentLine?.qty}
                      />
                    </Field>

                    <Field label={`Batch No.${firstBatch ? " (FIFO)" : ""}`}>
                      {hasMultiple ? (
                        <Select
                          {...register(`lines.${i}.batch_no`)}
                          onChange={(e) => {
                            const selected = fifo.find((b) => (b.batch_no ?? "") === e.target.value)
                            setValue(`lines.${i}.batch_no`, e.target.value)
                            setValue(`lines.${i}.bin_id`, selected?.bin_id ?? "")
                          }}
                        >
                          <option value="">— select —</option>
                          {fifo.map((b, bi) => (
                            <option key={bi} value={b.batch_no ?? ""}>
                              {b.batch_no ?? "(no batch)"} — {b.available_qty} avail
                              {b.expiry_date ? ` · exp ${b.expiry_date}` : ""}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          {...register(`lines.${i}.batch_no`)}
                          placeholder="BATCH-001"
                        />
                      )}
                    </Field>

                    <Field label="Bin">
                      <Select {...register(`lines.${i}.bin_id`)}>
                        <option value="">— select bin —</option>
                        {binLocations
                          .filter((b) => b.warehouse_id === indentLine?.warehouse_id)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.aisle}-{b.rack}-{b.bin}
                            </option>
                          ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              )
            })}
          </div>
        </FormCard>

        <FormActions
          onCancel={() => navigate(-1)}
          isSubmitting={isSubmitting}
          submitLabel="Confirm Issue & Generate MIN"
        />
      </form>
    </div>
  )
}
