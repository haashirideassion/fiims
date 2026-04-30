import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { Field, Input, Select, FormCard, FormActions } from "@/components/shared/FormField"
import { toast } from "sonner"

const schema = z.object({
  legal_name: z.string().min(3),
  gstin: z.string().length(15).optional().or(z.literal("")),
  pan: z.string().length(10).optional().or(z.literal("")),
  msme_flag: z.boolean(),
  udyam_no: z.string().optional(),
  credit_terms: z.coerce.number<number>().min(0).max(180).optional(),
  status: z.enum(["Active", "Blacklisted", "Under Review"]),
})
type FormValues = z.infer<typeof schema>

export function VendorForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id && !window.location.pathname.includes("/new")

  const { data: vendor } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { msme_flag: false, status: "Active", credit_terms: 30 },
  })

  useEffect(() => {
    if (vendor) reset(vendor)
  }, [vendor, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        const { error } = await supabase.from("vendors").update(values).eq("id", id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from("vendors").insert(values)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] })
      toast.success(isEdit ? "Vendor updated" : "Vendor created")
      navigate("/master/vendors")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const isMsme = watch("msme_flag")

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title={isEdit ? "Edit Vendor" : "New Vendor"} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Company Details">
          <Field label="Legal Name" required error={errors.legal_name?.message}>
            <Input {...register("legal_name")} placeholder="ABC Spare Parts Pvt Ltd" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="GSTIN" error={errors.gstin?.message}>
              <Input {...register("gstin")} placeholder="33AAAAA0000A1ZX" />
            </Field>
            <Field label="PAN" error={errors.pan?.message}>
              <Input {...register("pan")} placeholder="AAAAA0000A" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Credit Terms (days)" error={errors.credit_terms?.message}>
              <Input {...register("credit_terms")} type="number" min={0} />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select {...register("status")}>
                <option>Active</option>
                <option>Under Review</option>
                <option>Blacklisted</option>
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-sub-600)] cursor-pointer">
            <input type="checkbox" {...register("msme_flag")} className="w-4 h-4 rounded accent-[var(--color-primary-500)]" />
            MSME registered vendor
          </label>
          {isMsme && (
            <Field label="Udyam Registration No." error={errors.udyam_no?.message}>
              <Input {...register("udyam_no")} placeholder="UDYAM-TN-00-0000000" />
            </Field>
          )}
        </FormCard>
        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel={isEdit ? "Update Vendor" : "Create Vendor"} />
      </form>
    </div>
  )
}
