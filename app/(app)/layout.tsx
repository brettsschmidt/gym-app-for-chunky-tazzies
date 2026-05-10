import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-client";
import { listMyTazzles } from "@/lib/queries/chunky-tazzles";
import { getActiveTazzleId, setActiveTazzleId } from "@/lib/active-tazzle";
import { BottomNav, SideNav } from "@/components/nav/BottomNav";
import { TazzleSwitcher } from "@/components/nav/TazzleSwitcher";
import { UserMenu } from "@/components/nav/UserMenu";
import {
  CommandPalette,
  type CommandItem,
} from "@/components/search/CommandPalette";
import { HotDogFab } from "@/components/hot-dogs/HotDogFab";
import { MascotListener } from "@/components/mascot/MascotListener";
import { GoblinNudge } from "@/components/goblin/GoblinNudge";
import { isBrad } from "@/lib/goblin/detect";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tazzles = await listMyTazzles();

  // If the active tazzle cookie is missing or stale, set it to the first one.
  let activeId = await getActiveTazzleId();
  if (tazzles.length > 0 && (!activeId || !tazzles.some((t) => t.id === activeId))) {
    activeId = tazzles[0].id;
    await setActiveTazzleId(activeId);
  }

  const pub = await createSupabasePublicServerClient();
  const { data: profile } = await pub
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Pre-fetch a small list of items for Cmd+K. Cheap because catalog tends to
  // be small per tazzle, and the palette filters in-memory.
  const paletteItems: CommandItem[] = [];
  if (activeId) {
    const { data: exs } = await supabase
      .from("exercises")
      .select("id, name")
      .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${activeId}`)
      .order("name")
      .limit(150);
    for (const e of exs ?? []) {
      paletteItems.push({
        id: `ex-${e.id}`,
        label: e.name as string,
        href: `/exercises/${e.id}`,
        category: "exercise",
      });
    }
    const { data: foods } = await supabase
      .from("nutrition_foods")
      .select("id, name")
      .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${activeId}`)
      .order("name")
      .limit(150);
    for (const f of foods ?? []) {
      paletteItems.push({
        id: `food-${f.id}`,
        label: f.name as string,
        href: `/nutrition/foods/${f.id}`,
        category: "food",
      });
    }
  }

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="bg-card safe-top sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-2">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Image
            src="/branding/logo-transparent.png"
            alt="Chunky Tazzies"
            width={32}
            height={32}
            className="size-8"
          />
          <span className="hidden sm:inline">Chunky Tazzies</span>
        </Link>
        <div className="flex items-center gap-2">
          <TazzleSwitcher tazzles={tazzles} activeId={activeId} />
          <UserMenu
            email={user.email ?? ""}
            displayName={(profile?.display_name as string) ?? null}
          />
        </div>
      </header>

      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1 pb-36 md:pb-6">{children}</main>
      </div>

      <BottomNav />
      <HotDogFab />
      <MascotListener />
      <GoblinNudge
        active={isBrad({
          displayName: (profile?.display_name as string) ?? null,
          email: user.email ?? null,
        })}
      />
      <CommandPalette items={paletteItems} />
    </div>
  );
}
