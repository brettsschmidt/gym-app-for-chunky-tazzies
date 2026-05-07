"use client";

import { useTransition } from "react";
import { toggleReactionAction } from "@/lib/actions/social";

const KINDS: Array<{ key: string; emoji: string }> = [
  { key: "flex", emoji: "💪" },
  { key: "fire", emoji: "🔥" },
  { key: "clap", emoji: "👏" },
  { key: "goat", emoji: "🐐" },
  { key: "thumbs_up", emoji: "👍" },
  { key: "heart", emoji: "❤️" },
];

export interface ReactionShape {
  id: string;
  kind: string;
  user_id: string;
}

export function Reactions({
  subjectKind,
  subjectId,
  reactions,
  myUserId,
  path,
}: {
  subjectKind: string;
  subjectId: string;
  reactions: ReactionShape[];
  myUserId: string | null;
  path: string;
}) {
  const [isPending, startTransition] = useTransition();
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of reactions) {
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
    if (r.user_id === myUserId) mine.add(r.kind);
  }

  function toggle(kind: string) {
    if (!myUserId) return;
    const fd = new FormData();
    fd.set("subject_kind", subjectKind);
    fd.set("subject_id", subjectId);
    fd.set("kind", kind);
    fd.set("path", path);
    startTransition(async () => {
      await toggleReactionAction(fd);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {KINDS.map((k) => {
        const count = counts.get(k.key) ?? 0;
        const active = mine.has(k.key);
        return (
          <button
            key={k.key}
            type="button"
            disabled={!myUserId || isPending}
            onClick={() => toggle(k.key)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
              active
                ? "bg-primary/10 border-primary text-foreground"
                : "border-input hover:bg-accent"
            }`}
          >
            <span>{k.emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
