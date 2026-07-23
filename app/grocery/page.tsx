import { requireHousehold, getLatestMealPlan, getLatestGroceryList } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import GroceryListClient from "@/components/GroceryListClient";
import type { GroceryItem } from "@/lib/types";

export default async function GroceryPage() {
  const { household } = await requireHousehold();
  const [mealPlan, groceryList] = await Promise.all([
    getLatestMealPlan(household.id),
    getLatestGroceryList(household.id),
  ]);

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Grocery list" subtitle="Auto-built from your weekly meal plan" />
        <GroceryListClient
          householdId={household.id}
          initialItems={(groceryList?.items as GroceryItem[]) || []}
          initialCost={groceryList?.estimated_cost ?? null}
          initialWeekStart={groceryList?.week_start ?? null}
          hasMealPlan={!!mealPlan}
        />
      </div>
      <BottomNav />
    </main>
  );
}
