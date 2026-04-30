import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils/cn"

interface FieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function Field({ label, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-[var(--color-text-strong-950)]">
        {label}{required && <span className="text-[var(--color-error-base)] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--color-error-base)]">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-sm text-[var(--color-text-strong-950)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition",
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-sm text-[var(--color-text-strong-950)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-[var(--color-border-soft-200)] bg-[var(--color-bg-white-0)] text-sm text-[var(--color-text-strong-950)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition resize-none",
        className
      )}
      {...props}
    />
  )
}

export function FormCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-bg-white-0)] rounded-2xl border border-[var(--color-border-soft-200)] p-6 space-y-5">
      {title && <h3 className="text-sm font-semibold text-[var(--color-text-strong-950)] pb-2 border-b border-[var(--color-border-soft-200)]">{title}</h3>}
      {children}
    </div>
  )
}

export function FormActions({ onCancel, isSubmitting, submitLabel = "Save" }: { onCancel: () => void; isSubmitting?: boolean; submitLabel?: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-[var(--color-border-soft-200)] text-sm text-[var(--color-text-sub-600)] hover:bg-[var(--color-bg-soft-200)] transition">
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] disabled:opacity-50 transition">
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </div>
  )
}
