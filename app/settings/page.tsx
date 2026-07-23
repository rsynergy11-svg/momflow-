import { requireHousehold, getFamilyMembers, getStaff, getHouseholdMembers } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const { household, role } = await requireHousehold();
  const [members, staff, householdMembers] = await Promise.all([
    getFamilyMembers(household.id),
    getStaff(household.id),
    getHouseholdMembers(household.id),
  ]);

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Settings" />
        <SettingsClient
          household={household}
          initialMembers={members}
          initialStaff={staff}
          initialHouseholdMembers={householdMembers}
          currentRole={role}
        />
      </div>
      <BottomNav />
    </main>
  );
}
