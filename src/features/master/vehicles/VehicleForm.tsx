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

const ZONES = ["Zone 1 – Thiruvottiyur", "Zone 2 – Manali", "Zone 3 – Madhavaram", "Zone 4 – Tondiarpet", "Zone 5 – Royapuram", "Zone 6 – Harbour", "Zone 7 – Fort St. George"]
const STATUSES = ["Active", "Under Maintenance", "Breakdown", "Decommissioned"]

const schema = z.object({
  reg_no: z.string().min(5),
  chassis_no: z.string().min(5),
  engine_no: z.string().min(5),
  model_id: z.string().uuid(),
  zone: z.string().min(1),
  year: z.coerce.number<number>().min(2000).max(2030),
  gps_id: z.string().optional(),
  iot_id: z.string().optional(),
  status: z.string().min(1),
  odometer: z.coerce.number<number>().min(0).optional(),
  acquired_at: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function VehicleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id && !window.location.pathname.includes("/new")

  const { data: models = [] } = useQuery({
    queryKey: ["vehicle-models"],
    queryFn: async () => {
      const { data } = await supabase.from("vehicle_models").select("id, make, model, category").order("make")
      return data ?? []
    },
  })

  const { data: vehicle } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("*").eq("id", id!).single()
      return data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Active", year: new Date().getFullYear() },
  })

  useEffect(() => {
    if (vehicle) reset(vehicle)
  }, [vehicle, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        const { error } = await supabase.from("vehicles").update(values).eq("id", id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from("vehicles").insert(values)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success(isEdit ? "Vehicle updated" : "Vehicle registered")
      navigate("/master/vehicles")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title={isEdit ? "Edit Vehicle" : "Register Vehicle"} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <FormCard title="Vehicle Identity">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration No." required error={errors.reg_no?.message}>
              <Input {...register("reg_no")} placeholder="TN 01 AA 1234" />
            </Field>
            <Field label="Status" required error={errors.status?.message}>
              <Select {...register("status")}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Chassis No." required error={errors.chassis_no?.message}>
              <Input {...register("chassis_no")} />
            </Field>
            <Field label="Engine No." required error={errors.engine_no?.message}>
              <Input {...register("engine_no")} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Model" required error={errors.model_id?.message}>
              <Select {...register("model_id")}>
                <option value="">Select model…</option>
                {models.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.make} {m.model} ({m.category})</option>
                ))}
              </Select>
            </Field>
            <Field label="Zone" required error={errors.zone?.message}>
              <Select {...register("zone")}>
                <option value="">Select zone…</option>
                {ZONES.map((z) => <option key={z}>{z}</option>)}
              </Select>
            </Field>
            <Field label="Year" required error={errors.year?.message}>
              <Input {...register("year")} type="number" />
            </Field>
          </div>
        </FormCard>

        <FormCard title="Telematics & Operations">
          <div className="grid grid-cols-2 gap-4">
            <Field label="GPS Device ID" error={errors.gps_id?.message}>
              <Input {...register("gps_id")} placeholder="GPS-12345" />
            </Field>
            <Field label="IoT Device ID" error={errors.iot_id?.message}>
              <Input {...register("iot_id")} placeholder="IOT-12345" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Odometer (km)" error={errors.odometer?.message}>
              <Input {...register("odometer")} type="number" min={0} />
            </Field>
            <Field label="Date Acquired" error={errors.acquired_at?.message}>
              <Input {...register("acquired_at")} type="date" />
            </Field>
          </div>
        </FormCard>

        <FormActions onCancel={() => navigate(-1)} isSubmitting={isSubmitting} submitLabel={isEdit ? "Update Vehicle" : "Register Vehicle"} />
      </form>
    </div>
  )
}
