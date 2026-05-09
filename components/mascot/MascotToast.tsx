"use client";

import Image from "next/image";
import { toast } from "sonner";
import { pickMessage, spriteFor, type MascotKind } from "@/lib/mascot/messages";

interface MascotToastProps {
  kind: MascotKind;
  message: string;
}

function MascotBubble({ kind, message }: MascotToastProps) {
  return (
    <div className="bg-card text-card-foreground flex items-center gap-3 rounded-xl border p-3 shadow-lg">
      <Image
        src={spriteFor(kind)}
        alt=""
        width={56}
        height={56}
        className="size-14 shrink-0"
      />
      <div className="text-sm leading-snug">{message}</div>
    </div>
  );
}

export function showMascot(kind: MascotKind, message?: string) {
  const text = message ?? pickMessage(kind);
  // Sonner handles the rest — no focus trap, no input blocking, auto-dismiss.
  toast.custom(() => <MascotBubble kind={kind} message={text} />, {
    duration: 3500,
    position: "top-center",
  });
}
