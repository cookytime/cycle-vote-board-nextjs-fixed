import { NextResponse } from "next/server";
import { loadState, saveState, resetState } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any;
  const action = body.action as "add" | "undo" | "reset" | "complete" | "uncomplete" | "setRound" | "publicVote" | undefined;
  const round = body.round as number | undefined;
  const team = body.team as "A" | "B" | undefined;

  if (action === "reset") {
    const s = resetState();
    await saveState(s);
    return NextResponse.json({ ok: true });
  }

  const s = await loadState();

  if (action === "complete") {
    s.isComplete = true;
    await saveState(s);
    return NextResponse.json({ ok: true });
  }

  if (action === "uncomplete") {
    s.isComplete = false;
    await saveState(s);
    return NextResponse.json({ ok: true });
  }

  // Set the current active round for public voting
  if (action === "setRound") {
    if (!Number.isInteger(round) || (round as number) < 0 || (round as number) >= s.rounds.length) {
      return NextResponse.json({ ok: false, error: "Invalid round" }, { status: 400 });
    }
    s.currentRound = round as number;
    await saveState(s);
    return NextResponse.json({ ok: true });
  }

  // Public vote - only allows voting on current round
  if (action === "publicVote") {
    if (team !== "A" && team !== "B") {
      return NextResponse.json({ ok: false, error: "Invalid team" }, { status: 400 });
    }
    s.rounds[s.currentRound][team] += 1;
    await saveState(s);
    return NextResponse.json({ ok: true });
  }

  if (!Number.isInteger(round) || (round as number) < 0 || (round as number) >= s.rounds.length) {
    return NextResponse.json({ ok: false, error: "Invalid round" }, { status: 400 });
  }
  if (team !== "A" && team !== "B") {
    return NextResponse.json({ ok: false, error: "Invalid team" }, { status: 400 });
  }

  if (action === "undo") {
    s.rounds[round!][team] = Math.max(0, s.rounds[round!][team] - 1);
  } else {
    // default to add
    s.rounds[round!][team] += 1;
  }

  await saveState(s);
  return NextResponse.json({ ok: true });
}
