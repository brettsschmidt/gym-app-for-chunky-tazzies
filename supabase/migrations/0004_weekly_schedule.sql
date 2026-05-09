-- =============================================================================
-- 0004_weekly_schedule.sql — per-user weekly workout schedule.
--
-- A user picks which workout_template runs on which day of the week, scoped to
-- a tazzle. Day numbering matches Postgres extract(dow): 0=Sunday … 6=Saturday.
-- =============================================================================

create table if not exists gym.weekly_schedules (
  user_id uuid not null references auth.users(id) on delete cascade,
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  workout_template_id uuid not null references gym.workout_templates(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, chunky_tazzle_id, day_of_week)
);

create index if not exists weekly_schedules_user_idx
  on gym.weekly_schedules(user_id, chunky_tazzle_id);

create trigger weekly_schedules_touch before update on gym.weekly_schedules
  for each row execute function gym.touch_updated_at();

alter table gym.weekly_schedules enable row level security;

do $$ begin
  create policy "schedule self" on gym.weekly_schedules for all
    using (user_id = auth.uid()
           and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
    with check (user_id = auth.uid()
                and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;
