import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { RiArrowLeftLine } from "@remixicon/react"
import { cn } from "@/lib/utils/cn"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  backTo?: string
  backLabel?: string
}

export function PageHeader({ title, description, actions, className, backTo, backLabel }: PageHeaderProps) {
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
    } else if (backTo) {
      navigate(backTo)
    }
  }

  return (
    <div className={cn("mb-6", className)}>
      {backTo && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex items-center gap-1.5 mb-3 text-sm text-[var(--color-text-soft-400)] hover:text-[var(--color-text-sub-600)] transition"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          {backLabel ?? "Back"}
        </button>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-strong-950)]">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--color-text-sub-600)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
