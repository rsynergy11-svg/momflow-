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

// Promotes a cook's WhatsApp reply into a permanent memory rule — this is what lets
// the vault update itself from real usage instead of only manual edits in Settings.
export async function addCookReplyToMemory(
  replyId: string,
  householdId: string,
  rule: { rule_text: string; applies_to: string; rule_type: string }
) {
  const supabase = createClient();
  const { error: insertError } = await supabase.from("memory_rules").insert({
    household_id: householdId,
    rule_text: rule.rule_text,
    applies_to: rule.applies_to || "all",
    rule_type: rule.rule_type || "preference",
  });
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("cook_replies")
    .update({ added_to_memory: true })
    .eq("id", replyId);
  if (updateError) throw updateError;

  revalidatePath("/memory");
  revalidatePath("/dashboard");
  revalidatePath("/brief-preview");
}

// Dismisses a reply without adding it to memory (e.g. it was just "ok thanks").
export async function dismissCookReply(replyId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cook_replies").update({ added_to_memory: true }).eq("id", replyId);
  if (error) throw error;
  revalidatePath("/brief-preview");
}
