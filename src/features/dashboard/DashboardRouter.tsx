import { useAuth } from "@/features/auth/useAuth"
import { StoreManagerDashboard } from "./StoreManagerDashboard"
import { FleetManagerDashboard } from "./FleetManagerDashboard"
import { AdminDashboard } from "./AdminDashboard"
import { MaintenanceDashboard } from "./MaintenanceDashboard"
import { ProcurementDashboard } from "./ProcurementDashboard"

export function DashboardRouter() {
  const { user } = useAuth()
  switch (user?.role) {
    case "store_manager": return <StoreManagerDashboard />
    case "fleet_manager": return <FleetManagerDashboard />
    case "admin": return <AdminDashboard />
    case "maintenance_lead": return <MaintenanceDashboard />
    case "procurement": return <ProcurementDashboard />
    default: return <AdminDashboard />
  }
}
