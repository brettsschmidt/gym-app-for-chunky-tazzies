"use client";

import { showMascot } from "@/components/mascot/MascotToast";
import { Button } from "@/components/ui/button";

export function TylerButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => showMascot("tyler")}
    >
      🌭 What does Tyler say?
    </Button>
  );
}
