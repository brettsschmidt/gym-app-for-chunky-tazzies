import { cookies } from "next/headers";

const COOKIE = "ct_active_tazzle";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getActiveTazzleId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

export async function setActiveTazzleId(id: string) {
  const c = await cookies();
  c.set(COOKIE, id, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: false,
  });
}

export async function clearActiveTazzleId() {
  const c = await cookies();
  c.delete(COOKIE);
}
