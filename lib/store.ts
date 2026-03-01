import { Redis } from "@upstash/redis";

export type Round = { name: string; A: number; B: number };
export type VoteState = {
  teams: { A: string; B: string };
  rounds: Round[];
  updatedAt: string | null;
  isComplete: boolean;
  currentRound: number; // Index of the current active round for public voting
};

const KEY = "cycle-votes:v1";

export const DEFAULT_STATE: VoteState = {
  teams: { A: "USA", B: "UK" },
  rounds: [
    { name: "70s Rock", A: 0, B: 0 },
    { name: "80s Pop", A: 0, B: 0 },
    { name: "80s Rock", A: 0, B: 0 },
    { name: "90s", A: 0, B: 0 },
    { name: "00s", A: 0, B: 0 },
  ],
  updatedAt: null,
  isComplete: false,
  currentRound: 0,
};

// Module-level memory fallback (works great locally; for Vercel use Upstash env vars)
let memoryState: VoteState = structuredClone(DEFAULT_STATE);

function hasUpstashEnv() {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function totals(s: VoteState) {
  return {
    A: s.rounds.reduce((sum, r) => sum + r.A, 0),
    B: s.rounds.reduce((sum, r) => sum + r.B, 0),
  };
}

export async function loadState(): Promise<VoteState> {
  if (hasUpstashEnv()) {
    const redis = Redis.fromEnv();
    const s = (await redis.get<VoteState>(KEY)) ?? DEFAULT_STATE;
    return s;
  }
  return memoryState;
}

export async function saveState(s: VoteState): Promise<void> {
  s.updatedAt = now();
  if (hasUpstashEnv()) {
    const redis = Redis.fromEnv();
    await redis.set(KEY, s);
    return;
  }
  memoryState = s;
}

export function resetState(): VoteState {
  return structuredClone(DEFAULT_STATE);
}
