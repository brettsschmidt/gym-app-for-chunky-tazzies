"use client";

import { useState, useTransition } from "react";
import { TylerIdleSprite } from "@/components/mascot/TylerIdleSprite";
import { Button } from "@/components/ui/button";
import { TYLER_LINES } from "@/lib/hot-dogs/tyler-dialog";

function pickDifferent(current: string): string {
  if (TYLER_LINES.length <= 1) return TYLER_LINES[0];
  let next = current;
  while (next === current) {
    next = TYLER_LINES[Math.floor(Math.random() * TYLER_LINES.length)];
  }
  return next;
}

export function TylerShrine({ initialLine }: { initialLine: string }) {
  const [line, setLine] = useState(initialLine);
  const [count, setCount] = useState(1);
  const [pending, startTransition] = useTransition();

  function next() {
    startTransition(() => {
      setLine(pickDifferent(line));
      setCount((c) => c + 1);
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <TylerIdleSprite size={256} className="mascot-alive h-auto w-48 sm:w-64" />

      <div className="space-y-3">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Tyler · sermon #{count}
        </p>
        <blockquote className="text-balance text-2xl font-semibold leading-snug sm:text-3xl">
          “{line}”
        </blockquote>
      </div>

      <Button type="button" size="lg" onClick={next} disabled={pending}>
        🌭 Tell me another
      </Button>
    </div>
  );
}
