import { requireHousehold, getMemoryRules } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import MemoryRulesClient from "@/components/MemoryRulesClient";

export default async function MemoryPage() {
  const { household } = await requireHousehold();
  const rules = await getMemoryRules(household.id);

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Memory Vault" subtitle="Rules MomFlow always remembers for your cook" />
        <MemoryRulesClient householdId={household.id} initialRules={rules} />
      </div>
      <BottomNav />
    </main>
  );
}
