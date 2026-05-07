-- =============================================================================
-- gym-app-for-chunky-tazzies — initial schema
--
-- Run this in the SHARED Supabase project that already hosts Baby-food.
-- It creates a dedicated `gym` schema; `public.profiles` (owned by Baby-food)
-- is referenced for identity but never modified here.
--
-- After applying:
--   1. In Supabase Dashboard → Project Settings → API → "Exposed schemas",
--      add `gym` to the list (alongside `public`).
--   2. Generate types:  npm run db:types
-- =============================================================================

create extension if not exists "pgcrypto";

create schema if not exists gym;

-- -----------------------------------------------------------------------------
-- Profiles bridge: if Baby-food's signup trigger hasn't yet created a row
-- for a brand-new user, we still want a usable handle. We never alter the
-- table here — just guarantee rows exist via a small trigger.
-- -----------------------------------------------------------------------------
create or replace function gym.ensure_profile()
returns trigger
language plpgsql
security definer
set search_path = public, gym
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists gym_ensure_profile on auth.users;
create trigger gym_ensure_profile
  after insert on auth.users
  for each row
  execute function gym.ensure_profile();

-- =============================================================================
-- ENUMS
-- =============================================================================
do $$ begin
  create type gym.tazzle_role as enum ('owner', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.pr_kind as enum ('1rm', '3rm', '5rm', 'volume', 'reps_at_weight');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.meal_type as enum (
    'breakfast', 'lunch', 'dinner', 'snack', 'preworkout', 'postworkout'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.unit_pref as enum ('metric', 'imperial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gym.share_kind as enum ('template', 'program', 'session', 'recipe');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TIMESTAMP HELPER
-- =============================================================================
create or replace function gym.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- CHUNKY TAZZLES (gym-buddy groups)
-- =============================================================================
create table if not exists gym.chunky_tazzles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  theme text default 'iron',
  timezone text default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chunky_tazzles_owner_idx on gym.chunky_tazzles(owner_id);
create trigger chunky_tazzles_touch
  before update on gym.chunky_tazzles
  for each row execute function gym.touch_updated_at();

create table if not exists gym.chunky_tazzle_members (
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role gym.tazzle_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (chunky_tazzle_id, user_id)
);
create index if not exists chunky_tazzle_members_user_idx
  on gym.chunky_tazzle_members(user_id);

create table if not exists gym.chunky_tazzle_invites (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer not null default 5 check (max_uses > 0),
  used_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists chunky_tazzle_invites_tazzle_idx
  on gym.chunky_tazzle_invites(chunky_tazzle_id);

create table if not exists gym.chunky_tazzle_member_prefs (
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default true,
  units gym.unit_pref not null default 'metric',
  primary key (chunky_tazzle_id, user_id)
);

-- After a tazzle is inserted, auto-add the owner as a member
create or replace function gym.handle_new_chunky_tazzle()
returns trigger language plpgsql security definer set search_path = gym as $$
begin
  insert into gym.chunky_tazzle_members (chunky_tazzle_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists chunky_tazzles_after_insert on gym.chunky_tazzles;
create trigger chunky_tazzles_after_insert
  after insert on gym.chunky_tazzles
  for each row execute function gym.handle_new_chunky_tazzle();

-- Membership-check helper (used by RLS across most tables)
create or replace function gym.is_chunky_tazzle_member(tazzle uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = gym
as $$
  select exists (
    select 1 from gym.chunky_tazzle_members m
    where m.chunky_tazzle_id = tazzle and m.user_id = uid
  );
$$;

create or replace function gym.is_chunky_tazzle_owner(tazzle uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = gym
as $$
  select exists (
    select 1 from gym.chunky_tazzles t
    where t.id = tazzle and t.owner_id = uid
  );
$$;

-- Redeem an invite code → adds the caller to the tazzle
create or replace function gym.redeem_invite(code text)
returns uuid
language plpgsql
security definer
set search_path = gym
as $$
declare
  inv gym.chunky_tazzle_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'must be logged in';
  end if;

  select * into inv
    from gym.chunky_tazzle_invites
    where chunky_tazzle_invites.code = redeem_invite.code
    for update;

  if not found then raise exception 'invite_not_found'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  if inv.used_count >= inv.max_uses then
    raise exception 'invite_exhausted';
  end if;

  insert into gym.chunky_tazzle_members (chunky_tazzle_id, user_id, role)
  values (inv.chunky_tazzle_id, uid, 'member')
  on conflict do nothing;

  update gym.chunky_tazzle_invites
  set used_count = used_count + 1
  where id = inv.id;

  return inv.chunky_tazzle_id;
end;
$$;

-- =============================================================================
-- TAXONOMY
-- =============================================================================
create table if not exists gym.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  body_region text not null
);

create table if not exists gym.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null
);

-- =============================================================================
-- EXERCISES
-- =============================================================================
create table if not exists gym.exercises (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid references gym.chunky_tazzles(id) on delete cascade, -- null = global
  name text not null,
  slug text,
  description text,
  instructions text,
  video_url text,
  primary_muscle_id uuid references gym.muscle_groups(id),
  equipment_id uuid references gym.equipment(id),
  is_unilateral boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists exercises_tazzle_idx on gym.exercises(chunky_tazzle_id);
create index if not exists exercises_name_trgm on gym.exercises using gin (name gin_trgm_ops);
-- (gin_trgm_ops requires pg_trgm; create the extension if missing)
create extension if not exists pg_trgm;
create trigger exercises_touch before update on gym.exercises
  for each row execute function gym.touch_updated_at();

create table if not exists gym.exercise_muscles (
  exercise_id uuid not null references gym.exercises(id) on delete cascade,
  muscle_group_id uuid not null references gym.muscle_groups(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (exercise_id, muscle_group_id)
);

-- =============================================================================
-- WORKOUT TEMPLATES
-- =============================================================================
create table if not exists gym.workout_templates (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  name text not null,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workout_templates_tazzle_idx
  on gym.workout_templates(chunky_tazzle_id);
create trigger workout_templates_touch before update on gym.workout_templates
  for each row execute function gym.touch_updated_at();

create table if not exists gym.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references gym.workout_templates(id) on delete cascade,
  exercise_id uuid not null references gym.exercises(id) on delete restrict,
  position integer not null,
  target_sets integer,
  target_reps_min integer,
  target_reps_max integer,
  target_weight_kg numeric(7,2),
  target_rpe numeric(3,1),
  rest_seconds integer,
  superset_group integer,
  -- progression_rule examples:
  --   {"kind":"linear","weight_increment_kg":2.5,"frequency":"each_session"}
  --   {"kind":"double_progression","rep_target":12,"weight_increment_kg":2.5}
  --   {"kind":"percent_1rm","percent":0.75}
  --   {"kind":"none"}
  progression_rule jsonb not null default '{"kind":"none"}'::jsonb,
  unique (workout_template_id, position)
);
create index if not exists wte_template_idx
  on gym.workout_template_exercises(workout_template_id);

-- =============================================================================
-- PROGRAMS
-- =============================================================================
create table if not exists gym.programs (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  name text not null,
  description text,
  weeks_count integer not null default 4 check (weeks_count > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger programs_touch before update on gym.programs
  for each row execute function gym.touch_updated_at();

create table if not exists gym.program_workouts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references gym.programs(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  day_of_week integer not null check (day_of_week between 0 and 6),
  workout_template_id uuid not null references gym.workout_templates(id) on delete restrict,
  position integer not null default 0,
  unique (program_id, week_number, day_of_week, position)
);

-- =============================================================================
-- WORKOUT SESSIONS (logged training)
-- =============================================================================
create table if not exists gym.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_template_id uuid references gym.workout_templates(id) on delete set null,
  program_workout_id uuid references gym.program_workouts(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  bodyweight_kg numeric(6,2),
  perceived_effort smallint check (perceived_effort between 1 and 10),
  notes text,
  updated_at timestamptz not null default now()
);
create index if not exists workout_sessions_user_started_idx
  on gym.workout_sessions(user_id, started_at desc);
create index if not exists workout_sessions_tazzle_started_idx
  on gym.workout_sessions(chunky_tazzle_id, started_at desc);
create trigger workout_sessions_touch before update on gym.workout_sessions
  for each row execute function gym.touch_updated_at();

create table if not exists gym.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references gym.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references gym.exercises(id) on delete restrict,
  position integer not null,
  notes text,
  unique (session_id, position)
);

create table if not exists gym.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references gym.session_exercises(id) on delete cascade,
  set_number integer not null,
  reps integer,
  weight_kg numeric(7,2),
  rpe numeric(3,1),
  is_warmup boolean not null default false,
  is_completed boolean not null default false,
  rest_seconds_actual integer,
  created_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

-- =============================================================================
-- PERSONAL RECORDS
-- =============================================================================
create table if not exists gym.personal_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references gym.exercises(id) on delete cascade,
  kind gym.pr_kind not null,
  value_numeric numeric(10,3) not null,
  value_secondary numeric(10,3),
  achieved_at timestamptz not null default now(),
  session_set_id uuid references gym.session_sets(id) on delete set null,
  primary key (user_id, exercise_id, kind)
);

-- 1RM via Epley (weight * (1 + reps/30))
create or replace function gym.update_personal_records(set_id uuid)
returns void
language plpgsql
security definer
set search_path = gym
as $$
declare
  s gym.session_sets%rowtype;
  se gym.session_exercises%rowtype;
  sess gym.workout_sessions%rowtype;
  est_1rm numeric;
begin
  select * into s from gym.session_sets where id = set_id;
  if not found or s.is_warmup or not s.is_completed
     or s.weight_kg is null or s.reps is null or s.reps <= 0 then
    return;
  end if;

  select * into se from gym.session_exercises where id = s.session_exercise_id;
  select * into sess from gym.workout_sessions where id = se.session_id;

  est_1rm := s.weight_kg * (1 + s.reps::numeric / 30);

  -- 1RM (estimated)
  insert into gym.personal_records
    (user_id, exercise_id, kind, value_numeric, achieved_at, session_set_id)
  values (sess.user_id, se.exercise_id, '1rm', est_1rm, now(), s.id)
  on conflict (user_id, exercise_id, kind) do update
    set value_numeric = excluded.value_numeric,
        achieved_at = excluded.achieved_at,
        session_set_id = excluded.session_set_id
    where excluded.value_numeric > gym.personal_records.value_numeric;

  -- reps_at_weight (max reps at the given weight)
  insert into gym.personal_records
    (user_id, exercise_id, kind, value_numeric, value_secondary, achieved_at, session_set_id)
  values (sess.user_id, se.exercise_id, 'reps_at_weight',
          s.reps, s.weight_kg, now(), s.id)
  on conflict (user_id, exercise_id, kind) do update
    set value_numeric = excluded.value_numeric,
        value_secondary = excluded.value_secondary,
        achieved_at = excluded.achieved_at,
        session_set_id = excluded.session_set_id
    where (excluded.value_secondary, excluded.value_numeric)
        > (gym.personal_records.value_secondary, gym.personal_records.value_numeric);
end;
$$;

create or replace function gym.session_sets_pr_trigger()
returns trigger language plpgsql as $$
begin
  perform gym.update_personal_records(new.id);
  return new;
end;
$$;

drop trigger if exists session_sets_after_pr on gym.session_sets;
create trigger session_sets_after_pr
  after insert or update on gym.session_sets
  for each row execute function gym.session_sets_pr_trigger();

-- Read the previous session for a template-exercise (used by progression preview)
create or replace function gym.last_session_sets_for_template_exercise(
  template_exercise_id uuid,
  for_user uuid
)
returns table (
  reps integer,
  weight_kg numeric,
  rpe numeric,
  is_completed boolean
)
language sql stable security definer set search_path = gym as $$
  with wte as (
    select exercise_id, workout_template_id from gym.workout_template_exercises
    where id = template_exercise_id
  ),
  last_session as (
    select s.id from gym.workout_sessions s, wte
    where s.user_id = for_user
      and s.workout_template_id = wte.workout_template_id
      and s.completed_at is not null
    order by s.completed_at desc
    limit 1
  )
  select ss.reps, ss.weight_kg, ss.rpe, ss.is_completed
  from gym.session_sets ss
  join gym.session_exercises se on se.id = ss.session_exercise_id
  join wte on wte.exercise_id = se.exercise_id
  join last_session ls on ls.id = se.session_id
  where not ss.is_warmup
  order by ss.set_number;
$$;

-- Progression resolver: returns suggested next-session targets as JSON
create or replace function gym.apply_progression(
  template_exercise_id uuid,
  last_session_id uuid
)
returns jsonb
language plpgsql stable security definer set search_path = gym as $$
declare
  wte gym.workout_template_exercises%rowtype;
  rule jsonb;
  kind text;
  best_weight numeric;
  best_reps integer;
  bumped_weight numeric;
  uid uuid := auth.uid();
begin
  select * into wte from gym.workout_template_exercises
   where id = template_exercise_id;
  if not found then return null; end if;

  rule := wte.progression_rule;
  kind := rule->>'kind';

  if kind is null or kind = 'none' then
    return jsonb_build_object(
      'target_weight_kg', wte.target_weight_kg,
      'target_reps_min', wte.target_reps_min,
      'target_reps_max', wte.target_reps_max
    );
  end if;

  select max(weight_kg), max(reps) into best_weight, best_reps
    from gym.last_session_sets_for_template_exercise(template_exercise_id, uid);

  if kind = 'linear' then
    bumped_weight := coalesce(best_weight, wte.target_weight_kg, 0)
                   + coalesce((rule->>'weight_increment_kg')::numeric, 2.5);
    return jsonb_build_object(
      'target_weight_kg', bumped_weight,
      'target_reps_min', wte.target_reps_min,
      'target_reps_max', wte.target_reps_max,
      'rationale', 'linear progression'
    );
  end if;

  if kind = 'double_progression' then
    if best_reps is not null
       and best_reps >= coalesce((rule->>'rep_target')::int, wte.target_reps_max) then
      bumped_weight := coalesce(best_weight, wte.target_weight_kg, 0)
                     + coalesce((rule->>'weight_increment_kg')::numeric, 2.5);
      return jsonb_build_object(
        'target_weight_kg', bumped_weight,
        'target_reps_min', wte.target_reps_min,
        'target_reps_max', wte.target_reps_max,
        'rationale', 'hit rep target — bump weight'
      );
    else
      return jsonb_build_object(
        'target_weight_kg', coalesce(best_weight, wte.target_weight_kg),
        'target_reps_min', wte.target_reps_min,
        'target_reps_max', wte.target_reps_max,
        'rationale', 'add reps before adding weight'
      );
    end if;
  end if;

  if kind = 'percent_1rm' then
    declare
      pr_val numeric;
      pct numeric := coalesce((rule->>'percent')::numeric, 0.75);
    begin
      select value_numeric into pr_val from gym.personal_records
       where user_id = uid and exercise_id = wte.exercise_id and kind = '1rm';
      if pr_val is not null then
        return jsonb_build_object(
          'target_weight_kg', round(pr_val * pct, 1),
          'target_reps_min', wte.target_reps_min,
          'target_reps_max', wte.target_reps_max,
          'rationale', format('%s%% of estimated 1RM', round(pct*100))
        );
      end if;
    end;
  end if;

  return jsonb_build_object(
    'target_weight_kg', wte.target_weight_kg,
    'target_reps_min', wte.target_reps_min,
    'target_reps_max', wte.target_reps_max
  );
end;
$$;

-- =============================================================================
-- BODY METRICS
-- =============================================================================
create table if not exists gym.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(6,2),
  body_fat_pct numeric(5,2),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  notes text
);
create index if not exists body_metrics_user_idx
  on gym.body_metrics(user_id, measured_at desc);

-- =============================================================================
-- NUTRITION
-- =============================================================================
create table if not exists gym.nutrition_foods (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid references gym.chunky_tazzles(id) on delete cascade, -- null = global
  name text not null,
  brand text,
  serving_size_g numeric(7,2) not null default 100,
  serving_label text,
  kcal numeric(7,2) not null default 0,
  protein_g numeric(6,2) not null default 0,
  carbs_g numeric(6,2) not null default 0,
  fat_g numeric(6,2) not null default 0,
  fiber_g numeric(6,2),
  sugar_g numeric(6,2),
  sodium_mg numeric(7,2),
  barcode text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nutrition_foods_tazzle_idx
  on gym.nutrition_foods(chunky_tazzle_id);
create index if not exists nutrition_foods_barcode_idx
  on gym.nutrition_foods(barcode) where barcode is not null;
create index if not exists nutrition_foods_name_trgm
  on gym.nutrition_foods using gin (name gin_trgm_ops);
create trigger nutrition_foods_touch before update on gym.nutrition_foods
  for each row execute function gym.touch_updated_at();

create table if not exists gym.nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type gym.meal_type not null default 'snack',
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nutrition_meals_user_eaten_idx
  on gym.nutrition_meals(user_id, eaten_at desc);
create index if not exists nutrition_meals_tazzle_eaten_idx
  on gym.nutrition_meals(chunky_tazzle_id, eaten_at desc);
create trigger nutrition_meals_touch before update on gym.nutrition_meals
  for each row execute function gym.touch_updated_at();

create table if not exists gym.nutrition_meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references gym.nutrition_meals(id) on delete cascade,
  food_id uuid not null references gym.nutrition_foods(id) on delete restrict,
  quantity_g numeric(7,2) not null,
  quantity_servings numeric(6,2),
  kcal_override numeric(7,2),
  position integer not null default 0,
  unique (meal_id, position)
);

create table if not exists gym.nutrition_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kcal_target integer not null default 2400,
  protein_g_target integer not null default 160,
  carbs_g_target integer not null default 280,
  fat_g_target integer not null default 70,
  fiber_g_target integer not null default 30,
  effective_from date not null default current_date,
  updated_at timestamptz not null default now()
);
create trigger nutrition_targets_touch before update on gym.nutrition_targets
  for each row execute function gym.touch_updated_at();

create table if not exists gym.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml > 0)
);
create index if not exists water_logs_user_idx
  on gym.water_logs(user_id, logged_at desc);

create table if not exists gym.nutrition_recipes (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  name text not null,
  description text,
  servings_yield numeric(5,2) not null default 1 check (servings_yield > 0),
  photo_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger nutrition_recipes_touch before update on gym.nutrition_recipes
  for each row execute function gym.touch_updated_at();

create table if not exists gym.nutrition_recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references gym.nutrition_recipes(id) on delete cascade,
  food_id uuid not null references gym.nutrition_foods(id) on delete restrict,
  quantity_g numeric(7,2) not null,
  position integer not null default 0,
  unique (recipe_id, position)
);

create or replace function gym.expand_recipe_into_meal(recipe uuid, meal uuid)
returns void
language plpgsql security definer set search_path = gym as $$
begin
  insert into gym.nutrition_meal_items (meal_id, food_id, quantity_g, position)
  select meal, ri.food_id, ri.quantity_g, ri.position
    from gym.nutrition_recipe_items ri
   where ri.recipe_id = recipe;
end;
$$;

-- =============================================================================
-- SHARE LINKS
-- =============================================================================
create table if not exists gym.share_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind gym.share_kind not null,
  subject_id uuid not null,
  chunky_tazzle_id uuid references gym.chunky_tazzles(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  view_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists share_links_kind_subject_idx
  on gym.share_links(kind, subject_id);

create or replace function gym.resolve_share_link(slug text)
returns jsonb
language plpgsql security definer set search_path = gym as $$
declare
  link gym.share_links%rowtype;
  payload jsonb;
begin
  select * into link from gym.share_links
   where share_links.slug = resolve_share_link.slug;

  if not found
     or link.revoked_at is not null
     or (link.expires_at is not null and link.expires_at < now()) then
    return null;
  end if;

  update gym.share_links set view_count = view_count + 1 where id = link.id;

  if link.kind = 'template' then
    select jsonb_build_object(
      'kind', 'template',
      'template', to_jsonb(t.*),
      'lines', coalesce(jsonb_agg(to_jsonb(l.*) order by l.position) filter (where l.id is not null), '[]'::jsonb)
    ) into payload
    from gym.workout_templates t
    left join gym.workout_template_exercises l on l.workout_template_id = t.id
    where t.id = link.subject_id
    group by t.id;
  elsif link.kind = 'program' then
    select jsonb_build_object(
      'kind', 'program',
      'program', to_jsonb(p.*),
      'workouts', coalesce(jsonb_agg(to_jsonb(pw.*)) filter (where pw.id is not null), '[]'::jsonb)
    ) into payload
    from gym.programs p
    left join gym.program_workouts pw on pw.program_id = p.id
    where p.id = link.subject_id
    group by p.id;
  elsif link.kind = 'session' then
    select jsonb_build_object(
      'kind', 'session',
      'session', to_jsonb(s.*)
    ) into payload
    from gym.workout_sessions s
    where s.id = link.subject_id;
  elsif link.kind = 'recipe' then
    select jsonb_build_object(
      'kind', 'recipe',
      'recipe', to_jsonb(r.*),
      'items', coalesce(jsonb_agg(to_jsonb(ri.*) order by ri.position) filter (where ri.id is not null), '[]'::jsonb)
    ) into payload
    from gym.nutrition_recipes r
    left join gym.nutrition_recipe_items ri on ri.recipe_id = r.id
    where r.id = link.subject_id
    group by r.id;
  end if;

  return payload;
end;
$$;

-- =============================================================================
-- PUSH SUBSCRIPTIONS + ACTIVITY LOG
-- =============================================================================
create table if not exists gym.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx
  on gym.push_subscriptions(user_id);

create table if not exists gym.activity_log (
  id uuid primary key default gen_random_uuid(),
  chunky_tazzle_id uuid not null references gym.chunky_tazzles(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_table text,
  subject_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_tazzle_idx
  on gym.activity_log(chunky_tazzle_id, created_at desc);

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================
alter table gym.chunky_tazzles enable row level security;
alter table gym.chunky_tazzle_members enable row level security;
alter table gym.chunky_tazzle_invites enable row level security;
alter table gym.chunky_tazzle_member_prefs enable row level security;
alter table gym.muscle_groups enable row level security;
alter table gym.equipment enable row level security;
alter table gym.exercises enable row level security;
alter table gym.exercise_muscles enable row level security;
alter table gym.workout_templates enable row level security;
alter table gym.workout_template_exercises enable row level security;
alter table gym.programs enable row level security;
alter table gym.program_workouts enable row level security;
alter table gym.workout_sessions enable row level security;
alter table gym.session_exercises enable row level security;
alter table gym.session_sets enable row level security;
alter table gym.personal_records enable row level security;
alter table gym.body_metrics enable row level security;
alter table gym.nutrition_foods enable row level security;
alter table gym.nutrition_meals enable row level security;
alter table gym.nutrition_meal_items enable row level security;
alter table gym.nutrition_targets enable row level security;
alter table gym.nutrition_recipes enable row level security;
alter table gym.nutrition_recipe_items enable row level security;
alter table gym.water_logs enable row level security;
alter table gym.share_links enable row level security;
alter table gym.push_subscriptions enable row level security;
alter table gym.activity_log enable row level security;

-- chunky_tazzles
create policy "tazzles select for members"
  on gym.chunky_tazzles for select
  using (gym.is_chunky_tazzle_member(id, auth.uid()));
create policy "tazzles insert by self as owner"
  on gym.chunky_tazzles for insert
  with check (owner_id = auth.uid());
create policy "tazzles update by owner"
  on gym.chunky_tazzles for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "tazzles delete by owner"
  on gym.chunky_tazzles for delete using (owner_id = auth.uid());

-- chunky_tazzle_members
create policy "tazzle_members select for fellow members"
  on gym.chunky_tazzle_members for select
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "tazzle_members delete self or owner-driven"
  on gym.chunky_tazzle_members for delete
  using (user_id = auth.uid()
         or gym.is_chunky_tazzle_owner(chunky_tazzle_id, auth.uid()));
-- inserts go through the redeem_invite RPC (security definer), no policy needed

-- chunky_tazzle_invites
create policy "invites select for members"
  on gym.chunky_tazzle_invites for select
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "invites insert by members"
  on gym.chunky_tazzle_invites for insert
  with check (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid())
              and created_by = auth.uid());
create policy "invites delete by creator or owner"
  on gym.chunky_tazzle_invites for delete
  using (created_by = auth.uid()
         or gym.is_chunky_tazzle_owner(chunky_tazzle_id, auth.uid()));

-- chunky_tazzle_member_prefs
create policy "prefs self read"
  on gym.chunky_tazzle_member_prefs for select using (user_id = auth.uid());
create policy "prefs self upsert"
  on gym.chunky_tazzle_member_prefs for insert with check (user_id = auth.uid());
create policy "prefs self update"
  on gym.chunky_tazzle_member_prefs for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- taxonomies (publicly readable, no writes from clients)
create policy "muscle_groups read all" on gym.muscle_groups for select using (true);
create policy "equipment read all" on gym.equipment for select using (true);

-- exercises (global library OR tazzle-scoped)
create policy "exercises select global or member"
  on gym.exercises for select
  using (chunky_tazzle_id is null
         or gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "exercises insert by tazzle members"
  on gym.exercises for insert
  with check (chunky_tazzle_id is not null
              and created_by = auth.uid()
              and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "exercises update by creator"
  on gym.exercises for update
  using (created_by = auth.uid()
         and chunky_tazzle_id is not null
         and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "exercises delete by creator"
  on gym.exercises for delete
  using (created_by = auth.uid() and chunky_tazzle_id is not null);

create policy "exercise_muscles read all" on gym.exercise_muscles for select using (true);
create policy "exercise_muscles write by exercise creator"
  on gym.exercise_muscles for all
  using (exists (select 1 from gym.exercises e
                 where e.id = exercise_id and e.created_by = auth.uid()))
  with check (exists (select 1 from gym.exercises e
                      where e.id = exercise_id and e.created_by = auth.uid()));

-- workout_templates / workout_template_exercises
create policy "templates members crud"
  on gym.workout_templates for all
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
  with check (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));

create policy "template_lines members crud"
  on gym.workout_template_exercises for all
  using (exists (select 1 from gym.workout_templates t
                 where t.id = workout_template_id
                   and gym.is_chunky_tazzle_member(t.chunky_tazzle_id, auth.uid())))
  with check (exists (select 1 from gym.workout_templates t
                      where t.id = workout_template_id
                        and gym.is_chunky_tazzle_member(t.chunky_tazzle_id, auth.uid())));

-- programs / program_workouts
create policy "programs members crud"
  on gym.programs for all
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()))
  with check (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));

create policy "program_workouts members crud"
  on gym.program_workouts for all
  using (exists (select 1 from gym.programs p
                 where p.id = program_id
                   and gym.is_chunky_tazzle_member(p.chunky_tazzle_id, auth.uid())))
  with check (exists (select 1 from gym.programs p
                      where p.id = program_id
                        and gym.is_chunky_tazzle_member(p.chunky_tazzle_id, auth.uid())));

-- workout_sessions / session_exercises / session_sets
create policy "sessions members read"
  on gym.workout_sessions for select
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "sessions self write"
  on gym.workout_sessions for insert
  with check (user_id = auth.uid()
              and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "sessions self update"
  on gym.workout_sessions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sessions self delete"
  on gym.workout_sessions for delete using (user_id = auth.uid());

create policy "session_exercises members read"
  on gym.session_exercises for select
  using (exists (select 1 from gym.workout_sessions s
                 where s.id = session_id
                   and gym.is_chunky_tazzle_member(s.chunky_tazzle_id, auth.uid())));
create policy "session_exercises owner write"
  on gym.session_exercises for all
  using (exists (select 1 from gym.workout_sessions s
                 where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from gym.workout_sessions s
                      where s.id = session_id and s.user_id = auth.uid()));

create policy "session_sets members read"
  on gym.session_sets for select
  using (exists (select 1 from gym.session_exercises se
                 join gym.workout_sessions s on s.id = se.session_id
                 where se.id = session_exercise_id
                   and gym.is_chunky_tazzle_member(s.chunky_tazzle_id, auth.uid())));
create policy "session_sets owner write"
  on gym.session_sets for all
  using (exists (select 1 from gym.session_exercises se
                 join gym.workout_sessions s on s.id = se.session_id
                 where se.id = session_exercise_id and s.user_id = auth.uid()))
  with check (exists (select 1 from gym.session_exercises se
                      join gym.workout_sessions s on s.id = se.session_id
                      where se.id = session_exercise_id and s.user_id = auth.uid()));

-- per-user
create policy "prs self" on gym.personal_records for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "body_metrics self" on gym.body_metrics for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "targets self" on gym.nutrition_targets for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "water self" on gym.water_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push_subs self" on gym.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- nutrition_foods (global library OR tazzle-scoped)
create policy "foods select global or member"
  on gym.nutrition_foods for select
  using (chunky_tazzle_id is null
         or gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "foods insert by tazzle member"
  on gym.nutrition_foods for insert
  with check (chunky_tazzle_id is not null
              and created_by = auth.uid()
              and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "foods update by creator"
  on gym.nutrition_foods for update
  using (created_by = auth.uid() and chunky_tazzle_id is not null);
create policy "foods delete by creator"
  on gym.nutrition_foods for delete
  using (created_by = auth.uid() and chunky_tazzle_id is not null);

-- nutrition_meals + items
create policy "meals self read or tazzle feed"
  on gym.nutrition_meals for select
  using (user_id = auth.uid()
         or gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "meals self write"
  on gym.nutrition_meals for insert
  with check (user_id = auth.uid()
              and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "meals self update"
  on gym.nutrition_meals for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meals self delete"
  on gym.nutrition_meals for delete using (user_id = auth.uid());

create policy "meal_items via parent"
  on gym.nutrition_meal_items for all
  using (exists (select 1 from gym.nutrition_meals m
                 where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from gym.nutrition_meals m
                      where m.id = meal_id and m.user_id = auth.uid()));

-- recipes / recipe_items
create policy "recipes members read"
  on gym.nutrition_recipes for select
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "recipes member write"
  on gym.nutrition_recipes for insert
  with check (created_by = auth.uid()
              and gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));
create policy "recipes creator update"
  on gym.nutrition_recipes for update
  using (created_by = auth.uid()
         or gym.is_chunky_tazzle_owner(chunky_tazzle_id, auth.uid()));
create policy "recipes creator delete"
  on gym.nutrition_recipes for delete
  using (created_by = auth.uid()
         or gym.is_chunky_tazzle_owner(chunky_tazzle_id, auth.uid()));

create policy "recipe_items via parent"
  on gym.nutrition_recipe_items for all
  using (exists (select 1 from gym.nutrition_recipes r
                 where r.id = recipe_id
                   and gym.is_chunky_tazzle_member(r.chunky_tazzle_id, auth.uid())))
  with check (exists (select 1 from gym.nutrition_recipes r
                      where r.id = recipe_id
                        and (r.created_by = auth.uid()
                             or gym.is_chunky_tazzle_owner(r.chunky_tazzle_id, auth.uid()))));

-- share_links
create policy "share_links creator manage"
  on gym.share_links for all
  using (created_by = auth.uid()
         or (chunky_tazzle_id is not null
             and gym.is_chunky_tazzle_owner(chunky_tazzle_id, auth.uid())))
  with check (created_by = auth.uid());

-- activity_log (read for tazzle members, no client writes)
create policy "activity members read"
  on gym.activity_log for select
  using (gym.is_chunky_tazzle_member(chunky_tazzle_id, auth.uid()));

-- =============================================================================
-- SEED DATA
-- =============================================================================
insert into gym.muscle_groups (slug, name, body_region) values
  ('chest', 'Chest', 'upper'),
  ('back', 'Back', 'upper'),
  ('lats', 'Lats', 'upper'),
  ('traps', 'Traps', 'upper'),
  ('shoulders', 'Shoulders', 'upper'),
  ('side-delts', 'Side Delts', 'upper'),
  ('rear-delts', 'Rear Delts', 'upper'),
  ('biceps', 'Biceps', 'upper'),
  ('triceps', 'Triceps', 'upper'),
  ('forearms', 'Forearms', 'upper'),
  ('core', 'Core', 'core'),
  ('obliques', 'Obliques', 'core'),
  ('lower-back', 'Lower Back', 'core'),
  ('quads', 'Quads', 'lower'),
  ('hamstrings', 'Hamstrings', 'lower'),
  ('glutes', 'Glutes', 'lower'),
  ('adductors', 'Adductors', 'lower'),
  ('calves', 'Calves', 'lower'),
  ('hip-flexors', 'Hip Flexors', 'lower'),
  ('full-body', 'Full Body', 'full')
on conflict (slug) do nothing;

insert into gym.equipment (slug, name, category) values
  ('barbell', 'Barbell', 'free-weight'),
  ('dumbbell', 'Dumbbell', 'free-weight'),
  ('kettlebell', 'Kettlebell', 'free-weight'),
  ('cable', 'Cable Stack', 'machine'),
  ('machine', 'Machine', 'machine'),
  ('smith', 'Smith Machine', 'machine'),
  ('bodyweight', 'Bodyweight', 'bodyweight'),
  ('bands', 'Resistance Bands', 'band'),
  ('trx', 'TRX / Suspension', 'band'),
  ('plate', 'Weight Plate', 'free-weight'),
  ('ez-bar', 'EZ Bar', 'free-weight'),
  ('trap-bar', 'Trap Bar', 'free-weight'),
  ('pull-up-bar', 'Pull-Up Bar', 'bodyweight'),
  ('bench', 'Bench', 'accessory'),
  ('rack', 'Power Rack', 'accessory')
on conflict (slug) do nothing;

-- ~50 starter exercises (global library; chunky_tazzle_id = null)
with mg as (select id, slug from gym.muscle_groups),
     eq as (select id, slug from gym.equipment)
insert into gym.exercises (chunky_tazzle_id, name, slug, primary_muscle_id, equipment_id, is_unilateral)
select null, x.name, x.slug, mg.id, eq.id, x.uni
from (values
  ('Back Squat', 'back-squat', 'quads', 'barbell', false),
  ('Front Squat', 'front-squat', 'quads', 'barbell', false),
  ('Goblet Squat', 'goblet-squat', 'quads', 'dumbbell', false),
  ('Bulgarian Split Squat', 'bulgarian-split-squat', 'quads', 'dumbbell', true),
  ('Conventional Deadlift', 'conventional-deadlift', 'hamstrings', 'barbell', false),
  ('Romanian Deadlift', 'romanian-deadlift', 'hamstrings', 'barbell', false),
  ('Trap Bar Deadlift', 'trap-bar-deadlift', 'hamstrings', 'trap-bar', false),
  ('Leg Press', 'leg-press', 'quads', 'machine', false),
  ('Walking Lunge', 'walking-lunge', 'quads', 'dumbbell', true),
  ('Hip Thrust', 'hip-thrust', 'glutes', 'barbell', false),
  ('Glute Bridge', 'glute-bridge', 'glutes', 'bodyweight', false),
  ('Leg Curl', 'leg-curl', 'hamstrings', 'machine', false),
  ('Leg Extension', 'leg-extension', 'quads', 'machine', false),
  ('Standing Calf Raise', 'standing-calf-raise', 'calves', 'machine', false),
  ('Seated Calf Raise', 'seated-calf-raise', 'calves', 'machine', false),

  ('Bench Press', 'bench-press', 'chest', 'barbell', false),
  ('Incline Bench Press', 'incline-bench-press', 'chest', 'barbell', false),
  ('Dumbbell Bench Press', 'dumbbell-bench-press', 'chest', 'dumbbell', false),
  ('Incline Dumbbell Press', 'incline-dumbbell-press', 'chest', 'dumbbell', false),
  ('Push-Up', 'push-up', 'chest', 'bodyweight', false),
  ('Dip', 'dip', 'chest', 'bodyweight', false),
  ('Cable Fly', 'cable-fly', 'chest', 'cable', false),
  ('Pec Deck', 'pec-deck', 'chest', 'machine', false),

  ('Overhead Press', 'overhead-press', 'shoulders', 'barbell', false),
  ('Seated Dumbbell Press', 'seated-dumbbell-press', 'shoulders', 'dumbbell', false),
  ('Lateral Raise', 'lateral-raise', 'side-delts', 'dumbbell', false),
  ('Cable Lateral Raise', 'cable-lateral-raise', 'side-delts', 'cable', true),
  ('Rear Delt Fly', 'rear-delt-fly', 'rear-delts', 'dumbbell', false),
  ('Face Pull', 'face-pull', 'rear-delts', 'cable', false),

  ('Pull-Up', 'pull-up', 'lats', 'pull-up-bar', false),
  ('Chin-Up', 'chin-up', 'lats', 'pull-up-bar', false),
  ('Lat Pulldown', 'lat-pulldown', 'lats', 'cable', false),
  ('Barbell Row', 'barbell-row', 'back', 'barbell', false),
  ('Pendlay Row', 'pendlay-row', 'back', 'barbell', false),
  ('Single-Arm Dumbbell Row', 'single-arm-db-row', 'back', 'dumbbell', true),
  ('Seated Cable Row', 'seated-cable-row', 'back', 'cable', false),
  ('T-Bar Row', 't-bar-row', 'back', 'barbell', false),
  ('Shrug', 'shrug', 'traps', 'dumbbell', false),

  ('Barbell Curl', 'barbell-curl', 'biceps', 'barbell', false),
  ('Dumbbell Curl', 'dumbbell-curl', 'biceps', 'dumbbell', false),
  ('Hammer Curl', 'hammer-curl', 'biceps', 'dumbbell', false),
  ('Preacher Curl', 'preacher-curl', 'biceps', 'ez-bar', false),
  ('Cable Curl', 'cable-curl', 'biceps', 'cable', false),

  ('Close-Grip Bench Press', 'close-grip-bench', 'triceps', 'barbell', false),
  ('Tricep Pushdown', 'tricep-pushdown', 'triceps', 'cable', false),
  ('Skull Crusher', 'skull-crusher', 'triceps', 'ez-bar', false),
  ('Overhead Tricep Extension', 'overhead-tricep-extension', 'triceps', 'dumbbell', false),

  ('Plank', 'plank', 'core', 'bodyweight', false),
  ('Hanging Leg Raise', 'hanging-leg-raise', 'core', 'pull-up-bar', false),
  ('Cable Crunch', 'cable-crunch', 'core', 'cable', false),
  ('Russian Twist', 'russian-twist', 'obliques', 'plate', false),
  ('Back Extension', 'back-extension', 'lower-back', 'machine', false),
  ('Farmer Carry', 'farmer-carry', 'forearms', 'dumbbell', false)
) as x(name, slug, muscle_slug, eq_slug, uni)
join mg on mg.slug = x.muscle_slug
join eq on eq.slug = x.eq_slug
on conflict do nothing;

-- ~30 common foods (global library; chunky_tazzle_id = null)
insert into gym.nutrition_foods
  (chunky_tazzle_id, name, brand, serving_size_g, serving_label,
   kcal, protein_g, carbs_g, fat_g, fiber_g)
values
  (null, 'Chicken Breast (raw)', null, 100, '100 g',         165, 31, 0,   3.6, 0),
  (null, 'Chicken Thigh (raw, skinless)', null, 100, '100 g',119, 19, 0,   4.5, 0),
  (null, 'Lean Ground Beef 90/10', null, 100, '100 g',       176, 20, 0,  10,   0),
  (null, 'Sirloin Steak', null, 100, '100 g',                206, 27, 0,  10,   0),
  (null, 'Salmon Fillet', null, 100, '100 g',                208, 20, 0,  13,   0),
  (null, 'Tuna (canned in water)', null, 100, '100 g',       116, 26, 0,   1,   0),
  (null, 'Whole Egg (large)', null, 50, '1 egg',              72,  6, 0.4, 5,   0),
  (null, 'Egg White (large)', null, 33, '1 white',            17,  4, 0.2, 0,   0),
  (null, 'Greek Yogurt 0%', null, 100, '100 g',               59, 10, 3.6, 0.4, 0),
  (null, 'Cottage Cheese 2%', null, 100, '100 g',             84, 11, 4,   2.3, 0),
  (null, 'Whey Protein Isolate', null, 30, '1 scoop',        120, 25, 2,   1,   0),
  (null, 'Casein Protein', null, 30, '1 scoop',              110, 24, 3,   0.5, 1),

  (null, 'Cooked White Rice', null, 100, '100 g',            130,  2.7, 28,  0.3, 0.4),
  (null, 'Cooked Brown Rice', null, 100, '100 g',            112,  2.6, 24,  0.9, 1.8),
  (null, 'Rolled Oats (dry)', null, 40, '1/2 cup',           150,  5,  27,  3,   4),
  (null, 'Sweet Potato (baked)', null, 100, '100 g',          90,  2,  21,  0.1, 3.3),
  (null, 'Russet Potato (baked)', null, 100, '100 g',         93,  2.5, 21,  0.1, 2.2),
  (null, 'Whole-Wheat Bread', null, 30, '1 slice',            81,  4,  14,  1.1, 1.9),
  (null, 'Tortilla (flour, 8")', null, 49, '1 tortilla',     147,  4,  24,  4,   1),
  (null, 'Pasta (cooked)', null, 100, '100 g',               158,  6,  31,  0.9, 1.8),
  (null, 'Banana', null, 118, '1 medium',                    105,  1.3, 27,  0.4, 3.1),
  (null, 'Apple', null, 182, '1 medium',                      95,  0.5, 25,  0.3, 4.4),
  (null, 'Blueberries', null, 100, '100 g',                   57,  0.7, 14,  0.3, 2.4),
  (null, 'Banana (frozen, 100g)', null, 100, '100 g',         89,  1.1, 23,  0.3, 2.6),

  (null, 'Broccoli (steamed)', null, 100, '100 g',            35,  2.4, 7,   0.4, 3.3),
  (null, 'Spinach (raw)', null, 30, '1 cup',                   7,  0.9, 1.1, 0.1, 0.7),
  (null, 'Mixed Greens', null, 50, '1 cup',                   10,  1,   2,   0,   1),

  (null, 'Olive Oil', null, 14, '1 tbsp',                    119,  0,  0,  13.5, 0),
  (null, 'Almond Butter', null, 16, '1 tbsp',                 98,  3.4, 3,   9,   1.6),
  (null, 'Almonds', null, 28, '1 oz',                        164,  6,  6,  14,   3.5),
  (null, 'Avocado', null, 100, '100 g',                      160,  2,  9,  15,   7);

-- =============================================================================
-- GRANTS for the 'gym' schema (so PostgREST can see it once exposed)
-- =============================================================================
grant usage on schema gym to anon, authenticated, service_role;
grant all privileges on all tables in schema gym to anon, authenticated, service_role;
grant all privileges on all sequences in schema gym to anon, authenticated, service_role;
grant execute on all functions in schema gym to anon, authenticated, service_role;

alter default privileges in schema gym
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema gym
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema gym
  grant execute on functions to anon, authenticated, service_role;
