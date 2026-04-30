// ===================== User & Auth =====================

export type UserRole =
  | "store_manager"
  | "maintenance_lead"
  | "fleet_manager"
  | "admin"
  | "procurement"
  | "finance"
  | "auditor"

export interface AppUser {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  home_warehouse_id: string | null
  allowed_warehouses: string[]
  mfa_enabled: boolean
  status: "active" | "inactive"
  created_at: string
}

// ===================== Warehouse & Bins =====================

export interface Warehouse {
  id: string
  code: string
  name: string
  address: string
  city: string
  pincode: string
  lat?: number
  lng?: number
  gstin: string
  in_charge: string
  phone: string
  email: string
  operational_hours?: string
  status: "active" | "inactive"
  created_by: string
  created_at: string
}

export interface BinLocation {
  id: string
  warehouse_id: string
  aisle: string
  rack: string
  bin: string
  capacity?: number
  warehouse?: Warehouse
}

// ===================== Spare Parts =====================

export type PartCategory =
  | "Electrical/BOV"
  | "Hydraulics/Compactor"
  | "Tyres"
  | "Lubricants"
  | "Body"
  | "Engine"
  | "Battery"
  | "General"

export interface SparePart {
  id: string
  sku: string
  name: string
  category: PartCategory
  oem_no?: string
  alternate_skus: string[]
  uom: string
  hsn: string
  gst_rate: number
  serialised: boolean
  shelf_life_flag: boolean
  spec_sheet_url?: string
  images: string[]
  created_by: string
  created_at: string
}

export interface PartWarehouseLevel {
  id: string
  part_id: string
  warehouse_id: string
  min_qty: number
  max_qty: number
  reorder_qty: number
  part?: SparePart
  warehouse?: Warehouse
}

// ===================== Vehicle Models & Vehicles =====================

export type VehicleCategory = "BOV" | "HMV" | "LMV" | "Sweeper" | "Tractor" | "Other"

export interface VehicleModel {
  id: string
  make: string
  model: string
  category: VehicleCategory
  body_manufacturer?: string
}

export interface PartVehicleCompatibility {
  id: string
  part_id: string
  model_id: string
  oem_or_equivalent: "OEM" | "Equivalent"
  part?: SparePart
  vehicle_model?: VehicleModel
}

export type VehicleStatus = "Active" | "Under Maintenance" | "Idle" | "Retired"

export interface Vehicle {
  id: string
  reg_no: string
  chassis_no: string
  engine_no: string
  model_id: string
  zone: string
  year: number
  gps_id?: string
  iot_id?: string
  status: VehicleStatus
  odometer?: number
  acquired_at: string
  vehicle_model?: VehicleModel
}

export interface VehicleDocument {
  id: string
  vehicle_id: string
  doc_type: "RC" | "Insurance" | "Pollution" | "Fitness" | "Permit"
  url: string
  expiry_date: string
}

// ===================== Vendors =====================

export type VendorStatus = "Probation" | "Approved" | "Blacklisted"

export interface Vendor {
  id: string
  legal_name: string
  gstin: string
  pan: string
  msme_flag: boolean
  udyam_no?: string
  credit_terms?: number
  status: VendorStatus
  composite_rating?: number
  categories: PartCategory[]
  created_at: string
}

export interface VendorContact {
  id: string
  vendor_id: string
  name: string
  phone: string
  email: string
  is_primary: boolean
}

export interface VendorAddress {
  id: string
  vendor_id: string
  type: "billing" | "shipping"
  address: string
  city: string
  pincode: string
  gstin?: string
}

export interface VendorBankDetails {
  id: string
  vendor_id: string
  bank_name: string
  account_no: string
  ifsc: string
}

// ===================== Rate Contracts =====================

export interface RateContract {
  id: string
  vendor_id: string
  valid_from: string
  valid_until: string
  document_url?: string
  status: "active" | "expiring_soon" | "expired"
  vendor?: Vendor
  lines?: RateContractLine[]
}

export interface RateContractLine {
  id: string
  contract_id: string
  part_id: string
  price: number
  uom: string
  warranty_months?: number
  part?: SparePart
  slabs?: RateContractSlab[]
}

export interface RateContractSlab {
  id: string
  line_id: string
  qty_from: number
  qty_to: number
  price: number
}

// ===================== Purchase Requisitions =====================

export type PRStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Converted"

export interface PurchaseRequisition {
  id: string
  pr_no: string
  warehouse_id: string
  status: PRStatus
  urgency: "Normal" | "Urgent"
  created_by: string
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  warehouse?: Warehouse
  lines?: PRLine[]
}

export interface PRLine {
  id: string
  pr_id: string
  part_id: string
  qty: number
  suggested_vendor_id?: string
  notes?: string
  part?: SparePart
  suggested_vendor?: Vendor
}

// ===================== Purchase Orders =====================

export type POStatus =
  | "Draft"
  | "Issued"
  | "Partially Received"
  | "Fully Received"
  | "Closed"
  | "Short-Closed"

export interface PurchaseOrder {
  id: string
  po_no: string
  vendor_id: string
  status: POStatus
  pr_refs: string[]
  created_by: string
  issued_at?: string
  total_value: number
  created_at: string
  vendor?: Vendor
  lines?: POLine[]
}

export interface POLine {
  id: string
  po_id: string
  part_id: string
  qty: number
  unit_price: number
  destination_warehouse_id: string
  contract_line_id?: string
  received_qty: number
  part?: SparePart
  destination_warehouse?: Warehouse
}

// ===================== GRN =====================

export type GRNStatus = "Draft" | "QC_Pending" | "QC_Done" | "Completed"

export interface GRN {
  id: string
  grn_no: string
  po_id: string
  warehouse_id: string
  status: GRNStatus
  created_by: string
  grn_date: string
  lead_time_days?: number
  created_at: string
  po?: PurchaseOrder
  warehouse?: Warehouse
  lines?: GRNLine[]
}

export interface GRNLine {
  id: string
  grn_id: string
  po_line_id: string
  received_qty: number
  batch_no?: string
  mfg_date?: string
  expiry_date?: string
  bin_id?: string
  photos: string[]
  part?: SparePart
  serials?: GRNSerial[]
}

export interface GRNSerial {
  id: string
  grn_line_id: string
  serial_no: string
}

// ===================== QC =====================

export type QCRejectReason =
  | "Manufacturing Defect"
  | "Shipping Damage"
  | "Wrong Part"
  | "Quantity Short"
  | "Expiry Issue"
  | "Specification Mismatch"

export interface QCRecord {
  id: string
  grn_id: string
  grn_line_id: string
  accepted_qty: number
  rejected_qty: number
  reason_code?: QCRejectReason
  checklist_results: Record<string, boolean>
  photos: string[]
  inspector_id: string
  qc_date: string
}

export interface RejectionSlip {
  id: string
  qc_record_id: string
  debit_note_no: string
  vendor_notified_at?: string
  replacement_grn_id?: string
}

// ===================== Indents =====================

export type IndentStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Issued"
  | "Partially Issued"
  | "Closed"

export interface Indent {
  id: string
  indent_no: string
  vehicle_id: string
  urgency: "Breakdown" | "Scheduled"
  reason: string
  status: IndentStatus
  created_by: string
  approval_trail: ApprovalEvent[]
  created_at: string
  vehicle?: Vehicle
  lines?: IndentLine[]
}

export interface IndentLine {
  id: string
  indent_id: string
  part_id: string
  qty: number
  warehouse_id?: string
  issued_qty: number
  part?: SparePart
  warehouse?: Warehouse
}

export interface ApprovalEvent {
  user_id: string
  user_name: string
  action: "Approved" | "Rejected" | "Submitted"
  reason?: string
  timestamp: string
}

// ===================== Material Issue Notes (MIN) =====================

export interface MIN {
  id: string
  min_no: string
  indent_id: string
  warehouse_id: string
  issued_by: string
  recipient_id: string
  signature_url?: string
  issued_at: string
  indent?: Indent
  warehouse?: Warehouse
  lines?: MINLine[]
}

export interface MINLine {
  id: string
  min_id: string
  part_id: string
  qty: number
  batch_no?: string
  bin_id?: string
  cost_per_unit: number
  part?: SparePart
  serials?: MINSerial[]
}

export interface MINSerial {
  id: string
  min_line_id: string
  serial_no: string
}

// ===================== Inter-Warehouse Transfers =====================

export type TransferStatus =
  | "Requested"
  | "Approved"
  | "In-Transit"
  | "Received"
  | "Cancelled"

export interface Transfer {
  id: string
  transfer_no: string
  source_wh: string
  dest_wh: string
  status: TransferStatus
  requested_by: string
  approved_by?: string
  transporter_details?: TransporterDetails
  dispatched_at?: string
  received_at?: string
  required_by?: string
  reason: string
  created_at: string
  source_warehouse?: Warehouse
  dest_warehouse?: Warehouse
  lines?: TransferLine[]
}

export interface TransporterDetails {
  vehicle_no: string
  driver_name: string
  driver_phone: string
}

export interface TransferLine {
  id: string
  transfer_id: string
  part_id: string
  qty_dispatched: number
  qty_received?: number
  variance_flag: boolean
  part?: SparePart
}

// ===================== Scrap =====================

export type ScrapReason =
  | "Damaged in Storage"
  | "Expired"
  | "Obsolete"
  | "Pilferage"
  | "Other"

export type ScrapStatus = "Pending Approval" | "Approved" | "Rejected"

export interface ScrapRecord {
  id: string
  scrap_no: string
  warehouse_id: string
  part_id: string
  batch_no?: string
  qty: number
  reason_code: ScrapReason
  comments?: string
  value: number
  photos: string[]
  approval_trail: ApprovalEvent[]
  status: ScrapStatus
  approved_at?: string
  created_by: string
  created_at: string
  warehouse?: Warehouse
  part?: SparePart
}

// ===================== Returns =====================

export type ReturnCondition = "Unused-Sealed" | "Unused-Opened" | "Used-Reusable"

export interface ReturnNote {
  id: string
  return_no: string
  min_id: string
  warehouse_id: string
  returned_by: string
  received_by?: string
  return_date: string
  min?: MIN
  lines?: ReturnLine[]
}

export interface ReturnLine {
  id: string
  return_id: string
  part_id: string
  qty: number
  condition_code: ReturnCondition
  photos: string[]
  accepted: boolean
  part?: SparePart
}

// ===================== Serialised Units =====================

export type SerialUnitStatus = "In Stock" | "Issued" | "Scrapped" | "Under Warranty Claim"

export interface SerialisedUnit {
  id: string
  part_id: string
  serial_no: string
  current_status: SerialUnitStatus
  current_vehicle_id?: string
  part?: SparePart
  events?: SerialisedUnitEvent[]
}

export interface SerialisedUnitEvent {
  id: string
  unit_id: string
  event_type: "GRN" | "QC" | "Stored" | "Transfer" | "Issued" | "Returned" | "Scrapped"
  reference_id: string
  reference_type: string
  warehouse_id?: string
  vehicle_id?: string
  user_id: string
  photos: string[]
  notes?: string
  created_at: string
}

// ===================== Vendor Scorecards =====================

export interface VendorScorecard {
  id: string
  vendor_id: string
  period_month: number
  period_year: number
  quality_score: number
  timeliness_score: number
  price_score: number
  composite_score: number
  star_rating: number
  transaction_count: number
  vendor?: Vendor
}

// ===================== Warranty Claims =====================

export type WarrantyClaimStatus =
  | "Filed"
  | "Acknowledged"
  | "Approved"
  | "Replacement Received"
  | "Closed"
  | "Rejected"

export interface WarrantyClaim {
  id: string
  claim_no: string
  min_id: string
  part_id: string
  vendor_id: string
  failure_date: string
  days_in_service: number
  description: string
  photos: string[]
  status: WarrantyClaimStatus
  claim_trail: ApprovalEvent[]
  created_at: string
  part?: SparePart
  vendor?: Vendor
}

// ===================== Audit Log =====================

export interface AuditLog {
  id: string
  user_id: string
  action: "Create" | "Edit" | "Delete" | "Approve" | "Reject" | "Login" | "Logout"
  entity: string
  entity_id: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip_address?: string
  device?: string
  created_at: string
  user?: AppUser
}

// ===================== Reports =====================

export interface ReportSchedule {
  id: string
  report_type: string
  frequency: "daily" | "weekly" | "monthly"
  day_of_week?: number
  day_of_month?: number
  time: string
  recipients: string[]
  format: "excel" | "pdf" | "csv"
  filters: Record<string, unknown>
  created_by: string
  is_active: boolean
}

// ===================== Stock (derived) =====================

export interface StockSnapshot {
  part_id: string
  warehouse_id: string
  current_qty: number
  reserved_qty: number
  available_qty: number
  last_updated: string
  part?: SparePart
  warehouse?: Warehouse
}

export interface StockLedgerEntry {
  date: string
  transaction_type: "GRN" | "Issue" | "Transfer In" | "Transfer Out" | "Scrap" | "Return" | "Adjustment"
  reference_no: string
  qty_in: number
  qty_out: number
  balance: number
  unit_cost: number
  total_value: number
}
