// Server-side flash mechanism for the mascot toast. The action drops a
// short-lived cookie; the client <MascotListener> reads it once, clears it,
// and fires a Sonner toast — entirely outside the form submission's redirect
// path so it never blocks UX.
//
// Note: keep imports here server-only. The cookie name is in
// `cookie-name.ts` so client code can read it without pulling in next/headers.

import { cookies } from "next/headers";
import type { MascotKind } from "./messages";
import { MASCOT_FLASH_COOKIE } from "./cookie-name";

export async function flashMascot(kind: MascotKind) {
  try {
    const c = await cookies();
    c.set(MASCOT_FLASH_COOKIE, kind, {
      path: "/",
      maxAge: 30,
      sameSite: "lax",
      httpOnly: false,
    });
  } catch {
    // server components can't write cookies; ignore — only call from actions
  }
}
