-- MomFlow initial schema
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- HOUSEHOLDS
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  owner_id uuid references auth.users(id) on delete cascade,
  plan text default 'trial', -- trial | essential | premium | elite | ultra
  trial_ends_at timestamptz default now() + interval '14 days',
  created_at timestamptz default now()
);

-- FAMILY MEMBERS
create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  role text, -- mother | father | son | daughter | grandparent | other
  age integer,
  dietary_restrictions text[] default '{}',
  meal_preferences text[] default '{}',
  fasting_days text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

-- STAFF
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  role text default 'cook', -- cook | maid | driver | other
  language text default 'hindi', -- hindi | marathi | gujarati | odia | tamil | bengali
  whatsapp_number text,
  is_active boolean default true,
  is_present_today boolean default true,
  created_at timestamptz default now()
);

-- MEMORY VAULT (persistent rules)
create table if not exists memory_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  rule_text text not null,
  applies_to text default 'all', -- member name or 'all'
  rule_type text default 'preference', -- dietary | timing | preference | allergy | staff_instruction
  times_applied integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- DAILY BRIEFS
create table if not exists daily_briefs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  date date not null default current_date,
  meals jsonb, -- {breakfast: {name, notes}, lunch: {name, notes}, dinner: {name, notes}}
  special_context text,
  brief_hindi text,
  brief_english text,
  language_sent text default 'hindi',
  sent_to_whatsapp boolean default false,
  sent_at timestamptz,
  staff_id uuid references staff(id),
  created_at timestamptz default now()
);

-- MEAL PLANS (weekly)
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  week_start date not null,
  plan jsonb, -- {monday: {breakfast, lunch, dinner}, tuesday: {...}, ...}
  is_ai_generated boolean default true,
  created_at timestamptz default now()
);

-- SUBSCRIPTIONS
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  plan text not null,
  status text default 'active', -- active | paused | cancelled
  current_period_end timestamptz,
  amount integer, -- in paise
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_family_members_household on family_members(household_id);
create index if not exists idx_staff_household on staff(household_id);
create index if not exists idx_memory_rules_household on memory_rules(household_id, is_active);
create index if not exists idx_daily_briefs_household_date on daily_briefs(household_id, date desc);
create index if not exists idx_meal_plans_household_week on meal_plans(household_id, week_start desc);
create index if not exists idx_subscriptions_household on subscriptions(household_id);

-- Enable RLS on all tables
alter table households enable row level security;
alter table family_members enable row level security;
alter table staff enable row level security;
alter table memory_rules enable row level security;
alter table daily_briefs enable row level security;
alter table meal_plans enable row level security;
alter table subscriptions enable row level security;

-- RLS policies (owner can only see their own household data)
drop policy if exists "owner access" on households;
create policy "owner access" on households for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "household access" on family_members;
create policy "household access" on family_members for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));

drop policy if exists "household access" on staff;
create policy "household access" on staff for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));

drop policy if exists "household access" on memory_rules;
create policy "household access" on memory_rules for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));

drop policy if exists "household access" on daily_briefs;
create policy "household access" on daily_briefs for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));

drop policy if exists "household access" on meal_plans;
create policy "household access" on meal_plans for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));

drop policy if exists "household access" on subscriptions;
create policy "household access" on subscriptions for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));
