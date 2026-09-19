# Venture 1 — kid-safe AI tutor

Every question is an adventure. Venture 1 guides kids with a **hint ladder** (not spoilers), age-banded tutoring, XP/streaks, guided adventures, quizzes, and a parent report.

## Features

- Age bands: Little Explorer / Explorer / Teen Explorer
- Hint ladder stages 1–5 (adaptive tutoring depth)
- Streaming replies
- XP, levels, and daily streaks
- Daily challenge + guided multi-step adventures
- Topic-focused quizzes
- Parent report (local progress summary)
- Passport stamps, voice input, read-aloud
- Laptop-friendly two-column layout

## Local development

```bash
cp .env.example .env.local
# Optional: ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without an API key, demo mode still works (including staged hints + quizzes).

## Deploy on Railway

1. New Project → Deploy from GitHub → this repo
2. Variables:
   - `ANTHROPIC_API_KEY` (preferred)
   - or `OPENAI_API_KEY` (also enables moderation + true token streaming)
3. Enable public networking
4. Health: `GET /api/health`
