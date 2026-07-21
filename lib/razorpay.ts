import Razorpay from "razorpay";

let instance: Razorpay | null = null;

export function getRazorpay() {
  if (!instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys are not set");
    }
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

// Plan IDs must be created in the Razorpay dashboard beforehand
// (Settings > Subscriptions > Plans) and referenced here by env var
// or hardcoded once you have them. See README for setup steps.
export const RAZORPAY_PLANS: Record<string, { planId: string; amount: number; label: string }> = {
  essential: {
    planId: process.env.RAZORPAY_ESSENTIAL_PLAN_ID || "plan_essential_monthly",
    amount: 99900, // paise
    label: "Essential",
  },
  premium: {
    planId: process.env.RAZORPAY_PREMIUM_PLAN_ID || "plan_premium_monthly",
    amount: 199900,
    label: "Premium",
  },
};
