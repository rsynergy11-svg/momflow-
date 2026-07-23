import { requireHousehold, getStaff } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import LeaveDayClient from "@/components/LeaveDayClient";

export default async function LeaveDayPage() {
  const { household } = await requireHousehold();
  const staff = await getStaff(household.id);
  const absentCook = staff.find((s) => s.role === "cook" && !s.is_present_today) || staff.find((s) => !s.is_present_today);

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Backup plan" subtitle="A simple day of meals the family can cook" />
        <LeaveDayClient
          householdId={household.id}
          staffId={absentCook?.id}
          staffName={absentCook?.name}
        />
      </div>
      <BottomNav />
    </main>
  );
}
