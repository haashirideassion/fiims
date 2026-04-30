import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/features/auth/useAuth"
import { RiPencilLine } from "@remixicon/react"

export function VendorDetail() {
  const { id } = useParams()
  const { hasRole: _hasRole } = useAuth()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("id", id!).single()
      if (error) throw error
      return data
    },
  })

  const { data: contacts = [] } = useQuery({
    queryKey: ["vendor-contacts", id],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_contacts").select("*").eq("vendor_id", id!)
      return data ?? []
    },
    enabled: !!id,
  })

  const { data: contracts = [] } = useQuery({
    queryKey: ["vendor-contracts", id],
    queryFn: async () => {
      const { data } = await supabase.from("rate_contracts").select("id, valid_from, valid_until, status").eq("vendor_id", id!).order("valid_from", { ascending: false })
      return data ?? []
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-soft-400)]">Loading…</div>
  if (!vendor) return null

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={vendor.legal_name}
        description={vendor.gstin}
        actions={
          <Link to={`/master/vendors/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
            <RiPencilLine className="w-4 h-4" /> Edit
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Company Info</h3>
          {[
            ["PAN", vendor.pan],
            ["MSME", vendor.msme_flag ? "Yes" : "No"],
            ["Udyam No.", vendor.udyam_no],
            ["Credit Terms", vendor.credit_terms ? `${vendor.credit_terms} days` : "—"],
            ["Rating", vendor.composite_rating ? `${vendor.composite_rating.toFixed(1)} / 5` : "Unrated"],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between text-sm py-1.5 border-b border-[var(--color-border-soft-200)] last:border-0">
              <span className="text-[var(--color-text-soft-400)]">{label}</span>
              <span className="text-[var(--color-text-strong-950)]">{value as string ?? "—"}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-[var(--color-text-soft-400)]">Status</span>
            <StatusBadge status={vendor.status} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Contacts</h3>
            {contacts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-soft-400)]">No contacts</p>
            ) : (
              contacts.map((c: any) => (
                <div key={c.id} className="text-sm py-1.5 border-b border-[var(--color-border-soft-200)] last:border-0">
                  <p className="font-medium text-[var(--color-text-strong-950)]">{c.name} {c.is_primary && <span className="text-xs text-[var(--color-primary-500)]">(Primary)</span>}</p>
                  <p className="text-[var(--color-text-soft-400)]">{c.phone} · {c.email}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-3">Rate Contracts</h3>
            {contracts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-soft-400)]">No contracts</p>
            ) : (
              contracts.map((c: any) => (
                <Link key={c.id} to={`/master/rate-contracts/${c.id}`} className="flex justify-between text-sm py-1.5 border-b border-[var(--color-border-soft-200)] last:border-0 hover:text-[var(--color-primary-500)]">
                  <span className="text-[var(--color-text-sub-600)]">{c.valid_from} → {c.valid_until}</span>
                  <StatusBadge status={c.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
