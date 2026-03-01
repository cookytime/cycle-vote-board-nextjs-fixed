import { NextResponse } from "next/server";
import { loadState, totals } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const s = await loadState();
  const t = totals(s);
  const leader = t.A > t.B ? s.teams.A : t.B > t.A ? s.teams.B : "TIE";
  return NextResponse.json({ ...s, totals: t, leader, isComplete: s.isComplete ?? false });
}
