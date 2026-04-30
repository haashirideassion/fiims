import { RiCheckLine, RiCloseLine, RiSendPlane2Line } from "@remixicon/react"
import type { ApprovalEvent } from "@/lib/types"
import { formatDateTime } from "@/lib/utils/format"

interface ApprovalTimelineProps {
  trail: ApprovalEvent[]
}

const iconMap = {
  Approved: <RiCheckLine className="w-3.5 h-3.5 text-[var(--color-success-base)]" />,
  Rejected: <RiCloseLine className="w-3.5 h-3.5 text-[var(--color-error-base)]" />,
  Submitted: <RiSendPlane2Line className="w-3.5 h-3.5 text-[var(--color-information-base)]" />,
}

const bgMap = {
  Approved: "bg-[var(--color-success-alpha-16)] border-[var(--color-success-alpha-24)]",
  Rejected: "bg-[var(--color-error-alpha-16)] border-[var(--color-error-alpha-24)]",
  Submitted: "bg-[var(--color-information-alpha-16)] border-[var(--color-information-alpha-24)]",
}

export function ApprovalTimeline({ trail }: ApprovalTimelineProps) {
  if (!trail.length) {
    return <p className="text-sm text-[var(--color-text-soft-400)]">No approvals yet</p>
  }

  return (
    <div className="space-y-3">
      {trail.map((event, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${bgMap[event.action]}`}>
            {iconMap[event.action]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-strong-950)]">
              {event.user_name} <span className="font-normal text-[var(--color-text-sub-600)]">{event.action.toLowerCase()}</span>
            </p>
            {event.reason && (
              <p className="text-xs text-[var(--color-text-sub-600)] mt-0.5">{event.reason}</p>
            )}
            <p className="text-xs text-[var(--color-text-soft-400)] mt-0.5">{formatDateTime(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
