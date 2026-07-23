"use client";

import { useState, useTransition } from "react";
import type { GroceryItem } from "@/lib/types";
import { generateGroceryList } from "@/app/actions/generateGroceryList";

const CATEGORY_ORDER = [
  "Vegetables",
  "Fruits",
  "Dairy",
  "Grains & Atta",
  "Pulses & Lentils",
  "Spices & Masalas",
  "Oil & Ghee",
  "Other",
];

export default function GroceryListClient({
  householdId,
  initialItems,
  initialCost,
  initialWeekStart,
  hasMealPlan,
}: {
  householdId: string;
  initialItems: GroceryItem[];
  initialCost: number | null;
  initialWeekStart: string | null;
  hasMealPlan: boolean;
}) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [cost, setCost] = useState<number | null>(initialCost);
  const [weekStart, setWeekStart] = useState<string | null>(initialWeekStart);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [generating, startGenerate] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      try {
        const result = await generateGroceryList(householdId);
        setItems(result.items);
        setCost(result.estimatedCost);
        setWeekStart(result.weekStart);
        setChecked(new Set());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't build the list right now.");
      }
    });
  }

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={generating || !hasMealPlan}
        className="btn-primary w-full py-3.5 mb-2"
      >
        {generating ? "Building list…" : items.length ? "Regenerate from this week's plan" : "✨ Build grocery list from meal plan"}
      </button>

      {!hasMealPlan && (
        <p className="text-xs text-text-secondary text-center mb-4">
          Generate an AI weekly meal plan in Meals → Week first, then come back here.
        </p>
      )}
      {error && <p className="text-error text-sm mb-4">{error}</p>}

      {items.length > 0 && (
        <>
          <div className="card p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary">
                Week of {weekStart ? new Date(weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
              </p>
              <p className="text-sm font-semibold text-text-primary">{items.length} items</p>
            </div>
            {cost != null && (
              <div className="text-right">
                <p className="text-xs text-text-secondary">Estimated</p>
                <p className="text-sm font-semibold text-primary">₹{cost.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.category}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
                  {g.category}
                </p>
                <div className="card divide-y divide-muted">
                  {g.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => toggle(item.name)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-[10px] ${
                          checked.has(item.name)
                            ? "bg-primary border-primary text-background"
                            : "border-muted text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm flex-1 ${
                          checked.has(item.name) ? "line-through text-text-secondary" : "text-text-primary"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-xs text-text-secondary">{item.quantity}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {items.length === 0 && hasMealPlan && !generating && (
        <div className="card p-6 text-center text-text-secondary text-sm">
          No grocery list yet for this week — tap the button above.
        </div>
      )}
    </div>
  );
}
