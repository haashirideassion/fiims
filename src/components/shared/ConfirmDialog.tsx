import { RiAlertLine } from "@remixicon/react"
import type { ReactNode } from "react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: "danger" | "default"
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] shadow-lg p-6 w-full max-w-md">
        <div className="flex items-start gap-3 mb-4">
          {variant === "danger" && (
            <div className="w-9 h-9 rounded-xl bg-[var(--color-error-alpha-16)] flex items-center justify-center shrink-0">
              <RiAlertLine className="w-5 h-5 text-[var(--color-error-base)]" />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-strong-950)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-sub-600)]">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "px-4 py-2 rounded-lg bg-[var(--color-error-base)] text-white text-sm font-medium hover:opacity-90 transition"
                : "px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
