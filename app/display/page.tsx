"use client";

import { useEffect, useState, useMemo } from "react";
import { QRCodeDisplay } from "@/components/qr-code";

type Round = { name: string; A: number; B: number };
type State = {
  teams: { A: string; B: string };
  rounds: Round[];
  totals: { A: number; B: number };
  leader: string;
  updatedAt: string | null;
  isComplete: boolean;
};

async function getState(): Promise<State> {
  const res = await fetch("/api/state", { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 200));
  return JSON.parse(text);
}

// Confetti particle component
function Confetti() {
  const particles = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      color: ['#3b82f6', '#ef4444', '#fbbf24', '#ffffff', '#60a5fa', '#f87171'][Math.floor(Math.random() * 6)],
      size: 8 + Math.random() * 12,
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Winner celebration overlay
function WinnerCelebration({ winner, flag, score, loserScore }: { winner: string; flag: string; score: number; loserScore: number }) {
  const isTie = score === loserScore;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Confetti />
      <div className="text-center animate-winner-entrance">
        {isTie ? (
          <>
            <div className="text-[10rem] leading-none mb-4 animate-bounce-slow">
              <span>🇺🇸</span>
              <span className="mx-4">🤝</span>
              <span>🇬🇧</span>
            </div>
            <div className="text-7xl font-black text-yellow-400 mb-6 animate-pulse">
              {"IT'S A TIE!"}
            </div>
            <div className="text-5xl font-bold text-white/80">
              {score} - {loserScore}
            </div>
          </>
        ) : (
          <>
            <div className="text-[12rem] leading-none mb-4 animate-bounce-slow">{flag}</div>
            <div className="text-8xl font-black text-yellow-400 mb-4 animate-pulse drop-shadow-lg">
              {winner} WINS!
            </div>
            <div className="text-5xl font-bold text-white/80 mb-8">
              {score} - {loserScore}
            </div>
            <div className="text-3xl text-white/60 uppercase tracking-widest">
              All rounds complete
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ team, score, flag, color, isLeading }: { team: string; score: number; flag: string; color: string; isLeading: boolean }) {
  return (
    <div className={`relative flex-1 rounded-3xl p-8 ${color} ${isLeading ? "ring-4 ring-yellow-400 ring-offset-4 ring-offset-neutral-950" : ""}`}>
      {isLeading && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-1 rounded-full text-2xl font-black uppercase tracking-wider animate-pulse">
          Leading
        </div>
      )}
      <div className="text-center">
        <div className="text-8xl mb-4">{flag}</div>
        <div className="text-5xl font-black uppercase tracking-wider mb-6">{team}</div>
        <div className="text-[12rem] font-black leading-none tabular-nums">{score}</div>
      </div>
    </div>
  );
}

function RoundRow({ round, index, teams }: { round: Round; index: number; teams: { A: string; B: string } }) {
  const aWinning = round.A > round.B;
  const bWinning = round.B > round.A;
  const tied = round.A === round.B;
  
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="w-16 text-3xl font-black text-white/40">{index + 1}</div>
      <div className="flex-1 text-4xl font-bold">{round.name}</div>
      <div className={`w-32 text-center text-5xl font-black rounded-xl py-3 ${aWinning ? "bg-blue-600 text-white" : tied ? "bg-white/10 text-white/60" : "bg-white/5 text-white/40"}`}>
        {round.A}
      </div>
      <div className="text-3xl text-white/30 font-bold">vs</div>
      <div className={`w-32 text-center text-5xl font-black rounded-xl py-3 ${bWinning ? "bg-red-600 text-white" : tied ? "bg-white/10 text-white/60" : "bg-white/5 text-white/40"}`}>
        {round.B}
      </div>
    </div>
  );
}

export default function DisplayPage() {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const scanUrl = "https://vote.glencook.fit/scan";

  useEffect(() => {
    let cancelled = false;
    let lastTotals = { A: 0, B: 0 };

    async function tick() {
      try {
        setErr(null);
        const data = await getState();
        if (!cancelled) {
          // Trigger pulse animation on score change
          if (data.totals.A !== lastTotals.A || data.totals.B !== lastTotals.B) {
            setPulse(true);
            setTimeout(() => setPulse(false), 300);
            lastTotals = { ...data.totals };
          }
          setS(data);
        }
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

  const usaLeading = s && s.totals.A > s.totals.B;
  const ukLeading = s && s.totals.B > s.totals.A;
  
  // Show celebration when instructor marks voting as complete
  const showCelebration = s?.isComplete;

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Winner celebration overlay */}
      {showCelebration && s && (
        <WinnerCelebration 
          winner={usaLeading ? s.teams.A : s.teams.B}
          flag={usaLeading ? "🇺🇸" : "🇬🇧"}
          score={Math.max(s.totals.A, s.totals.B)}
          loserScore={Math.min(s.totals.A, s.totals.B)}
        />
      )}
      
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/30 via-neutral-950 to-red-950/30 pointer-events-none" />
      
      <div className="relative z-10 h-screen flex flex-col p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            CYCLE BATTLE
          </h1>
          <div className="flex items-center gap-6">
            <QRCodeDisplay 
              url={scanUrl} 
              size={140} 
              label="Scan to Vote"
              className="text-white/70"
            />
            <div className="text-xl text-white/50 font-medium">
              {s?.updatedAt ? `Updated ${s.updatedAt}` : "Loading..."}
            </div>
          </div>
        </div>

        {err && (
          <div className="mb-6 rounded-2xl border-2 border-red-500/50 bg-red-500/20 p-6 text-red-200">
            <div className="text-2xl font-bold">Connection Error</div>
            <div className="mt-2 text-lg">{err}</div>
          </div>
        )}

        {!s ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-4xl text-white/50 animate-pulse">Loading scores...</div>
          </div>
        ) : (
          <div className="flex-1 flex gap-8">
            {/* Left: Score Cards */}
            <div className="flex-1 flex flex-col gap-6">
              <div className={`flex gap-6 transition-transform duration-150 ${pulse ? "scale-[1.02]" : "scale-100"}`}>
                <ScoreCard 
                  team={s.teams.A} 
                  score={s.totals.A} 
                  flag="🇺🇸" 
                  color="bg-gradient-to-br from-blue-700 to-blue-900" 
                  isLeading={!!usaLeading}
                />
                <ScoreCard 
                  team={s.teams.B} 
                  score={s.totals.B} 
                  flag="🇬🇧" 
                  color="bg-gradient-to-br from-red-700 to-red-900" 
                  isLeading={!!ukLeading}
                />
              </div>
              
              {/* VS indicator */}
              <div className="text-center">
                <span className="inline-block bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full text-3xl font-black text-white/80 border border-white/20">
                  {s.totals.A === s.totals.B ? "TIED!" : usaLeading ? "USA LEADS!" : "UK LEADS!"}
                </span>
              </div>
            </div>

            {/* Right: Round breakdown */}
            <div className="w-[500px] bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
              <h2 className="text-3xl font-black mb-4 text-white/80 uppercase tracking-wider">Rounds</h2>
              <div className="space-y-1">
                {s.rounds.map((r, i) => (
                  <RoundRow key={i} round={r} index={i} teams={s.teams} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
