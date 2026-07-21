"use client";

import { useState, useTransition } from "react";
import type { MemoryRule } from "@/lib/types";
import { addMemoryRule, toggleMemoryRule } from "@/app/actions/memory";

const GROUP_ORDER: MemoryRule["rule_type"][] = [
  "dietary",
  "allergy",
  "timing",
  "staff_instruction",
  "preference",
];

const GROUP_LABEL: Record<string, string> = {
  dietary: "Dietary",
  allergy: "Allergy",
  timing: "Timing",
  staff_instruction: "Staff instruction",
  preference: "Preference",
};

const GROUP_DOT: Record<string, string> = {
  dietary: "bg-success",
  allergy: "bg-error",
  timing: "bg-warning",
  staff_instruction: "bg-secondary",
  preference: "bg-accent",
};

export default function MemoryRulesClient({
  householdId,
  initialRules,
}: {
  householdId: string;
  initialRules: MemoryRule[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [ruleText, setRuleText] = useState("");
  const [appliesTo, setAppliesTo] = useState("all");
  const [ruleType, setRuleType] = useState("dietary");
  const [pending, startTransition] = useTransition();

  function grouped() {
    const map: Record<string, MemoryRule[]> = {};
    for (const r of rules) {
      const key = r.rule_type || "preference";
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }

  function handleAdd() {
    if (!ruleText.trim()) return;
    const optimistic: MemoryRule = {
      id: `temp-${Date.now()}`,
      household_id: householdId,
      rule_text: ruleText.trim(),
      applies_to: appliesTo || "all",
      rule_type: ruleType as MemoryRule["rule_type"],
      times_applied: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setRules((prev) => [optimistic, ...prev]);
    setRuleText("");
    setShowForm(false);
    startTransition(async () => {
      await addMemoryRule(householdId, { rule_text: optimistic.rule_text, applies_to: appliesTo, rule_type: ruleType });
    });
  }

  function handleToggle(rule: MemoryRule) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
    startTransition(async () => {
      await toggleMemoryRule(rule.id, !rule.is_active);
    });
  }

  const g = grouped();

  return (
    <div>
      {GROUP_ORDER.filter((t) => g[t]?.length).map((type) => (
        <div key={type} className="mb-5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
            {GROUP_LABEL[type]}
          </h3>
          <div className="space-y-2">
            {g[type].map((rule) => (
              <div key={rule.id} className="card p-4 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${GROUP_DOT[type]}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${rule.is_active ? "text-text-primary" : "text-text-secondary line-through"}`}>
                    {rule.rule_text}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {rule.applies_to === "all" ? "Everyone" : rule.applies_to} · Applied {rule.times_applied}×
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(rule)}
                  className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors ${
                    rule.is_active ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      rule.is_active ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!rules.length && (
        <div className="card p-6 text-center text-text-secondary text-sm mb-4">
          No rules yet. Add the first one your cook needs to know.
        </div>
      )}

      {showForm ? (
        <div className="card p-4 mb-4">
          <textarea
            className="w-full border border-muted rounded-btn px-3 py-2 mb-2 text-sm bg-surface"
            placeholder='e.g. "Papa no rice at night"'
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2 mb-3">
            <select
              className="flex-1 border border-muted rounded-btn px-3 py-2 text-sm bg-surface"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
            >
              {GROUP_ORDER.map((t) => (
                <option key={t} value={t}>{GROUP_LABEL[t]}</option>
              ))}
            </select>
            <input
              className="flex-1 border border-muted rounded-btn px-3 py-2 text-sm bg-surface"
              placeholder="Applies to (or 'all')"
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={pending} className="btn-primary flex-1 py-2.5 text-sm">
              Save rule
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-btn bg-accent/40 text-primary font-semibold text-sm mb-4"
        >
          + Add rule
        </button>
      )}
    </div>
  );
}
