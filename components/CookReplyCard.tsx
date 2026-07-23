"use client";

import { useState, useTransition } from "react";
import type { CookReply } from "@/lib/types";
import { addCookReplyToMemory, dismissCookReply } from "@/app/actions/memory";

export default function CookReplyCard({
  reply,
  householdId,
}: {
  reply: CookReply;
  householdId: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ruleText, setRuleText] = useState(reply.message);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  function handleAdd() {
    startTransition(async () => {
      await addCookReplyToMemory(reply.id, householdId, {
        rule_text: ruleText,
        applies_to: "all",
        rule_type: "preference",
      });
      setDismissed(true);
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissCookReply(reply.id);
      setDismissed(true);
    });
  }

  return (
    <div className="card p-4 mb-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2">
        Cook replied on WhatsApp
      </p>
      {editing ? (
        <textarea
          autoFocus
          className="w-full border border-muted rounded-btn px-3 py-2 mb-3 text-sm bg-surface min-h-[70px]"
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
        />
      ) : (
        <p className="text-sm text-text-primary mb-3">&ldquo;{reply.message}&rdquo;</p>
      )}
      <div className="flex gap-2">
        <button onClick={handleDismiss} disabled={pending} className="btn-secondary flex-1 py-2.5 text-sm">
          Dismiss
        </button>
        {editing ? (
          <button onClick={handleAdd} disabled={pending} className="btn-primary flex-1 py-2.5 text-sm">
            Save to vault
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            disabled={pending}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            Add to memory vault
          </button>
        )}
      </div>
    </div>
  );
}
