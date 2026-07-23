import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Receives inbound WhatsApp messages from Interakt when a cook replies to a brief
// (e.g. "made it without onion" or "out of paneer, used tofu instead"). We store every
// reply and surface it in /brief-preview with a one-tap "add to memory vault" action —
// this is what lets the memory vault update itself from how things actually went,
// instead of only ever being edited manually in Settings.
//
// NOTE: Interakt's exact inbound webhook payload shape can vary by plan/version and
// hasn't been verified against a live account yet (Interakt isn't configured for this
// household). This route is written defensively against the commonly documented shape
// and logs the raw body on parse failure so the mapping can be corrected once real
// webhook traffic is visible in Vercel logs.
//
// Configure in Interakt: Settings → Webhooks → point "message received" at
// <your-app-url>/api/interakt/webhook?token=<INTERAKT_WEBHOOK_SECRET>

function extractPhoneAndMessage(body: unknown): { phone: string; message: string } | null {
  const b = body as Record<string, unknown>;
  const data = (b?.data ?? b) as Record<string, unknown> | undefined;
  if (!data) return null;

  const customer = data.customer as Record<string, unknown> | undefined;
  const message = data.message as Record<string, unknown> | undefined;

  const phone =
    (customer?.phone_number as string) ||
    (customer?.channel_phone_number as string) ||
    (data.phone_number as string) ||
    (data.from as string) ||
    "";

  const text =
    (message?.message as string) ||
    (message?.text as string) ||
    (data.message as string) ||
    (data.text as string) ||
    "";

  if (!phone || !text) return null;
  return { phone, message: text };
}

function last10Digits(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (process.env.INTERAKT_WEBHOOK_SECRET && token !== process.env.INTERAKT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = body ? extractPhoneAndMessage(body) : null;

  if (!parsed) {
    console.warn("Interakt webhook: unrecognised payload shape", JSON.stringify(body));
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  const tail = last10Digits(parsed.phone);

  const { data: staffMatches } = await supabase
    .from("staff")
    .select("id, household_id")
    .not("whatsapp_number", "is", null);

  const staff = (staffMatches || []).find(
    (s) => last10Digits((s as { whatsapp_number?: string }).whatsapp_number || "") === tail
  ) as { id: string; household_id: string } | undefined;

  if (!staff) {
    // Message from a number we don't recognise — nothing to attach it to.
    return NextResponse.json({ received: true });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayBrief } = await supabase
    .from("daily_briefs")
    .select("id")
    .eq("household_id", staff.household_id)
    .eq("date", today)
    .maybeSingle();

  await supabase.from("cook_replies").insert({
    household_id: staff.household_id,
    staff_id: staff.id,
    brief_id: todayBrief?.id || null,
    message: parsed.message,
  });

  return NextResponse.json({ received: true });
}
