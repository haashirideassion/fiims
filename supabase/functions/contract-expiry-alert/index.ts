// Edge Function: contract-expiry-alert
// Can be invoked two ways:
//   1. Via pg_cron using net.http_post (daily schedule)
//   2. Manually via POST request for ad-hoc checks
//
// Fetches contracts expiring within N days (default 30)
// and emails the procurement team.
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   FROM_EMAIL
//   PROCUREMENT_EMAIL (comma-separated list of procurement team emails)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY      = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL          = Deno.env.get("FROM_EMAIL") ?? "noreply@fiims.local";
const PROCUREMENT_EMAILS  = (Deno.env.get("PROCUREMENT_EMAIL") ?? "").split(",").map(e => e.trim()).filter(Boolean);

interface ExpiringContract {
  contract_id: string;
  vendor_name: string;
  vendor_email: string | null;
  valid_until: string;
  days_remaining: number;
}

async function sendEmail(to: string[], subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY || to.length === 0) {
    console.warn("RESEND_API_KEY not set or no recipients — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url    = new URL(req.url);
  const days   = parseInt(url.searchParams.get("days") ?? "30", 10);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: contracts, error } = await supabase.rpc("rpc_expiring_contracts", { p_days: days });
  if (error) {
    console.error("RPC error:", error);
    return new Response("Database error", { status: 500 });
  }

  const rows = (contracts as ExpiringContract[]) ?? [];
  if (rows.length === 0) {
    return new Response(JSON.stringify({ sent: false, reason: "No expiring contracts" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build HTML table
  const tableRows = rows
    .map(
      (c) => `
      <tr>
        <td>${c.vendor_name}</td>
        <td>${c.valid_until}</td>
        <td style="color:${c.days_remaining <= 7 ? "red" : "orange"}">
          <strong>${c.days_remaining} days</strong>
        </td>
      </tr>`
    )
    .join("");

  const html = `
    <h2>Rate Contract Expiry Alert</h2>
    <p>The following vendor rate contracts are expiring within <strong>${days} days</strong>:</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Expiry Date</th>
          <th>Days Remaining</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <p>Please review and renew contracts as required.</p>
    <hr/>
    <small>FIIMS — Fleet Inventory & IoT Management System | Auto-generated alert</small>
  `;

  const recipients = [...PROCUREMENT_EMAILS];
  // Also add urgent contacts from the expiring contracts themselves
  rows.forEach((c) => {
    if (c.vendor_email && !recipients.includes(c.vendor_email)) {
      // Don't email vendors — only internal team
    }
  });

  if (recipients.length === 0) {
    console.warn("No procurement email recipients configured (PROCUREMENT_EMAIL env var)");
    return new Response(JSON.stringify({ sent: false, reason: "No recipients configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const subject = `⚠️ FIIMS: ${rows.length} Rate Contract(s) Expiring in ${days} Days`;
  await sendEmail(recipients, subject, html);

  return new Response(
    JSON.stringify({ sent: true, count: rows.length, to: recipients }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
