-- MomFlow: grocery lists (auto-derived from the weekly meal plan)
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.
-- (Already applied live to the momflow project via the Supabase MCP.)

create table if not exists grocery_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  week_start date not null,
  items jsonb not null default '[]', -- [{name, quantity, category}]
  estimated_cost integer, -- rough estimate in rupees
  is_ai_generated boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_grocery_lists_household_week on grocery_lists(household_id, week_start desc);

alter table grocery_lists enable row level security;

drop policy if exists "household access" on grocery_lists;
create policy "household access" on grocery_lists for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));
