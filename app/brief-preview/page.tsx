import { requireHousehold, getStaff, getTodayBrief, getRecentBriefs, getPendingCookReplies } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import BriefPreviewClient from "@/components/BriefPreviewClient";
import CookReplyCard from "@/components/CookReplyCard";
import Link from "next/link";

export default async function BriefPreviewPage({
  searchParams,
}: {
  searchParams: { staff?: string };
}) {
  const { household } = await requireHousehold();
  const staffList = await getStaff(household.id);
  const todayBrief = await getTodayBrief(household.id);
  const history = await getRecentBriefs(household.id, 7);
  const pendingReplies = await getPendingCookReplies(household.id);

  if (!staffList.length) {
    return (
      <main className="min-h-screen bg-background px-5 pt-8 pb-24">
        <div className="max-w-md mx-auto">
          <PageHeader title="Brief preview" />
          <div className="card p-6 text-center">
            <p className="text-text-secondary text-sm mb-4">Add a cook first so MomFlow knows who to brief.</p>
            <Link href="/settings" className="btn-primary inline-block px-6 py-3">Go to Settings</Link>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  const initialStaffId = searchParams.staff || staffList[0].id;
  const hasBriefForStaff = todayBrief && todayBrief.staff_id === initialStaffId && todayBrief.brief_hindi;

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <PageHeader title="Today's brief" subtitle="Review, edit, and send to your cook" />
        {pendingReplies.map((reply) => (
          <CookReplyCard key={reply.id} reply={reply} householdId={household.id} />
        ))}
        <BriefPreviewClient
          household={household}
          staffList={staffList}
          initialStaffId={initialStaffId}
          initialBrief={hasBriefForStaff ? todayBrief : null}
          history={history.filter((h) => h.brief_hindi)}
        />
      </div>
      <BottomNav />
    </main>
  );
}
