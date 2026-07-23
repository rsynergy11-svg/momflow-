"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { getClaude, CLAUDE_MODEL } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import type { FamilyMember, MemoryRule, WeeklyPlan } from "@/lib/types";
import { saveWeeklyMealPlan } from "@/app/actions/meals";
import { formatWeekFestivalContextForPrompt } from "@/lib/festivals";

const SYSTEM_PROMPT = `You are MomFlow's meal planning engine for Indian households. You know 
regional Indian cuisine deeply, including fasting rules (Navratri, Ekadashi, weekly fasts), 
diabetic-friendly substitutions, and how to balance variety across a week without repeating 
dishes back-to-back. You always respect every dietary rule given to you — no exceptions.

Return ONLY valid JSON, no prose, no markdown code fences. The shape must be exactly:
{
  "monday": { "breakfast": {"name": "...", "notes": "..."}, "lunch": {...}, "dinner": {...} },
  "tuesday": { ... }, "wednesday": { ... }, "thursday": { ... }, "friday": { ... },
  "saturday": { ... }, "sunday": { ... }
}
"notes" should be short (under 12 words) — e.g. who it's for, or a rule being followed.`;

function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 1 ? 0 : (8 - day) % 7 || 7;
  const monday = day === 1 ? d : new Date(d.getTime() + diff * 86400000);
  return monday.toISOString().slice(0, 10);
}

export async function generateWeeklyMealPlan(householdId: string, specialModes: string[]) {
  const supabase = createClient();
  const [{ data: rules }, { data: members }] = await Promise.all([
    supabase.from("memory_rules").select("*").eq("household_id", householdId).eq("is_active", true),
    supabase.from("family_members").select("*").eq("household_id", householdId),
  ]);

  const rulesText = ((rules as MemoryRule[]) || []).map((r) => `- ${r.rule_text}`).join("\n") || "None";
  const membersText =
    ((members as FamilyMember[]) || [])
      .map((m) => `- ${m.name}: ${[m.role, ...(m.dietary_restrictions || [])].filter(Boolean).join(", ")}`)
      .join("\n") || "Not specified";

  const modesText = specialModes.length
    ? `Special modes active this week: ${specialModes.join(", ")}.`
    : "No special modes active this week.";

  const weekStart = nextMonday();
  const festivalText = formatWeekFestivalContextForPrompt(weekStart);

  const userPrompt = `Plan a full week of breakfast, lunch, and dinner for this household.
The week starts Monday ${weekStart}.

Family members and their needs:
${membersText}

Rules to always follow:
${rulesText}

${modesText}

Festival/fasting calendar for this specific week (auto-detected — adjust affected days'
meals automatically, e.g. sabudana/kuttu on fasting days, no onion-garlic during Shravan):
${festivalText}

Return the JSON plan now.`;

  const anthropic = getClaude();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const plan = JSON.parse(cleaned) as WeeklyPlan;

  await saveWeeklyMealPlan(householdId, weekStart, plan);

  return { weekStart, plan };
}
