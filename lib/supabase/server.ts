import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// NOTE: untyped until `npm run db:types` regenerates `types/supabase.ts`.
// The `db: { schema: 'gym' }` option pins the default schema for `.from(...)`.

interface CookieInput {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "gym" },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieInput[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't set cookies — middleware refreshes.
          }
        },
      },
    } as never,
  );
}

export async function createSupabaseServiceRoleClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: "gym" },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          /* service-role calls don't manage user cookies */
        },
      },
    } as never,
  );
}
