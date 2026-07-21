"use client";

import { useState, useTransition } from "react";
import type { DailyBrief, Staff } from "@/lib/types";
import { generateBrief, updateBriefText } from "@/app/actions/generateBrief";
import { sendBriefToWhatsApp } from "@/app/actions/sendWhatsApp";

const LANGUAGE_LABEL: Record<string, string> = {
  hindi: "Hindi",
  marathi: "Marathi",
  gujarati: "Gujarati",
  odia: "Odia",
  tamil: "Tamil",
  bengali: "Bengali",
};

export default function BriefPreviewClient({
  household,
  staffList,
  initialStaffId,
  initialBrief,
  history,
}: {
  household: { id: string };
  staffList: Staff[];
  initialStaffId: string;
  initialBrief: DailyBrief | null;
  history: DailyBrief[];
}) {
  const [staffId, setStaffId] = useState(initialStaffId);
  const [specialContext, setSpecialContext] = useState("");
  const [brief, setBrief] = useState<DailyBrief | null>(initialBrief);
  const [showEnglish, setShowEnglish] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [generating, startGenerate] = useTransition();
  const [sending, startSend] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const staff = staffList.find((s) => s.id === staffId);
  const activeText = brief ? (showEnglish ? brief.brief_english : brief.brief_hindi) : "";

  function handleGenerate() {
    if (!staffId) return;
    setStatus(null);
    startGenerate(async () => {
      try {
        const result = await generateBrief({ householdId: household.id, staffId, specialContext });
        setBrief((prev) => ({
          id: result.briefId,
          household_id: household.id,
          date: new Date().toISOString().slice(0, 10),
          meals: prev?.meals || null,
          special_context: specialContext,
          brief_hindi: result.briefText,
          brief_english: result.englishText,
          language_sent: result.language,
          sent_to_whatsapp: false,
          sent_at: null,
          staff_id: staffId,
          created_at: new Date().toISOString(),
        }));
        setShowEnglish(false);
      } catch (e) {
        setStatus({ type: "error", text: "Couldn't generate the brief. Please try again." });
      }
    });
  }

  function handleSaveEdit() {
    if (!brief) return;
    const field = showEnglish ? "brief_english" : "brief_hindi";
    setBrief({ ...brief, [field]: draftText });
    setEditing(false);
    startSend(async () => {
      await updateBriefText(brief.id, field, draftText);
    });
  }

  function handleSend() {
    if (!brief) return;
    setStatus(null);
    startSend(async () => {
      const result = await sendBriefToWhatsApp(brief.id);
      if (result.ok) {
        setBrief((b) => (b ? { ...b, sent_to_whatsapp: true, sent_at: new Date().toISOString() } : b));
        setStatus({ type: "success", text: "Sent to WhatsApp ✓" });
      } else {
        setStatus({ type: "error", text: result.error || "WhatsApp send failed — copy the text instead." });
      }
    });
  }

  async function handleCopy() {
    if (!activeText) return;
    try {
      await navigator.clipboard.writeText(activeText);
      setStatus({ type: "info", text: "Copied to clipboard." });
    } catch {
      setStatus({ type: "error", text: "Couldn't copy — please select the text manually." });
    }
  }

  return (
    <div>
      {!brief && (
        <div className="card p-4 mb-4">
          <label className="block text-sm font-medium mb-1.5">Send to</label>
          <select
            className="w-full border border-muted rounded-btn px-3 py-2.5 mb-3 text-sm bg-surface"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({LANGUAGE_LABEL[s.language] || s.language})
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium mb-1.5">Anything special today?</label>
          <input
            className="w-full border border-muted rounded-btn px-3 py-2.5 mb-4 text-sm bg-surface"
            placeholder="e.g. Guests for dinner, Navratri fasting"
            value={specialContext}
            onChange={(e) => setSpecialContext(e.target.value)}
          />
          <button onClick={handleGenerate} disabled={generating || !staffId} className="btn-primary w-full py-3.5">
            {generating ? "Writing brief…" : "Generate brief"}
          </button>
        </div>
      )}

      {brief && (
        <>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowEnglish(false)}
              className={`chip flex-1 text-center border ${!showEnglish ? "bg-primary text-background border-primary" : "bg-surface text-text-secondary border-muted"}`}
            >
              {LANGUAGE_LABEL[brief.language_sent] || "Native"}
            </button>
            <button
              onClick={() => setShowEnglish(true)}
              className={`chip flex-1 text-center border ${showEnglish ? "bg-primary text-background border-primary" : "bg-surface text-text-secondary border-muted"}`}
            >
              English
            </button>
          </div>

          <div className="card p-4 mb-3">
            {editing ? (
              <>
                <textarea
                  autoFocus
                  className="w-full border border-muted rounded-btn px-3 py-2 mb-3 text-sm bg-surface min-h-[160px]"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-secondary flex-1 py-2.5 text-sm">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="btn-primary flex-1 py-2.5 text-sm">
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed mb-3">
                  {activeText}
                </p>
                <button
                  onClick={() => {
                    setDraftText(activeText || "");
                    setEditing(true);
                  }}
                  className="text-primary text-xs font-semibold"
                >
                  Edit before sending
                </button>
              </>
            )}
          </div>

          {status && (
            <div
              className={`rounded-btn px-4 py-2.5 mb-3 text-sm font-medium ${
                status.type === "success"
                  ? "bg-success/15 text-success"
                  : status.type === "error"
                  ? "bg-error/15 text-error"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {status.text}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3.5 rounded-btn bg-[#25D366] text-white font-semibold mb-2"
          >
            {sending ? "Sending…" : brief.sent_to_whatsapp ? "Re-send via WhatsApp" : "Send via WhatsApp"}
          </button>
          <button onClick={handleCopy} className="btn-secondary w-full py-3 mb-2 text-sm">
            Copy text
          </button>
          <button
            onClick={() => {
              setBrief(null);
              setStatus(null);
            }}
            className="w-full py-2 text-xs text-text-secondary font-medium mb-6"
          >
            Generate a new brief
          </button>
        </>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
            Send history
          </p>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="card p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(h.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs text-text-secondary">{LANGUAGE_LABEL[h.language_sent] || h.language_sent}</p>
                </div>
                <span
                  className={`chip text-xs ${h.sent_to_whatsapp ? "bg-success/15 text-success" : "bg-muted text-text-secondary"}`}
                >
                  {h.sent_to_whatsapp ? "Sent" : "Not sent"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
