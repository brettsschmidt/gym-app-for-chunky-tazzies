"use client";

import { useEffect } from "react";
import { showMascot } from "./MascotToast";
import { isMascotKind } from "@/lib/mascot/messages";
import { MASCOT_FLASH_COOKIE } from "@/lib/mascot/cookie-name";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function MascotListener() {
  useEffect(() => {
    const value = readCookie(MASCOT_FLASH_COOKIE);
    if (value && isMascotKind(value)) {
      showMascot(value);
      clearCookie(MASCOT_FLASH_COOKIE);
    }
  }, []);
  return null;
}
