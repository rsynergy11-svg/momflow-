"use client";

import { useState, useTransition } from "react";
import type { Staff } from "@/lib/types";
import { toggleStaffPresence } from "@/app/actions/meals";

export default function StaffStatusCard({ staff }: { staff: Staff[] }) {
  const [list, setList] = useState(staff);
  const [, startTransition] = useTransition();

  function toggle(s: Staff) {
    setList((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, is_present_today: !x.is_present_today } : x))
    );
    startTransition(async () => {
      await toggleStaffPresence(s.id, !s.is_present_today);
    });
  }

  if (!list.length) {
    return (
      <div className="card p-4 mb-3">
        <p className="text-sm text-text-secondary">No staff added yet — add your cook in Settings.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 mb-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-3">
        Today&apos;s staff
      </p>
      <div className="space-y-3">
        {list.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
              {s.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{s.name}</p>
              <p className="text-xs text-text-secondary capitalize">{s.role} · {s.language}</p>
            </div>
            <button
              onClick={() => toggle(s)}
              className={`chip text-xs ${
                s.is_present_today
                  ? "bg-success/15 text-success"
                  : "bg-error/15 text-error"
              }`}
            >
              {s.is_present_today ? "Present" : "Absent"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
