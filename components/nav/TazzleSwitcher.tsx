"use client";

import Link from "next/link";
import { ChevronsUpDown, Plus, Users } from "lucide-react";
import { setActiveTazzleAction } from "@/lib/actions/chunky-tazzles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TazzleSummary } from "@/lib/queries/chunky-tazzles";

export function TazzleSwitcher({
  tazzles,
  activeId,
}: {
  tazzles: TazzleSummary[];
  activeId: string | null;
}) {
  const active = tazzles.find((t) => t.id === activeId) ?? tazzles[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
        <Users className="size-4" />
        <span className="max-w-32 truncate font-medium">
          {active?.name ?? "No tazzle"}
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your tazzles</DropdownMenuLabel>
        {tazzles.length === 0 ? (
          <DropdownMenuItem disabled>None yet</DropdownMenuItem>
        ) : (
          tazzles.map((t) => (
            <form key={t.id} action={setActiveTazzleAction}>
              <input type="hidden" name="chunky_tazzle_id" value={t.id} />
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left">
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {t.member_count} member{t.member_count === 1 ? "" : "s"} ·{" "}
                      {t.role}
                    </span>
                  </span>
                </button>
              </DropdownMenuItem>
            </form>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/chunky-tazzles/new">
            <Plus className="size-4" /> New tazzle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chunky-tazzles/join">Join with code</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chunky-tazzles">Manage tazzles</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
