"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribes to a tazzle's session + meal feed and refreshes the route when
 * something new lands. Mount once per page that needs live updates.
 */
export function RealtimeRefresher({
  tazzleId,
  channels = ["sessions", "meals"],
}: {
  tazzleId: string;
  channels?: Array<"sessions" | "meals" | "sets">;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`tazzle:${tazzleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "gym",
          table: channels.includes("sessions") ? "workout_sessions" : "noop",
          filter: `chunky_tazzle_id=eq.${tazzleId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "gym",
          table: channels.includes("meals") ? "nutrition_meals" : "noop",
          filter: `chunky_tazzle_id=eq.${tazzleId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tazzleId, router, channels]);

  return null;
}
