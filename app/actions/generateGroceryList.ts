"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { getClaude, CLAUDE_MODEL } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import type { GroceryItem, WeeklyPlan } from "@/lib/types";
import { revalidatePath } from "next/cache";

const SYSTEM_PROMPT = `You are MomFlow's grocery planning engine for Indian households. Given a
week of planned breakfast/lunch/dinner dishes, work out a consolidated shopping list — combine
duplicate ingredients across dishes into one line with a realistic total quantity for an Indian
household of the given size.

Return ONLY valid JSON, no prose, no markdown fences. Shape must be exactly:
{
  "items": [ { "name": "...", "quantity": "...", "category": "..." } ],
  "estimated_cost": 1850
}
"category" must be one of: Vegetables, Fruits, Dairy, Grains & Atta, Pulses & Lentils, Spices & Masalas,
Oil & Ghee, Other. "quantity" should be realistic and short (e.g. "1 kg", "2 bunches", "500 g").
"estimated_cost" is a rough total in Indian rupees (integer, no currency symbol) for a mid-range
Indian city grocery run.`;

function buildPrompt(plan: WeeklyPlan, familySize: number) {
  const dishLines: string[] = [];
  (Object.keys(plan) as (keyof WeeklyPlan)[]).forEach((day) => {
    (["breakfast", "lunch", "dinner"] as const).forEach((slot) => {
      const meal = plan[day]?.[slot];
      if (meal?.name) dishLines.push(`${day} ${slot}: ${meal.name}${meal.notes ? ` (${meal.notes})` : ""}`);
    });
  });

  return `Household size: roughly ${familySize} people.

This week's planned dishes:
${dishLines.join("\n")}

Build the consolidated grocery list now as JSON.`;
}

export async function generateGroceryList(householdId: string) {
  const supabase = createClient();

  const [{ data: mealPlan }, { data: members }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("*")
      .eq("household_id", householdId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("family_members").select("id").eq("household_id", householdId),
  ]);

  if (!mealPlan) {
    throw new Error("Generate a weekly meal plan first (in Meals → Week), then build the grocery list.");
  }

  const familySize = Math.max((members?.length || 0) + 1, 2); // +1 for the person planning
  const userPrompt = buildPrompt(mealPlan.plan as WeeklyPlan, familySize);

  const anthropic = getClaude();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(cleaned) as { items: GroceryItem[]; estimated_cost: number };

  const { data: existing } = await supabase
    .from("grocery_lists")
    .select("id")
    .eq("household_id", householdId)
    .eq("week_start", mealPlan.week_start)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("grocery_lists")
      .update({ items: parsed.items, estimated_cost: parsed.estimated_cost })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("grocery_lists").insert({
      household_id: householdId,
      week_start: mealPlan.week_start,
      items: parsed.items,
      estimated_cost: parsed.estimated_cost,
      is_ai_generated: true,
    });
    if (error) throw error;
  }

  revalidatePath("/grocery");
  return { weekStart: mealPlan.week_start, items: parsed.items, estimatedCost: parsed.estimated_cost };
}
