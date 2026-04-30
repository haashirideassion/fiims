import { Link } from "react-router-dom"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  RiBox3Line, RiShoppingCartLine, RiTruckLine, RiUserLine,
  RiCarLine, RiBarChartLine, RiMoneyDollarCircleLine
} from "@remixicon/react"

const REPORT_GROUPS = [
  {
    title: "Stock Reports",
    reports: [
      { id: "stock-ledger", label: "Stock Ledger", description: "Current stock levels across all warehouses" },
      { id: "stock-aging", label: "Stock Aging", description: "Slow-moving and expired stock" },
      { id: "abc-analysis", label: "ABC Analysis", description: "Inventory classification by value contribution" },
      { id: "reorder-status", label: "Reorder Status", description: "Parts below reorder level" },
    ],
    icon: <RiBox3Line className="w-5 h-5" />,
    color: "bg-[var(--color-primary-alpha-10)] text-[var(--color-primary-500)]",
  },
  {
    title: "Procurement Reports",
    reports: [
      { id: "pr-status", label: "PR Status Report", description: "All purchase requisitions and approval status" },
      { id: "po-register", label: "PO Register", description: "Purchase orders with value and delivery status" },
      { id: "pending-delivery", label: "Pending Deliveries", description: "Issued POs awaiting GRN" },
      { id: "lead-time", label: "Lead Time Analysis", description: "Vendor delivery time performance" },
    ],
    icon: <RiShoppingCartLine className="w-5 h-5" />,
    color: "bg-[var(--color-warning-alpha-16)] text-[var(--color-warning-base)]",
  },
  {
    title: "Issue Reports",
    reports: [
      { id: "min-register", label: "MIN Register", description: "All Material Issue Notes" },
      { id: "consumption-analysis", label: "Consumption Analysis", description: "Parts consumed by vehicle and zone" },
      { id: "breakdown-report", label: "Breakdown Report", description: "Breakdown indent frequency" },
    ],
    icon: <RiTruckLine className="w-5 h-5" />,
    color: "bg-[var(--color-success-alpha-16)] text-[var(--color-success-base)]",
  },
  {
    title: "Vendor Reports",
    reports: [
      { id: "vendor-scorecard", label: "Vendor Scorecard Report", description: "Quality, timeliness, and price scores" },
      { id: "vendor-spend", label: "Vendor Spend Analysis", description: "Spend by vendor and category" },
      { id: "rejection-analysis", label: "Rejection Analysis", description: "QC rejections by vendor" },
    ],
    icon: <RiUserLine className="w-5 h-5" />,
    color: "bg-[var(--color-information-alpha-16)] text-[var(--color-information-base)]",
  },
  {
    title: "Vehicle Reports",
    reports: [
      { id: "vehicle-history", label: "Vehicle Service History", description: "All MINs linked to a vehicle" },
      { id: "fleet-maintenance", label: "Fleet Maintenance Summary", description: "Parts consumed per vehicle" },
      { id: "zone-wise-spend", label: "Zone-wise Spend", description: "Maintenance spend by zone" },
    ],
    icon: <RiCarLine className="w-5 h-5" />,
    color: "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)]",
  },
  {
    title: "Lifecycle Reports",
    reports: [
      { id: "sku-lifecycle", label: "SKU Lifecycle Report", description: "Full history of a part number" },
      { id: "serial-history", label: "Serial History", description: "Serialised unit event log" },
      { id: "mtbr-report", label: "MTBR Report", description: "Mean time between replacements" },
      { id: "warranty-status", label: "Warranty Status", description: "Open and resolved warranty claims" },
    ],
    icon: <RiBarChartLine className="w-5 h-5" />,
    color: "bg-[var(--color-purple-alpha-16,rgba(139,92,246,0.1))] text-purple-500",
  },
  {
    title: "Financial Reports",
    reports: [
      { id: "inventory-valuation", label: "Inventory Valuation", description: "Stock value by warehouse and category" },
      { id: "scrap-register", label: "Scrap Register", description: "Written-off stock with values" },
      { id: "gst-report", label: "GST Report", description: "Input credit summary for Tally" },
      { id: "tally-export", label: "Tally Export", description: "XML export compatible with Tally ERP" },
    ],
    icon: <RiMoneyDollarCircleLine className="w-5 h-5" />,
    color: "bg-[var(--color-success-alpha-16)] text-[var(--color-success-base)]",
  },
]

export function ReportsHub() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="35+ operational and analytical reports" />
      <div className="space-y-6">
        {REPORT_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${group.color}`}>{group.icon}</span>
              <h2 className="text-sm font-semibold text-[var(--color-text-strong-950)]">{group.title}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {group.reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="bg-[var(--color-bg-white-0)] rounded-xl border border-[var(--color-border-soft-200)] p-4 hover:border-[var(--color-primary-500)] hover:shadow-sm transition group"
                >
                  <p className="text-sm font-medium text-[var(--color-text-strong-950)] group-hover:text-[var(--color-primary-500)] transition">{report.label}</p>
                  <p className="text-xs text-[var(--color-text-soft-400)] mt-1 line-clamp-2">{report.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
