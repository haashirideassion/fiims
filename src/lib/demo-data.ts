/**
 * FIIMS Demo Data — Chennai Fleet (Urbaser Sumeet × GCC)
 * All IDs use human-readable prefixes so they're easy to trace in the UI.
 */

// ─── IDs ────────────────────────────────────────────────────────────────────

const WH = {
  Z1: "wh-z1", Z2: "wh-z2", Z3: "wh-z3", Z4: "wh-z4",
  Z5: "wh-z5", Z6: "wh-z6", Z7: "wh-z7", CEN: "wh-cen",
} as const

const VM = {
  LPT1613: "vm-01", LPT1109: "vm-02", STARBUS: "vm-03",
  TREO: "vm-04", BOLERO: "vm-05", JCB3DX: "vm-06",
  PELICAN: "vm-07", DULEVO: "vm-08", PRO3015: "vm-09", DI745: "vm-10",
} as const

const PART = {
  OIL_FILTER: "pt-01", FUEL_FILTER: "pt-02", AIR_FILTER: "pt-03",
  ENGINE_OIL: "pt-04", BRAKE_PAD_F: "pt-05", BRAKE_SHOE_R: "pt-06",
  TYRE_295: "pt-07", TYRE_900: "pt-08", ALTERNATOR: "pt-09",
  STARTER: "pt-10", LEAF_SPRING: "pt-11", SHOCK_ABS: "pt-12",
  CLUTCH: "pt-13", RADIATOR: "pt-14", BATTERY: "pt-15",
} as const

const VEH = {
  V01: "veh-01", V02: "veh-02", V03: "veh-03", V04: "veh-04",
  V05: "veh-05", V06: "veh-06", V07: "veh-07", V08: "veh-08",
  V09: "veh-09", V10: "veh-10",
} as const

const VENDOR = {
  SPARES: "ven-01", TYRES: "ven-02", ELEC: "ven-03", FLUIDS: "ven-04", OEM: "ven-05",
} as const

const USER = {
  ADMIN: "usr-admin", STORE1: "usr-store1", FLEET: "usr-fleet",
  PROC: "usr-proc", FINANCE: "usr-fin", MAINT: "usr-maint", AUDIT: "usr-audit",
} as const

// ─── Tables ─────────────────────────────────────────────────────────────────

export const DEMO_TABLES: Record<string, any[]> = {

  // ── Warehouses ────────────────────────────────────────────────────────────
  warehouses: [
    { id: WH.Z1,  code: "WH-Z1",  name: "Zone 1 – Thiruvottiyur", address: "Thiruvottiyur, Chennai 600019", lat: 13.1627, lng: 80.3091, in_charge: "Ravi Kumar",     phone: "9841000001", status: "Active" },
    { id: WH.Z2,  code: "WH-Z2",  name: "Zone 2 – Manali",        address: "Manali, Chennai 600068",        lat: 13.1673, lng: 80.2621, in_charge: "Suresh Babu",    phone: "9841000002", status: "Active" },
    { id: WH.Z3,  code: "WH-Z3",  name: "Zone 3 – Madhavaram",    address: "Madhavaram, Chennai 600060",    lat: 13.1502, lng: 80.2322, in_charge: "Murugan S",      phone: "9841000003", status: "Active" },
    { id: WH.Z4,  code: "WH-Z4",  name: "Zone 4 – Tondiarpet",    address: "Tondiarpet, Chennai 600081",    lat: 13.1234, lng: 80.2934, in_charge: "Priya Devi",     phone: "9841000004", status: "Active" },
    { id: WH.Z5,  code: "WH-Z5",  name: "Zone 5 – Royapuram",     address: "Royapuram, Chennai 600013",     lat: 13.1023, lng: 80.2997, in_charge: "Anand R",        phone: "9841000005", status: "Active" },
    { id: WH.Z6,  code: "WH-Z6",  name: "Zone 6 – Harbour",       address: "Harbour, Chennai 600001",       lat: 13.0878, lng: 80.2905, in_charge: "Selvam K",       phone: "9841000006", status: "Active" },
    { id: WH.Z7,  code: "WH-Z7",  name: "Zone 7 – Fort",          address: "Fort St George, Chennai 600009",lat: 13.0799, lng: 80.2768, in_charge: "Lakshmi Narain", phone: "9841000007", status: "Active" },
    { id: WH.CEN, code: "WH-CEN", name: "Central Store",           address: "Anna Salai, Chennai 600002",    lat: 13.0604, lng: 80.2658, in_charge: "Central Manager",phone: "9841000008", status: "Active" },
  ],

  // ── Vehicle Models ────────────────────────────────────────────────────────
  vehicle_models: [
    { id: VM.LPT1613, make: "Tata",     model: "LPT 1613",      category: "HMV",     body_manufacturer: "Farid"    },
    { id: VM.LPT1109, make: "Tata",     model: "LPT 1109",      category: "LMV",     body_manufacturer: "Farid"    },
    { id: VM.STARBUS, make: "Tata",     model: "Starbus Ultra",  category: "BOV",     body_manufacturer: "Tata"     },
    { id: VM.TREO,    make: "Mahindra", model: "Treo Zor",       category: "LMV",     body_manufacturer: "Mahindra" },
    { id: VM.BOLERO,  make: "Mahindra", model: "Bolero Maxi",    category: "LMV",     body_manufacturer: "Mahindra" },
    { id: VM.JCB3DX,  make: "JCB",      model: "3DX",            category: "HMV",     body_manufacturer: "JCB"      },
    { id: VM.PELICAN, make: "Elgin",    model: "Pelican",        category: "Sweeper", body_manufacturer: "Elgin"    },
    { id: VM.DULEVO,  make: "Dulevo",   model: "6000 EVO",       category: "Sweeper", body_manufacturer: "Dulevo"   },
    { id: VM.PRO3015, make: "Eicher",   model: "Pro 3015",       category: "LMV",     body_manufacturer: "Eicher"   },
    { id: VM.DI745,   make: "Sonalika", model: "DI 745 III",     category: "Tractor", body_manufacturer: "Sonalika" },
  ],

  // ── Vehicles ──────────────────────────────────────────────────────────────
  vehicles: [
    { id: VEH.V01, reg_no: "TN01 AB 1234", chassis_no: "MAT612345", engine_no: "EN001234", model_id: VM.LPT1613, zone: "Zone 1", year: 2019, status: "Active",            odometer: 87500, acquired_at: "2019-04-01", vehicle_models: { make: "Tata",     model: "LPT 1613",     category: "HMV"     } },
    { id: VEH.V02, reg_no: "TN01 CD 5678", chassis_no: "MAT612346", engine_no: "EN001235", model_id: VM.LPT1613, zone: "Zone 1", year: 2020, status: "Active",            odometer: 62000, acquired_at: "2020-01-15", vehicle_models: { make: "Tata",     model: "LPT 1613",     category: "HMV"     } },
    { id: VEH.V03, reg_no: "TN02 EF 9012", chassis_no: "MAT612347", engine_no: "EN001236", model_id: VM.STARBUS, zone: "Zone 2", year: 2018, status: "Under Maintenance", odometer: 120000,acquired_at: "2018-06-01", vehicle_models: { make: "Tata",     model: "Starbus Ultra", category: "BOV"     } },
    { id: VEH.V04, reg_no: "TN03 GH 3456", chassis_no: "MAT612348", engine_no: "EN001237", model_id: VM.PELICAN, zone: "Zone 3", year: 2021, status: "Active",            odometer: 45200, acquired_at: "2021-03-10", vehicle_models: { make: "Elgin",    model: "Pelican",       category: "Sweeper" } },
    { id: VEH.V05, reg_no: "TN04 IJ 7890", chassis_no: "MAT612349", engine_no: "EN001238", model_id: VM.JCB3DX,  zone: "Zone 4", year: 2020, status: "Idle",              odometer: 8900,  acquired_at: "2020-08-01", vehicle_models: { make: "JCB",      model: "3DX",           category: "HMV"     } },
    { id: VEH.V06, reg_no: "TN05 KL 1234", chassis_no: "MAT612350", engine_no: "EN001239", model_id: VM.LPT1109, zone: "Zone 5", year: 2022, status: "Active",            odometer: 23000, acquired_at: "2022-01-20", vehicle_models: { make: "Tata",     model: "LPT 1109",      category: "LMV"     } },
    { id: VEH.V07, reg_no: "TN06 MN 5678", chassis_no: "MAT612351", engine_no: "EN001240", model_id: VM.DULEVO,  zone: "Zone 6", year: 2021, status: "Active",            odometer: 51000, acquired_at: "2021-11-01", vehicle_models: { make: "Dulevo",   model: "6000 EVO",      category: "Sweeper" } },
    { id: VEH.V08, reg_no: "TN07 OP 9012", chassis_no: "MAT612352", engine_no: "EN001241", model_id: VM.TREO,    zone: "Zone 7", year: 2023, status: "Active",            odometer: 9800,  acquired_at: "2023-05-01", vehicle_models: { make: "Mahindra", model: "Treo Zor",      category: "LMV"     } },
    { id: VEH.V09, reg_no: "TN08 QR 3456", chassis_no: "MAT612353", engine_no: "EN001242", model_id: VM.DI745,   zone: "Zone 1", year: 2019, status: "Active",            odometer: 34500, acquired_at: "2019-09-01", vehicle_models: { make: "Sonalika", model: "DI 745 III",    category: "Tractor" } },
    { id: VEH.V10, reg_no: "TN01 ST 7890", chassis_no: "MAT612354", engine_no: "EN001243", model_id: VM.LPT1613, zone: "Zone 2", year: 2020, status: "Under Maintenance", odometer: 95000, acquired_at: "2020-04-15", vehicle_models: { make: "Tata",     model: "LPT 1613",     category: "HMV"     } },
  ],

  // ── Spare Parts ───────────────────────────────────────────────────────────
  spare_parts: [
    { id: PART.OIL_FILTER,  sku: "ENG-FLT-001", name: "Engine Oil Filter",           category: "Filters",      oem_no: "LF3883",    uom: "Nos",   hsn: "84099940", gst_rate: 18, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.FUEL_FILTER, sku: "ENG-FLT-002", name: "Fuel Filter (Primary)",       category: "Filters",      oem_no: "FS1006",    uom: "Nos",   hsn: "84099940", gst_rate: 18, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.AIR_FILTER,  sku: "ENG-FLT-003", name: "Air Filter Element",          category: "Filters",      oem_no: "AF1754",    uom: "Nos",   hsn: "84099940", gst_rate: 18, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.ENGINE_OIL,  sku: "ENG-OIL-001", name: "Engine Oil 15W40 (5L)",       category: "Fluids",       oem_no: "CMS15W40",  uom: "Litre", hsn: "27101940", gst_rate: 18, serialised: false, shelf_life_flag: true,  alternate_skus: [], images: [] },
    { id: PART.BRAKE_PAD_F, sku: "BRK-PAD-001", name: "Brake Lining Set (Front)",    category: "Brakes",       oem_no: "MAH-BL01",  uom: "Set",   hsn: "87083000", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.BRAKE_SHOE_R,sku: "BRK-PAD-002", name: "Brake Shoe (Rear) — HMV",    category: "Brakes",       oem_no: "TAT-BS02",  uom: "Set",   hsn: "87083000", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.TYRE_295,    sku: "TYR-TBL-001", name: "Tyre 295/80 R22.5 Tubeless", category: "Tyres",        oem_no: "MRF-RIB",   uom: "Nos",   hsn: "40112000", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.TYRE_900,    sku: "TYR-TBL-002", name: "Tyre 9.00 × 20 (LMV)",       category: "Tyres",        oem_no: "APC-900",   uom: "Nos",   hsn: "40112000", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.ALTERNATOR,  sku: "ELC-ALT-001", name: "Alternator 24V 45A",          category: "Electrical",   oem_no: "BOSCH-ALT", uom: "Nos",   hsn: "85113000", gst_rate: 18, serialised: true,  shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.STARTER,     sku: "ELC-STR-001", name: "Starter Motor 24V",           category: "Electrical",   oem_no: "BOSCH-STR", uom: "Nos",   hsn: "85114000", gst_rate: 18, serialised: true,  shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.LEAF_SPRING, sku: "SUS-SPR-001", name: "Leaf Spring (Front) — HMV",  category: "Suspension",   oem_no: "TAT-LS01",  uom: "Set",   hsn: "87082100", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.SHOCK_ABS,   sku: "SUS-SHK-001", name: "Shock Absorber (Rear)",       category: "Suspension",   oem_no: "GAB-SA01",  uom: "Nos",   hsn: "87082900", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.CLUTCH,      sku: "CLT-PLT-001", name: "Clutch Plate Assembly",       category: "Transmission", oem_no: "LUK-CP01",  uom: "Set",   hsn: "87084000", gst_rate: 28, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.RADIATOR,    sku: "RAD-COR-001", name: "Radiator Core (HMV)",         category: "Engine",       oem_no: "MODINE-R01",uom: "Nos",   hsn: "87199000", gst_rate: 18, serialised: false, shelf_life_flag: false, alternate_skus: [], images: [] },
    { id: PART.BATTERY,     sku: "ELC-BAT-001", name: "Battery 12V 150Ah",           category: "Electrical",   oem_no: "EXIDE-150", uom: "Nos",   hsn: "85072000", gst_rate: 28, serialised: true,  shelf_life_flag: false, alternate_skus: [], images: [] },
  ],

  // ── Part–Warehouse Levels ─────────────────────────────────────────────────
  part_warehouse_levels: [
    { id: "pwl-01", part_id: PART.OIL_FILTER,  warehouse_id: WH.CEN, min_qty: 20, max_qty: 100, reorder_qty: 30 },
    { id: "pwl-02", part_id: PART.FUEL_FILTER, warehouse_id: WH.CEN, min_qty: 20, max_qty: 100, reorder_qty: 30 },
    { id: "pwl-03", part_id: PART.AIR_FILTER,  warehouse_id: WH.CEN, min_qty: 15, max_qty: 80,  reorder_qty: 25 },
    { id: "pwl-04", part_id: PART.ENGINE_OIL,  warehouse_id: WH.CEN, min_qty: 50, max_qty: 200, reorder_qty: 75 },
    { id: "pwl-05", part_id: PART.BRAKE_PAD_F, warehouse_id: WH.CEN, min_qty: 5,  max_qty: 40,  reorder_qty: 10 },
    { id: "pwl-06", part_id: PART.TYRE_295,    warehouse_id: WH.CEN, min_qty: 8,  max_qty: 50,  reorder_qty: 12 },
    { id: "pwl-07", part_id: PART.ALTERNATOR,  warehouse_id: WH.CEN, min_qty: 3,  max_qty: 15,  reorder_qty: 5  },
    { id: "pwl-08", part_id: PART.BATTERY,     warehouse_id: WH.CEN, min_qty: 5,  max_qty: 30,  reorder_qty: 8  },
    { id: "pwl-09", part_id: PART.OIL_FILTER,  warehouse_id: WH.Z1,  min_qty: 5,  max_qty: 30,  reorder_qty: 10 },
    { id: "pwl-10", part_id: PART.ENGINE_OIL,  warehouse_id: WH.Z1,  min_qty: 10, max_qty: 60,  reorder_qty: 20 },
  ],

  // ── Vendors ───────────────────────────────────────────────────────────────
  vendors: [
    { id: VENDOR.SPARES, legal_name: "Chennai Spares & Auto Parts",  gstin: "33ABCDE1234F1Z5", pan: "ABCDE1234F", msme_flag: true,  credit_terms: 30, status: "Active", composite_rating: 4.2, created_at: "2022-01-01T00:00:00Z" },
    { id: VENDOR.TYRES,  legal_name: "MRF Direct — South Zone",      gstin: "33FGHIJ5678G2Z6", pan: "FGHIJ5678G", msme_flag: false, credit_terms: 45, status: "Active", composite_rating: 4.7, created_at: "2022-01-01T00:00:00Z" },
    { id: VENDOR.ELEC,   legal_name: "Bosch Authorized Service",      gstin: "33KLMNO9012H3Z7", pan: "KLMNO9012H", msme_flag: false, credit_terms: 30, status: "Active", composite_rating: 4.5, created_at: "2022-03-01T00:00:00Z" },
    { id: VENDOR.FLUIDS, legal_name: "Castrol India — Chennai Hub",   gstin: "33PQRST3456I4Z8", pan: "PQRST3456I", msme_flag: false, credit_terms: 60, status: "Active", composite_rating: 4.0, created_at: "2022-06-01T00:00:00Z" },
    { id: VENDOR.OEM,    legal_name: "Tata Motors Dealer (Ambattur)", gstin: "33UVWXY7890J5Z9", pan: "UVWXY7890J", msme_flag: false, credit_terms: 30, status: "Active", composite_rating: 4.8, created_at: "2021-11-01T00:00:00Z" },
  ],

  // ── Vendor Contacts ───────────────────────────────────────────────────────
  vendor_contacts: [
    { id: "vc-01", vendor_id: VENDOR.SPARES, name: "Ramesh Kumar",  phone: "9944001001", email: "ramesh@cspares.in",  is_primary: true  },
    { id: "vc-02", vendor_id: VENDOR.TYRES,  name: "Pradeep Singh", phone: "9944002001", email: "pradeep@mrfdirect.in",is_primary: true  },
    { id: "vc-03", vendor_id: VENDOR.ELEC,   name: "Anil Sharma",   phone: "9944003001", email: "anil@boschservice.in",is_primary: true  },
    { id: "vc-04", vendor_id: VENDOR.FLUIDS, name: "Deepa R",       phone: "9944004001", email: "deepa@castrol.in",    is_primary: true  },
    { id: "vc-05", vendor_id: VENDOR.OEM,    name: "Vijay T",       phone: "9944005001", email: "vijay@tata-amba.in",  is_primary: true  },
  ],

  // ── Rate Contracts ────────────────────────────────────────────────────────
  rate_contracts: [
    { id: "rc-01", vendor_id: VENDOR.SPARES, valid_from: "2024-04-01", valid_until: "2025-03-31", status: "Active",  created_at: "2024-03-25T00:00:00Z", vendors: { legal_name: "Chennai Spares & Auto Parts" } },
    { id: "rc-02", vendor_id: VENDOR.TYRES,  valid_from: "2024-04-01", valid_until: "2025-03-31", status: "Active",  created_at: "2024-03-25T00:00:00Z", vendors: { legal_name: "MRF Direct — South Zone"    } },
    { id: "rc-03", vendor_id: VENDOR.ELEC,   valid_from: "2024-01-01", valid_until: "2024-12-31", status: "Active",  created_at: "2023-12-20T00:00:00Z", vendors: { legal_name: "Bosch Authorized Service"   } },
    { id: "rc-04", vendor_id: VENDOR.FLUIDS, valid_from: "2023-04-01", valid_until: "2024-03-31", status: "Expired", created_at: "2023-03-28T00:00:00Z", vendors: { legal_name: "Castrol India — Chennai Hub" } },
    { id: "rc-05", vendor_id: VENDOR.OEM,    valid_from: "2024-04-01", valid_until: "2025-03-31", status: "Active",  created_at: "2024-03-20T00:00:00Z", vendors: { legal_name: "Tata Motors Dealer (Ambattur)"} },
  ],

  // ── Rate Contract Lines ───────────────────────────────────────────────────
  rate_contract_lines: [
    { id: "rcl-01", contract_id: "rc-01", part_id: PART.OIL_FILTER,  uom: "Nos",   price: 680  },
    { id: "rcl-02", contract_id: "rc-01", part_id: PART.FUEL_FILTER, uom: "Nos",   price: 950  },
    { id: "rcl-03", contract_id: "rc-01", part_id: PART.AIR_FILTER,  uom: "Nos",   price: 1200 },
    { id: "rcl-04", contract_id: "rc-01", part_id: PART.BRAKE_PAD_F, uom: "Set",   price: 4500 },
    { id: "rcl-05", contract_id: "rc-02", part_id: PART.TYRE_295,    uom: "Nos",   price: 22500},
    { id: "rcl-06", contract_id: "rc-02", part_id: PART.TYRE_900,    uom: "Nos",   price: 8500 },
    { id: "rcl-07", contract_id: "rc-03", part_id: PART.ALTERNATOR,  uom: "Nos",   price: 12000},
    { id: "rcl-08", contract_id: "rc-03", part_id: PART.STARTER,     uom: "Nos",   price: 9500 },
    { id: "rcl-09", contract_id: "rc-03", part_id: PART.BATTERY,     uom: "Nos",   price: 7800 },
    { id: "rcl-10", contract_id: "rc-04", part_id: PART.ENGINE_OIL,  uom: "Litre", price: 320  },
  ],

  // ── Purchase Requisitions ─────────────────────────────────────────────────
  purchase_requisitions: [
    {
      id: "pr-01", warehouse_id: WH.Z1, status: "Draft",     urgency: "Normal",   created_by: USER.STORE1, created_at: "2024-04-28T08:00:00Z",
      warehouses: { name: "Zone 1 – Thiruvottiyur" }, users: { name: "Muthu (Store Mgr Z1)" },
    },
    {
      id: "pr-02", warehouse_id: WH.Z3, status: "Submitted", urgency: "Urgent",   created_by: USER.STORE1, created_at: "2024-04-27T10:30:00Z",
      warehouses: { name: "Zone 3 – Madhavaram"    }, users: { name: "Muthu (Store Mgr Z1)" },
      approval_trail: [{ user_id: USER.STORE1, user_name: "Muthu", action: "Submitted", timestamp: "2024-04-27T10:35:00Z" }],
    },
    {
      id: "pr-03", warehouse_id: WH.CEN, status: "Approved", urgency: "Critical", created_by: USER.ADMIN,  created_at: "2024-04-25T09:00:00Z",
      warehouses: { name: "Central Store"           }, users: { name: "Admin" },
      approval_trail: [
        { user_id: USER.STORE1, user_name: "Muthu",     action: "Submitted", timestamp: "2024-04-25T09:05:00Z" },
        { user_id: USER.FLEET,  user_name: "Fleet Mgr", action: "Approved",  timestamp: "2024-04-25T11:00:00Z" },
      ],
    },
    {
      id: "pr-04", warehouse_id: WH.Z2, status: "Rejected",  urgency: "Normal",   created_by: USER.STORE1, created_at: "2024-04-20T07:00:00Z",
      warehouses: { name: "Zone 2 – Manali"         }, users: { name: "Muthu (Store Mgr Z1)" },
    },
    {
      id: "pr-05", warehouse_id: WH.Z1, status: "Draft",     urgency: "Normal",   created_by: USER.STORE1, created_at: "2024-04-29T14:00:00Z",
      warehouses: { name: "Zone 1 – Thiruvottiyur" }, users: { name: "Muthu (Store Mgr Z1)" },
    },
  ],

  // ── PR Lines ──────────────────────────────────────────────────────────────
  pr_lines: [
    { id: "prl-01", pr_id: "pr-01", part_id: PART.OIL_FILTER,  qty: 20, spare_parts: { sku: "ENG-FLT-001", name: "Engine Oil Filter"        } },
    { id: "prl-02", pr_id: "pr-01", part_id: PART.ENGINE_OIL,  qty: 100,spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40 (5L)"    } },
    { id: "prl-03", pr_id: "pr-02", part_id: PART.TYRE_295,    qty: 8,  spare_parts: { sku: "TYR-TBL-001", name: "Tyre 295/80 R22.5"        } },
    { id: "prl-04", pr_id: "pr-02", part_id: PART.BRAKE_PAD_F, qty: 6,  spare_parts: { sku: "BRK-PAD-001", name: "Brake Lining Set (Front)" } },
    { id: "prl-05", pr_id: "pr-03", part_id: PART.BATTERY,     qty: 5,  spare_parts: { sku: "ELC-BAT-001", name: "Battery 12V 150Ah"        } },
    { id: "prl-06", pr_id: "pr-03", part_id: PART.ALTERNATOR,  qty: 3,  spare_parts: { sku: "ELC-ALT-001", name: "Alternator 24V 45A"       } },
    { id: "prl-07", pr_id: "pr-04", part_id: PART.FUEL_FILTER, qty: 15, spare_parts: { sku: "ENG-FLT-002", name: "Fuel Filter (Primary)"    } },
    { id: "prl-08", pr_id: "pr-05", part_id: PART.AIR_FILTER,  qty: 10, spare_parts: { sku: "ENG-FLT-003", name: "Air Filter Element"       } },
  ],

  // ── Purchase Orders ───────────────────────────────────────────────────────
  purchase_orders: [
    {
      id: "po-01", vendor_id: VENDOR.SPARES, status: "Issued",  total_value: 86000,  created_by: USER.PROC, created_at: "2024-04-26T10:00:00Z", issued_at: "2024-04-26T11:00:00Z",
      vendors: { legal_name: "Chennai Spares & Auto Parts" },
      approval_trail: [{ user_id: USER.PROC, user_name: "Procurement", action: "Approved", timestamp: "2024-04-26T10:30:00Z" }],
    },
    {
      id: "po-02", vendor_id: VENDOR.TYRES,  status: "Draft",   total_value: 225000, created_by: USER.PROC, created_at: "2024-04-29T09:00:00Z",
      vendors: { legal_name: "MRF Direct — South Zone"    },
    },
    {
      id: "po-03", vendor_id: VENDOR.ELEC,   status: "Issued",  total_value: 57600,  created_by: USER.PROC, created_at: "2024-04-22T08:00:00Z", issued_at: "2024-04-22T09:00:00Z",
      vendors: { legal_name: "Bosch Authorized Service"   },
    },
  ],

  // ── PO Lines ──────────────────────────────────────────────────────────────
  po_lines: [
    { id: "pol-01", po_id: "po-01", part_id: PART.OIL_FILTER,  qty: 30, unit_price: 680,  destination_warehouse_id: WH.CEN },
    { id: "pol-02", po_id: "po-01", part_id: PART.ENGINE_OIL,  qty: 75, unit_price: 320,  destination_warehouse_id: WH.CEN },
    { id: "pol-03", po_id: "po-01", part_id: PART.BRAKE_PAD_F, qty: 10, unit_price: 4500, destination_warehouse_id: WH.CEN },
    { id: "pol-04", po_id: "po-02", part_id: PART.TYRE_295,    qty: 10, unit_price: 22500,destination_warehouse_id: WH.CEN },
    { id: "pol-05", po_id: "po-03", part_id: PART.ALTERNATOR,  qty: 3,  unit_price: 12000,destination_warehouse_id: WH.CEN },
    { id: "pol-06", po_id: "po-03", part_id: PART.BATTERY,     qty: 6,  unit_price: 7800, destination_warehouse_id: WH.CEN },
  ],

  // ── GRNs ──────────────────────────────────────────────────────────────────
  grns: [
    {
      id: "grn-01", po_id: "po-01", warehouse_id: WH.CEN, status: "QC Done",  grn_date: "2024-04-28", lead_time_days: 2, created_by: USER.STORE1, created_at: "2024-04-28T09:00:00Z",
      purchase_orders: { id: "po-01", vendors: { legal_name: "Chennai Spares & Auto Parts" } },
      warehouses: { name: "Central Store" },
    },
    {
      id: "grn-02", po_id: "po-03", warehouse_id: WH.CEN, status: "Completed",grn_date: "2024-04-25", lead_time_days: 3, created_by: USER.STORE1, created_at: "2024-04-25T10:00:00Z",
      purchase_orders: { id: "po-03", vendors: { legal_name: "Bosch Authorized Service" } },
      warehouses: { name: "Central Store" },
    },
    {
      id: "grn-03", po_id: "po-01", warehouse_id: WH.Z1,  status: "Pending QC",grn_date: "2024-04-29",lead_time_days: 1, created_by: USER.STORE1, created_at: "2024-04-29T11:00:00Z",
      purchase_orders: { id: "po-01", vendors: { legal_name: "Chennai Spares & Auto Parts" } },
      warehouses: { name: "Zone 1 – Thiruvottiyur" },
    },
  ],

  // ── GRN Lines ─────────────────────────────────────────────────────────────
  grn_lines: [
    { id: "grnl-01", grn_id: "grn-01", po_line_id: "pol-01", received_qty: 30, batch_no: "B24APR001", spare_parts: { sku: "ENG-FLT-001", name: "Engine Oil Filter"   } },
    { id: "grnl-02", grn_id: "grn-01", po_line_id: "pol-02", received_qty: 75, batch_no: "B24APR002", spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40"    } },
    { id: "grnl-03", grn_id: "grn-02", po_line_id: "pol-05", received_qty: 3,  batch_no: "B24APR003", spare_parts: { sku: "ELC-ALT-001", name: "Alternator 24V 45A"  } },
    { id: "grnl-04", grn_id: "grn-02", po_line_id: "pol-06", received_qty: 6,  batch_no: "B24APR004", spare_parts: { sku: "ELC-BAT-001", name: "Battery 12V 150Ah"   } },
    { id: "grnl-05", grn_id: "grn-03", po_line_id: "pol-03", received_qty: 10, batch_no: "B24APR005", spare_parts: { sku: "BRK-PAD-001", name: "Brake Lining (Front)" } },
  ],

  // ── QC Records ────────────────────────────────────────────────────────────
  qc_records: [
    {
      id: "qc-01", grn_id: "grn-01", grn_line_id: "grnl-01", accepted_qty: 29, rejected_qty: 1,  reason_code: "Packaging Damage", qc_date: "2024-04-28", inspector_id: USER.STORE1,
      grn_lines: { spare_parts: { sku: "ENG-FLT-001", name: "Engine Oil Filter"  }, received_qty: 30, batch_no: "B24APR001" },
      grns: { purchase_orders: { vendors: { legal_name: "Chennai Spares & Auto Parts" } } },
    },
    {
      id: "qc-02", grn_id: "grn-01", grn_line_id: "grnl-02", accepted_qty: 75, rejected_qty: 0,  qc_date: "2024-04-28", inspector_id: USER.STORE1,
      grn_lines: { spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40"   }, received_qty: 75, batch_no: "B24APR002" },
      grns: { purchase_orders: { vendors: { legal_name: "Chennai Spares & Auto Parts" } } },
    },
    {
      id: "qc-03", grn_id: "grn-02", grn_line_id: "grnl-03", accepted_qty: 3,  rejected_qty: 0,  qc_date: "2024-04-25", inspector_id: USER.STORE1,
      grn_lines: { spare_parts: { sku: "ELC-ALT-001", name: "Alternator 24V 45A" }, received_qty: 3,  batch_no: "B24APR003" },
      grns: { purchase_orders: { vendors: { legal_name: "Bosch Authorized Service" } } },
    },
    {
      id: "qc-04", grn_id: "grn-03", grn_line_id: "grnl-05", accepted_qty: 0,  rejected_qty: 0,  qc_date: "2024-04-29", inspector_id: USER.STORE1,
      grn_lines: { spare_parts: { sku: "BRK-PAD-001", name: "Brake Lining (Front)"}, received_qty: 10, batch_no: "B24APR005" },
      grns: { purchase_orders: { vendors: { legal_name: "Chennai Spares & Auto Parts" } } },
    },
  ],

  // ── Indents ───────────────────────────────────────────────────────────────
  indents: [
    {
      id: "ind-01", vehicle_id: VEH.V01, urgency: "Breakdown", reason: "Engine oil leak — needs oil filter and top-up", status: "Approved",
      created_by: USER.MAINT, created_at: "2024-04-29T06:00:00Z",
      vehicles: { reg_no: "TN01 AB 1234" }, users: { name: "Maintenance Lead" },
      approval_trail: [
        { user_id: USER.MAINT, user_name: "Maintenance Lead", action: "Submitted", timestamp: "2024-04-29T06:05:00Z" },
        { user_id: USER.FLEET, user_name: "Fleet Manager",    action: "Approved",  timestamp: "2024-04-29T06:30:00Z" },
      ],
    },
    {
      id: "ind-02", vehicle_id: VEH.V03, urgency: "Scheduled", reason: "Preventive maintenance — 10,000 km service", status: "Issued",
      created_by: USER.MAINT, created_at: "2024-04-25T08:00:00Z",
      vehicles: { reg_no: "TN02 EF 9012" }, users: { name: "Maintenance Lead" },
    },
    {
      id: "ind-03", vehicle_id: VEH.V05, urgency: "Breakdown", reason: "Battery dead — vehicle won't start", status: "Draft",
      created_by: USER.MAINT, created_at: "2024-04-29T13:00:00Z",
      vehicles: { reg_no: "TN04 IJ 7890" }, users: { name: "Maintenance Lead" },
    },
    {
      id: "ind-04", vehicle_id: VEH.V10, urgency: "Scheduled", reason: "Tyre rotation and replacement", status: "Submitted",
      created_by: USER.MAINT, created_at: "2024-04-27T09:00:00Z",
      vehicles: { reg_no: "TN01 ST 7890" }, users: { name: "Maintenance Lead" },
    },
    {
      id: "ind-05", vehicle_id: VEH.V07, urgency: "Scheduled", reason: "Air filter and fuel filter replacement", status: "Approved",
      created_by: USER.MAINT, created_at: "2024-04-28T10:00:00Z",
      vehicles: { reg_no: "TN06 MN 5678" }, users: { name: "Maintenance Lead" },
      approval_trail: [{ user_id: USER.FLEET, user_name: "Fleet Manager", action: "Approved", timestamp: "2024-04-28T10:45:00Z" }],
    },
  ],

  // ── Indent Lines ──────────────────────────────────────────────────────────
  indent_lines: [
    { id: "indl-01", indent_id: "ind-01", part_id: PART.OIL_FILTER, qty: 1, warehouse_id: WH.Z1,  spare_parts: { sku: "ENG-FLT-001", name: "Engine Oil Filter"    }, warehouses: { name: "Zone 1 – Thiruvottiyur" } },
    { id: "indl-02", indent_id: "ind-01", part_id: PART.ENGINE_OIL, qty: 10,warehouse_id: WH.Z1,  spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40"     }, warehouses: { name: "Zone 1 – Thiruvottiyur" } },
    { id: "indl-03", indent_id: "ind-02", part_id: PART.AIR_FILTER, qty: 2, warehouse_id: WH.CEN, spare_parts: { sku: "ENG-FLT-003", name: "Air Filter Element"    }, warehouses: { name: "Central Store"           } },
    { id: "indl-04", indent_id: "ind-02", part_id: PART.ENGINE_OIL, qty: 20,warehouse_id: WH.CEN, spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40"     }, warehouses: { name: "Central Store"           } },
    { id: "indl-05", indent_id: "ind-03", part_id: PART.BATTERY,    qty: 1, warehouse_id: WH.CEN, spare_parts: { sku: "ELC-BAT-001", name: "Battery 12V 150Ah"    }, warehouses: { name: "Central Store"           } },
    { id: "indl-06", indent_id: "ind-04", part_id: PART.TYRE_295,   qty: 4, warehouse_id: WH.CEN, spare_parts: { sku: "TYR-TBL-001", name: "Tyre 295/80 R22.5"    }, warehouses: { name: "Central Store"           } },
    { id: "indl-07", indent_id: "ind-05", part_id: PART.AIR_FILTER, qty: 1, warehouse_id: WH.Z3,  spare_parts: { sku: "ENG-FLT-003", name: "Air Filter Element"    }, warehouses: { name: "Zone 3 – Madhavaram"    } },
    { id: "indl-08", indent_id: "ind-05", part_id: PART.FUEL_FILTER,qty: 1, warehouse_id: WH.Z3,  spare_parts: { sku: "ENG-FLT-002", name: "Fuel Filter (Primary)" }, warehouses: { name: "Zone 3 – Madhavaram"    } },
  ],

  // ── Material Issue Notes ──────────────────────────────────────────────────
  material_issue_notes: [
    {
      id: "min-01", indent_id: "ind-02", warehouse_id: WH.CEN, issued_by: USER.STORE1, issued_at: "2024-04-25T12:00:00Z",
      warehouses: { name: "Central Store" }, indents: { vehicles: { reg_no: "TN02 EF 9012" } },
    },
    {
      id: "min-02", indent_id: "ind-01", warehouse_id: WH.Z1,  issued_by: USER.STORE1, issued_at: "2024-04-29T09:00:00Z",
      warehouses: { name: "Zone 1 – Thiruvottiyur" }, indents: { vehicles: { reg_no: "TN01 AB 1234" } },
    },
  ],

  // ── MIN Lines ─────────────────────────────────────────────────────────────
  min_lines: [
    { id: "ml-01", min_id: "min-01", part_id: PART.AIR_FILTER, qty: 2, batch_no: "B24APR001", spare_parts: { sku: "ENG-FLT-003", name: "Air Filter Element" } },
    { id: "ml-02", min_id: "min-01", part_id: PART.ENGINE_OIL, qty: 20,batch_no: "B24APR002", spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40"   } },
    { id: "ml-03", min_id: "min-02", part_id: PART.OIL_FILTER, qty: 1, batch_no: "B24APR001", spare_parts: { sku: "ENG-FLT-001", name: "Engine Oil Filter"  } },
    { id: "ml-04", min_id: "min-02", part_id: PART.ENGINE_OIL, qty: 10,batch_no: "B24APR002", spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40"   } },
  ],

  // ── Transfers ─────────────────────────────────────────────────────────────
  transfers: [
    {
      id: "tr-01", source_wh: WH.CEN, dest_wh: WH.Z1, status: "Received",
      requested_by: USER.STORE1, dispatched_at: "2024-04-22T10:00:00Z", received_at: "2024-04-22T16:00:00Z",
      created_at: "2024-04-22T08:00:00Z",
      "source:warehouses!source_wh": { name: "Central Store"           },
      "dest:warehouses!dest_wh":     { name: "Zone 1 – Thiruvottiyur" },
    },
    {
      id: "tr-02", source_wh: WH.CEN, dest_wh: WH.Z3, status: "In-Transit",
      requested_by: USER.STORE1, dispatched_at: "2024-04-29T11:00:00Z",
      created_at: "2024-04-29T09:00:00Z",
      "source:warehouses!source_wh": { name: "Central Store"        },
      "dest:warehouses!dest_wh":     { name: "Zone 3 – Madhavaram" },
    },
  ],

  // ── Transfer Lines ────────────────────────────────────────────────────────
  transfer_lines: [
    { id: "trl-01", transfer_id: "tr-01", part_id: PART.OIL_FILTER, qty_dispatched: 10, qty_received: 10, variance_flag: false },
    { id: "trl-02", transfer_id: "tr-01", part_id: PART.ENGINE_OIL, qty_dispatched: 30, qty_received: 30, variance_flag: false },
    { id: "trl-03", transfer_id: "tr-02", part_id: PART.AIR_FILTER, qty_dispatched: 5,  qty_received: 0,  variance_flag: false },
  ],

  // ── Scrap Records ─────────────────────────────────────────────────────────
  scrap_records: [
    {
      id: "scrap-01", warehouse_id: WH.CEN, part_id: PART.OIL_FILTER, qty: 2, reason_code: "Damaged in Storage", value: 1360,
      status: "Approved", approved_at: "2024-04-20T14:00:00Z", created_by: USER.STORE1, created_at: "2024-04-18T09:00:00Z",
      warehouses: { name: "Central Store" }, spare_parts: { sku: "ENG-FLT-001", name: "Engine Oil Filter" },
    },
    {
      id: "scrap-02", warehouse_id: WH.Z1,  part_id: PART.ENGINE_OIL, qty: 5, reason_code: "Expired",            value: 1600,
      status: "Pending Approval", created_by: USER.STORE1, created_at: "2024-04-27T11:00:00Z",
      warehouses: { name: "Zone 1 – Thiruvottiyur" }, spare_parts: { sku: "ENG-OIL-001", name: "Engine Oil 15W40" },
    },
  ],

  // ── Return Notes ──────────────────────────────────────────────────────────
  return_notes: [
    {
      id: "rn-01", min_id: "min-01", warehouse_id: WH.CEN, returned_by: USER.MAINT, return_date: "2024-04-27", created_at: "2024-04-27T09:00:00Z",
      warehouses: { name: "Central Store" }, users: { name: "Maintenance Lead" },
    },
  ],

  // ── Vendor Scorecards ─────────────────────────────────────────────────────
  vendor_scorecards: [
    { id: "vs-01", vendor_id: VENDOR.SPARES, period_month: 3, period_year: 2024, quality_score: 94.2, timeliness_score: 87.5, price_score: 96.0, composite_score: 92.5, star_rating: 4.6, transaction_count: 12, vendors: { id: VENDOR.SPARES, legal_name: "Chennai Spares & Auto Parts" } },
    { id: "vs-02", vendor_id: VENDOR.TYRES,  period_month: 3, period_year: 2024, quality_score: 98.0, timeliness_score: 92.0, price_score: 90.0, composite_score: 93.8, star_rating: 4.7, transaction_count: 5,  vendors: { id: VENDOR.TYRES,  legal_name: "MRF Direct — South Zone"    } },
    { id: "vs-03", vendor_id: VENDOR.ELEC,   period_month: 3, period_year: 2024, quality_score: 97.0, timeliness_score: 85.0, price_score: 94.0, composite_score: 92.5, star_rating: 4.6, transaction_count: 8,  vendors: { id: VENDOR.ELEC,   legal_name: "Bosch Authorized Service"   } },
    { id: "vs-04", vendor_id: VENDOR.FLUIDS, period_month: 3, period_year: 2024, quality_score: 88.0, timeliness_score: 80.0, price_score: 85.0, composite_score: 84.5, star_rating: 4.2, transaction_count: 6,  vendors: { id: VENDOR.FLUIDS, legal_name: "Castrol India — Chennai Hub" } },
    { id: "vs-05", vendor_id: VENDOR.OEM,    period_month: 3, period_year: 2024, quality_score: 99.0, timeliness_score: 95.0, price_score: 92.0, composite_score: 95.7, star_rating: 4.8, transaction_count: 4,  vendors: { id: VENDOR.OEM,    legal_name: "Tata Motors Dealer (Ambattur)"} },
    // Feb
    { id: "vs-06", vendor_id: VENDOR.SPARES, period_month: 2, period_year: 2024, quality_score: 91.0, timeliness_score: 84.0, price_score: 95.0, composite_score: 90.1, star_rating: 4.5, transaction_count: 10, vendors: { id: VENDOR.SPARES, legal_name: "Chennai Spares & Auto Parts" } },
    { id: "vs-07", vendor_id: VENDOR.TYRES,  period_month: 2, period_year: 2024, quality_score: 97.0, timeliness_score: 90.0, price_score: 88.0, composite_score: 92.2, star_rating: 4.6, transaction_count: 4,  vendors: { id: VENDOR.TYRES,  legal_name: "MRF Direct — South Zone"    } },
  ],

  // ── Warranty Claims ───────────────────────────────────────────────────────
  warranty_claims: [
    {
      id: "wc-01", min_id: "min-02", part_id: PART.ALTERNATOR, vendor_id: VENDOR.ELEC,
      failure_date: "2024-04-28", description: "Alternator failed after 3 weeks — charging voltage dropping", status: "Open", created_at: "2024-04-28T14:00:00Z",
      spare_parts: { sku: "ELC-ALT-001", name: "Alternator 24V 45A" }, vendors: { legal_name: "Bosch Authorized Service" },
    },
  ],

  // ── Serialised Units ──────────────────────────────────────────────────────
  serialised_units: [
    { id: "su-01", part_id: PART.ALTERNATOR, serial_no: "ALT-2024-001", current_status: "Issued",   current_vehicle_id: VEH.V01, spare_parts: { sku: "ELC-ALT-001", name: "Alternator 24V 45A" }, vehicles: { reg_no: "TN01 AB 1234" } },
    { id: "su-02", part_id: PART.ALTERNATOR, serial_no: "ALT-2024-002", current_status: "In Stock",  current_vehicle_id: null,    spare_parts: { sku: "ELC-ALT-001", name: "Alternator 24V 45A" }, vehicles: null },
    { id: "su-03", part_id: PART.BATTERY,    serial_no: "BAT-2024-001", current_status: "In Stock",  current_vehicle_id: null,    spare_parts: { sku: "ELC-BAT-001", name: "Battery 12V 150Ah"  }, vehicles: null },
    { id: "su-04", part_id: PART.STARTER,    serial_no: "STR-2023-007", current_status: "Scrapped",  current_vehicle_id: null,    spare_parts: { sku: "ELC-STR-001", name: "Starter Motor 24V"   }, vehicles: null },
  ],

  // ── Users ─────────────────────────────────────────────────────────────────
  users: [
    { id: USER.ADMIN,  name: "Admin User",          email: "admin@demo.com",       role: "admin",            home_warehouse_id: null,   allowed_warehouses: [], status: "Active" },
    { id: USER.STORE1, name: "Muthu (Store Mgr Z1)",email: "store@demo.com",       role: "store_manager",    home_warehouse_id: WH.Z1,  allowed_warehouses: [WH.Z1, WH.Z2], status: "Active" },
    { id: USER.FLEET,  name: "Fleet Manager",        email: "fleet@demo.com",       role: "fleet_manager",    home_warehouse_id: null,   allowed_warehouses: [], status: "Active" },
    { id: USER.PROC,   name: "Procurement Officer",  email: "procurement@demo.com", role: "procurement",      home_warehouse_id: null,   allowed_warehouses: [], status: "Active" },
    { id: USER.FINANCE,name: "Finance Manager",      email: "finance@demo.com",     role: "finance",          home_warehouse_id: null,   allowed_warehouses: [], status: "Active" },
    { id: USER.MAINT,  name: "Maintenance Lead",     email: "maintenance@demo.com", role: "maintenance_lead", home_warehouse_id: WH.Z1,  allowed_warehouses: [WH.Z1], status: "Active" },
    { id: USER.AUDIT,  name: "Auditor",              email: "auditor@demo.com",     role: "auditor",          home_warehouse_id: null,   allowed_warehouses: [], status: "Active" },
  ],

  // ── Audit Logs ────────────────────────────────────────────────────────────
  audit_logs: [
    { id: "al-01", user_id: USER.STORE1, action: "INSERT:purchase_requisitions", entity: "purchase_requisitions", entity_id: "pr-01", after: { status: "Draft" },    created_at: "2024-04-28T08:00:00Z", users: { name: "Muthu (Store Mgr Z1)" } },
    { id: "al-02", user_id: USER.FLEET,  action: "UPDATE:purchase_requisitions", entity: "purchase_requisitions", entity_id: "pr-03", before: { status: "Submitted" }, after: { status: "Approved" }, created_at: "2024-04-25T11:00:00Z", users: { name: "Fleet Manager" } },
    { id: "al-03", user_id: USER.STORE1, action: "INSERT:grns",                  entity: "grns",                  entity_id: "grn-01",after: { status: "Draft" },    created_at: "2024-04-28T09:00:00Z", users: { name: "Muthu (Store Mgr Z1)" } },
    { id: "al-04", user_id: USER.PROC,   action: "INSERT:purchase_orders",       entity: "purchase_orders",       entity_id: "po-01", after: { status: "Issued" },   created_at: "2024-04-26T11:00:00Z", users: { name: "Procurement Officer"  } },
    { id: "al-05", user_id: USER.ADMIN,  action: "INSERT:vendors",               entity: "vendors",               entity_id: VENDOR.OEM,after: { legal_name: "Tata Motors Dealer" }, created_at: "2024-04-01T09:00:00Z", users: { name: "Admin User" } },
  ],

  // ── Stock Snapshots ───────────────────────────────────────────────────────
  stock_snapshots: (() => {
    const rows: any[] = []
    const dates = ["2024-04-23", "2024-04-24", "2024-04-25", "2024-04-26", "2024-04-27", "2024-04-28", "2024-04-29"]
    const levels = [52, 48, 45, 58, 55, 51, 47]
    dates.forEach((d, i) => rows.push({ id: `ss-${i+1}`, part_id: PART.OIL_FILTER, warehouse_id: WH.CEN, qty_on_hand: levels[i], snapshot_date: d }))
    return rows
  })(),

  // ── Report Schedules ──────────────────────────────────────────────────────
  report_schedules: [
    { id: "rs-01", report_type: "stock_ledger", frequency: "weekly",  recipients: ["admin@demo.com"],       created_by: USER.ADMIN, created_at: "2024-01-01T00:00:00Z" },
    { id: "rs-02", report_type: "vendor_scorecard", frequency: "monthly", recipients: ["finance@demo.com"], created_by: USER.FINANCE,created_at: "2024-01-01T00:00:00Z" },
  ],

  // ── Bin Locations ─────────────────────────────────────────────────────────
  bin_locations: [
    { id: "bin-01", warehouse_id: WH.CEN, aisle: "A", rack: "1", bin: "01", capacity: 200 },
    { id: "bin-02", warehouse_id: WH.CEN, aisle: "A", rack: "1", bin: "02", capacity: 200 },
    { id: "bin-03", warehouse_id: WH.CEN, aisle: "B", rack: "2", bin: "01", capacity: 50  },
    { id: "bin-04", warehouse_id: WH.Z1,  aisle: "A", rack: "1", bin: "01", capacity: 100 },
  ],

  // ── Part Vehicle Compatibility ────────────────────────────────────────────
  part_vehicle_compatibility: [
    { part_id: PART.OIL_FILTER,  model_id: VM.LPT1613, oem_or_equivalent: "OEM" },
    { part_id: PART.OIL_FILTER,  model_id: VM.LPT1109, oem_or_equivalent: "OEM" },
    { part_id: PART.BRAKE_PAD_F, model_id: VM.LPT1613, oem_or_equivalent: "OEM" },
    { part_id: PART.BRAKE_SHOE_R,model_id: VM.LPT1613, oem_or_equivalent: "OEM" },
    { part_id: PART.TYRE_295,    model_id: VM.LPT1613, oem_or_equivalent: "OEM" },
    { part_id: PART.TYRE_900,    model_id: VM.LPT1109, oem_or_equivalent: "Equivalent" },
    { part_id: PART.CLUTCH,      model_id: VM.LPT1613, oem_or_equivalent: "OEM" },
    { part_id: PART.RADIATOR,    model_id: VM.LPT1613, oem_or_equivalent: "OEM" },
  ],
}

// ─── Demo Auth Users ─────────────────────────────────────────────────────────

export const DEMO_CREDENTIALS = [
  { email: "admin@demo.com",       password: "demo", label: "Admin",            role: "admin"            },
  { email: "store@demo.com",       password: "demo", label: "Store Manager",    role: "store_manager"    },
  { email: "fleet@demo.com",       password: "demo", label: "Fleet Manager",    role: "fleet_manager"    },
  { email: "procurement@demo.com", password: "demo", label: "Procurement",      role: "procurement"      },
  { email: "finance@demo.com",     password: "demo", label: "Finance",          role: "finance"          },
  { email: "maintenance@demo.com", password: "demo", label: "Maintenance Lead", role: "maintenance_lead" },
] as const
