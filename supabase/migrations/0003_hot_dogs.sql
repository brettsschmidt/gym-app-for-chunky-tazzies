-- =============================================================================
-- 0003_hot_dogs.sql — first-class hot-dog logging for the tazzle
-- =============================================================================

create table if not exists gym.hot_dog_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  count smallint not null default 1 check (count > 0 and count <= 100),
  notes text,
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists hot_dog_logs_user_idx on gym.hot_dog_logs(user_id, eaten_at desc);
create index if not exists hot_dog_logs_tazzle_idx on gym.hot_dog_logs(chunky_tazzle_id, eaten_at desc);

alter table gym.hot_dog_logs enable row level security;

do $$ begin
  create policy "hotdogs members read" on gym.hot_dog_logs for select
    using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hotdogs self write" on gym.hot_dog_logs for all
    using (user_id = auth.uid()
           and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
    with check (user_id = auth.uid()
                and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;
