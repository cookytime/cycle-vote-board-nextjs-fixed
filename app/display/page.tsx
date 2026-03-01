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

async function getState(): Promise<State> {
  const res = await fetch("/api/state", { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 200));
  return JSON.parse(text);
}

export default function DisplayPage() {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        setErr(null);
        const data = await getState();
        if (!cancelled) setS(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6">
          <h1 className="text-6xl font-black tracking-tight">Scoreboard</h1>
          <div className="text-lg text-white/70">
            {s ? `Last update: ${s.updatedAt ?? "—"}` : "Loading…"} • Tablet: /vote
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            <div className="font-bold">Error</div>
            <div className="mt-1 text-sm whitespace-pre-wrap">{err}</div>
          </div>
        )}

        {!s ? (
          <div className="mt-10 text-white/70">Loading…</div>
        ) : (
          <>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/15">
              <table className="w-full border-collapse text-3xl">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-5 text-left font-extrabold">Round</th>
                    <th className="px-6 py-5 text-left font-extrabold">{s.teams.A}</th>
                    <th className="px-6 py-5 text-left font-extrabold">{s.teams.B}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.rounds.map((r, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="px-6 py-5">{i + 1}. {r.name}</td>
                      <td className="px-6 py-5 font-black">{r.A}</td>
                      <td className="px-6 py-5 font-black">{r.B}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-wrap gap-10 text-5xl font-black">
              <div>{s.teams.A}: {s.totals.A}</div>
              <div>{s.teams.B}: {s.totals.B}</div>
            </div>

            <div className="mt-4 text-6xl font-black">
              Leader: <span className="underline decoration-white/30">{s.leader}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
