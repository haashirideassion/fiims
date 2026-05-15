// Edge Function: notify-qc-rejection
// Triggered via Supabase Database Webhook on INSERT into rejection_slips.
// Emails the vendor's primary contact with rejection details & debit note.
//
// Webhook config (set in Supabase Dashboard → Database → Webhooks):
//   Table: rejection_slips
//   Events: INSERT
//   URL: https://<ref>.supabase.co/functions/v1/notify-qc-rejection
//   HTTP method: POST
//   Headers: Authorization: Bearer <service-role-key>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") ?? "noreply@fiims.local";

interface RejectionSlipPayload {
  record: {
    id: string;
    qc_record_id: string;
    debit_note_no: string;
    vendor_notified_at: string | null;
  };
}

async function sendEmail(to: string, subject: string, html: string) {
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
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body: RejectionSlipPayload = await req.json().catch(() => null);
  if (!body?.record) return new Response("Invalid payload", { status: 400 });

  const { qc_record_id, debit_note_no } = body.record;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Resolve full context: qc_record → grn → po → vendor
  const { data: qc } = await supabase
    .from("qc_records")
    .select(`
      grn_id, grn_line_id, rejected_qty, reason_code,
      grns!grn_id(
        grn_no, grn_date, warehouse_id,
        purchase_orders!po_id(
          po_no, vendor_id,
          vendors!vendor_id(legal_name, gstin,
            vendor_contacts!vendor_id(email, is_primary)
          )
        )
      ),
      grn_lines!grn_line_id(
        po_lines!po_line_id(
          spare_parts!part_id(name, sku)
        )
      )
    `)
    .eq("id", qc_record_id)
    .single();

  if (!qc) {
    return new Response("QC record not found", { status: 404 });
  }

  const grn      = (qc as any).grns;
  const po       = grn?.purchase_orders;
  const vendor   = po?.vendors;
  const contacts = vendor?.vendor_contacts ?? [];
  const part     = (qc as any).grn_lines?.po_lines?.spare_parts;

  const primaryContact = contacts.find((c: any) => c.is_primary) ?? contacts[0];
  const vendorEmail    = primaryContact?.email;

  if (!vendorEmail) {
    console.warn("No vendor email found for vendor", vendor?.legal_name);
    // Mark as notified even without email to avoid re-fire
    return new Response("No vendor email", { status: 200 });
  }

  const subject = `FIIMS Quality Rejection Notice — Debit Note ${debit_note_no ?? "N/A"}`;
  const html = `
    <h2>Quality Control Rejection Notice</h2>
    <p>Dear ${vendor?.legal_name ?? "Vendor"},</p>
    <p>We regret to inform you that goods received under the following details have been rejected after quality inspection:</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><td><strong>GRN No.</strong></td><td>${grn?.grn_no ?? "—"}</td></tr>
      <tr><td><strong>GRN Date</strong></td><td>${grn?.grn_date ?? "—"}</td></tr>
      <tr><td><strong>PO No.</strong></td><td>${po?.po_no ?? "—"}</td></tr>
      <tr><td><strong>Part</strong></td><td>${part?.name ?? "—"} (SKU: ${part?.sku ?? "—"})</td></tr>
      <tr><td><strong>Rejected Qty</strong></td><td>${qc.rejected_qty}</td></tr>
      <tr><td><strong>Reason</strong></td><td>${qc.reason_code ?? "—"}</td></tr>
      <tr><td><strong>Debit Note No.</strong></td><td><strong>${debit_note_no ?? "Pending"}</strong></td></tr>
    </table>
    <p>Please arrange for replacement or credit note at your earliest convenience.</p>
    <hr/>
    <small>FIIMS — Fleet Inventory & IoT Management System</small>
  `;

  await sendEmail(vendorEmail, subject, html);

  // Update vendor_notified_at
  await supabase
    .from("rejection_slips")
    .update({ vendor_notified_at: new Date().toISOString() })
    .eq("id", body.record.id);

  return new Response(JSON.stringify({ sent: true, to: vendorEmail }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
