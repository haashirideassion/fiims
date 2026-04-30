import { useAuth } from "@/features/auth/useAuth"

export function useWarehouseScope() {
  const { user } = useAuth()

  function scopedWarehouseId(warehouseId?: string): string | null {
    if (!user) return null
    if (user.role === "store_manager") {
      return warehouseId ?? user.home_warehouse_id
    }
    return warehouseId ?? null
  }

  function canWriteToWarehouse(warehouseId: string): boolean {
    if (!user) return false
    if (["admin", "fleet_manager", "procurement", "finance", "auditor"].includes(user.role)) {
      return user.role !== "auditor"
    }
    if (user.role === "store_manager") {
      return (
        user.home_warehouse_id === warehouseId ||
        user.allowed_warehouses.includes(warehouseId)
      )
    }
    return user.role === "maintenance_lead"
  }

  return {
    homeWarehouseId: user?.home_warehouse_id ?? null,
    allowedWarehouses: user?.allowed_warehouses ?? [],
    scopedWarehouseId,
    canWriteToWarehouse,
    isMultiWarehouse: (user?.allowed_warehouses?.length ?? 0) > 0,
  }
}
