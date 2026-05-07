"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface CommandItem {
  id: string;
  label: string;
  href: string;
  category: "exercise" | "food" | "session" | "page" | "recipe";
}

const STATIC_PAGES: CommandItem[] = [
  { id: "p-dash", label: "Dashboard", href: "/dashboard", category: "page" },
  { id: "p-sess", label: "Sessions", href: "/sessions", category: "page" },
  { id: "p-wo", label: "Workouts", href: "/workouts", category: "page" },
  { id: "p-pgm", label: "Programs", href: "/programs", category: "page" },
  { id: "p-ex", label: "Exercises", href: "/exercises", category: "page" },
  { id: "p-nutr", label: "Nutrition", href: "/nutrition", category: "page" },
  { id: "p-foods", label: "Foods", href: "/nutrition/foods", category: "page" },
  { id: "p-met", label: "Metrics", href: "/metrics", category: "page" },
  { id: "p-vol", label: "Volume", href: "/metrics/volume", category: "page" },
  { id: "p-std", label: "Strength standards", href: "/metrics/standards", category: "page" },
  { id: "p-set", label: "Settings", href: "/settings", category: "page" },
];

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const all = useMemo(() => [...STATIC_PAGES, ...items], [items]);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all.slice(0, 30);
    return all
      .filter((it) => it.label.toLowerCase().includes(needle))
      .slice(0, 50);
  }, [q, all]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground size-4" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises, foods, pages…"
            className="border-0 px-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches[0]) go(matches[0].href);
            }}
          />
          <kbd className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
            ⌘K
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1">
          {matches.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">
              No matches.
            </li>
          ) : (
            matches.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => go(m.href)}
                  className="hover:bg-accent flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm"
                >
                  <span>{m.label}</span>
                  <span className="text-muted-foreground text-xs uppercase">
                    {m.category}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
