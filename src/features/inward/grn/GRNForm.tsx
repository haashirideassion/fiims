import { useEffect } from "react"
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
import { RiAddLine, RiDeleteBinLine, RiPrinterLine } from "@remixicon/react"

const lineSchema = z.object({
  po_line_id: z.string().min(1, "Please select a PO line"),
  received_qty: z.coerce.number<number>().min(0),
  batch_no: z.string().optional(),
  mfg_date: z.string().optional(),
  expiry_date: z.string().optional(),
  bin_id: z.string().optional(),
  photos: z.array(z.string()).optional(),
})

const schema = z.object({
  po_id: z.string().min(1, "Please select a purchase order"),
  warehouse_id: z.string().min(1, "Please select a warehouse"),
  grn_date: z.string(),
  lines: z.array(lineSchema).min(1),
})
type FormValues = z.infer<typeof schema>

export function GRNForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const isEdit = !!id && id !== "new"

  const { data: openPOs = [] } = useQuery({
    queryKey: ["open-pos"],
    queryFn: async () => {
      // Include Approved and Issued POs (eligible for goods receipt), plus Partially Received
      const { data } = await supabase
        .from("purchase_orders")
        .select("id, po_no, vendors(legal_name)")
        .in("status", ["Approved", "Issued", "Partially Received"])
        .order("po_no", { ascending: false })
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

  const { data: grn } = useQuery({
    queryKey: ["grn", id],
    queryFn: async () => {
      const { data } = await supabase.from("grns").select("*, grn_lines(*)").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      po_id: "",
      warehouse_id: "",
      grn_date: new Date().toISOString().split("T")[0],
      lines: [{ po_line_id: "", received_qty: 0, batch_no: "", photos: [] }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  const selectedPoId = watch("po_id")
  const { data: poLines = [] } = useQuery({
    queryKey: ["po-lines", selectedPoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("po_lines")
        .select("id, qty, part_id, spare_parts(sku, name)")
        .eq("po_id", selectedPoId!)
      return data ?? []
    },
    enabled: !!selectedPoId,
  })

  // Reset line items when PO changes so stale po_line_id selections are cleared
  useEffect(() => {
    if (selectedPoId && !isEdit) {
      setValue("lines", [{ po_line_id: "", received_qty: 0, batch_no: "", photos: [] }])
    }
  }, [selectedPoId, isEdit, setValue])

  useEffect(() => {
    if (grn) reset({ po_id: grn.po_id, warehouse_id: grn.warehouse_id, grn_date: grn.grn_date, lines: grn.grn_lines ?? [] })
  }, [grn, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { lines, ...header } = values

      // Build a po_line_id → part_id lookup from the already-fetched poLines
      const partIdByPoLine: Record<string, string> = {}
      for (const pl of poLines as any[]) {
        if (pl.id && pl.part_id) partIdByPoLine[pl.id] = pl.part_id
      }

      const enrichLine = (l: typeof lines[number], grnId: string) => ({
        ...l,
        grn_id:  grnId,
        part_id: l.po_line_id ? (partIdByPoLine[l.po_line_id] ?? null) : null,
      })

      if (isEdit) {
        const { error } = await supabase.from("grns").update({ ...header, status: "Received" }).eq("id", id!)
        if (error) throw error
        await supabase.from("grn_lines").delete().eq("grn_id", id!)
        await supabase.from("grn_lines").insert(lines.map((l) => enrichLine(l, id!)))
      } else {
        const { data, error } = await supabase.from("grns")
          .insert({ ...header, status: "Draft", created_by: user?.id })
          .select().single()
        if (error) throw error
        await supabase.from("grn_lines").insert(lines.map((l) => enrichLine(l, data.id)))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grns"] })
      toast.success("GRN saved")
      navigate("/inward/grn")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const isReadOnly = isEdit && grn?.status === "QC Done"

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={isEdit ? `GRN-${id?.slice(0, 8).toUpperCase()}` : "New GRN"}
        actions={isEdit && (
          <div className="flex items-center gap-2">
            <StatusBadge status={grn?.status ?? "Draft"} />
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
              <RiPrinterLine className="w-4 h-4" /> Print Labels
            </button>
          </div>
        )}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Receipt Details">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Purchase Order" required error={errors.po_id?.message}>
              <Select {...register("po_id")} disabled={isReadOnly}>
                <option value="">Select PO…</option>
                {openPOs.length === 0
                  ? <option disabled>No open purchase orders</option>
                  : openPOs.map((po: any) => (
                      <option key={po.id} value={po.id}>
                        {po.po_no ?? `PO-${po.id.slice(0, 8).toUpperCase()}`} — {po.vendors?.legal_name ?? "Unknown vendor"}
                      </option>
                    ))
                }
              </Select>
            </Field>
            <Field label="Warehouse" required error={errors.warehouse_id?.message}>
              <Select {...register("warehouse_id")} disabled={isReadOnly}>
                <option value="">Select warehouse…</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="GRN Date" required error={errors.grn_date?.message}>
              <Input {...register("grn_date")} type="date" disabled={isReadOnly} />
            </Field>
          </div>
        </FormCard>

        <FormCard title="Received Items">
          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="border border-[var(--color-border-soft-200)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-strong-950)]">Item {i + 1}</span>
                  {!isReadOnly && fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="p-1 rounded hover:bg-[var(--color-error-alpha-16)] text-[var(--color-text-soft-400)] hover:text-[var(--color-error-base)] transition">
                      <RiDeleteBinLine className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="PO Line (Part)" error={(errors.lines?.[i] as any)?.po_line_id?.message}>
                    <Select {...register(`lines.${i}.po_line_id`)} disabled={isReadOnly || !selectedPoId}>
                      <option value="">{selectedPoId ? "Select…" : "Select a PO first"}</option>
                      {poLines.length === 0 && selectedPoId
                        ? <option disabled>No lines on this PO</option>
                        : poLines.map((pl: any) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.spare_parts?.sku} — {pl.spare_parts?.name} (Ordered: {pl.qty})
                            </option>
                          ))
                      }
                    </Select>
                  </Field>
                  <Field label="Received Qty" error={(errors.lines?.[i] as any)?.received_qty?.message}>
                    <Input {...register(`lines.${i}.received_qty`)} type="number" min={0} disabled={isReadOnly} />
                  </Field>
                  <Field label="Batch No.">
                    <Input {...register(`lines.${i}.batch_no`)} placeholder="BATCH-001" disabled={isReadOnly} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mfg Date">
                    <Input {...register(`lines.${i}.mfg_date`)} type="date" disabled={isReadOnly} />
                  </Field>
                  <Field label="Expiry Date">
                    <Input {...register(`lines.${i}.expiry_date`)} type="date" disabled={isReadOnly} />
                  </Field>
                </div>
                {!isReadOnly && (
                  <Field label="Photos">
                    <FileUpload
                      bucket="grn-photos"
                      path={`grn/${id ?? "new"}/line-${i}`}
                      accept="image/*"
                      multiple
                      maxFiles={3}
                      onUploaded={(urls) => {
                        const current = (watch(`lines.${i}.photos`) ?? []) as string[]
                        setValue(`lines.${i}.photos`, [...current, ...urls])
                      }}
                    />
                  </Field>
                )}
              </div>
            ))}
          </div>
          {!isReadOnly && (
            <button type="button" onClick={() => append({ po_line_id: "", received_qty: 0, batch_no: "", photos: [] })} className="flex items-center gap-1.5 text-sm text-[var(--color-primary-500)]">
              <RiAddLine className="w-4 h-4" /> Add Item
            </button>
          )}
        </FormCard>

        {!isReadOnly && <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel={isEdit ? "Update GRN" : "Create GRN"} />}
      </form>
    </div>
  )
}
