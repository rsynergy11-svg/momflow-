import Link from "next/link";
import { requireHousehold, getStaff, getMemoryRules, getTodayBrief, isTrialExpired } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import StaffStatusCard from "@/components/StaffStatusCard";
import MealEditRow from "@/components/MealEditRow";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { household } = await requireHousehold();
  const [staff, rules, brief] = await Promise.all([
    getStaff(household.id),
    getMemoryRules(household.id, true),
    getTodayBrief(household.id),
  ]);

  const primaryCook = staff.find((s) => s.role === "cook") || staff[0];
  const topRules = rules
    .slice()
    .sort((a, b) => b.times_applied - a.times_applied)
    .slice(0, 3);
  const trialExpired = isTrialExpired(household);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(household.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <p className="text-xs text-text-secondary mb-0.5">{today}</p>
        <h1 className="text-2xl font-semibold text-text-primary mb-5">
          {greeting()}, {household.name.replace(/^The\s|\sHome$/gi, "") || "there"} 👋
        </h1>

        {household.plan === "trial" && (
          <div
            className={`rounded-btn px-4 py-3 mb-4 text-sm font-medium ${
              trialExpired ? "bg-error/10 text-error" : "bg-accent/40 text-primary"
            }`}
          >
            {trialExpired ? (
              <>
                Your free trial has ended.{" "}
                <Link href="/pricing" className="underline font-semibold">
                  Upgrade to keep sending briefs →
                </Link>
              </>
            ) : (
              <>{daysLeft} day{daysLeft === 1 ? "" : "s"} left in your free trial</>
            )}
          </div>
        )}

        <StaffStatusCard staff={staff} />

        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
          Today&apos;s meals
        </p>
        <div className="mb-4">
          <MealEditRow householdId={household.id} initialMeals={brief?.meals || {}} />
        </div>

        {primaryCook ? (
          trialExpired ? (
            <Link href="/pricing" className="btn-primary w-full py-3.5 block text-center mb-2">
              Upgrade to send today&apos;s brief
            </Link>
          ) : (
            <Link
              href={`/brief-preview?staff=${primaryCook.id}`}
              className="btn-primary w-full py-3.5 block text-center mb-2"
            >
              {brief?.sent_to_whatsapp ? "Re-send brief to" : "Send brief to"} {primaryCook.name}
            </Link>
          )
        ) : (
          <Link href="/settings" className="btn-secondary w-full py-3.5 block text-center mb-2">
            Add a cook to send your first brief
          </Link>
        )}

        <p className="text-xs text-center text-text-secondary mb-6">
          {brief?.sent_to_whatsapp
            ? `Sent today at ${brief.sent_at ? new Date(brief.sent_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}`
            : "Not sent yet today"}
        </p>

        {topRules.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Memory vault
              </p>
              <Link href="/memory" className="text-primary text-xs font-semibold">All →</Link>
            </div>
            <div className="space-y-2">
              {topRules.map((r) => (
                <div key={r.id} className="card p-3.5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                  <p className="text-sm text-text-primary flex-1">
                    {r.rule_text} <span className="text-text-secondary">· Applied {r.times_applied}×</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
