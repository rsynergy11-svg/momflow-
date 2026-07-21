"use client";

import { useState, useTransition } from "react";
import type { MealsForDay } from "@/lib/types";
import { upsertTodayMeals } from "@/app/actions/meals";

const SLOTS: { key: keyof MealsForDay; label: string; tag: string; tagColor: string }[] = [
  { key: "breakfast", label: "Breakfast", tag: "AM", tagColor: "bg-warning/20 text-warning" },
  { key: "lunch", label: "Lunch", tag: "VEG", tagColor: "bg-primary/15 text-primary" },
  { key: "dinner", label: "Dinner", tag: "PM", tagColor: "bg-secondary/15 text-secondary" },
];

export default function MealEditRow({
  householdId,
  initialMeals,
}: {
  householdId: string;
  initialMeals: MealsForDay;
}) {
  const [meals, setMeals] = useState<MealsForDay>(initialMeals || {});
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(key: keyof MealsForDay, name: string, notes: string) {
    const next = { ...meals, [key]: { name, notes } };
    setMeals(next);
    setEditing(null);
    startTransition(async () => {
      await upsertTodayMeals(householdId, next);
    });
  }

  return (
    <div className="card divide-y divide-muted">
      {SLOTS.map((slot) => {
        const meal = meals[slot.key];
        const isEditing = editing === slot.key;
        return (
          <div key={slot.key} className="p-4">
            {isEditing ? (
              <InlineEdit
                initialName={meal?.name || ""}
                initialNotes={meal?.notes || ""}
                onCancel={() => setEditing(null)}
                onSave={(name, notes) => save(slot.key, name, notes)}
              />
            ) : (
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setEditing(slot.key)}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
                    {slot.label}
                  </p>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {meal?.name || "Tap to add"}
                  </p>
                  {meal?.notes && <p className="text-xs text-text-secondary mt-0.5">{meal.notes}</p>}
                </div>
                <span className="text-text-secondary text-lg flex-shrink-0">✏️</span>
              </button>
            )}
          </div>
        );
      })}
      {pending && <p className="text-xs text-text-secondary px-4 pb-2">Saving…</p>}
    </div>
  );
}

function InlineEdit({
  initialName,
  initialNotes,
  onSave,
  onCancel,
}: {
  initialName: string;
  initialNotes: string;
  onSave: (name: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes);
  return (
    <div>
      <input
        autoFocus
        className="w-full border border-muted rounded-btn px-3 py-2 mb-2 text-sm bg-surface"
        placeholder="Dish name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full border border-muted rounded-btn px-3 py-2 mb-2 text-sm bg-surface"
        placeholder="Notes (e.g. no onion, 5 people)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
        <button onClick={() => onSave(name, notes)} className="btn-primary flex-1 py-2 text-xs">Save</button>
      </div>
    </div>
  );
}
