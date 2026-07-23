import { createClient } from "@/lib/supabase/server";
import type { CookReply, DailyBrief, FamilyMember, Household, HouseholdMember, MemoryRule, Staff } from "@/lib/types";
import { calculateAdherence, calculateStreak } from "@/lib/streak";
import { redirect } from "next/navigation";

// Fetches the signed-in user's household via household_members (owner or invited
// member), redirecting to /onboarding if they don't belong to one yet.
export async function requireHousehold(): Promise<{
  household: Household;
  userId: string;
  role: "owner" | "member";
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", membership.household_id)
    .maybeSingle();

  if (!household) redirect("/onboarding");

  return { household: household as Household, userId: user.id, role: membership.role as "owner" | "member" };
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });
  return (data as HouseholdMember[]) || [];
}

export async function getStaff(householdId: string): Promise<Staff[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data as Staff[]) || [];
}

export async function getFamilyMembers(householdId: string): Promise<FamilyMember[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("family_members")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });
  return (data as FamilyMember[]) || [];
}

export async function getMemoryRules(householdId: string, activeOnly = false): Promise<MemoryRule[]> {
  const supabase = createClient();
  let query = supabase
    .from("memory_rules")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data as MemoryRule[]) || [];
}

export async function getTodayBrief(householdId: string): Promise<DailyBrief | null> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_briefs")
    .select("*")
    .eq("household_id", householdId)
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DailyBrief) || null;
}

export async function getRecentBriefs(householdId: string, limit = 7): Promise<DailyBrief[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_briefs")
    .select("*")
    .eq("household_id", householdId)
    .order("date", { ascending: false })
    .limit(limit);
  return (data as DailyBrief[]) || [];
}

export async function getLatestMealPlan(householdId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("household_id", householdId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getLatestGroceryList(householdId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("grocery_lists")
    .select("*")
    .eq("household_id", householdId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getBriefStats(householdId: string, householdCreatedAt: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_briefs")
    .select("date")
    .eq("household_id", householdId)
    .eq("sent_to_whatsapp", true)
    .order("date", { ascending: false })
    .limit(90);

  const sentDates = (data || []).map((d) => d.date as string);
  const streak = calculateStreak(sentDates);

  const daysSinceCreated = Math.max(
    1,
    Math.ceil((Date.now() - new Date(householdCreatedAt).getTime()) / 86400000)
  );
  const windowDays = Math.min(30, daysSinceCreated);
  const adherence = calculateAdherence(sentDates, windowDays);

  return { streak, ...adherence };
}

export async function getPendingCookReplies(householdId: string): Promise<CookReply[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cook_replies")
    .select("*")
    .eq("household_id", householdId)
    .eq("added_to_memory", false)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data as CookReply[]) || [];
}

export function isTrialExpired(household: Household): boolean {
  if (household.plan !== "trial") return false;
  return new Date(household.trial_ends_at).getTime() < Date.now();
}
