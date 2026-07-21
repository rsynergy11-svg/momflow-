"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMemoryRule(
  householdId: string,
  rule: { rule_text: string; applies_to: string; rule_type: string }
) {
  const supabase = createClient();
  const { error } = await supabase.from("memory_rules").insert({
    household_id: householdId,
    rule_text: rule.rule_text,
    applies_to: rule.applies_to || "all",
    rule_type: rule.rule_type || "preference",
  });
  if (error) throw error;
  revalidatePath("/memory");
  revalidatePath("/dashboard");
}

export async function toggleMemoryRule(ruleId: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("memory_rules").update({ is_active: isActive }).eq("id", ruleId);
  if (error) throw error;
  revalidatePath("/memory");
  revalidatePath("/dashboard");
}

export async function deleteMemoryRule(ruleId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("memory_rules").delete().eq("id", ruleId);
  if (error) throw error;
  revalidatePath("/memory");
}
