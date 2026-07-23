"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createHousehold(name: string, city: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Reuse an existing household for this owner if one already exists (idempotent onboarding).
  const { data: existing } = await supabase
    .from("households")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("households").update({ name, city }).eq("id", existing.id);
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("households")
    .insert({ name, city, owner_id: user.id })
    .select("id")
    .single();

  if (error) throw error;

  // The owner is always an active household_members row too — every other table's
  // RLS now checks membership rather than owner_id directly.
  await supabase.from("household_members").insert({
    household_id: data.id,
    user_id: user.id,
    invited_email: user.email,
    role: "owner",
    status: "active",
  });

  return data.id as string;
}

export async function addFamilyMember(
  householdId: string,
  member: {
    name: string;
    role: string;
    age?: number | null;
    dietary_restrictions: string[];
    notes?: string;
  }
) {
  const supabase = createClient();
  const { error } = await supabase.from("family_members").insert({
    household_id: householdId,
    name: member.name,
    role: member.role,
    age: member.age ?? null,
    dietary_restrictions: member.dietary_restrictions,
    notes: member.notes ?? null,
  });
  if (error) throw error;
}

export async function addStaffMember(
  householdId: string,
  staffMember: { name: string; whatsapp_number: string; language: string; role?: string }
) {
  const supabase = createClient();
  const { error } = await supabase.from("staff").insert({
    household_id: householdId,
    name: staffMember.name,
    whatsapp_number: staffMember.whatsapp_number,
    language: staffMember.language,
    role: staffMember.role ?? "cook",
  });
  if (error) throw error;
}

export async function addMemoryRuleAction(
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
}

export async function finishOnboarding() {
  revalidatePath("/dashboard");
}
