// Pure helpers for the "day streak" badge and adherence score — kept separate from
// lib/data.ts so they're trivially unit-testable without a Supabase client.

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Counts consecutive days (ending today or yesterday) that have a sent brief.
 * `sentDates` should be distinct YYYY-MM-DD strings, any order.
 */
export function calculateStreak(sentDates: string[], today: Date = new Date()): number {
  const set = new Set(sentDates);
  let cursor = new Date(today);

  // If today hasn't been sent yet, the streak still counts through yesterday —
  // a mother checking at 8am shouldn't see her streak reset before she's had a chance to send.
  if (!set.has(toISO(cursor))) {
    cursor = new Date(cursor.getTime() - 86400000);
  }

  let streak = 0;
  while (set.has(toISO(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

/** Sent-vs-total adherence over the last `windowDays` days (or fewer if the household is newer). */
export function calculateAdherence(
  sentDates: string[],
  windowDays: number,
  today: Date = new Date()
): { sent: number; total: number } {
  const set = new Set(sentDates);
  let sent = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    if (set.has(toISO(d))) sent += 1;
  }
  return { sent, total: windowDays };
}
