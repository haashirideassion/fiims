import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/PageHeader"
import { RiStarFill, RiTrophyLine, RiMedalLine } from "@remixicon/react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const MEDALS = [
  { icon: <RiTrophyLine className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-50 border-yellow-200" },
  { icon: <RiMedalLine className="w-5 h-5 text-slate-400" />, bg: "bg-slate-50 border-slate-200" },
  { icon: <RiMedalLine className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50 border-amber-200" },
]

export function VendorLeaderboard() {
  const { data: top = [] } = useQuery({
    queryKey: ["vendor-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_scorecards")
        .select("*, vendors(id, legal_name)")
        .order("composite_score", { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
  })

  const chartData = top.map((s: any) => ({
    name: s.vendors?.legal_name?.split(" ")[0] ?? "—",
    score: Math.round(s.composite_score ?? 0),
    fullName: s.vendors?.legal_name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Leaderboard" description="Top performers ranked by composite score" />

      {/* Podium */}
      <div className="grid grid-cols-3 gap-4">
        {top.slice(0, 3).map((s: any, i: number) => (
          <div key={s.id} className={`border rounded-2xl p-5 text-center ${MEDALS[i]?.bg ?? ""}`}>
            <div className="flex justify-center mb-2">{MEDALS[i]?.icon}</div>
            <p className="text-sm font-semibold text-[var(--color-text-strong-950)]">#{i + 1}</p>
            <Link to={`/master/vendors/${s.vendors?.id}`} className="text-sm font-medium text-[var(--color-primary-500)] hover:underline block truncate mt-1">
              {s.vendors?.legal_name}
            </Link>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <RiStarFill key={j} className={`w-3.5 h-3.5 ${j < Math.round(s.star_rating ?? 0) ? "text-yellow-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-strong-950)] mt-2">{Math.round(s.composite_score ?? 0)}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {top.length > 0 && (
        <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] mb-4">Composite Score — Top 10</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown, _: unknown, props: any) => [v, props?.payload?.fullName]} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((_: unknown, i: number) => (
                  <Cell key={i} fill={i < 3 ? "#335cff" : "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full table */}
      <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-soft-200)]">
              {["Rank", "Vendor", "Quality", "Timeliness", "Price", "Composite"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-soft-400)] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((s: any, i: number) => (
              <tr key={s.id} className="border-b border-[var(--color-border-soft-200)] last:border-0 hover:bg-[var(--color-bg-weak-50)]">
                <td className="px-4 py-3 text-[var(--color-text-sub-600)] font-medium">#{i + 1}</td>
                <td className="px-4 py-3">
                  <Link to={`/master/vendors/${s.vendors?.id}`} className="text-[var(--color-primary-500)] hover:underline">{s.vendors?.legal_name}</Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-sub-600)]">{Math.round(s.quality_score ?? 0)}</td>
                <td className="px-4 py-3 text-[var(--color-text-sub-600)]">{Math.round(s.timeliness_score ?? 0)}</td>
                <td className="px-4 py-3 text-[var(--color-text-sub-600)]">{Math.round(s.price_score ?? 0)}</td>
                <td className="px-4 py-3 font-semibold text-[var(--color-text-strong-950)]">{Math.round(s.composite_score ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
