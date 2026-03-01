# Cycle Vote Board (Next.js + Tailwind)

Pages:
- `/` landing page
- `/vote` tablet input
- `/display` TV scoreboard

Storage:
- If `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, it uses Upstash Redis.
- Otherwise it falls back to in-memory storage (great for local / single-machine use).

## Local run
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Import repo to Vercel
2. Add Upstash Redis integration (recommended)
3. Redeploy

Env vars expected for Upstash:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
