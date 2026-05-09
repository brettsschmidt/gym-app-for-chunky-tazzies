import { cookies } from "next/headers";

const COOKIE = "ct_active_tazzle";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getActiveTazzleId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

export async function setActiveTazzleId(id: string) {
  try {
    const c = await cookies();
    c.set(COOKIE, id, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
      httpOnly: false,
    });
  } catch {
    // Server Components can't mutate cookies in Next 16. Layouts may call this
    // to lazily seed the active tazzle on first load — swallow the error and
    // let the cookie be written next time a server action or route handler runs.
  }
}

export async function clearActiveTazzleId() {
  try {
    const c = await cookies();
    c.delete(COOKIE);
  } catch {
    // see note in setActiveTazzleId
  }
}
