import { format as dateFnsFormat } from "date-fns"

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: string | Date, fmt = "dd MMM yyyy"): string {
  return dateFnsFormat(new Date(date), fmt)
}

export function formatDateTime(date: string | Date): string {
  return dateFnsFormat(new Date(date), "dd MMM yyyy, HH:mm")
}

export function formatGSTIN(value: string): string {
  return value.toUpperCase()
}

export function validateGSTIN(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
}

export function validatePAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
}

export function skuPrefix(category: string): string {
  const map: Record<string, string> = {
    Electrical: "SP-ELE",
    Hydraulic: "SP-HYD",
    Tyre: "SP-TYR",
    Lubricant: "SP-LUB",
    Body: "SP-BOD",
    Engine: "SP-ENG",
    Battery: "SP-BAT",
    General: "SP-GEN",
  }
  return map[category] ?? "SP-GEN"
}
