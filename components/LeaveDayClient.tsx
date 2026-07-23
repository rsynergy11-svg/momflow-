"use client";

import { useState, useTransition } from "react";
import { generateLeaveDayPlan } from "@/app/actions/generateLeaveDayPlan";

export default function LeaveDayClient({
  householdId,
  staffId,
  staffName,
}: {
  householdId: string;
  staffId?: string;
  staffName?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    setStatus(null);
    startGenerate(async () => {
      try {
        const result = await generateLeaveDayPlan(householdId, staffId);
        setText(result.text);
      } catch {
        setError("Couldn't generate a backup plan right now. Please try again.");
      }
    });
  }

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard.");
    } catch {
      setError("Couldn't copy — please select the text manually.");
    }
  }

  return (
    <div>
      {!text && (
        <div className="card p-5 mb-4 text-center">
          <p className="text-3xl mb-2">🍳</p>
          <p className="text-sm font-semibold text-text-primary mb-1">
            {staffName ? `${staffName} is on leave today` : "Cook on leave today"}
          </p>
          <p className="text-xs text-text-secondary mb-4">
            Get a simple, family-friendly backup plan — no cook required.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full py-3.5">
            {generating ? "Putting together a plan…" : "Generate backup plan"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-btn px-4 py-2.5 mb-3 text-sm font-medium bg-error/15 text-error">
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-btn px-4 py-2.5 mb-3 text-sm font-medium bg-muted text-text-secondary">
          {status}
        </div>
      )}

      {text && (
        <>
          <div className="card p-4 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2">
              Today&apos;s backup plan
            </p>
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{text}</p>
          </div>
          <button onClick={handleCopy} className="btn-primary w-full py-3.5 mb-2">
            Copy text
          </button>
          <button
            onClick={() => {
              setText(null);
              setStatus(null);
            }}
            className="w-full py-2 text-xs text-text-secondary font-medium"
          >
            Generate a different plan
          </button>
        </>
      )}
    </div>
  );
}
