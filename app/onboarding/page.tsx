"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import {
  createHousehold,
  addFamilyMember,
  addStaffMember,
  addMemoryRuleAction,
  finishOnboarding,
} from "@/app/actions/onboarding";

const TOTAL_STEPS = 5;
const DIET_OPTIONS = ["No onion", "No garlic", "Lactose-free", "Diabetic", "Jain", "Vegan", "No spicy"];
const LANGUAGES = [
  { value: "hindi", label: "Hindi" },
  { value: "marathi", label: "Marathi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "odia", label: "Odia" },
  { value: "tamil", label: "Tamil" },
  { value: "bengali", label: "Bengali" },
];
const ROLES = ["mother", "father", "son", "daughter", "grandparent", "other"];

type DraftMember = { name: string; role: string; age: string; dietary_restrictions: string[] };
type DraftRule = { rule_text: string; applies_to: string; rule_type: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [householdName, setHouseholdName] = useState("");
  const [city, setCity] = useState("");
  const [householdId, setHouseholdId] = useState<string | null>(null);

  // Step 2
  const [members, setMembers] = useState<DraftMember[]>([
    { name: "", role: "mother", age: "", dietary_restrictions: [] },
  ]);

  // Step 3
  const [cookName, setCookName] = useState("");
  const [cookWhatsapp, setCookWhatsapp] = useState("");
  const [cookLanguage, setCookLanguage] = useState("hindi");

  // Step 4
  const [rules, setRules] = useState<DraftRule[]>([
    { rule_text: "", applies_to: "all", rule_type: "dietary" },
    { rule_text: "", applies_to: "all", rule_type: "dietary" },
    { rule_text: "", applies_to: "all", rule_type: "staff_instruction" },
  ]);

  async function handleStep1() {
    if (!householdName.trim()) return setError("Please enter your household name.");
    setSaving(true);
    setError("");
    try {
      const id = await createHousehold(householdName.trim(), city.trim());
      setHouseholdId(id);
      setStep(2);
    } catch (e) {
      setError("Couldn't save your household. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStep2(skip = false) {
    if (!householdId) return;
    setSaving(true);
    setError("");
    try {
      if (!skip) {
        const valid = members.filter((m) => m.name.trim());
        for (const m of valid) {
          await addFamilyMember(householdId, {
            name: m.name.trim(),
            role: m.role,
            age: m.age ? Number(m.age) : null,
            dietary_restrictions: m.dietary_restrictions,
          });
        }
      }
      setStep(3);
    } catch {
      setError("Couldn't save family members. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStep3(skip = false) {
    if (!householdId) return;
    setSaving(true);
    setError("");
    try {
      if (!skip && cookName.trim() && cookWhatsapp.trim()) {
        await addStaffMember(householdId, {
          name: cookName.trim(),
          whatsapp_number: cookWhatsapp.trim(),
          language: cookLanguage,
        });
      }
      setStep(4);
    } catch {
      setError("Couldn't save your cook's details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStep4(skip = false) {
    if (!householdId) return;
    setSaving(true);
    setError("");
    try {
      if (!skip) {
        const valid = rules.filter((r) => r.rule_text.trim());
        for (const r of valid) {
          await addMemoryRuleAction(householdId, r);
        }
      }
      await finishOnboarding();
      setStep(5);
    } catch {
      setError("Couldn't save your rules. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateMember(i: number, patch: Partial<DraftMember>) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function toggleDiet(i: number, diet: string) {
    setMembers((prev) =>
      prev.map((m, idx) => {
        if (idx !== i) return m;
        const has = m.dietary_restrictions.includes(diet);
        return {
          ...m,
          dietary_restrictions: has
            ? m.dietary_restrictions.filter((d) => d !== diet)
            : [...m.dietary_restrictions, diet],
        };
      })
    );
  }

  function updateRule(i: number, patch: Partial<DraftRule>) {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <StepIndicator step={step} total={TOTAL_STEPS} />
          <p className="text-text-secondary text-xs mt-2">Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}</p>
        </div>

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-btn px-4 py-3 mb-4">{error}</div>
        )}

        {step === 1 && (
          <section className="card p-6">
            <h1 className="text-xl font-semibold mb-1">Let&apos;s set up your household</h1>
            <p className="text-text-secondary text-sm mb-6">This takes about 5 minutes, and you can change everything later.</p>
            <label className="block text-sm font-medium mb-1.5">Household name</label>
            <input
              className="w-full border border-muted rounded-btn px-4 py-3 mb-4 bg-surface"
              placeholder="e.g. The Sharma Home"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
            />
            <label className="block text-sm font-medium mb-1.5">City</label>
            <input
              className="w-full border border-muted rounded-btn px-4 py-3 mb-6 bg-surface"
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button onClick={handleStep1} disabled={saving} className="btn-primary w-full py-3.5">
              {saving ? "Saving…" : "Continue"}
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="card p-6">
            <h1 className="text-xl font-semibold mb-1">Who&apos;s in the family?</h1>
            <p className="text-text-secondary text-sm mb-6">Add dietary rules for each person.</p>

            {members.map((m, i) => (
              <div key={i} className="border border-muted rounded-btn p-4 mb-3">
                <input
                  className="w-full border border-muted rounded-btn px-3 py-2 mb-2 bg-surface text-sm"
                  placeholder="Name"
                  value={m.name}
                  onChange={(e) => updateMember(i, { name: e.target.value })}
                />
                <div className="flex gap-2 mb-2">
                  <select
                    className="flex-1 border border-muted rounded-btn px-3 py-2 bg-surface text-sm"
                    value={m.role}
                    onChange={(e) => updateMember(i, { role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    className="w-20 border border-muted rounded-btn px-3 py-2 bg-surface text-sm"
                    placeholder="Age"
                    value={m.age}
                    onChange={(e) => updateMember(i, { age: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DIET_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiet(i, d)}
                      className={`chip border text-xs ${
                        m.dietary_restrictions.includes(d)
                          ? "bg-primary text-background border-primary"
                          : "bg-surface text-text-secondary border-muted"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setMembers((p) => [...p, { name: "", role: "other", age: "", dietary_restrictions: [] }])
              }
              className="text-primary text-sm font-medium mb-6"
            >
              + Add another family member
            </button>

            <div className="flex gap-3">
              <button onClick={() => handleStep2(true)} disabled={saving} className="btn-secondary flex-1 py-3.5">
                Skip
              </button>
              <button onClick={() => handleStep2(false)} disabled={saving} className="btn-primary flex-1 py-3.5">
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="card p-6">
            <h1 className="text-xl font-semibold mb-1">Add your cook</h1>
            <p className="text-text-secondary text-sm mb-6">They&apos;ll receive daily briefs on WhatsApp, in their language.</p>
            <label className="block text-sm font-medium mb-1.5">Cook&apos;s name</label>
            <input
              className="w-full border border-muted rounded-btn px-4 py-3 mb-4 bg-surface"
              placeholder="e.g. Sunita"
              value={cookName}
              onChange={(e) => setCookName(e.target.value)}
            />
            <label className="block text-sm font-medium mb-1.5">WhatsApp number</label>
            <input
              className="w-full border border-muted rounded-btn px-4 py-3 mb-4 bg-surface"
              placeholder="e.g. 98765 43210"
              value={cookWhatsapp}
              onChange={(e) => setCookWhatsapp(e.target.value)}
            />
            <label className="block text-sm font-medium mb-1.5">Preferred language</label>
            <select
              className="w-full border border-muted rounded-btn px-4 py-3 mb-6 bg-surface"
              value={cookLanguage}
              onChange={(e) => setCookLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => handleStep3(true)} disabled={saving} className="btn-secondary flex-1 py-3.5">
                Skip
              </button>
              <button onClick={() => handleStep3(false)} disabled={saving} className="btn-primary flex-1 py-3.5">
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="card p-6">
            <h1 className="text-xl font-semibold mb-1">A few rules to remember</h1>
            <p className="text-text-secondary text-sm mb-6">
              e.g. &ldquo;Papa no rice at night&rdquo;, &ldquo;No onion for kids&rdquo;
            </p>
            {rules.map((r, i) => (
              <input
                key={i}
                className="w-full border border-muted rounded-btn px-4 py-3 mb-3 bg-surface text-sm"
                placeholder={`Rule ${i + 1}`}
                value={r.rule_text}
                onChange={(e) => updateRule(i, { rule_text: e.target.value })}
              />
            ))}
            <div className="flex gap-3 mt-3">
              <button onClick={() => handleStep4(true)} disabled={saving} className="btn-secondary flex-1 py-3.5">
                Skip
              </button>
              <button onClick={() => handleStep4(false)} disabled={saving} className="btn-primary flex-1 py-3.5">
                {saving ? "Saving…" : "Finish setup"}
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="card p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center text-2xl">
              ✓
            </div>
            <h1 className="text-xl font-semibold mb-2">You&apos;re all set!</h1>
            <p className="text-text-secondary text-sm mb-6">
              MomFlow now knows your family&apos;s rules. Ready to send your cook their first brief?
            </p>
            <button
              onClick={() => router.push("/brief-preview")}
              className="btn-primary w-full py-3.5 mb-3"
            >
              Send your first brief
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-secondary w-full py-3.5"
            >
              Go to dashboard
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
