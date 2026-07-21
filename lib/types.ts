export type Plan = "trial" | "essential" | "premium" | "elite" | "ultra";

export type Household = {
  id: string;
  name: string;
  city: string | null;
  owner_id: string;
  plan: Plan;
  trial_ends_at: string;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  household_id: string;
  name: string;
  role: string | null;
  age: number | null;
  dietary_restrictions: string[];
  meal_preferences: string[];
  fasting_days: string[];
  notes: string | null;
  created_at: string;
};

export type Staff = {
  id: string;
  household_id: string;
  name: string;
  role: string;
  language: "hindi" | "marathi" | "gujarati" | "odia" | "tamil" | "bengali";
  whatsapp_number: string | null;
  is_active: boolean;
  is_present_today: boolean;
  created_at: string;
};

export type MemoryRule = {
  id: string;
  household_id: string;
  rule_text: string;
  applies_to: string;
  rule_type: "dietary" | "timing" | "preference" | "allergy" | "staff_instruction";
  times_applied: number;
  is_active: boolean;
  created_at: string;
};

export type MealSlot = { name: string; notes?: string };
export type MealsForDay = { breakfast?: MealSlot; lunch?: MealSlot; dinner?: MealSlot };

export type DailyBrief = {
  id: string;
  household_id: string;
  date: string;
  meals: MealsForDay | null;
  special_context: string | null;
  brief_hindi: string | null;
  brief_english: string | null;
  language_sent: string;
  sent_to_whatsapp: boolean;
  sent_at: string | null;
  staff_id: string | null;
  created_at: string;
};

export type WeeklyPlan = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  MealsForDay
>;

export type MealPlan = {
  id: string;
  household_id: string;
  week_start: string;
  plan: WeeklyPlan;
  is_ai_generated: boolean;
  created_at: string;
};

export type Subscription = {
  id: string;
  household_id: string;
  razorpay_subscription_id: string | null;
  plan: Plan;
  status: "active" | "paused" | "cancelled";
  current_period_end: string | null;
  amount: number | null;
  created_at: string;
};
