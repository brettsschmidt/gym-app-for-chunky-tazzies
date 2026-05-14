import type { Metadata } from "next";
import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";
import { pickGoblinMessage } from "@/lib/goblin/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BradIdleSprite } from "@/components/mascot/BradIdleSprite";
import { GoblinLineRoller } from "./GoblinLineRoller";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brad — the Goblin Pact",
  description:
    "Brad. The lore is patient. Sign the pact. Hoard the gains. Eat the dog.",
  openGraph: {
    title: "Brad — the Goblin Pact · Chunky Tazzies",
    description:
      "Brad. The lore is patient. Sign the pact. Hoard the gains. Eat the dog.",
    images: ["/branding/mascot/brad.png"],
  },
  twitter: {
    card: "summary",
    title: "Brad — the Goblin Pact",
    description: "The Goblin Council of Snargleth is expecting you.",
    images: ["/branding/mascot/brad.png"],
  },
};

const errorMessages: Record<string, string> = {
  email_taken: "That email already belongs to a goblin.",
  invalid_input: "The pact requires every line. Check the form.",
  weak_password: "Your password is weaker than a 5-rep deadlift. Try 8+ chars.",
  rate_limited: "The Council says slow down. Try again in a minute.",
  unknown: "The cave shifted. Try again.",
};

export default async function BradSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const initialLine = pickGoblinMessage();

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <BradIdleSprite
          size={256}
          className="mascot-alive h-auto w-40 sm:w-56"
        />
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
          The Goblin Pact
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Brad. We&apos;ve been expecting you.
        </h1>
        <GoblinLineRoller initialLine={initialLine} />
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          {error && (
            <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
              {errorMessages[error] ?? errorMessages.unknown}
            </p>
          )}
          <form action={signUpAction} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Goblin name</Label>
              <Input
                id="displayName"
                name="displayName"
                required
                maxLength={60}
                defaultValue="Brad"
                placeholder="Bradglob the Beefy"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Cave address (email)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="brad@caves.gov"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Hoard password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm the pact</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              🪙 Sign the pact
            </Button>
          </form>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Already in the cave?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Crawl back in
            </Link>
            .
          </p>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Not Brad?{" "}
            <Link href="/signup" className="hover:underline">
              regular signup
            </Link>{" "}
            ·{" "}
            <Link href="/tyler" className="hover:underline">
              ask Tyler instead
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="text-muted-foreground max-w-md text-xs">
        The Council of Snargleth votes 11–0 in favor.
      </p>
    </main>
  );
}
