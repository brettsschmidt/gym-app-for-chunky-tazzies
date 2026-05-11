"use client";

import Image from "next/image";
import { useEffect } from "react";
import { toast } from "sonner";
import { pickGoblinMessage } from "@/lib/goblin/messages";

const SESSION_KEY = "ct-goblin-shown-this-session";

function GoblinBubble({ message }: { message: string }) {
  return (
    <div className="bg-card text-card-foreground flex items-center gap-3 rounded-xl border p-3 shadow-lg">
      <Image
        src="/branding/mascot/sad.png"
        alt=""
        width={48}
        height={48}
        className="size-12 shrink-0 mascot-anim-goblin"
      />
      <div className="text-sm leading-snug">{message}</div>
    </div>
  );
}

/**
 * Mounted in the (app) layout for users named Brad. Has a 35% chance per page
 * load to schedule a single goblin toast 3–7 seconds after the page settles —
 * spaced out enough to feel ambient, never modal, never blocking.
 *
 * Only one goblin toast per session window so we don't carpet-bomb him.
 */
export function GoblinNudge({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    if (Math.random() > 0.35) return;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_KEY)) return;

    const delay = 3000 + Math.random() * 4000;
    const id = setTimeout(() => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
      const message = pickGoblinMessage();
      toast.custom(() => <GoblinBubble message={message} />, {
        duration: 5500,
        position: "top-center",
      });
    }, delay);
    return () => clearTimeout(id);
  }, [active]);

  return null;
}
