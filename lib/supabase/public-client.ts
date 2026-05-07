import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

interface CookieInput {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * A Supabase server client bound to the default `public` schema. Use this
 * when reading/writing rows owned by the Baby-food app (e.g. `public.profiles`)
 * — the gym app's main client is pinned to the `gym` schema.
 */
export async function createSupabasePublicServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "public" },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieInput[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* see server.ts */
          }
        },
      },
    } as never,
  );
}
