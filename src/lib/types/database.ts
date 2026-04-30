export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Permissive Database type — covers all FIIMS tables.
// Supabase GenericTable requires Relationships, so we satisfy that constraint.
type AnyTable = {
  Row: Record<string, any>
  Insert: Record<string, any>
  Update: Record<string, any>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      warehouses: AnyTable
      bin_locations: AnyTable
      spare_parts: AnyTable
      part_warehouse_levels: AnyTable
      vehicle_models: AnyTable
      part_vehicle_compatibility: AnyTable
      vehicles: AnyTable
      vehicle_documents: AnyTable
      vendors: AnyTable
      vendor_contacts: AnyTable
      vendor_addresses: AnyTable
      vendor_bank_details: AnyTable
      rate_contracts: AnyTable
      rate_contract_lines: AnyTable
      rate_contract_slabs: AnyTable
      purchase_requisitions: AnyTable
      pr_lines: AnyTable
      purchase_orders: AnyTable
      po_lines: AnyTable
      grns: AnyTable
      grn_lines: AnyTable
      grn_serials: AnyTable
      qc_records: AnyTable
      rejection_slips: AnyTable
      indents: AnyTable
      indent_lines: AnyTable
      material_issue_notes: AnyTable
      min_lines: AnyTable
      min_serials: AnyTable
      transfers: AnyTable
      transfer_lines: AnyTable
      scrap_records: AnyTable
      return_notes: AnyTable
      return_lines: AnyTable
      serialised_units: AnyTable
      serialised_unit_events: AnyTable
      vendor_scorecards: AnyTable
      warranty_claims: AnyTable
      users: AnyTable
      audit_logs: AnyTable
      stock_snapshots: AnyTable
      report_schedules: AnyTable
    }
    Views: Record<string, AnyTable>
    Functions: Record<string, { Args: Record<string, any>; Returns: any }>
    Enums: Record<string, string>
    CompositeTypes: Record<string, Record<string, any>>
  }
}
