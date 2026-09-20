# Venture 1 — kid-safe curious tutor

**Guides homework without spoilers. Explores science, history, places, arts, and how things work.**

Venture 1 is a Socratic tutor for kids: smarter explanations, wider kid-appropriate knowledge, age-banded depth, coach action buttons, subject focus, mastery tracking, XP/streaks, guided adventures, quizzes, and a parent report.

## Features

- Age bands: Little Explorer / Explorer / Teen Explorer (depth & wording only — topic range stays wide)
- Wide subjects: Homework, Math, Reading, Writing, Science, World, Arts, Explore
- Hint ladder stages 1–5 for school problems (never spoils first)
- Coach buttons: I get it · Simpler · Another way · Show example · Hint · Check my work · Quiz me
- Stuck detection, mastery bars, session insights
- Streaming replies, XP/streaks, passport, voice, read-aloud
- Unique Quiz Me rounds (seeded bank + exclusions)
- Laptop-friendly two-column layout

## Local development

```bash
cp .env.example .env.local
# Optional: ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without an API key, demo mode still works (including staged hints, coach actions, and quizzes).

## Deploy on Railway

1. New Project → Deploy from GitHub → this repo
2. Variables:
   - `ANTHROPIC_API_KEY` (preferred)
   - or `OPENAI_API_KEY` (also enables moderation + true token streaming)
   - Optional: `ANTHROPIC_MODEL`, `OPENAI_MODEL` (defaults: `claude-sonnet-4-6`, `gpt-4o`)
3. Enable public networking
4. Health: `GET /api/health` → should list `"version":"3.0.0"` and features
