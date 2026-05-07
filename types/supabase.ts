// Generated types stub. Regenerate with `npm run db:types` once you've linked
// the Supabase project (`supabase link --project-ref <ref>`) and applied
// `supabase/migrations/0001_init.sql`.
//
// Until then, this loose `Database` shape lets the app typecheck. Replace the
// whole file with the generated output.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Row = Record<string, unknown>;

interface PassThroughTable<T extends Row = Row> {
  Row: T;
  Insert: Partial<T> & Row;
  Update: Partial<T>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: PassThroughTable<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  gym: {
    Tables: {
      chunky_tazzles: PassThroughTable;
      chunky_tazzle_members: PassThroughTable;
      chunky_tazzle_invites: PassThroughTable;
      chunky_tazzle_member_prefs: PassThroughTable;
      muscle_groups: PassThroughTable;
      equipment: PassThroughTable;
      exercises: PassThroughTable;
      exercise_muscles: PassThroughTable;
      workout_templates: PassThroughTable;
      workout_template_exercises: PassThroughTable;
      programs: PassThroughTable;
      program_workouts: PassThroughTable;
      workout_sessions: PassThroughTable;
      session_exercises: PassThroughTable;
      session_sets: PassThroughTable;
      personal_records: PassThroughTable;
      body_metrics: PassThroughTable;
      nutrition_foods: PassThroughTable;
      nutrition_meals: PassThroughTable;
      nutrition_meal_items: PassThroughTable;
      nutrition_targets: PassThroughTable;
      nutrition_recipes: PassThroughTable;
      nutrition_recipe_items: PassThroughTable;
      water_logs: PassThroughTable;
      share_links: PassThroughTable;
      push_subscriptions: PassThroughTable;
      activity_log: PassThroughTable;
      user_prefs: PassThroughTable;
      favorite_foods: PassThroughTable;
      nutrition_food_units: PassThroughTable;
      cardio_sessions: PassThroughTable;
      mobility_logs: PassThroughTable;
      notifications: PassThroughTable;
      chunky_tazzle_equipment: PassThroughTable;
      caffeine_logs: PassThroughTable;
      alcohol_logs: PassThroughTable;
      supplement_logs: PassThroughTable;
      progress_photos: PassThroughTable;
      sleep_logs: PassThroughTable;
      daily_wellness: PassThroughTable;
      reactions: PassThroughTable;
      comments: PassThroughTable;
      tazzle_challenges: PassThroughTable;
      tazzle_challenge_progress: PassThroughTable;
      strength_standards: PassThroughTable;
    };
    Views: { weekly_muscle_volume: { Row: Row; Relationships: [] } };
    Functions: {
      redeem_invite: { Args: { code: string }; Returns: string };
      is_chunky_tazzle_member: {
        Args: { tazzle: string; uid: string };
        Returns: boolean;
      };
      apply_progression: {
        Args: { template_exercise_id: string; last_session_id: string | null };
        Returns: Json;
      };
      expand_recipe_into_meal: {
        Args: { recipe: string; meal: string };
        Returns: void;
      };
      resolve_share_link: { Args: { slug: string }; Returns: Json };
      tazzle_leaderboard: {
        Args: { tazzle: string; since?: string };
        Returns: Json;
      };
      workout_streak: { Args: { uid: string }; Returns: number };
      refresh_weekly_muscle_volume: { Args: Record<string, never>; Returns: void };
      user_can_see_subject: {
        Args: { subject_kind: string; subject_id: string; uid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["gym"]["Tables"]> =
  Database["gym"]["Tables"][T]["Row"];
