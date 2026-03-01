"use client";

import { useEffect, useState } from "react";

type Round = { name: string; A: number; B: number };
type State = {
  teams: { A: string; B: string };
  rounds: Round[];
  totals: { A: number; B: number };
  leader: string;
  updatedAt: string | null;
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
            <h1 className="text-3xl font-extrabold tracking-tight">Vote Input</h1>
            <p className="mt-1 text-slate-600">
              Use this on your tablet. TV should be on <span className="font-semibold">/display</span>.
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
              href="/display"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm active:scale-[0.99]"
            >
              Open Display
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
            {s.rounds.map((r, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xl font-extrabold">
                  Round {i + 1}: <span className="font-black">{r.name}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}
