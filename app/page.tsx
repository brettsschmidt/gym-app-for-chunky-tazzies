import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, Salad, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MascotIdleSprite } from "@/components/mascot/MascotIdleSprite";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-10 px-6 pt-16 pb-24 text-center">
      <MascotIdleSprite size={256} className="mascot-alive h-auto w-48 sm:w-64" />
      <div className="space-y-4">
        <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
          <Dumbbell className="size-4" />
          For chunky tazzies
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Lift heavy. Eat smart. Track everything.
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-lg">
          Build workout plans, log every set, dial in your macros, and share
          progress with your gym buddies — your <em>chunky tazzle</em>.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/signup">Get started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>

      <ul className="grid gap-6 pt-8 sm:grid-cols-3">
        <Feature icon={<Dumbbell className="size-5" />} title="Train">
          Templates, programs, sessions, PRs.
        </Feature>
        <Feature icon={<Salad className="size-5" />} title="Eat">
          Foods, recipes, daily macros, barcode scan.
        </Feature>
        <Feature icon={<Users className="size-5" />} title="Together">
          Invite your tazzle. Cheer each other on.
        </Feature>
      </ul>
    </main>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="bg-card flex flex-col items-center gap-2 rounded-xl border p-5 text-left">
      <div className="bg-accent/20 text-accent-foreground rounded-full p-2">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{children}</p>
    </li>
  );
}
