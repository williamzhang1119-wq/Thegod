<<<<<<< HEAD
# Venture 1 — kid-safe AI tutor
=======
# Venture 1 — advanced homework helper
>>>>>>> a88a990 (Advance Venture 1 to v3 homework helper)

**The homework helper that never gives the answer first.**

<<<<<<< HEAD
## Features
=======
Venture 1 guides kids with a hint ladder (not spoilers), age-banded tutoring, coach action buttons, subject focus, mastery tracking, XP/streaks, guided adventures, quizzes, and a parent report.

## What's new in v3

- Product focus: homework helper that never hands over answers first
- Giant coach buttons under replies: I get it · Simpler · Another way · Show example · Hint · Check my work · Quiz me
- Subject modes: Homework / Math / Reading / Writing / Science / Explore
- Stuck detection (auto-simplifies when a child sounds lost)
- Subject mastery bars + “Practice weak spot”
- Session insights in the parent report (coach uses, reveals, concepts)
- Homework-first adventures and daily challenges

## Still included from v2
>>>>>>> a88a990 (Advance Venture 1 to v3 homework helper)

- Age bands: Little Explorer / Explorer / Teen Explorer
- Hint ladder stages 1–5
- Streaming replies
- XP, levels, and daily streaks
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

Without an API key, demo mode still works (including staged hints, coach actions, and quizzes).

## Deploy on Railway

1. New Project → Deploy from GitHub → this repo
2. Variables:
   - `ANTHROPIC_API_KEY` (preferred)
   - or `OPENAI_API_KEY` (also enables moderation + true token streaming)
3. Enable public networking
<<<<<<< HEAD
4. Health: `GET /api/health`
=======
4. Health: `GET /api/health` → should list `"version":"3.0.0"` and features
>>>>>>> a88a990 (Advance Venture 1 to v3 homework helper)
