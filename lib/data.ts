import { createClient } from "@/lib/supabase/server";
import type { DailyBrief, FamilyMember, Household, MemoryRule, Staff } from "@/lib/types";
import { redirect } from "next/navigation";

// Fetches the signed-in user's household, redirecting to /onboarding if none exists yet.
export async function requireHousehold(): Promise<{ household: Household; userId: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!household) redirect("/onboarding");

  return { household: household as Household, userId: user.id };
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

export function isTrialExpired(household: Household): boolean {
  if (household.plan !== "trial") return false;
  return new Date(household.trial_ends_at).getTime() < Date.now();
}
