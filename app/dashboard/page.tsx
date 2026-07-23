import Link from "next/link";
import { requireHousehold, getStaff, getMemoryRules, getTodayBrief, getBriefStats, isTrialExpired, getLatestMealPlan } from "@/lib/data";
import { getFestivalContext, getUpcomingFestival } from "@/lib/festivals";
import BottomNav from "@/components/BottomNav";
import StaffStatusCard from "@/components/StaffStatusCard";
import MealEditRow from "@/components/MealEditRow";
import type { MealsForDay, WeeklyPlan } from "@/lib/types";

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

// If mom already generated this week's AI meal plan, today's dashboard should show
// those meals by default instead of blank "Tap to add" fields — she shouldn't have
// to re-type what she already planned. Only used when no brief exists yet for today
// (once she's edited/confirmed today's meals via a brief, that takes precedence).
function todaysMealsFromWeeklyPlan(
  plan: { week_start: string; plan: WeeklyPlan } | null,
  today: Date
): MealsForDay | null {
  if (!plan) return null;
  const weekStart = new Date(plan.week_start + "T00:00:00");
  const daysSinceStart = Math.floor((today.getTime() - weekStart.getTime()) / 86400000);
  if (daysSinceStart < 0 || daysSinceStart > 6) return null; // plan doesn't cover today
  const dayDate = new Date(weekStart);
  dayDate.setDate(dayDate.getDate() + daysSinceStart);
  const key = WEEKDAY_KEYS[dayDate.getDay()];
  return plan.plan?.[key] || null;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { household } = await requireHousehold();
  const [staff, rules, brief, stats, weeklyPlan] = await Promise.all([
    getStaff(household.id),
    getMemoryRules(household.id, true),
    getTodayBrief(household.id),
    getBriefStats(household.id, household.created_at),
    getLatestMealPlan(household.id),
  ]);

  const todaysMeals =
    brief?.meals && Object.keys(brief.meals).length > 0
      ? brief.meals
      : todaysMealsFromWeeklyPlan(weeklyPlan as { week_start: string; plan: WeeklyPlan } | null, new Date());

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

  const todaysFestivals = getFestivalContext(new Date());
  const upcoming = todaysFestivals.length ? null : getUpcomingFestival(3);
  const primaryCookOnLeave = primaryCook && !primaryCook.is_present_today;

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <div className="hero-card px-5 pt-6 pb-5 mb-4">
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-xs text-white/55 mb-0.5">{today}</p>
              <h1 className="text-[22px] font-medium text-white leading-tight">
                {greeting()}, {household.name.replace(/^The\s|\sHome$/gi, "") || "there"} 👋
              </h1>
            </div>
            {stats.streak > 0 && (
              <div className="streak-badge">
                <div className="text-base font-bold text-white leading-none">{stats.streak}</div>
                <div className="text-[8px] font-bold text-white/85 uppercase tracking-wide mt-0.5">
                  day streak
                </div>
              </div>
            )}
          </div>

          {todaysFestivals.length > 0 && (
            <div className="mt-4 bg-marigold/15 border border-marigold/35 rounded-btn px-3.5 py-2.5 text-xs text-[#F0D9B8] font-medium">
              {todaysFestivals.map((e) => `${e.emoji} ${e.name}`).join(" · ")} today — fasting rules auto-applied to briefs and meal plans.
            </div>
          )}
          {upcoming && (
            <div className="mt-4 bg-marigold/10 border border-marigold/25 rounded-btn px-3.5 py-2.5 text-xs text-[#F0D9B8] font-medium">
              {upcoming.event.emoji} {upcoming.event.name} in {upcoming.daysUntil} day{upcoming.daysUntil === 1 ? "" : "s"} — rules will auto-apply.
            </div>
          )}
        </div>

        {stats.total > 0 && (
          <p className="text-xs text-center text-text-secondary mb-4">
            {stats.sent}/{stats.total} days sent this month
          </p>
        )}

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

        {primaryCookOnLeave && (
          <div className="card p-4 mb-4 border border-warning/30">
            <p className="text-sm font-semibold text-text-primary mb-1">
              {primaryCook!.name} is marked absent today
            </p>
            <p className="text-xs text-text-secondary mb-3">
              Need a simple backup plan the family can cook themselves?
            </p>
            <Link href="/leave-day" className="btn-secondary w-full py-2.5 block text-center text-sm">
              Generate backup plan
            </Link>
          </div>
        )}

        <StaffStatusCard staff={staff} />

        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 px-1">
          Today&apos;s meals
        </p>
        <div className="mb-4">
          <MealEditRow householdId={household.id} initialMeals={todaysMeals || {}} />
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

        <Link href="/grocery" className="card p-3.5 mb-4 flex items-center gap-3">
          <span className="text-lg">🛒</span>
          <span className="text-sm font-medium text-text-primary flex-1">
            This week&apos;s grocery list
          </span>
          <span className="text-primary text-xs font-semibold">Open →</span>
        </Link>

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
