import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "./components/layout/AppShell"
import { LoginPage } from "./features/auth/LoginPage"
import { useAuth } from "./features/auth/useAuth"

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Lazy page imports ───────────────────────────────────────────────────────

const DashboardRouter = lazy(() => import("./features/dashboard/DashboardRouter").then(m => ({ default: m.DashboardRouter })))

// Master Data
const WarehouseList = lazy(() => import("./features/master/warehouses/WarehouseList").then(m => ({ default: m.WarehouseList })))
const WarehouseForm = lazy(() => import("./features/master/warehouses/WarehouseForm").then(m => ({ default: m.WarehouseForm })))
const PartList = lazy(() => import("./features/master/parts/PartList").then(m => ({ default: m.PartList })))
const PartForm = lazy(() => import("./features/master/parts/PartForm").then(m => ({ default: m.PartForm })))
const PartDetail = lazy(() => import("./features/master/parts/PartDetail").then(m => ({ default: m.PartDetail })))
const VehicleList = lazy(() => import("./features/master/vehicles/VehicleList").then(m => ({ default: m.VehicleList })))
const VehicleForm = lazy(() => import("./features/master/vehicles/VehicleForm").then(m => ({ default: m.VehicleForm })))
const VehicleDetail = lazy(() => import("./features/master/vehicles/VehicleDetail").then(m => ({ default: m.VehicleDetail })))
const VendorList = lazy(() => import("./features/master/vendors/VendorList").then(m => ({ default: m.VendorList })))
const VendorForm = lazy(() => import("./features/master/vendors/VendorForm").then(m => ({ default: m.VendorForm })))
const VendorDetail = lazy(() => import("./features/master/vendors/VendorDetail").then(m => ({ default: m.VendorDetail })))
const ContractList = lazy(() => import("./features/master/rate-contracts/ContractList").then(m => ({ default: m.ContractList })))
const ContractForm = lazy(() => import("./features/master/rate-contracts/ContractForm").then(m => ({ default: m.ContractForm })))

// Inward
const PRList = lazy(() => import("./features/inward/purchase-requisitions/PRList").then(m => ({ default: m.PRList })))
const PRForm = lazy(() => import("./features/inward/purchase-requisitions/PRForm").then(m => ({ default: m.PRForm })))
const POList = lazy(() => import("./features/inward/purchase-orders/POList").then(m => ({ default: m.POList })))
const POForm = lazy(() => import("./features/inward/purchase-orders/POForm").then(m => ({ default: m.POForm })))
const GRNList = lazy(() => import("./features/inward/grn/GRNList").then(m => ({ default: m.GRNList })))
const GRNForm = lazy(() => import("./features/inward/grn/GRNForm").then(m => ({ default: m.GRNForm })))
const QCQueue = lazy(() => import("./features/inward/qc/QCQueue").then(m => ({ default: m.QCQueue })))
const QCForm = lazy(() => import("./features/inward/qc/QCForm").then(m => ({ default: m.QCForm })))

// Outward
const IndentList = lazy(() => import("./features/outward/indents/IndentList").then(m => ({ default: m.IndentList })))
const IndentForm = lazy(() => import("./features/outward/indents/IndentForm").then(m => ({ default: m.IndentForm })))
const IssueQueue = lazy(() => import("./features/outward/issues/IssueQueue").then(m => ({ default: m.IssueQueue })))
const IssueForm = lazy(() => import("./features/outward/issues/IssueForm").then(m => ({ default: m.IssueForm })))
const TransferList = lazy(() => import("./features/outward/transfers/TransferList").then(m => ({ default: m.TransferList })))
const TransferForm = lazy(() => import("./features/outward/transfers/TransferForm").then(m => ({ default: m.TransferForm })))
const ScrapList = lazy(() => import("./features/outward/scrap/ScrapList").then(m => ({ default: m.ScrapList })))
const ScrapForm = lazy(() => import("./features/outward/scrap/ScrapForm").then(m => ({ default: m.ScrapForm })))
const ReturnList = lazy(() => import("./features/outward/returns/ReturnList").then(m => ({ default: m.ReturnList })))
const ReturnForm = lazy(() => import("./features/outward/returns/ReturnForm").then(m => ({ default: m.ReturnForm })))

// Vendor Performance
const ScorecardList = lazy(() => import("./features/vendor-performance/ScorecardList").then(m => ({ default: m.ScorecardList })))
const VendorLeaderboard = lazy(() => import("./features/vendor-performance/VendorLeaderboard").then(m => ({ default: m.VendorLeaderboard })))
const DefectHeatmap = lazy(() => import("./features/vendor-performance/DefectHeatmap").then(m => ({ default: m.DefectHeatmap })))

// Lifecycle
const SerialTracer = lazy(() => import("./features/lifecycle/SerialTracer").then(m => ({ default: m.SerialTracer })))
const SKULifecycle = lazy(() => import("./features/lifecycle/SKULifecycle").then(m => ({ default: m.SKULifecycle })))
const MTBRTable = lazy(() => import("./features/lifecycle/MTBRTable").then(m => ({ default: m.MTBRTable })))
const WarrantyTracker = lazy(() => import("./features/lifecycle/WarrantyTracker").then(m => ({ default: m.WarrantyTracker })))

// Reports
const ReportsHub = lazy(() => import("./features/reports/ReportsHub").then(m => ({ default: m.ReportsHub })))
const ReportViewer = lazy(() => import("./features/reports/ReportViewer").then(m => ({ default: m.ReportViewer })))

// Settings
const UserList = lazy(() => import("./features/settings/users/UserList").then(m => ({ default: m.UserList })))
const UserForm = lazy(() => import("./features/settings/users/UserForm").then(m => ({ default: m.UserForm })))
const AuditLog = lazy(() => import("./features/settings/audit/AuditLog").then(m => ({ default: m.AuditLog })))

// ─── Route helper ────────────────────────────────────────────────────────────

function page(Component: React.ComponentType) {
  return (
    <RequireAuth>
      <Suspense fallback={<Spinner />}>
        <Component />
      </Suspense>
    </RequireAuth>
  )
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: page(DashboardRouter) },

      // Master Data
      { path: "master/warehouses", element: page(WarehouseList) },
      { path: "master/warehouses/new", element: page(WarehouseForm) },
      { path: "master/warehouses/:id", element: page(WarehouseForm) },
      { path: "master/parts", element: page(PartList) },
      { path: "master/parts/new", element: page(PartForm) },
      { path: "master/parts/:id/edit", element: page(PartForm) },
      { path: "master/parts/:id", element: page(PartDetail) },
      { path: "master/vehicles", element: page(VehicleList) },
      { path: "master/vehicles/new", element: page(VehicleForm) },
      { path: "master/vehicles/:id/edit", element: page(VehicleForm) },
      { path: "master/vehicles/:id", element: page(VehicleDetail) },
      { path: "master/vendors", element: page(VendorList) },
      { path: "master/vendors/new", element: page(VendorForm) },
      { path: "master/vendors/:id/edit", element: page(VendorForm) },
      { path: "master/vendors/:id", element: page(VendorDetail) },
      { path: "master/rate-contracts", element: page(ContractList) },
      { path: "master/rate-contracts/new", element: page(ContractForm) },
      { path: "master/rate-contracts/:id", element: page(ContractForm) },

      // Inward
      { path: "inward/pr", element: page(PRList) },
      { path: "inward/pr/new", element: page(PRForm) },
      { path: "inward/pr/:id", element: page(PRForm) },
      { path: "inward/po", element: page(POList) },
      { path: "inward/po/new", element: page(POForm) },
      { path: "inward/po/:id", element: page(POForm) },
      { path: "inward/grn", element: page(GRNList) },
      { path: "inward/grn/new", element: page(GRNForm) },
      { path: "inward/grn/:id", element: page(GRNForm) },
      { path: "inward/qc", element: page(QCQueue) },
      { path: "inward/qc/:id", element: page(QCForm) },

      // Outward
      { path: "outward/indents", element: page(IndentList) },
      { path: "outward/indents/new", element: page(IndentForm) },
      { path: "outward/indents/:id", element: page(IndentForm) },
      { path: "outward/issues", element: page(IssueQueue) },
      { path: "outward/issues/:id", element: page(IssueForm) },
      { path: "outward/transfers", element: page(TransferList) },
      { path: "outward/transfers/new", element: page(TransferForm) },
      { path: "outward/transfers/:id", element: page(TransferForm) },
      { path: "outward/scrap", element: page(ScrapList) },
      { path: "outward/scrap/new", element: page(ScrapForm) },
      { path: "outward/returns", element: page(ReturnList) },
      { path: "outward/returns/new", element: page(ReturnForm) },

      // Vendor Performance
      { path: "vendor-performance", element: page(ScorecardList) },
      { path: "vendor-performance/leaderboard", element: page(VendorLeaderboard) },
      { path: "vendor-performance/heatmap", element: page(DefectHeatmap) },

      // Lifecycle
      { path: "lifecycle/serial", element: page(SerialTracer) },
      { path: "lifecycle/sku/:id", element: page(SKULifecycle) },
      { path: "lifecycle/mtbr", element: page(MTBRTable) },
      { path: "lifecycle/warranty", element: page(WarrantyTracker) },

      // Reports
      { path: "reports", element: page(ReportsHub) },
      { path: "reports/:reportType", element: page(ReportViewer) },

      // Settings
      { path: "settings/users", element: page(UserList) },
      { path: "settings/users/new", element: page(UserForm) },
      { path: "settings/users/:id", element: page(UserForm) },
      { path: "settings/audit", element: page(AuditLog) },
    ],
  },
])
