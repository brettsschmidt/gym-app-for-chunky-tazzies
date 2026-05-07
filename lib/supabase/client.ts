"use client";

import { createBrowserClient } from "@supabase/ssr";

// NOTE: once you've run `npm run db:types`, the generated Database type can be
// re-introduced via `createBrowserClient<Database>(...)`. Until then we use the
// untyped client to keep the schema-pinning option ergonomic.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "gym" } } as never,
  );
}
