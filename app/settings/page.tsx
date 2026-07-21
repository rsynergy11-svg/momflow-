import { requireHousehold, getFamilyMembers, getStaff } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const { household } = await requireHousehold();
  const [members, staff] = await Promise.all([
    getFamilyMembers(household.id),
    getStaff(household.id),
  ]);

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Settings" />
        <SettingsClient household={household} initialMembers={members} initialStaff={staff} />
      </div>
      <BottomNav />
    </main>
  );
}
