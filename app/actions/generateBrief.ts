"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { getClaude, CLAUDE_MODEL } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import type { FamilyMember, MealsForDay, MemoryRule, Staff } from "@/lib/types";
import { revalidatePath } from "next/cache";

const SYSTEM_PROMPT = `You are MomFlow's kitchen intelligence engine. You generate daily cook 
briefs for Indian households. You know Indian cuisine deeply — regional 
variations, fasting rules, diabetic-friendly substitutions, and how to 
communicate with domestic cooks clearly.

Generate the brief in the requested language. Be warm, clear, and 
specific. Use natural spoken language — not formal. The cook should feel 
like they received personal instructions from the lady of the house.

Always include:
1. A warm greeting with the cook's name
2. Breakfast instructions with timing
3. Lunch instructions with any special notes
4. Dinner instructions
5. Any special reminders from the memory rules
6. A closing line

Keep it under 200 words. Natural language, not bullet points.`;

const LANGUAGE_LABEL: Record<string, string> = {
  hindi: "Hindi",
  marathi: "Marathi",
  gujarati: "Gujarati",
  odia: "Odia",
  tamil: "Tamil",
  bengali: "Bengali",
  english: "English",
};

function formatMemoryRules(rules: MemoryRule[]): string {
  if (!rules.length) return "None specified.";
  return rules.map((r) => `- ${r.rule_text} (applies to: ${r.applies_to})`).join("\n");
}

function formatFamilyMembers(members: FamilyMember[]): string {
  if (!members.length) return "Not specified.";
  return members
    .map((m) => {
      const bits = [m.role, m.age ? `${m.age} yrs` : null, ...(m.dietary_restrictions || [])].filter(
        Boolean
      );
      return `- ${m.name}${bits.length ? ` (${bits.join(", ")})` : ""}`;
    })
    .join("\n");
}

function buildUserPrompt(opts: {
  staffName: string;
  language: string;
  date: string;
  specialContext: string;
  meals: MealsForDay;
  memoryRules: MemoryRule[];
  familyMembers: FamilyMember[];
}) {
  const langLabel = LANGUAGE_LABEL[opts.language] || opts.language;
  return `Generate today's cook brief for our household.

Cook's name: ${opts.staffName}
Language: ${langLabel}
Today's date: ${opts.date}
Any special context today: ${opts.specialContext || "None"}

Today's planned meals:
- Breakfast: ${opts.meals.breakfast?.name || "Not set"}${opts.meals.breakfast?.notes ? ` (${opts.meals.breakfast.notes})` : ""}
- Lunch: ${opts.meals.lunch?.name || "Not set"}${opts.meals.lunch?.notes ? ` (${opts.meals.lunch.notes})` : ""}
- Dinner: ${opts.meals.dinner?.name || "Not set"}${opts.meals.dinner?.notes ? ` (${opts.meals.dinner.notes})` : ""}

Family dietary rules to always follow:
${formatMemoryRules(opts.memoryRules)}

Family members:
${formatFamilyMembers(opts.familyMembers)}

Generate the brief in ${langLabel}. Make it warm and natural.`;
}

export async function generateBrief(opts: {
  householdId: string;
  staffId: string;
  specialContext?: string;
}) {
  const supabase = createClient();

  const [{ data: staff }, { data: rules }, { data: members }] = await Promise.all([
    supabase.from("staff").select("*").eq("id", opts.staffId).single(),
    supabase
      .from("memory_rules")
      .select("*")
      .eq("household_id", opts.householdId)
      .eq("is_active", true),
    supabase.from("family_members").select("*").eq("household_id", opts.householdId),
  ]);

  if (!staff) throw new Error("Cook not found");

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayBrief } = await supabase
    .from("daily_briefs")
    .select("*")
    .eq("household_id", opts.householdId)
    .eq("date", today)
    .maybeSingle();

  const meals: MealsForDay = todayBrief?.meals || {};
  const language: string = (staff as Staff).language || "hindi";

  const userPrompt = buildUserPrompt({
    staffName: (staff as Staff).name,
    language,
    date: today,
    specialContext: opts.specialContext || "",
    meals,
    memoryRules: (rules as MemoryRule[]) || [],
    familyMembers: (members as FamilyMember[]) || [],
  });

  const anthropic = getClaude();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const briefText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  // Also generate an English version for the toggle in /brief-preview, unless already English.
  let englishText = briefText;
  if (language !== "english") {
    const englishPrompt = buildUserPrompt({
      staffName: (staff as Staff).name,
      language: "english",
      date: today,
      specialContext: opts.specialContext || "",
      meals,
      memoryRules: (rules as MemoryRule[]) || [],
      familyMembers: (members as FamilyMember[]) || [],
    });
    const englishMessage = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: englishPrompt }],
    });
    englishText = englishMessage.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
  }

  const briefRow = {
    household_id: opts.householdId,
    date: today,
    meals,
    special_context: opts.specialContext || null,
    brief_hindi: briefText,
    brief_english: englishText,
    language_sent: language,
    staff_id: opts.staffId,
  };

  let briefId: string;
  if (todayBrief) {
    const { error } = await supabase.from("daily_briefs").update(briefRow).eq("id", todayBrief.id);
    if (error) throw error;
    briefId = todayBrief.id;
  } else {
    const { data, error } = await supabase
      .from("daily_briefs")
      .insert(briefRow)
      .select("id")
      .single();
    if (error) throw error;
    briefId = data.id;
  }

  // Bump times_applied for every active rule that was used to generate this brief.
  if (rules?.length) {
    await Promise.all(
      (rules as MemoryRule[]).map((r) =>
        supabase
          .from("memory_rules")
          .update({ times_applied: (r.times_applied || 0) + 1 })
          .eq("id", r.id)
      )
    );
  }

  revalidatePath("/brief-preview");
  revalidatePath("/dashboard");
  revalidatePath("/memory");

  return { briefId, briefText, englishText, language };
}

export async function updateBriefText(briefId: string, field: "brief_hindi" | "brief_english", text: string) {
  const supabase = createClient();
  const { error } = await supabase.from("daily_briefs").update({ [field]: text }).eq("id", briefId);
  if (error) throw error;
  revalidatePath("/brief-preview");
}
