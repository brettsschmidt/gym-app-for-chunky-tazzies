-- Seed a persistent test user for the e2e suite.
-- Run via:
--   psql "$DATABASE_URL" -f scripts/seed-test-user.sql
-- or paste into the Supabase SQL editor.
--
-- Notes:
--   * GoTrue's row scanner can't handle NULL token columns, so we set them to ''.
--   * An entry in auth.identities is also required for password login to work.

do $$
declare
  uid uuid;
begin
  delete from auth.users where email = 'e2e-fixture@example.com';

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
    email_change, phone_change, phone_change_token, reauthentication_token
  ) values (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'e2e-fixture@example.com',
    crypt('test-password-123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"E2E Fixture"}'::jsonb,
    now(), now(),
    '', '', '', '', '', '', '', ''
  ) returning id into uid;

  insert into auth.identities (
    id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, 'email', uid::text,
    jsonb_build_object(
      'sub', uid::text,
      'email', 'e2e-fixture@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    now(), now(), now()
  );
end $$;
