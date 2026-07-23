import type { FamilyMember, MemoryRule } from "@/lib/types";

// Shared prompt-formatting helpers used by both the regular cook brief and the
// leave-day family backup plan. Kept out of any "use server" file because
// server action files require every export to be an async function.

export function formatMemoryRules(rules: MemoryRule[]): string {
  if (!rules.length) return "None specified.";
  return rules.map((r) => `- ${r.rule_text} (applies to: ${r.applies_to})`).join("\n");
}

export function formatFamilyMembers(members: FamilyMember[]): string {
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
