"use client";

import Script from "next/script";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    key: "trial",
    name: "Trial",
    price: "Free",
    period: "for 14 days",
    features: ["All features unlocked", "Unlimited briefs", "No credit card needed"],
  },
  {
    key: "essential",
    name: "Essential",
    price: "₹999",
    period: "/month",
    features: ["Daily cook briefs", "Memory Vault", "1 staff member", "WhatsApp delivery"],
    highlight: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "₹1,999",
    period: "/month",
    features: ["Everything in Essential", "Unlimited staff", "AI weekly meal planning", "Priority support"],
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function subscribe(planKey: string) {
    if (planKey === "trial") {
      window.location.href = "/login";
      return;
    }

    setError("");
    setLoadingPlan(planKey);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login?next=/pricing";
      return;
    }

    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout");

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "MomFlow",
        description: `${planKey === "essential" ? "Essential" : "Premium"} plan`,
        theme: { color: "#3D4A2A" },
        handler: function () {
          window.location.href = "/dashboard?upgraded=1";
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          },
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="text-text-secondary text-sm font-medium">← Back</Link>
          <h1 className="text-3xl font-semibold text-text-primary mt-3">Simple, honest pricing</h1>
          <p className="text-text-secondary mt-2">Start free. Upgrade when your family&apos;s ready.</p>
        </div>

        {error && <p className="text-error text-sm text-center mb-4">{error}</p>}

        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`card p-6 flex flex-col ${plan.highlight ? "ring-2 ring-primary" : ""}`}
            >
              {plan.highlight && (
                <span className="chip bg-primary text-background self-start mb-3 text-[11px]">Most popular</span>
              )}
              <h3 className="text-lg font-semibold text-text-primary mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-semibold text-text-primary">{plan.price}</span>
                <span className="text-text-secondary text-sm"> {plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan.key)}
                disabled={loadingPlan === plan.key}
                className={plan.highlight ? "btn-primary w-full py-3" : "btn-secondary w-full py-3"}
              >
                {loadingPlan === plan.key ? "Loading…" : plan.key === "trial" ? "Start free trial" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-text-secondary text-xs mt-8">
          UPI, cards, and netbanking supported via Razorpay. Cancel anytime.
        </p>
      </div>
    </main>
  );
}
