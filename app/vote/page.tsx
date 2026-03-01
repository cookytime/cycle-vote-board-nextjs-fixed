"use client";

import { useEffect, useState } from "react";

type Round = { name: string; A: number; B: number; trackA: string; trackB: string };
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

export default function VotePage() {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      setErr(null);
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setS(data);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function post(payload: any) {
    try {
      setErr(null);
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Control Panel</h1>
            <p className="mt-1 text-slate-600">
              Admin controls and manual vote input. Members scan QR for <span className="font-semibold">/scan</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => post({ action: "reset" })}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-[0.99]"
            >
              Reset All
            </button>
            <a
              href="/scan"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-[0.99]"
            >
              Public Vote
            </a>
            <a
              href="/display"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-[0.99]"
            >
              Display
            </a>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
            <div className="font-bold">Error</div>
            <div className="mt-1 text-sm whitespace-pre-wrap">{err}</div>
            <button
              className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white"
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}

        {!s ? (
          <div className="mt-6 text-slate-600">Loading…</div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Current Round Selector */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="text-lg font-bold text-blue-900 mb-3">
                Active Round for Public Voting (QR Code)
              </div>
              <div className="flex flex-wrap gap-2">
                {s.rounds.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => post({ action: "setRound", round: i })}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      s.currentRound === i
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}. {r.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-blue-700">
                Current: <span className="font-bold">{s.rounds[s.currentRound].name}</span> (Round {s.currentRound + 1})
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <span className="text-blue-600 font-semibold">{s.teams.A}:</span>{" "}
                  <span className="text-slate-700">{s.rounds[s.currentRound].trackA}</span>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <span className="text-red-600 font-semibold">{s.teams.B}:</span>{" "}
                  <span className="text-slate-700">{s.rounds[s.currentRound].trackB}</span>
                </div>
              </div>
            </div>

            {s.rounds.map((r, i) => (
              <div key={i} className={`rounded-2xl border bg-white p-4 shadow-sm ${s.currentRound === i ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-extrabold">
                    Round {i + 1}: <span className="font-black">{r.name}</span>
                  </div>
                  {s.currentRound === i && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">ACTIVE</span>
                  )}
                </div>

                {/* Track inputs */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-blue-700 w-12">{s.teams.A}:</label>
                    <input
                      type="text"
                      defaultValue={r.trackA}
                      onBlur={(e) => post({ action: "setTrack", round: i, team: "A", track: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Track name..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-red-700 w-12">{s.teams.B}:</label>
                    <input
                      type="text"
                      defaultValue={r.trackB}
                      onBlur={(e) => post({ action: "setTrack", round: i, team: "B", track: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                      placeholder="Track name..."
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <button
                      onClick={() => post({ action: "add", round: i, team: "A" })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-5 text-2xl font-extrabold shadow-sm active:scale-[0.99]"
                    >
                      + {s.teams.A} <span className="opacity-70">( {r.A} )</span>
                    </button>
                    <button
                      onClick={() => post({ action: "undo", round: i, team: "A" })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-[0.99]"
                    >
                      Undo {s.teams.A}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => post({ action: "add", round: i, team: "B" })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-5 text-2xl font-extrabold shadow-sm active:scale-[0.99]"
                    >
                      + {s.teams.B} <span className="opacity-70">( {r.B} )</span>
                    </button>
                    <button
                      onClick={() => post({ action: "undo", round: i, team: "B" })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-[0.99]"
                    >
                      Undo {s.teams.B}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xl font-extrabold">Totals</div>
              <div className="mt-2 text-lg">
                {s.teams.A}: <span className="font-extrabold">{s.totals.A}</span>{" "}
                <span className="mx-2 text-slate-300">|</span>
                {s.teams.B}: <span className="font-extrabold">{s.totals.B}</span>
              </div>
              <div className="mt-1 text-slate-600">
                Last update: {s.updatedAt ?? "—"} • Leader:{" "}
                <span className="font-extrabold">{s.leader}</span>
              </div>
            </div>

            {/* Complete / Show Winner Button */}
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 shadow-sm">
              {!s.isComplete ? (
                <button
                  onClick={() => post({ action: "complete" })}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-6 text-3xl font-black text-white shadow-lg active:scale-[0.98] transition-transform"
                >
                  Show Winner
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center text-xl font-bold text-green-700">
                    Winner is being displayed on screen!
                  </div>
                  <button
                    onClick={() => post({ action: "uncomplete" })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold shadow-sm active:scale-[0.99]"
                  >
                    Hide Winner / Continue Voting
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
