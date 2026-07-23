# MomFlow

The kitchen OS for Indian households. Set your family's dietary rules once — your cook gets a
personalised daily brief on WhatsApp, in their own language.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (auth + Postgres) · Anthropic Claude
(brief + meal-plan generation) · Interakt (WhatsApp) · Razorpay (subscriptions) · Vercel

## ⚠️ Before you upload this anywhere (GitHub, etc.)

**Never upload `.env.local` to GitHub or any git host.** It contains your real, live secret
keys. `.gitignore` excludes it automatically if you use `git push` from a terminal — but if
you're uploading via a website's drag-and-drop "upload files" feature, `.gitignore` is NOT
respected, so you must manually leave `.env.local` out of what you select/drag. Secrets belong
only in Vercel's Environment Variables screen (or your own machine), never in a repo.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Supabase — already provisioned for you**
   - Project `momflow` is live (ref `sgtnaorkbecghtkakdic`, region `ap-south-1`/Mumbai).
     Dashboard: https://supabase.com/dashboard/project/sgtnaorkbecghtkakdic
   - The schema + RLS policies from `supabase/migrations/0001_init.sql` are already applied —
     all 7 tables exist with RLS enabled and zero security lints.
   - `.env.local` is pre-filled with the project URL and anon key. You still need to:
     - Grab the **service role key** yourself from Project Settings → API (this is never exposed
       by the provisioning tool for security) and paste it into `SUPABASE_SERVICE_ROLE_KEY`.
     - Enable Google as an OAuth provider under Authentication → Providers, and add
       `<your-app-url>/auth/callback` as an authorized redirect URL.

   **Google OAuth client** — already created and saved in Supabase → Authentication → Providers →
   Google (https://supabase.com/dashboard/project/sgtnaorkbecghtkakdic/auth/providers). The actual
   Client ID/Secret values are intentionally NOT written here — this file may end up in a public
   or shared git repo, and secrets should never be committed to source control. If you need to see
   them again, get the Client ID/Secret from Google Cloud Console → APIs & Services → Credentials.
   Registered redirect URI: `https://sgtnaorkbecghtkakdic.supabase.co/auth/v1/callback`

3. **Anthropic**
   - Get an API key from console.anthropic.com and set `ANTHROPIC_API_KEY`.

4. **Interakt (WhatsApp)**
   - Create an Interakt account, set up the `daily_cook_brief` WhatsApp template, and
     set `INTERAKT_API_KEY`.
   - If this isn't configured, brief sending will fail gracefully and the UI falls back
     to a "copy text" button — nothing else breaks.
   - **Cook reply capture (optional):** point Interakt's inbound-message webhook at
     `<your-app-url>/api/interakt/webhook?token=<INTERAKT_WEBHOOK_SECRET>` and set
     `INTERAKT_WEBHOOK_SECRET` to a random string. When your cook replies on WhatsApp
     (e.g. "made it without onion today"), it shows up in `/brief-preview` with a
     one-tap "Add to memory vault" button. This hasn't been tested against a live
     Interakt account yet — the payload parser in `app/api/interakt/webhook/route.ts`
     is written defensively against the commonly documented shape, but check Vercel
     logs after your first real reply in case the field names need adjusting.

5. **Razorpay**
   - Create two subscription plans in the Razorpay dashboard (Settings → Subscriptions →
     Plans): `essential_monthly` (₹999) and `premium_monthly` (₹1,999).
   - Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
     `RAZORPAY_ESSENTIAL_PLAN_ID`, `RAZORPAY_PREMIUM_PLAN_ID`.
   - Point a webhook at `<your-app-url>/api/razorpay/webhook` for the `subscription.*` events.

6. **Voice-note briefs (optional)**
   - Enable the Text-to-Speech API in a Google Cloud project, create an API key, and
     set `GOOGLE_TTS_API_KEY`.
   - If this isn't set, the "Generate voice note" button on `/brief-preview` shows a
     clear error instead of breaking. Chosen for its Indian-language coverage (Hindi,
     Marathi, Gujarati, Tamil, Bengali; Odia support may be limited — check
     `lib/tts.ts` if that language's button errors).
   - Sending the audio automatically as a WhatsApp voice note isn't implemented —
     Interakt's media-message API needs an active 24-hour customer session window,
     which is a different integration than the template-message send already built.
     For now: generate → play/download → forward manually on WhatsApp.

7. **Run locally**
   ```
   npm run dev
   ```

8. **Deploy**
   - Push to a GitHub repo, import into Vercel, and set the same env vars there.

## Project structure

- `app/onboarding` — 5-step setup wizard
- `app/dashboard` — daily home screen (streak, festival banner, leave-mode banner)
- `app/meals` — today's meals + AI weekly planning
- `app/grocery` — AI-generated grocery list from the week's meal plan
- `app/memory` — the Memory Vault (persistent household rules)
- `app/brief-preview` — generate, edit, and send the daily WhatsApp brief; voice note; cook replies
- `app/leave-day` — simple family backup plan when the cook is marked absent
- `app/settings` — family, staff, household access (invite), subscription, notifications
- `app/pricing` — plans + Razorpay checkout
- `app/actions/*` — server actions (Claude generation, WhatsApp send, TTS, CRUD)
- `app/api/interakt/webhook` — inbound cook WhatsApp replies
- `lib/festivals.ts` — 2026 Hindu festival/fasting calendar, auto-applied to briefs and meal plans
- `supabase/migrations/0001_init.sql` — core schema + RLS
- `supabase/migrations/0002_grocery_lists.sql` — grocery lists
- `supabase/migrations/0003_cook_replies.sql` — cook WhatsApp reply capture
- `supabase/migrations/0004_household_members.sql` — multi-user household access

## Notes

- Auth is Google-only via Supabase, no passwords.
- Every household is isolated by Postgres RLS, scoped through `household_members` — a
  user can only ever read/write rows for households they're an active member of.
- **Multi-user households:** the person who completes onboarding becomes the `owner`.
  From Settings → Family access, the owner can invite anyone by email; that person gets
  full access to the same household the next time they sign in with Google using that
  email. Only the owner can invite or remove people; any active member (owner or
  invited) can otherwise read/write everything in the household — there's no finer-
  grained permission model yet (e.g. view-only access isn't supported).
- Trial households get full access for 14 days (`households.trial_ends_at`); after that,
  the dashboard and brief-preview redirect to `/pricing`.
