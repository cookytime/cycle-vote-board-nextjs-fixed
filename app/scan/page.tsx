"use client";

import { useEffect, useState } from "react";

type Round = { name: string; A: number; B: number };
type State = {
  teams: { A: string; B: string };
  rounds: Round[];
  totals: { A: number; B: number };
  leader: string;
  updatedAt: string | null;
  isComplete: boolean;
  currentRound: number;
};

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`);
  }
}

export default function ScanVotePage() {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  async function refresh() {
    try {
      setErr(null);
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setS(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
    }
  }

  async function vote(team: "A" | "B") {
    if (isVoting || voted) return;
    setIsVoting(true);
    try {
      setErr(null);
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publicVote", team }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setVoted(team);
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setErr(message);
    } finally {
      setIsVoting(false);
    }
  }

  useEffect(() => {
    refresh();
    // Poll for state changes (in case admin changes current round)
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset voted state when current round changes
  useEffect(() => {
    if (s) {
      setVoted(null);
    }
  }, [s?.currentRound]);

  if (err) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-red-950/50 p-8 text-center">
          <div className="text-2xl font-bold text-red-400">Connection Error</div>
          <div className="mt-2 text-red-300/80">{err}</div>
          <button
            onClick={refresh}
            className="mt-6 rounded-2xl bg-red-600 px-8 py-4 text-lg font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-white/60 animate-pulse">Loading...</div>
      </div>
    );
  }

  const currentBattle = s.rounds[s.currentRound];

  if (s.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-black text-white">Voting Complete!</h1>
          <p className="mt-4 text-xl text-slate-400">
            Winner: <span className="text-yellow-400 font-bold">{s.leader}</span>
          </p>
          <p className="mt-2 text-slate-500">Thanks for participating!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="p-6 text-center border-b border-slate-700/50">
        <h1 className="text-2xl font-bold text-white">Vote Now!</h1>
        <p className="text-slate-400 mt-1">
          Round {s.currentRound + 1} of {s.rounds.length}
        </p>
      </header>

      {/* Current Battle */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Battle Name */}
          <div className="text-center mb-8">
            <div className="inline-block rounded-full bg-yellow-500/20 px-6 py-2 text-yellow-400 font-bold text-lg mb-3">
              {currentBattle.name}
            </div>
            <h2 className="text-3xl font-black text-white">
              {s.teams.A} vs {s.teams.B}
            </h2>
          </div>

          {voted ? (
            /* Thank you state */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-3xl font-bold text-green-400">Vote Recorded!</h3>
              <p className="mt-4 text-xl text-slate-400">
                You voted for{" "}
                <span className="font-bold text-white">
                  {voted === "A" ? s.teams.A : s.teams.B}
                </span>
              </p>
              <p className="mt-6 text-slate-500 text-sm">
                Wait for the next round to vote again
              </p>
            </div>
          ) : (
            /* Voting buttons */
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => vote("A")}
                disabled={isVoting}
                className="aspect-square rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 flex flex-col items-center justify-center text-white shadow-xl shadow-blue-900/30 active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                <span className="text-5xl font-black">{s.teams.A}</span>
                <span className="mt-2 text-blue-200/70 text-sm font-medium">Tap to vote</span>
              </button>

              <button
                onClick={() => vote("B")}
                disabled={isVoting}
                className="aspect-square rounded-3xl bg-gradient-to-br from-red-600 to-red-700 p-6 flex flex-col items-center justify-center text-white shadow-xl shadow-red-900/30 active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                <span className="text-5xl font-black">{s.teams.B}</span>
                <span className="mt-2 text-red-200/70 text-sm font-medium">Tap to vote</span>
              </button>
            </div>
          )}

          {/* Current scores (small) */}
          <div className="mt-8 text-center text-slate-500 text-sm">
            Current: {s.teams.A} {currentBattle.A} - {currentBattle.B} {s.teams.B}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center border-t border-slate-700/50">
        <p className="text-slate-600 text-xs">Cycle Vote Board</p>
      </footer>
    </div>
  );
}
