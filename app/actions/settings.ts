"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Family members ──
export async function upsertFamilyMember(
  householdId: string,
  member: {
    id?: string;
    name: string;
    role: string;
    age?: number | null;
    dietary_restrictions: string[];
  }
) {
  const supabase = createClient();
  if (member.id) {
    const { error } = await supabase
      .from("family_members")
      .update({
        name: member.name,
        role: member.role,
        age: member.age ?? null,
        dietary_restrictions: member.dietary_restrictions,
      })
      .eq("id", member.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("family_members").insert({
      household_id: householdId,
      name: member.name,
      role: member.role,
      age: member.age ?? null,
      dietary_restrictions: member.dietary_restrictions,
    });
    if (error) throw error;
  }
  revalidatePath("/settings");
}

export async function deleteFamilyMember(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
}

// ── Staff ──
export async function upsertStaffMember(
  householdId: string,
  staffMember: {
    id?: string;
    name: string;
    role: string;
    language: string;
    whatsapp_number: string;
  }
) {
  const supabase = createClient();
  if (staffMember.id) {
    const { error } = await supabase
      .from("staff")
      .update({
        name: staffMember.name,
        role: staffMember.role,
        language: staffMember.language,
        whatsapp_number: staffMember.whatsapp_number,
      })
      .eq("id", staffMember.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("staff").insert({
      household_id: householdId,
      name: staffMember.name,
      role: staffMember.role,
      language: staffMember.language,
      whatsapp_number: staffMember.whatsapp_number,
    });
    if (error) throw error;
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function deactivateStaffMember(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("staff").update({ is_active: false }).eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateHouseholdLanguagePreference(householdId: string, staffId: string, language: string) {
  const supabase = createClient();
  const { error } = await supabase.from("staff").update({ language }).eq("id", staffId).eq("household_id", householdId);
  if (error) throw error;
  revalidatePath("/settings");
}

// ── Household access (multi-user) ──
export async function inviteHouseholdMember(householdId: string, email: string) {
  const supabase = createClient();
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) throw new Error("Enter a valid email address.");

  const { data: existing } = await supabase
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("invited_email", normalized)
    .maybeSingle();
  if (existing) return; // already invited or active — nothing to do

  const { error } = await supabase.from("household_members").insert({
    household_id: householdId,
    invited_email: normalized,
    role: "member",
    status: "invited",
  });
  if (error) throw error;
  revalidatePath("/settings");
}

export async function removeHouseholdMember(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("household_members").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
}
