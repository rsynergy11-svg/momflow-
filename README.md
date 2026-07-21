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

5. **Razorpay**
   - Create two subscription plans in the Razorpay dashboard (Settings → Subscriptions →
     Plans): `essential_monthly` (₹999) and `premium_monthly` (₹1,999).
   - Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
     `RAZORPAY_ESSENTIAL_PLAN_ID`, `RAZORPAY_PREMIUM_PLAN_ID`.
   - Point a webhook at `<your-app-url>/api/razorpay/webhook` for the `subscription.*` events.

6. **Run locally**
   ```
   npm run dev
   ```

7. **Deploy**
   - Push to a GitHub repo, import into Vercel, and set the same env vars there.

## Project structure

- `app/onboarding` — 5-step setup wizard
- `app/dashboard` — daily home screen
- `app/meals` — today's meals + AI weekly planning
- `app/memory` — the Memory Vault (persistent household rules)
- `app/brief-preview` — generate, edit, and send the daily WhatsApp brief
- `app/settings` — family, staff, subscription, notifications
- `app/pricing` — plans + Razorpay checkout
- `app/actions/*` — server actions (Claude generation, WhatsApp send, CRUD)
- `supabase/migrations/0001_init.sql` — full schema + RLS policies

## Notes

- Auth is Google-only via Supabase, no passwords.
- Every household is isolated by Postgres RLS — a user can only ever read their own rows.
- Trial households get full access for 14 days (`households.trial_ends_at`); after that,
  the dashboard and brief-preview redirect to `/pricing`.
