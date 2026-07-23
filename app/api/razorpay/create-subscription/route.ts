import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay, RAZORPAY_PLANS } from "@/lib/razorpay";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan } = (await request.json()) as { plan: keyof typeof RAZORPAY_PLANS };
  const planConfig = RAZORPAY_PLANS[plan];
  if (!planConfig) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "No household found" }, { status: 400 });

  try {
    const razorpay = getRazorpay();
    const subscription = await razorpay.subscriptions.create({
      plan_id: planConfig.planId,
      customer_notify: 1,
      total_count: 12, // 12 monthly cycles; renews automatically
      notes: { household_id: membership.household_id, plan },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start checkout" },
      { status: 500 }
    );
  }
}
