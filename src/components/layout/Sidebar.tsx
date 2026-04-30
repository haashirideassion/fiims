import { NavLink, useNavigate } from "react-router-dom"
import {
  RiTruckLine,
  RiDashboardLine,
  RiStore2Line,
  RiArrowDownCircleLine,
  RiArrowUpCircleLine,
  RiCarLine,
  RiUserStarLine,
  RiTimeLine,
  RiBarChartLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from "@remixicon/react"
import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/features/auth/useAuth"
import type { UserRole } from "@/lib/types"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  roles: UserRole[]
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: RiDashboardLine,
    href: "/dashboard",
    roles: ["store_manager", "maintenance_lead", "fleet_manager", "admin", "procurement", "finance", "auditor"],
  },
  {
    label: "Master Data",
    icon: RiStore2Line,
    href: "/master",
    roles: ["store_manager", "fleet_manager", "admin", "procurement", "auditor"],
    children: [
      { label: "Warehouses", href: "/master/warehouses" },
      { label: "Spare Parts", href: "/master/parts" },
      { label: "Vehicles", href: "/master/vehicles" },
      { label: "Vendors", href: "/master/vendors" },
      { label: "Rate Contracts", href: "/master/rate-contracts" },
    ],
  },
  {
    label: "Inventory Inward",
    icon: RiArrowDownCircleLine,
    href: "/inward",
    roles: ["store_manager", "fleet_manager", "admin", "procurement", "finance", "auditor"],
    children: [
      { label: "Purchase Requisitions", href: "/inward/pr" },
      { label: "Purchase Orders", href: "/inward/po" },
      { label: "Goods Receipt (GRN)", href: "/inward/grn" },
      { label: "Quality Control", href: "/inward/qc" },
    ],
  },
  {
    label: "Inventory Outward",
    icon: RiArrowUpCircleLine,
    href: "/outward",
    roles: ["store_manager", "maintenance_lead", "fleet_manager", "admin", "procurement", "auditor"],
    children: [
      { label: "Indents", href: "/outward/indents" },
      { label: "Issue Parts (MIN)", href: "/outward/issues" },
      { label: "Transfers", href: "/outward/transfers" },
      { label: "Scrap", href: "/outward/scrap" },
      { label: "Returns", href: "/outward/returns" },
    ],
  },
  {
    label: "Vehicles",
    icon: RiCarLine,
    href: "/master/vehicles",
    roles: ["fleet_manager", "admin", "maintenance_lead", "auditor"],
  },
  {
    label: "Vendor Performance",
    icon: RiUserStarLine,
    href: "/vendor-performance",
    roles: ["admin", "procurement", "fleet_manager", "auditor"],
    children: [
      { label: "Scorecards", href: "/vendor-performance" },
      { label: "Leaderboard", href: "/vendor-performance/leaderboard" },
      { label: "Defect Heatmap", href: "/vendor-performance/heatmap" },
    ],
  },
  {
    label: "Lifecycle",
    icon: RiTimeLine,
    href: "/lifecycle",
    roles: ["fleet_manager", "admin", "procurement", "auditor"],
    children: [
      { label: "Serial Tracer", href: "/lifecycle/serial" },
      { label: "MTBR Analysis", href: "/lifecycle/mtbr" },
      { label: "Warranty Tracker", href: "/lifecycle/warranty" },
    ],
  },
  {
    label: "Reports",
    icon: RiBarChartLine,
    href: "/reports",
    roles: ["store_manager", "fleet_manager", "admin", "procurement", "finance", "auditor"],
  },
  {
    label: "Settings",
    icon: RiSettingsLine,
    href: "/settings",
    roles: ["admin"],
    children: [
      { label: "Users", href: "/settings/users" },
      { label: "Audit Log", href: "/settings/audit" },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role))

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[var(--color-bg-white-0)] border-r border-[var(--color-border-soft-200)] transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border-soft-200)] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-500)] flex items-center justify-center">
              <RiTruckLine className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-[var(--color-text-strong-950)]">FIIMS</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-soft-400)] hover:text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition"
        >
          {collapsed ? <RiMenuUnfoldLine className="w-4 h-4" /> : <RiMenuFoldLine className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filtered.map((item) => {
          const Icon = item.icon
          const isExpanded = expanded === item.href

          if (!item.children) {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition",
                    isActive
                      ? "bg-[var(--color-primary-alpha-16)] text-[var(--color-primary-500)] font-medium"
                      : "text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] hover:text-[var(--color-text-strong-950)]"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <div key={item.href}>
              <button
                onClick={() => setExpanded(isExpanded ? null : item.href)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition",
                  isExpanded
                    ? "bg-[var(--color-bg-soft-200)] text-[var(--color-text-strong-950)] font-medium"
                    : "text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] hover:text-[var(--color-text-strong-950)]"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <svg
                      className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")}
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
              {isExpanded && !collapsed && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      className={({ isActive }) =>
                        cn(
                          "block px-2.5 py-1.5 rounded-lg text-sm transition",
                          isActive
                            ? "text-[var(--color-primary-500)] font-medium bg-[var(--color-primary-alpha-10)]"
                            : "text-[var(--color-text-sub-600)] hover:text-[var(--color-text-strong-950)] hover:bg-[var(--color-bg-soft-200)]"
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-[var(--color-border-soft-200)] shrink-0">
        {!collapsed && user && (
          <div className="px-2.5 py-2 mb-1">
            <p className="text-xs font-medium text-[var(--color-text-strong-950)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--color-text-soft-400)] truncate capitalize">{user.role.replace("_", " ")}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-error-alpha-16)] hover:text-[var(--color-error-base)] transition"
        >
          <RiLogoutBoxLine className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
