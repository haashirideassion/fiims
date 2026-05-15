// Edge Function: notify-approval
// Triggered via Supabase Database Webhook on INSERT into audit_logs.
// Sends email when a PR or Indent is approved or rejected.
//
// Webhook config (set in Supabase Dashboard → Database → Webhooks):
//   Table: audit_logs
//   Events: INSERT
//   URL: https://<ref>.supabase.co/functions/v1/notify-approval
//   HTTP method: POST
//   Headers: Authorization: Bearer <service-role-key>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY    = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL        = Deno.env.get("FROM_EMAIL") ?? "noreply@fiims.local";

interface AuditPayload {
  record: {
    id: string;
    user_id: string;
    action: string;
    entity: string;
    entity_id: string;
    after: Record<string, unknown>;
    created_at: string;
  };
}

interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body: AuditPayload = await req.json().catch(() => null);
  if (!body?.record) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { action, entity, entity_id, after } = body.record;

  // Only process PR and Indent approval/rejection events
  const isPR     = entity === "purchase_requisitions";
  const isIndent = entity === "indents";
  if (!isPR && !isIndent) {
    return new Response("Ignored", { status: 200 });
  }

  const isApproved = action.includes("Approved") || (after as any)?.status === "Approved";
  const isRejected = action.includes("Rejected") || (after as any)?.status === "Rejected";
  if (!isApproved && !isRejected) {
    return new Response("Ignored — not an approval event", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch document details + creator email
  let docNo   = "";
  let docType = "";
  let creatorEmail = "";
  let urgency = "";

  if (isPR) {
    const { data: pr } = await supabase
      .from("purchase_requisitions")
      .select("pr_no, urgency, created_by, users!created_by(name)")
      .eq("id", entity_id)
      .single();
    if (pr) {
      docNo   = pr.pr_no ?? entity_id;
      docType = "Purchase Requisition";
      urgency = pr.urgency;
    }
    // Get creator's email from auth.users via admin API
    const { data: authUser } = await supabase.auth.admin.getUserById(
      (after as any)?.created_by ?? body.record.user_id
    );
    creatorEmail = authUser?.user?.email ?? "";
  } else {
    const { data: indent } = await supabase
      .from("indents")
      .select("indent_no, urgency, created_by")
      .eq("id", entity_id)
      .single();
    if (indent) {
      docNo   = indent.indent_no ?? entity_id;
      docType = "Indent";
      urgency = indent.urgency;
    }
    const { data: authUser } = await supabase.auth.admin.getUserById(
      (after as any)?.created_by ?? body.record.user_id
    );
    creatorEmail = authUser?.user?.email ?? "";
  }

  if (!creatorEmail) {
    console.warn("No creator email found for entity", entity_id);
    return new Response("No recipient", { status: 200 });
  }

  const statusWord = isApproved ? "Approved ✅" : "Rejected ❌";
  const subject    = `FIIMS: ${docType} ${docNo} has been ${statusWord}`;
  const html = `
    <h2>${docType} ${statusWord}</h2>
    <p>Your ${docType} <strong>${docNo}</strong> has been <strong>${isApproved ? "approved" : "rejected"}</strong>.</p>
    ${urgency ? `<p>Urgency: <strong>${urgency}</strong></p>` : ""}
    ${isRejected && (after as any)?.rejection_reason
      ? `<p>Reason: ${(after as any).rejection_reason}</p>`
      : ""}
    <p>Please log in to FIIMS to view the details.</p>
    <hr/>
    <small>FIIMS — Fleet Inventory & IoT Management System</small>
  `;

  await sendEmail({ from: FROM_EMAIL, to: [creatorEmail], subject, html });

  return new Response(JSON.stringify({ sent: true, to: creatorEmail }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
