"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { getClaude, CLAUDE_MODEL } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import type { FamilyMember, MemoryRule, Staff } from "@/lib/types";
import { formatFestivalContextForPrompt } from "@/lib/festivals";
import { formatFamilyMembers, formatMemoryRules } from "@/lib/briefPrompts";

const SYSTEM_PROMPT = `You are MomFlow's kitchen intelligence engine. Today the household's regular
cook is on leave. Generate a simple backup meal plan the family members themselves can cook —
NOT instructions for a domestic cook. Assume the person cooking may not be an experienced cook.

Always include:
1. A short, reassuring opening line (e.g. "No worries, here's an easy day")
2. Breakfast — something quick, minimal steps
3. Lunch — simple, ideally one-pot or few ingredients
4. Dinner — simple, ideally reusing lunch ingredients to save a grocery run
5. Respect every dietary rule given — no exceptions
6. Keep total under 180 words, in clear, encouraging English. No jargon, short steps.`;

function buildPrompt(opts: {
  date: string;
  memoryRules: MemoryRule[];
  familyMembers: FamilyMember[];
  festivalContext: string;
  cookName: string;
}) {
  return `Our cook, ${opts.cookName}, is on leave today (${opts.date}). Generate a simple backup
day of meals the family can cook themselves.

Today's festival/fasting calendar (apply automatically if relevant):
${opts.festivalContext}

Family dietary rules to always follow:
${formatMemoryRules(opts.memoryRules)}

Family members:
${formatFamilyMembers(opts.familyMembers)}

Generate the backup plan now, in English, warm and encouraging.`;
}

export async function generateLeaveDayPlan(householdId: string, staffId?: string) {
  const supabase = createClient();

  const [{ data: rules }, { data: members }, staffRes] = await Promise.all([
    supabase.from("memory_rules").select("*").eq("household_id", householdId).eq("is_active", true),
    supabase.from("family_members").select("*").eq("household_id", householdId),
    staffId
      ? supabase.from("staff").select("*").eq("id", staffId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const staff = staffRes.data as Staff | null;
  const today = new Date().toISOString().slice(0, 10);
  const festivalContext = formatFestivalContextForPrompt(new Date());

  const userPrompt = buildPrompt({
    date: today,
    memoryRules: (rules as MemoryRule[]) || [],
    familyMembers: (members as FamilyMember[]) || [],
    festivalContext,
    cookName: staff?.name || "your cook",
  });

  const anthropic = getClaude();
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { text };
}
