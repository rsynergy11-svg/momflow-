"use server";

import { createClient } from "@/lib/supabase/server";
import type { MealsForDay } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function upsertTodayMeals(householdId: string, meals: MealsForDay) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("daily_briefs")
    .select("id")
    .eq("household_id", householdId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("daily_briefs").update({ meals }).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("daily_briefs")
      .insert({ household_id: householdId, date: today, meals });
    if (error) throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals");
}

export async function toggleStaffPresence(staffId: string, isPresent: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("staff")
    .update({ is_present_today: isPresent })
    .eq("id", staffId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function saveWeeklyMealPlan(
  householdId: string,
  weekStart: string,
  plan: Record<string, MealsForDay>
) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("household_id", householdId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("meal_plans").update({ plan }).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("meal_plans")
      .insert({ household_id: householdId, week_start: weekStart, plan, is_ai_generated: true });
    if (error) throw error;
  }

  revalidatePath("/meals");
}
