import { useAuth } from "@/features/auth/useAuth"
import type { ApprovalEvent } from "@/lib/types"

export function useApproval() {
  const { user } = useAuth()

  function createApprovalEvent(
    action: ApprovalEvent["action"],
    userName?: string,
    reason?: string
  ): ApprovalEvent {
    return {
      user_id: user?.id ?? "",
      user_name: userName ?? user?.name ?? "Unknown",
      action,
      reason,
      timestamp: new Date().toISOString(),
    }
  }

  function appendApproval(
    trail: ApprovalEvent[],
    action: ApprovalEvent["action"],
    userName?: string,
    reason?: string
  ): ApprovalEvent[] {
    return [...trail, createApprovalEvent(action, userName, reason)]
  }

  /** Parse the raw JSON trail from the database into typed ApprovalEvent[] */
  function formatTrail(trail: unknown): ApprovalEvent[] {
    if (!trail) return []
    if (Array.isArray(trail)) return trail as ApprovalEvent[]
    return []
  }

  return { createApprovalEvent, appendApproval, formatTrail }
}
