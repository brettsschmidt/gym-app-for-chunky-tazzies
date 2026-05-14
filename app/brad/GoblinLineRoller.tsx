"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { GOBLIN_MESSAGES } from "@/lib/goblin/messages";

function pickDifferent(current: string): string {
  if (GOBLIN_MESSAGES.length <= 1) return GOBLIN_MESSAGES[0];
  let next = current;
  while (next === current) {
    next = GOBLIN_MESSAGES[Math.floor(Math.random() * GOBLIN_MESSAGES.length)];
  }
  return next;
}

export function GoblinLineRoller({ initialLine }: { initialLine: string }) {
  const [line, setLine] = useState(initialLine);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-3">
      <blockquote className="text-balance max-w-lg text-lg italic leading-snug sm:text-xl">
        “{line}”
      </blockquote>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => setLine(pickDifferent(line)))}
      >
        🪙 another whisper
      </Button>
    </div>
  );
}
