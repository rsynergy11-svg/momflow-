-- MomFlow: cook WhatsApp reply capture (feeds the Memory Vault from real usage)
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.
-- (Already applied live to the momflow project via the Supabase MCP.)

create table if not exists cook_replies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  staff_id uuid references staff(id),
  brief_id uuid references daily_briefs(id) on delete set null,
  message text not null,
  added_to_memory boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_cook_replies_household on cook_replies(household_id, added_to_memory, created_at desc);

alter table cook_replies enable row level security;

drop policy if exists "household access" on cook_replies;
create policy "household access" on cook_replies for all using (household_id in (select id from households where owner_id = auth.uid())) with check (household_id in (select id from households where owner_id = auth.uid()));
