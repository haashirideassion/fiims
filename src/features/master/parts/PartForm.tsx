import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { FileUpload } from "@/components/shared/FileUpload"
import { toast } from "sonner"

const CATEGORIES = ["Engine", "Transmission", "Brakes", "Suspension", "Electrical", "Body", "Tyres", "Filters", "Fluids", "Tools", "Others"]
const UOM_OPTIONS = ["Nos", "Set", "Pair", "Litre", "Kg", "Metre", "Box"]

const schema = z.object({
  sku: z.string().min(3).max(30),
  name: z.string().min(3),
  category: z.string().min(1),
  oem_no: z.string().optional(),
  alternate_skus: z.array(z.string()).optional(),
  uom: z.string().min(1),
  hsn: z.string().optional(),
  gst_rate: z.coerce.number<number>().min(0).max(28),
  serialised: z.boolean(),
  shelf_life_flag: z.boolean(),
  images: z.array(z.string()).optional(),
  spec_sheet_url: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function PartForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id && !window.location.pathname.includes("/new")

  const { data: part } = useQuery({
    queryKey: ["part", id],
    queryFn: async () => {
      const { data } = await supabase.from("spare_parts").select("*").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { serialised: false, shelf_life_flag: false, gst_rate: 18, alternate_skus: [], images: [] },
  })

  useEffect(() => {
    if (part) reset(part)
  }, [part, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        const { error } = await supabase.from("spare_parts").update(values).eq("id", id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from("spare_parts").insert(values)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] })
      toast.success(isEdit ? "Part updated" : "Part created")
      navigate("/master/parts")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const images = watch("images") ?? []

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title={isEdit ? "Edit Part" : "New Spare Part"} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Basic Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU" required error={errors.sku?.message}>
              <Input {...register("sku")} placeholder="ENG-FLT-001" />
            </Field>
            <Field label="Category" required error={errors.category?.message}>
              <Select {...register("category")}>
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Part Name" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Oil Filter - Engine" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="OEM No." error={errors.oem_no?.message}>
              <Input {...register("oem_no")} placeholder="MAH-OEM-1234" />
            </Field>
            <Field label="UOM" required error={errors.uom?.message}>
              <Select {...register("uom")}>
                <option value="">Select…</option>
                {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </Field>
            <Field label="GST Rate (%)" required error={errors.gst_rate?.message}>
              <Input {...register("gst_rate")} type="number" step="0.01" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="HSN Code" error={errors.hsn?.message}>
              <Input {...register("hsn")} placeholder="84099940" />
            </Field>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-sub-600)] cursor-pointer">
              <input type="checkbox" {...register("serialised")} className="w-4 h-4 rounded accent-[var(--color-primary-500)]" />
              Serialised item
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-sub-600)] cursor-pointer">
              <input type="checkbox" {...register("shelf_life_flag")} className="w-4 h-4 rounded accent-[var(--color-primary-500)]" />
              Track shelf life / expiry
            </label>
          </div>
        </FormCard>

        <FormCard title="Images & Documents">
          <Field label="Part Images">
            <FileUpload
              bucket="part-images"
              path={`parts/${id ?? "new"}`}
              accept="image/*"
              multiple
              maxFiles={5}
              onUploaded={(urls) => setValue("images", [...images, ...urls])}
            />
          </Field>
          <Field label="Spec Sheet URL" error={errors.spec_sheet_url?.message}>
            <Input {...register("spec_sheet_url")} placeholder="https://…" />
          </Field>
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel={isEdit ? "Update Part" : "Create Part"} />
      </form>
    </div>
  )
}
