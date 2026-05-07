import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-client";
import { listMyTazzles } from "@/lib/queries/chunky-tazzles";
import { getActiveTazzleId, setActiveTazzleId } from "@/lib/active-tazzle";
import { BottomNav, SideNav } from "@/components/nav/BottomNav";
import { TazzleSwitcher } from "@/components/nav/TazzleSwitcher";
import { UserMenu } from "@/components/nav/UserMenu";

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

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="bg-card safe-top sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-2">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Dumbbell className="text-primary size-5" />
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
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
