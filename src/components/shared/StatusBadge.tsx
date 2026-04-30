import { cn } from "@/lib/utils/cn"

type StatusVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary"

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-[var(--color-success-alpha-16)] text-[var(--color-success-base)] border-[var(--color-success-alpha-24)]",
  warning: "bg-[var(--color-warning-alpha-16)] text-[var(--color-warning-base)] border-[var(--color-warning-alpha-24)]",
  error: "bg-[var(--color-error-alpha-16)] text-[var(--color-error-base)] border-[var(--color-error-alpha-24)]",
  info: "bg-[var(--color-information-alpha-16)] text-[var(--color-information-base)] border-[var(--color-information-alpha-24)]",
  neutral: "bg-[var(--color-bg-soft-200)] text-[var(--color-text-sub-600)] border-[var(--color-border-soft-200)]",
  primary: "bg-[var(--color-primary-alpha-16)] text-[var(--color-primary-500)] border-[var(--color-primary-alpha-24)]",
}

function statusVariantFromString(status: string): StatusVariant {
  const s = status.toLowerCase()
  if (["active", "approved", "completed", "passed", "received", "closed", "paid"].some((v) => s.includes(v))) return "success"
  if (["pending", "draft", "submitted", "partial", "in-transit", "requested"].some((v) => s.includes(v))) return "warning"
  if (["rejected", "failed", "scrapped", "blacklisted", "error"].some((v) => s.includes(v))) return "error"
  if (["inactive", "idle", "expired", "cancelled"].some((v) => s.includes(v))) return "neutral"
  if (["issued", "qc_pending", "probation"].some((v) => s.includes(v))) return "info"
  return "neutral"
}

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  className?: string
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const v = variant ?? statusVariantFromString(status)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variantClasses[v],
        className
      )}
    >
      {status}
    </span>
  )
}
