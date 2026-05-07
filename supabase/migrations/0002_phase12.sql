-- =============================================================================
-- 0002_phase12.sql — 50 follow-on features for chunky tazzies.
--
-- Adds:
--   * Set-level metadata (kind, parent, notes, failure marker, RIR)
--   * Tempo on template exercises; deload + phase on programs
--   * Cardio + mobility logging
--   * Notifications, equipment availability, custom serving units
--   * Caffeine / alcohol / supplement / sleep / wellness logs
--   * Progress photos, reactions, comments, leaderboards, challenges
--   * App-wide user prefs (theme, units, timezone) and favorite foods
--   * weekly_muscle_volume materialized view + nightly refresh helper
--
-- Idempotent so it can be re-applied safely.
-- =============================================================================

set search_path = public;

-- =============================================================================
-- ENUMS
-- =============================================================================
do $$ begin
  create type gym.set_kind as enum (
    'working', 'warmup', 'drop', 'cluster', 'rest_pause', 'amrap'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.cardio_mode as enum (
    'run', 'bike', 'row', 'swim', 'walk', 'hike', 'elliptical',
    'stairmaster', 'jump_rope', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.photo_angle as enum ('front', 'side', 'back', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.reaction_kind as enum (
    'flex', 'fire', 'clap', 'goat', 'thumbs_up', 'heart'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.feed_subject as enum (
    'workout_session', 'nutrition_meal', 'nutrition_recipe', 'personal_record'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.challenge_metric as enum (
    'volume_kg', 'session_count', 'streak_days', 'pr_count', 'macro_target_days'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.theme_pref as enum ('light', 'dark', 'auto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.notification_kind as enum (
    'pr_hit', 'tazzle_session', 'tazzle_meal', 'tazzle_pr',
    'streak_at_risk', 'challenge_progress', 'comment_reply',
    'reaction_received', 'progression_stalled'
  );
exception when duplicate_object then null; end $$;

-- =============================================================================
-- COLUMN ADDITIONS to existing tables
-- =============================================================================
alter table gym.session_sets
  add column if not exists set_kind gym.set_kind not null default 'working',
  add column if not exists parent_set_id uuid references gym.session_sets(id) on delete cascade,
  add column if not exists notes text,
  add column if not exists failed_at_set boolean not null default false,
  add column if not exists rir smallint check (rir is null or (rir >= 0 and rir <= 10));

create index if not exists session_sets_parent_idx on gym.session_sets(parent_set_id);

-- Backfill: existing warmup rows
update gym.session_sets set set_kind = 'warmup'
  where is_warmup = true and set_kind = 'working';

alter table gym.workout_template_exercises
  add column if not exists tempo text;

alter table gym.program_workouts
  add column if not exists is_deload boolean not null default false;

alter table gym.programs
  add column if not exists phase text
    check (phase is null or phase in ('accumulation','intensification','realization','deload'));

-- =============================================================================
-- USER-LEVEL PREFERENCES (app-wide, complement per-tazzle prefs)
-- =============================================================================
create table if not exists gym.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  units gym.unit_pref not null default 'metric',
  theme gym.theme_pref not null default 'auto',
  timezone text not null default 'UTC',
  weekly_session_target smallint not null default 4,
  hydration_target_ml integer,
  caffeine_cap_mg integer not null default 400,
  goal text check (goal is null or goal in ('strength','hypertrophy','general','cut','bulk','maintain')),
  experience text check (experience is null or experience in ('beginner','intermediate','advanced')),
  birth_date date,
  sex text check (sex is null or sex in ('male','female','other')),
  height_cm numeric(5,1),
  onboarded_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger user_prefs_touch before update on gym.user_prefs
  for each row execute function gym.touch_updated_at();

alter table gym.user_prefs enable row level security;

do $$ begin
  create policy "user_prefs self" on gym.user_prefs for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- FAVORITE FOODS
-- =============================================================================
create table if not exists gym.favorite_foods (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null references gym.nutrition_foods(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table gym.favorite_foods enable row level security;

do $$ begin
  create policy "favorite_foods self" on gym.favorite_foods for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- CUSTOM SERVING UNITS for foods (e.g. "1 scoop = 30g")
-- =============================================================================
create table if not exists gym.nutrition_food_units (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references gym.nutrition_foods(id) on delete cascade,
  label text not null,
  grams numeric(8,2) not null check (grams > 0),
  created_at timestamptz not null default now(),
  unique (food_id, label)
);

alter table gym.nutrition_food_units enable row level security;

do $$ begin
  create policy "food_units read all" on gym.nutrition_food_units for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "food_units write by food owner" on gym.nutrition_food_units
    for all using (
      exists (
        select 1 from gym.nutrition_foods f
        where f.id = food_id
          and (f.created_by = auth.uid()
               or (f.chunky_tazzle_id is not null
                   and gym.is_chunky_tazzle_member(f.chunky_tazzle_id, auth.uid())))
      )
    ) with check (
      exists (
        select 1 from gym.nutrition_foods f
        where f.id = food_id
          and (f.created_by = auth.uid()
               or (f.chunky_tazzle_id is not null
                   and gym.is_chunky_tazzle_member(f.chunky_tazzle_id, auth.uid())))
      )
    );
exception when duplicate_object then null; end $$;

-- =============================================================================
-- CARDIO SESSIONS
-- =============================================================================
create table if not exists gym.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  mode gym.cardio_mode not null,
  started_at timestamptz not null default now(),
  duration_s integer check (duration_s is null or duration_s > 0),
  distance_m numeric(10,2),
  avg_hr smallint,
  max_hr smallint,
  kcal_estimate integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cardio_sessions_user_idx
  on gym.cardio_sessions(user_id, started_at desc);
create index if not exists cardio_sessions_tazzle_idx
  on gym.cardio_sessions(chunky_tazzle_id, started_at desc);

alter table gym.cardio_sessions enable row level security;

do $$ begin
  create policy "cardio members read" on gym.cardio_sessions for select
    using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "cardio self write" on gym.cardio_sessions
    for all using (user_id = auth.uid()
                   and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
    with check (user_id = auth.uid()
                and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

-- =============================================================================
-- MOBILITY LOGS
-- =============================================================================
create table if not exists gym.mobility_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  routine text not null,
  duration_s integer,
  notes text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mobility_logs_user_idx
  on gym.mobility_logs(user_id, performed_at desc);

alter table gym.mobility_logs enable row level security;

do $$ begin
  create policy "mobility members read" on gym.mobility_logs for select
    using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mobility self write" on gym.mobility_logs
    for all using (user_id = auth.uid())
    with check (user_id = auth.uid()
                and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

-- =============================================================================
-- NOTIFICATIONS (in-app feed; web-push is separate)
-- =============================================================================
create table if not exists gym.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind gym.notification_kind not null,
  title text not null,
  body text,
  subject_kind gym.feed_subject,
  subject_id uuid,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on gym.notifications(user_id, created_at desc);

alter table gym.notifications enable row level security;

do $$ begin
  create policy "notifications self" on gym.notifications for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TAZZLE EQUIPMENT AVAILABILITY
-- =============================================================================
create table if not exists gym.chunky_tazzle_equipment (
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  equipment_id integer not null references gym.equipment(id) on delete cascade,
  primary key (chunky_tazzle_id, equipment_id)
);

alter table gym.chunky_tazzle_equipment enable row level security;

do $$ begin
  create policy "tazzle_equipment members" on gym.chunky_tazzle_equipment
    for all using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
    with check (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

-- =============================================================================
-- CAFFEINE / ALCOHOL / SUPPLEMENT LOGS
-- =============================================================================
create table if not exists gym.caffeine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_mg integer not null check (amount_mg > 0),
  source text,
  logged_at timestamptz not null default now()
);
create index if not exists caffeine_logs_user_idx
  on gym.caffeine_logs(user_id, logged_at desc);
alter table gym.caffeine_logs enable row level security;
do $$ begin
  create policy "caffeine self" on gym.caffeine_logs for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

create table if not exists gym.alcohol_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  units numeric(4,1) not null check (units > 0),
  kind text,
  kcal integer,
  logged_at timestamptz not null default now()
);
create index if not exists alcohol_logs_user_idx
  on gym.alcohol_logs(user_id, logged_at desc);
alter table gym.alcohol_logs enable row level security;
do $$ begin
  create policy "alcohol self" on gym.alcohol_logs for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

create table if not exists gym.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  time_of_day text,
  logged_at timestamptz not null default now()
);
create index if not exists supplement_logs_user_idx
  on gym.supplement_logs(user_id, logged_at desc);
alter table gym.supplement_logs enable row level security;
do $$ begin
  create policy "supplement self" on gym.supplement_logs for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- PROGRESS PHOTOS
-- =============================================================================
create table if not exists gym.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at timestamptz not null default now(),
  angle gym.photo_angle not null default 'front',
  storage_path text not null,
  weight_kg numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_user_idx
  on gym.progress_photos(user_id, taken_at desc);
alter table gym.progress_photos enable row level security;
do $$ begin
  create policy "progress_photos self" on gym.progress_photos for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- SLEEP LOGS
-- =============================================================================
create table if not exists gym.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  quality smallint check (quality is null or (quality >= 1 and quality <= 5)),
  notes text,
  created_at timestamptz not null default now(),
  check (ended_at > started_at)
);
create index if not exists sleep_logs_user_idx
  on gym.sleep_logs(user_id, started_at desc);
alter table gym.sleep_logs enable row level security;
do $$ begin
  create policy "sleep_logs self" on gym.sleep_logs for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- DAILY WELLNESS (mood, stress, energy 1-5)
-- =============================================================================
create table if not exists gym.daily_wellness (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  mood smallint check (mood is null or (mood >= 1 and mood <= 5)),
  stress smallint check (stress is null or (stress >= 1 and stress <= 5)),
  energy smallint check (energy is null or (energy >= 1 and energy <= 5)),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);
create trigger daily_wellness_touch before update on gym.daily_wellness
  for each row execute function gym.touch_updated_at();
alter table gym.daily_wellness enable row level security;
do $$ begin
  create policy "wellness self" on gym.daily_wellness for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- REACTIONS
-- =============================================================================
create table if not exists gym.reactions (
  id uuid primary key default gen_random_uuid(),
  subject_kind gym.feed_subject not null,
  subject_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind gym.reaction_kind not null default 'flex',
  created_at timestamptz not null default now(),
  unique (subject_kind, subject_id, user_id, kind)
);
create index if not exists reactions_subject_idx
  on gym.reactions(subject_kind, subject_id);
alter table gym.reactions enable row level security;

create or replace function gym.user_can_see_subject(
  subject_kind gym.feed_subject, subject_id uuid, uid uuid
) returns boolean
language sql stable security definer set search_path = gym as $$
  select case subject_kind
    when 'workout_session' then exists (
      select 1 from gym.workout_sessions s
      where s.id = subject_id and gym.is_chunky_tazzle_member(s.chunky_tazzle_id, uid)
    )
    when 'nutrition_meal' then exists (
      select 1 from gym.nutrition_meals m
      where m.id = subject_id and gym.is_chunky_tazzle_member(m.chunky_tazzle_id, uid)
    )
    when 'nutrition_recipe' then exists (
      select 1 from gym.nutrition_recipes r
      where r.id = subject_id and gym.is_chunky_tazzle_member(r.chunky_tazzle_id, uid)
    )
    when 'personal_record' then exists (
      select 1 from gym.personal_records pr
      where pr.session_set_id = subject_id and pr.user_id = uid
    )
    else false
  end;
$$;

do $$ begin
  create policy "reactions read by viewers" on gym.reactions for select
    using (gym.user_can_see_subject(subject_kind, subject_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "reactions self write" on gym.reactions
    for insert with check (user_id = auth.uid()
                           and gym.user_can_see_subject(subject_kind, subject_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "reactions self delete" on gym.reactions
    for delete using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================
create table if not exists gym.comments (
  id uuid primary key default gen_random_uuid(),
  subject_kind gym.feed_subject not null,
  subject_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references gym.comments(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 4000),
  edited_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists comments_subject_idx
  on gym.comments(subject_kind, subject_id, created_at);
create index if not exists comments_parent_idx on gym.comments(parent_id);
alter table gym.comments enable row level security;

do $$ begin
  create policy "comments read by viewers" on gym.comments for select
    using (gym.user_can_see_subject(subject_kind, subject_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comments self write" on gym.comments
    for insert with check (user_id = auth.uid()
                           and gym.user_can_see_subject(subject_kind, subject_id, auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comments self update" on gym.comments
    for update using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "comments self delete" on gym.comments
    for delete using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TAZZLE CHALLENGES
-- =============================================================================
create table if not exists gym.tazzle_challenges (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  name text not null,
  description text,
  metric gym.challenge_metric not null,
  target numeric(12,2) not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists tazzle_challenges_tazzle_idx
  on gym.tazzle_challenges(chunky_tazzle_id, ends_at desc);
alter table gym.tazzle_challenges enable row level security;

do $$ begin
  create policy "challenges members crud" on gym.tazzle_challenges for all
    using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
    with check (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
exception when duplicate_object then null; end $$;

create table if not exists gym.tazzle_challenge_progress (
  challenge_id uuid not null references gym.tazzle_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_value numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create trigger challenge_progress_touch before update on gym.tazzle_challenge_progress
  for each row execute function gym.touch_updated_at();
alter table gym.tazzle_challenge_progress enable row level security;

do $$ begin
  create policy "challenge_progress members read" on gym.tazzle_challenge_progress
    for select using (
      exists (select 1 from gym.tazzle_challenges c
              where c.id = challenge_id
                and gym.is_chunky_tazzle_member(c.chunky_tazzle_id, auth.uid()))
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "challenge_progress self write" on gym.tazzle_challenge_progress
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =============================================================================
-- WEEKLY MUSCLE VOLUME (materialized view)
-- =============================================================================
drop materialized view if exists gym.weekly_muscle_volume;
create materialized view gym.weekly_muscle_volume as
select
  ws.user_id,
  ws.chunky_tazzle_id,
  date_trunc('week', ws.started_at)::date as week_start,
  em.muscle_group_id,
  count(*) filter (where ss.is_warmup = false and ss.is_completed = true) as hard_sets,
  coalesce(
    sum(ss.weight_kg * ss.reps) filter (where ss.is_warmup = false
                                          and ss.is_completed = true
                                          and ss.weight_kg is not null
                                          and ss.reps is not null),
    0
  )::numeric(12,2) as total_volume_kg
from gym.workout_sessions ws
join gym.session_exercises se on se.session_id = ws.id
join gym.session_sets ss on ss.session_exercise_id = se.id
join gym.exercise_muscles em on em.exercise_id = se.exercise_id
where ws.started_at is not null
group by ws.user_id, ws.chunky_tazzle_id,
         date_trunc('week', ws.started_at)::date, em.muscle_group_id
with no data;

create unique index if not exists weekly_muscle_volume_pk
  on gym.weekly_muscle_volume (user_id, chunky_tazzle_id, week_start, muscle_group_id);

create or replace function gym.refresh_weekly_muscle_volume()
returns void language plpgsql security definer
set search_path = gym as $$
begin
  refresh materialized view concurrently gym.weekly_muscle_volume;
exception when feature_not_supported then
  refresh materialized view gym.weekly_muscle_volume;
end;
$$;

grant select on gym.weekly_muscle_volume to anon, authenticated;

-- =============================================================================
-- STRENGTH STANDARDS lookup (static)
-- =============================================================================
create table if not exists gym.strength_standards (
  exercise_slug text not null,
  sex text not null check (sex in ('male','female')),
  bodyweight_band text not null,
  untrained numeric(6,2) not null,
  novice numeric(6,2) not null,
  intermediate numeric(6,2) not null,
  advanced numeric(6,2) not null,
  elite numeric(6,2) not null,
  primary key (exercise_slug, sex, bodyweight_band)
);

alter table gym.strength_standards enable row level security;

do $$ begin
  create policy "strength_standards read all"
    on gym.strength_standards for select using (true);
exception when duplicate_object then null; end $$;

-- Seed a small sample (kg, intermediate-ish 80kg male). Real data can be loaded later.
insert into gym.strength_standards
  (exercise_slug, sex, bodyweight_band, untrained, novice, intermediate, advanced, elite)
values
  ('back-squat',   'male', '80', 50, 80, 120, 160, 210),
  ('back-squat',   'female','60', 25, 45, 70, 95, 125),
  ('bench-press',  'male', '80', 40, 65, 95, 130, 170),
  ('bench-press',  'female','60', 20, 35, 55, 75, 100),
  ('deadlift',     'male', '80', 60, 100, 145, 185, 235),
  ('deadlift',     'female','60', 30, 55, 85, 115, 150),
  ('overhead-press','male','80', 25, 45, 65, 85, 110),
  ('overhead-press','female','60',12, 22, 35, 50, 70)
on conflict do nothing;

-- =============================================================================
-- HELPER: tazzle leaderboard rollup
-- =============================================================================
create or replace function gym.tazzle_leaderboard(
  tazzle uuid,
  since timestamptz default (now() - interval '7 days')
) returns table (
  user_id uuid,
  display_name text,
  session_count bigint,
  total_volume_kg numeric,
  set_count bigint,
  pr_count bigint
)
language sql stable security definer set search_path = gym as $$
  with sessions as (
    select ws.user_id, ws.id
    from gym.workout_sessions ws
    where ws.chunky_tazzle_id = tazzle
      and ws.started_at >= since
      and ws.completed_at is not null
  ),
  vol as (
    select s.user_id,
           count(distinct s.id) as session_count,
           coalesce(sum(ss.weight_kg * ss.reps) filter
             (where ss.is_warmup = false and ss.is_completed = true
              and ss.weight_kg is not null and ss.reps is not null), 0) as total_volume_kg,
           count(*) filter
             (where ss.is_warmup = false and ss.is_completed = true) as set_count
    from sessions s
    left join gym.session_exercises se on se.session_id = s.id
    left join gym.session_sets ss on ss.session_exercise_id = se.id
    group by s.user_id
  ),
  prs as (
    select pr.user_id, count(*) as pr_count
    from gym.personal_records pr
    where pr.achieved_at >= since
    group by pr.user_id
  )
  select v.user_id,
         coalesce(p.display_name, '') as display_name,
         v.session_count,
         v.total_volume_kg::numeric,
         v.set_count,
         coalesce(prs.pr_count, 0) as pr_count
  from vol v
  left join public.profiles p on p.id = v.user_id
  left join prs on prs.user_id = v.user_id
  where exists (select 1 from gym.chunky_tazzle_members m
                where m.chunky_tazzle_id = tazzle and m.user_id = v.user_id)
  order by v.total_volume_kg desc nulls last;
$$;

grant execute on function gym.tazzle_leaderboard(uuid, timestamptz) to authenticated;

-- =============================================================================
-- HELPER: per-user streaks (workouts per week, macro-target days)
-- =============================================================================
create or replace function gym.workout_streak(uid uuid)
returns integer
language sql stable security definer set search_path = gym as $$
  with days as (
    select distinct date_trunc('day', started_at)::date as d
    from gym.workout_sessions
    where user_id = uid and completed_at is not null
  ),
  ordered as (
    select d, d - (row_number() over (order by d desc))::int as grp
    from days
  ),
  today_or_yesterday as (
    select * from ordered
    where d >= current_date - interval '1 day'
  )
  select coalesce(count(*), 0)::int from ordered
  where grp = (select grp from today_or_yesterday limit 1);
$$;
grant execute on function gym.workout_streak(uuid) to authenticated;

-- =============================================================================
-- DONE
-- =============================================================================
