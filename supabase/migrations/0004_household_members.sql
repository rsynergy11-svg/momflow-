-- MomFlow: multi-user household access
-- Run via Supabase CLI: supabase db push
-- or paste into the Supabase SQL editor.
-- (Already applied live to the momflow project via the Supabase MCP.)

create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role text default 'member', -- owner | member
  status text default 'invited', -- invited | active
  created_at timestamptz default now()
);

create unique index if not exists idx_household_members_household_user on household_members(household_id, user_id) where user_id is not null;
create index if not exists idx_household_members_user on household_members(user_id);
create index if not exists idx_household_members_email on household_members(household_id, invited_email);

alter table household_members enable row level security;

-- Backfill: every existing household's owner becomes an active 'owner' member row.
insert into household_members (household_id, user_id, role, status)
select id, owner_id, 'owner', 'active' from households
where owner_id is not null
on conflict do nothing;

drop policy if exists "owner manages members" on household_members;
create policy "owner manages members" on household_members for all using (
  household_id in (select id from households where owner_id = auth.uid())
) with check (
  household_id in (select id from households where owner_id = auth.uid())
);

drop policy if exists "member sees own row" on household_members;
create policy "member sees own row" on household_members for select using (
  user_id = auth.uid()
);

-- Replace owner-only RLS on every household-scoped table with membership-based RLS.
drop policy if exists "owner access" on households;
drop policy if exists "member access" on households;
create policy "member access" on households for all using (
  id in (select household_id from household_members where user_id = auth.uid() and status = 'active')
) with check (
  owner_id = auth.uid() or id in (select household_id from household_members where user_id = auth.uid() and status = 'active')
);

drop policy if exists "household access" on family_members;
create policy "household access" on family_members for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on staff;
create policy "household access" on staff for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on memory_rules;
create policy "household access" on memory_rules for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on daily_briefs;
create policy "household access" on daily_briefs for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on meal_plans;
create policy "household access" on meal_plans for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on subscriptions;
create policy "household access" on subscriptions for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on grocery_lists;
create policy "household access" on grocery_lists for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));

drop policy if exists "household access" on cook_replies;
create policy "household access" on cook_replies for all using (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active')) with check (household_id in (select household_id from household_members where user_id = auth.uid() and status = 'active'));
