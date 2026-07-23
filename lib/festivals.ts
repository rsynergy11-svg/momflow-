// MomFlow — Indian festival & fasting calendar (2026)
//
// Source: SmartPuja Hindu Festival Calendar 2026 (drikpanchang-based), cross-checked
// against India TV / panchang.org for Navratri, Karva Chauth, Diwali, Shravan.
// Dates follow the North Indian / Delhi panchang; regional variation of ±1 day is normal.
//
// This auto-applies fasting/festival context to brief generation and meal planning so
// families don't have to remember to toggle it manually every time.

export type FestivalType = "fasting" | "festival" | "info";

export type FestivalEvent = {
  name: string;
  type: FestivalType;
  ruleText: string;
  emoji: string;
};

type SingleDateEntry = FestivalEvent & { date: string };
type RangeEntry = FestivalEvent & { start: string; end: string };

// Single-day events, 2026.
const SINGLE_DATES: SingleDateEntry[] = [
  { date: "2026-01-14", name: "Makar Sankranti", type: "festival", emoji: "🪁", ruleText: "Makar Sankranti — til-gud sweets are traditional; some households fast till the kite-flying/puja is done." },
  { date: "2026-01-14", name: "Shattila Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-01-18", name: "Mauni Amavasya", type: "fasting", emoji: "🌑", ruleText: "Mauni Amavasya — a silence/fasting day for some family members; keep meals simple." },
  { date: "2026-01-29", name: "Jaya Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-02-13", name: "Vijaya Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-02-15", name: "Maha Shivratri", type: "fasting", emoji: "🕉️", ruleText: "Maha Shivratri — a major fasting day; many eat only fruits/sabudana until the night puja." },
  { date: "2026-02-27", name: "Amalaki Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-03-03", name: "Holika Dahan", type: "festival", emoji: "🔥", ruleText: "Holika Dahan eve — festive sweets (gujiya) likely; check if guests are expected." },
  { date: "2026-03-04", name: "Holi", type: "festival", emoji: "🎨", ruleText: "Holi — festive day, expect guests dropping by; rich/sweet food is traditional." },
  { date: "2026-03-15", name: "Papmochani Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-03-27", name: "Ram Navami", type: "fasting", emoji: "🏹", ruleText: "Ram Navami — closing day of Chaitra Navratri fasting; a festive meal often follows the puja." },
  { date: "2026-03-29", name: "Kamada Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-04-13", name: "Varuthini Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-04-20", name: "Akshaya Tritiya", type: "festival", emoji: "🪙", ruleText: "Akshaya Tritiya — considered auspicious; some families keep a partial fast until puja." },
  { date: "2026-04-27", name: "Mohini Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-05-13", name: "Apara Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-05-27", name: "Padmini Ekadashi (Adhik Maas)", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-06-11", name: "Parama Ekadashi (Adhik Maas)", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-06-25", name: "Nirjala Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Nirjala Ekadashi — the strictest Ekadashi, often observed without even water. Keep this in mind if anyone in the house observes it." },
  { date: "2026-07-10", name: "Yogini Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-07-16", name: "Jagannath Rath Yatra", type: "festival", emoji: "🚩", ruleText: "Rath Yatra — festive day in many households, sweets/prasad common." },
  { date: "2026-07-25", name: "Devshayani Ekadashi (Chaturmas begins)", type: "fasting", emoji: "🪷", ruleText: "Devshayani Ekadashi — start of Chaturmas; some family members avoid certain vegetables (onion/garlic/brinjal) for the next 4 months." },
  { date: "2026-08-18", name: "Nag Panchami", type: "festival", emoji: "🐍", ruleText: "Nag Panchami — some households avoid frying/cutting vegetables on this day." },
  { date: "2026-08-23", name: "Shravana Putrada Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-08-28", name: "Raksha Bandhan / Shravan Purnima", type: "festival", emoji: "🎗️", ruleText: "Raksha Bandhan — festive sweets likely; siblings may be visiting." },
  { date: "2026-09-04", name: "Janmashtami", type: "fasting", emoji: "🦚", ruleText: "Janmashtami — a major fasting day, often broken at midnight; keep the evening meal light until then." },
  { date: "2026-09-07", name: "Aja Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-09-14", name: "Ganesh Chaturthi", type: "festival", emoji: "🐘", ruleText: "Ganesh Chaturthi — modak and festive sweets are traditional; expect guests during the 11-day period." },
  { date: "2026-09-22", name: "Parivartini Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-10-06", name: "Indira Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-10-20", name: "Dussehra (Vijayadashami)", type: "festival", emoji: "🏹", ruleText: "Dussehra — closing day of Navratri fasting; a festive meal often follows in the evening." },
  { date: "2026-10-21", name: "Papankusha Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-10-29", name: "Karva Chauth", type: "fasting", emoji: "🌙", ruleText: "Karva Chauth — a strict day-long fast (often nirjala) for married women until moonrise. Keep this in mind for who you're cooking for today." },
  { date: "2026-11-05", name: "Rama Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-11-06", name: "Dhanteras", type: "festival", emoji: "🪙", ruleText: "Dhanteras — start of the Diwali cluster; sweets and guests likely over the next few days." },
  { date: "2026-11-08", name: "Diwali (Lakshmi Puja)", type: "festival", emoji: "🪔", ruleText: "Diwali — major festive day, guests and sweets very likely. Many keep a light meal before the evening puja." },
  { date: "2026-11-14", name: "Chhath Puja", type: "fasting", emoji: "🌅", ruleText: "Chhath Puja — a rigorous multi-day fast (nirjala for some) centred on sunrise/sunset offerings." },
  { date: "2026-11-20", name: "Devutthana Ekadashi (Tulsi Vivah)", type: "fasting", emoji: "🌿", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-12-04", name: "Utpanna Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
  { date: "2026-12-20", name: "Mokshada Ekadashi", type: "fasting", emoji: "🪷", ruleText: "Ekadashi — avoid rice, grains and non-veg for anyone observing the fast." },
];

// Multi-day ranges, 2026.
const RANGES: RangeEntry[] = [
  { start: "2026-03-19", end: "2026-03-27", name: "Chaitra Navratri", type: "fasting", emoji: "🚩", ruleText: "Chaitra Navratri — 9 days of fasting for many households: no onion/garlic/grains, sabudana and kuttu atta are common substitutes." },
  { start: "2026-07-30", end: "2026-08-28", name: "Shravan Maas", type: "fasting", emoji: "🕉️", ruleText: "Shravan Maas — many households avoid non-veg, onion and garlic for the whole month. Mondays (Shravan Somvar) often add a stricter fast on top." },
  { start: "2026-09-14", end: "2026-09-24", name: "Ganesh Chaturthi period", type: "festival", emoji: "🐘", ruleText: "Ganesh Chaturthi — 11-day festive period, modak and guests likely, especially the first and last day." },
  { start: "2026-09-27", end: "2026-10-10", name: "Pitru Paksha", type: "info", emoji: "🙏", ruleText: "Pitru Paksha — many households avoid starting anything auspicious and skip certain foods (garlic, onion, non-veg) during this period." },
  { start: "2026-10-12", end: "2026-10-20", name: "Sharad Navratri", type: "fasting", emoji: "🚩", ruleText: "Sharad Navratri — 9 days of fasting for many households: no onion/garlic/grains, sabudana and kuttu atta are common substitutes." },
];

function parseISO(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** All festival/fasting events active on a given date (usually 0-2). */
export function getFestivalContext(date: Date = new Date()): FestivalEvent[] {
  const iso = toISO(date);
  const events: FestivalEvent[] = [];

  for (const e of SINGLE_DATES) {
    if (e.date === iso) events.push(e);
  }

  for (const r of RANGES) {
    if (iso >= r.start && iso <= r.end) {
      events.push(r);
      // Shravan Somvar: within Shravan Maas, flag Mondays specifically.
      if (r.name === "Shravan Maas" && date.getDay() === 1) {
        events.push({
          name: "Shravan Somvar",
          type: "fasting",
          emoji: "🔱",
          ruleText: "Shravan Somvar (Monday fast) — many observe a stricter fast today: fruits, sabudana, or one satvik meal only.",
        });
      }
    }
  }

  return events;
}

/** The next upcoming festival/fasting event within `daysAhead` days (not counting today). */
export function getUpcomingFestival(
  daysAhead = 3,
  from: Date = new Date()
): { event: FestivalEvent; daysUntil: number } | null {
  for (let i = 1; i <= daysAhead; i++) {
    const check = new Date(from.getTime() + i * 86400000);
    const iso = toISO(check);
    const single = SINGLE_DATES.find((e) => e.date === iso);
    if (single) return { event: single, daysUntil: i };
    const range = RANGES.find((r) => r.start === iso);
    if (range) return { event: range, daysUntil: i };
  }
  return null;
}

/** Formats today's + any upcoming context into a short line for prompts and UI. */
export function formatFestivalContextForPrompt(date: Date = new Date()): string {
  const today = getFestivalContext(date);
  if (!today.length) return "None today.";
  return today.map((e) => `${e.emoji} ${e.name}: ${e.ruleText}`).join("\n");
}

export function parseFestivalDate(iso: string): Date {
  return parseISO(iso);
}

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Day-by-day festival/fasting summary for a 7-day week starting on `weekStartISO` (a Monday). */
export function formatWeekFestivalContextForPrompt(weekStartISO: string): string {
  const start = parseISO(weekStartISO);
  const lines: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const events = getFestivalContext(d);
    if (events.length) {
      lines.push(`${DAY_NAMES[i]}: ${events.map((e) => `${e.emoji} ${e.name} — ${e.ruleText}`).join(" | ")}`);
    }
  }
  return lines.length ? lines.join("\n") : "No festivals or fasting days this week.";
}
