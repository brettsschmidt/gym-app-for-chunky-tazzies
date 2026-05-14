import type { Metadata } from "next";
import Link from "next/link";
import { pickTylerLine } from "@/lib/hot-dogs/tyler-dialog";
import { Button } from "@/components/ui/button";
import { TylerShrine } from "./TylerShrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What does Tyler say?",
  description:
    "Tyler the Hot Dog has something to tell you. Pixel-art mascot. Real philosophy. Zero macros.",
  openGraph: {
    title: "What does Tyler say? · Chunky Tazzies",
    description:
      "Tyler the Hot Dog has something to tell you. Pixel-art mascot. Real philosophy. Zero macros.",
    images: ["/branding/mascot/tyler.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "What does Tyler say?",
    description: "Tyler the Hot Dog has something to tell you.",
    images: ["/branding/mascot/tyler.png"],
  },
};

export default function TylerShrinePage() {
  const initialLine = pickTylerLine();

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <TylerShrine initialLine={initialLine} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/signup">Join the tazzle</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back to the gym</Link>
        </Button>
      </div>

      <p className="text-muted-foreground max-w-md text-xs">
        The first rule of Hot Dog Club: you talk about Hot Dog Club.
      </p>
    </main>
  );
}
