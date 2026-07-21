import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

const PLAN_FROM_NOTES = (notes: Record<string, string> | undefined) => notes?.plan || "essential";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createServiceClient();

  const entity = event.payload?.subscription?.entity;
  const householdId: string | undefined = entity?.notes?.household_id;
  const plan = PLAN_FROM_NOTES(entity?.notes);

  if (!entity || !householdId) {
    // Not a subscription event we care about (e.g. payment.* events) — ack and exit.
    return NextResponse.json({ received: true });
  }

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged": {
      await supabase.from("subscriptions").upsert(
        {
          household_id: householdId,
          razorpay_subscription_id: entity.id,
          plan,
          status: "active",
          current_period_end: entity.current_end
            ? new Date(entity.current_end * 1000).toISOString()
            : null,
          amount: entity.plan_id ? null : null,
        },
        { onConflict: "razorpay_subscription_id" }
      );
      await supabase.from("households").update({ plan }).eq("id", householdId);
      break;
    }
    case "subscription.cancelled":
    case "subscription.completed": {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("razorpay_subscription_id", entity.id);
      break;
    }
    case "subscription.paused": {
      await supabase
        .from("subscriptions")
        .update({ status: "paused" })
        .eq("razorpay_subscription_id", entity.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
