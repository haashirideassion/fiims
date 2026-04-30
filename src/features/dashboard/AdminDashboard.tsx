import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { formatCurrency } from "@/lib/utils/format"

const COLORS = ["#335cff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [vendors, vehicles, warehouses, openPOs] = await Promise.all([
        supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("warehouses").select("*", { count: "exact", head: true }),
        supabase.from("purchase_orders").select("*", { count: "exact", head: true }).eq("status", "Issued"),
      ])
      return {
        vendors: vendors.count ?? 0,
        vehicles: vehicles.count ?? 0,
        warehouses: warehouses.count ?? 0,
        openPOs: openPOs.count ?? 0,
      }
    },
  })

  const spendData = [
    { month: "Nov", value: 240000 },
    { month: "Dec", value: 310000 },
    { month: "Jan", value: 185000 },
    { month: "Feb", value: 420000 },
    { month: "Mar", value: 290000 },
    { month: "Apr", value: 350000 },
  ]

  const categoryData = [
    { name: "Engine Parts", value: 35 },
    { name: "Tyres", value: 20 },
    { name: "Filters", value: 18 },
    { name: "Electrical", value: 15 },
    { name: "Others", value: 12 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="System-wide overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Vendors", value: stats?.vendors ?? 0 },
          { label: "Total Vehicles", value: stats?.vehicles ?? 0 },
          { label: "Warehouses", value: stats?.warehouses ?? 0 },
          { label: "Open POs", value: stats?.openPOs ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
            <p className="text-sm text-[var(--color-text-sub-600)] mb-2">{s.label}</p>
            <p className="text-2xl font-semibold text-[var(--color-text-strong-950)]">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
          <h3 className="text-sm font-medium text-[var(--color-text-strong-950)] mb-4">Monthly Spend (₹)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
              <Bar dataKey="value" fill="#335cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-5">
          <h3 className="text-sm font-medium text-[var(--color-text-strong-950)] mb-4">Spend by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1 text-xs text-[var(--color-text-sub-600)]">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
