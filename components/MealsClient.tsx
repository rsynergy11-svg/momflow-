"use client";

import { useState, useTransition } from "react";
import type { MealsForDay, WeeklyPlan } from "@/lib/types";
import MealEditRow from "@/components/MealEditRow";
import { generateWeeklyMealPlan } from "@/app/actions/generateMealPlan";

const MODES = ["Fasting", "Guest", "Sport", "Diabetic"];
const DAYS: (keyof WeeklyPlan)[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

export default function MealsClient({
  householdId,
  todayMeals,
  initialPlan,
}: {
  householdId: string;
  todayMeals: MealsForDay;
  initialPlan: WeeklyPlan | null;
}) {
  const [view, setView] = useState<"today" | "week">("today");
  const [modes, setModes] = useState<string[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan | null>(initialPlan);
  const [generating, startGenerate] = useTransition();
  const [error, setError] = useState("");

  function toggleMode(m: string) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function handleGenerate() {
    setError("");
    startGenerate(async () => {
      try {
        const result = await generateWeeklyMealPlan(householdId, modes);
        setPlan(result.plan);
        setView("week");
      } catch {
        setError("Couldn't generate a plan right now. Please try again.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-1 bg-muted rounded-btn p-1 mb-4">
        <button
          onClick={() => setView("today")}
          className={`flex-1 py-2 rounded-btn text-sm font-semibold ${view === "today" ? "bg-surface shadow-soft text-primary" : "text-text-secondary"}`}
        >
          Today
        </button>
        <button
          onClick={() => setView("week")}
          className={`flex-1 py-2 rounded-btn text-sm font-semibold ${view === "week" ? "bg-surface shadow-soft text-primary" : "text-text-secondary"}`}
        >
          Week
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => toggleMode(m)}
            className={`chip border ${modes.includes(m) ? "bg-primary text-background border-primary" : "bg-surface text-text-secondary border-muted"}`}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="btn-primary w-full py-3.5 mb-5"
      >
        {generating ? "Planning with AI…" : "✨ Generate AI meal plan"}
      </button>

      {error && <p className="text-error text-sm mb-4">{error}</p>}

      {view === "today" ? (
        <MealEditRow householdId={householdId} initialMeals={todayMeals} />
      ) : plan ? (
        <div className="space-y-4">
          {DAYS.map((day) => (
            <div key={day} className="card p-4">
              <p className="text-sm font-semibold text-text-primary capitalize mb-2">{day}</p>
              <div className="space-y-1.5">
                {(["breakfast", "lunch", "dinner"] as const).map((slot) => {
                  const meal = plan[day]?.[slot];
                  if (!meal?.name) return null;
                  return (
                    <div key={slot} className="flex items-start justify-between text-sm">
                      <span className="text-text-secondary capitalize w-20 flex-shrink-0">{slot}</span>
                      <span className="text-text-primary flex-1 text-right">
                        {meal.name}
                        {meal.notes && <span className="text-text-secondary"> · {meal.notes}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center text-text-secondary text-sm">
          No weekly plan yet — tap &ldquo;Generate AI meal plan&rdquo; above.
        </div>
      )}
    </div>
  );
}
