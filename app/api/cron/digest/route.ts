import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vercel cron hits this endpoint weekly. We just acknowledge the call here —
 * the heavy lifting (rolling up tazzle volume + macros and sending push) is
 * a TODO for a future iteration.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ran_at: new Date().toISOString() });
}
