import { requireHousehold, getTodayBrief, getLatestMealPlan } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import MealsClient from "@/components/MealsClient";
import type { WeeklyPlan } from "@/lib/types";

export default async function MealsPage() {
  const { household } = await requireHousehold();
  const [brief, mealPlan] = await Promise.all([
    getTodayBrief(household.id),
    getLatestMealPlan(household.id),
  ]);

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Meals" subtitle="Plan today, or let AI plan the week" />
        <MealsClient
          householdId={household.id}
          todayMeals={brief?.meals || {}}
          initialPlan={(mealPlan?.plan as WeeklyPlan) || null}
        />
      </div>
      <BottomNav />
    </main>
  );
}
