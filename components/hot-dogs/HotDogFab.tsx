"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logHotDogAction } from "@/lib/actions/hot-dogs";

const QUICK_COUNTS = [1, 2, 3, 5, 10];

export function HotDogFab() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [pending, startTransition] = useTransition();

  function submit(n: number) {
    const fd = new FormData();
    fd.set("count", String(n));
    startTransition(async () => {
      const res = await logHotDogAction(fd);
      if (res.ok) {
        toast.success(`🌭 Logged ${res.count} hot dog${res.count === 1 ? "" : "s"}`);
        setOpen(false);
        setCount(1);
      } else if (res.error === "no_active_tazzle") {
        toast.error("Pick or create a tazzle first.");
      } else {
        toast.error("Couldn't log it. Try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Log hot dog"
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center rounded-full text-3xl shadow-lg ring-4 ring-background transition-transform active:scale-95 md:bottom-6"
      >
        🌭
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🌭 Log hot dog</DialogTitle>
            <DialogDescription className="text-center">
              How many did you put down?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={pending || count <= 1}
                aria-label="decrement count"
              >
                −
              </Button>
              <div className="w-20 text-center text-4xl font-bold tabular-nums">
                {count}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCount((c) => Math.min(100, c + 1))}
                disabled={pending || count >= 100}
                aria-label="increment count"
              >
                +
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_COUNTS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={count === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCount(n)}
                  disabled={pending}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full"
              onClick={() => submit(count)}
              disabled={pending}
            >
              {pending ? "Logging…" : `Log ${count} 🌭`}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/hotdogs" onClick={() => setOpen(false)}>
                See stats
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
