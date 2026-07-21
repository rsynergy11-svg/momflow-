"use client";

import { useEffect, useState, useTransition } from "react";
import type { FamilyMember, Household, Staff } from "@/lib/types";
import {
  upsertFamilyMember,
  deleteFamilyMember,
  upsertStaffMember,
  deactivateStaffMember,
} from "@/app/actions/settings";

const LANGUAGES = [
  { value: "hindi", label: "Hindi" },
  { value: "marathi", label: "Marathi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "odia", label: "Odia" },
  { value: "tamil", label: "Tamil" },
  { value: "bengali", label: "Bengali" },
];

const PLAN_LABEL: Record<string, string> = {
  trial: "Free trial",
  essential: "Essential",
  premium: "Premium",
  elite: "Elite",
  ultra: "Ultra",
};

export default function SettingsClient({
  household,
  initialMembers,
  initialStaff,
}: {
  household: Household;
  initialMembers: FamilyMember[];
  initialStaff: Staff[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [staff, setStaff] = useState(initialStaff);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ dailyReminder: true, sendConfirmation: true });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("momflow_notif_prefs") : null;
    if (saved) setNotifPrefs(JSON.parse(saved));
  }, []);

  function toggleNotif(key: keyof typeof notifPrefs) {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    window.localStorage.setItem("momflow_notif_prefs", JSON.stringify(next));
  }

  function handleRemoveMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      await deleteFamilyMember(id);
    });
  }

  function handleDeactivateStaff(id: string) {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      await deactivateStaffMember(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Subscription */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
          Subscription
        </p>
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">{PLAN_LABEL[household.plan] || household.plan}</p>
            <p className="text-xs text-text-secondary">
              {household.plan === "trial"
                ? `Trial ends ${new Date(household.trial_ends_at).toLocaleDateString("en-IN")}`
                : "Active subscription"}
            </p>
          </div>
          <a href="/pricing" className="btn-primary px-4 py-2 text-sm">
            {household.plan === "trial" ? "Upgrade" : "Manage"}
          </a>
        </div>
      </section>

      {/* Family members */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
          Family members
        </p>
        <div className="space-y-2 mb-2">
          {members.map((m) => (
            <div key={m.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {m.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{m.name}</p>
                <p className="text-xs text-text-secondary capitalize truncate">
                  {[m.role, ...(m.dietary_restrictions || [])].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button onClick={() => handleRemoveMember(m.id)} className="text-error text-xs font-semibold">
                Remove
              </button>
            </div>
          ))}
        </div>
        {showMemberForm ? (
          <MemberForm
            householdId={household.id}
            onDone={(m) => {
              setMembers((prev) => [...prev, m]);
              setShowMemberForm(false);
            }}
            onCancel={() => setShowMemberForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowMemberForm(true)}
            className="w-full py-2.5 rounded-btn bg-accent/40 text-primary font-semibold text-sm"
          >
            + Add family member
          </button>
        )}
      </section>

      {/* Staff */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
          Staff
        </p>
        <div className="space-y-2 mb-2">
          {staff.map((s) => (
            <div key={s.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{s.name}</p>
                <p className="text-xs text-text-secondary capitalize">
                  {s.role} · {LANGUAGES.find((l) => l.value === s.language)?.label || s.language} · {s.whatsapp_number}
                </p>
              </div>
              <button onClick={() => handleDeactivateStaff(s.id)} className="text-error text-xs font-semibold">
                Remove
              </button>
            </div>
          ))}
        </div>
        {showStaffForm ? (
          <StaffForm
            householdId={household.id}
            onDone={(s) => {
              setStaff((prev) => [...prev, s]);
              setShowStaffForm(false);
            }}
            onCancel={() => setShowStaffForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowStaffForm(true)}
            className="w-full py-2.5 rounded-btn bg-accent/40 text-primary font-semibold text-sm"
          >
            + Add staff member
          </button>
        )}
      </section>

      {/* Notifications */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
          Notifications
        </p>
        <div className="card divide-y divide-muted">
          <ToggleRow
            label="Daily reminder to send brief"
            checked={notifPrefs.dailyReminder}
            onChange={() => toggleNotif("dailyReminder")}
          />
          <ToggleRow
            label="Confirm when WhatsApp brief is delivered"
            checked={notifPrefs.sendConfirmation}
            onChange={() => toggleNotif("sendConfirmation")}
          />
        </div>
      </section>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <p className="text-sm text-text-primary">{label}</p>
      <button
        onClick={onChange}
        className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function MemberForm({
  householdId,
  onDone,
  onCancel,
}: {
  householdId: string;
  onDone: (m: FamilyMember) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("other");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    await upsertFamilyMember(householdId, { name: name.trim(), role, dietary_restrictions: [] });
    onDone({
      id: `temp-${Date.now()}`,
      household_id: householdId,
      name: name.trim(),
      role,
      age: null,
      dietary_restrictions: [],
      meal_preferences: [],
      fasting_days: [],
      notes: null,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
  }

  return (
    <div className="card p-4 mb-2">
      <input
        className="w-full border border-muted rounded-btn px-3 py-2 mb-2 text-sm bg-surface"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="w-full border border-muted rounded-btn px-3 py-2 mb-3 text-sm bg-surface"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        {["mother", "father", "son", "daughter", "grandparent", "other"].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
        <button onClick={submit} disabled={saving} className="btn-primary flex-1 py-2 text-sm">Save</button>
      </div>
    </div>
  );
}

function StaffForm({
  householdId,
  onDone,
  onCancel,
}: {
  householdId: string;
  onDone: (s: Staff) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [language, setLanguage] = useState("hindi");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || !whatsapp.trim()) return;
    setSaving(true);
    await upsertStaffMember(householdId, { name: name.trim(), role: "cook", language, whatsapp_number: whatsapp.trim() });
    onDone({
      id: `temp-${Date.now()}`,
      household_id: householdId,
      name: name.trim(),
      role: "cook",
      language: language as Staff["language"],
      whatsapp_number: whatsapp.trim(),
      is_active: true,
      is_present_today: true,
      created_at: new Date().toISOString(),
    });
    setSaving(false);
  }

  return (
    <div className="card p-4 mb-2">
      <input
        className="w-full border border-muted rounded-btn px-3 py-2 mb-2 text-sm bg-surface"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full border border-muted rounded-btn px-3 py-2 mb-2 text-sm bg-surface"
        placeholder="WhatsApp number"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
      />
      <select
        className="w-full border border-muted rounded-btn px-3 py-2 mb-3 text-sm bg-surface"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
        <button onClick={submit} disabled={saving} className="btn-primary flex-1 py-2 text-sm">Save</button>
      </div>
    </div>
  );
}
