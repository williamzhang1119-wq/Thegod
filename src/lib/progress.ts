export type MasteryScore = {
  subject: string;
  attempts: number;
  successes: number; // got_it / quiz correct / stage progress without reveal
  lastTouched: string; // YYYY-MM-DD
};

export type SessionInsight = {
  day: string;
  questions: number;
  coachUses: number;
  reveals: number;
  subjects: string[];
};

export type ProgressState = {
  xp: number;
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  questionsAsked: number;
  quizzesCompleted: number;
  adventuresCompleted: number;
  dailyChallengeDone: string | null; // day id when completed
  topicsTouched: string[];
  badges: string[];
  mastery: MasteryScore[];
  coachUses: number;
  revealsUsed: number;
  attemptsBeforeReveal: number[];
  sessionInsights: SessionInsight[];
  conceptsLearned: string[];
};

const KEY = "venture1-progress-v3";

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function defaultProgress(): ProgressState {
  return {
    xp: 0,
    streak: 0,
    lastActiveDay: "",
    questionsAsked: 0,
    quizzesCompleted: 0,
    adventuresCompleted: 0,
    dailyChallengeDone: null,
    topicsTouched: [],
    badges: [],
    mastery: [],
    coachUses: 0,
    revealsUsed: 0,
    attemptsBeforeReveal: [],
    sessionInsights: [],
    conceptsLearned: [],
  };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem("venture1-progress-v2");
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...(JSON.parse(raw) as ProgressState) };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(state: ProgressState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function touchStreak(state: ProgressState, now = new Date()): ProgressState {
  const today = todayKey(now);
  if (state.lastActiveDay === today) return state;
  const yesterday = todayKey(new Date(now.getTime() - 86400000));
  const streak = state.lastActiveDay === yesterday ? state.streak + 1 : 1;
  return { ...state, streak, lastActiveDay: today };
}

export function levelFromXp(xp: number) {
  let level = 1;
  let need = 50;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.floor(need * 1.35);
  }
  return {
    level,
    intoLevel: remaining,
    needForNext: need,
    pct: Math.min(100, (remaining / need) * 100),
  };
}

export function addTopic(state: ProgressState, topic: string): ProgressState {
  const t = topic.trim().toLowerCase();
  if (!t) return state;
  if (state.topicsTouched.includes(t)) return state;
  return { ...state, topicsTouched: [...state.topicsTouched.slice(-19), t] };
}

export function masteryPct(m: MasteryScore): number {
  if (m.attempts <= 0) return 0;
  return Math.min(100, Math.round((m.successes / m.attempts) * 100));
}

export function recordMastery(
  state: ProgressState,
  subject: string,
  success: boolean,
  now = new Date(),
): ProgressState {
  const key = subject.trim().toLowerCase() || "open";
  const day = todayKey(now);
  const existing = state.mastery.find((m) => m.subject === key);
  const nextEntry: MasteryScore = existing
    ? {
        ...existing,
        attempts: existing.attempts + 1,
        successes: existing.successes + (success ? 1 : 0),
        lastTouched: day,
      }
    : {
        subject: key,
        attempts: 1,
        successes: success ? 1 : 0,
        lastTouched: day,
      };
  const mastery = [
    ...state.mastery.filter((m) => m.subject !== key),
    nextEntry,
  ].slice(-12);
  return { ...state, mastery };
}

export function weakSubjects(state: ProgressState, limit = 3): string[] {
  return [...state.mastery]
    .filter((m) => m.attempts >= 2)
    .sort((a, b) => masteryPct(a) - masteryPct(b))
    .slice(0, limit)
    .map((m) => m.subject);
}

export function bumpSessionInsight(
  state: ProgressState,
  patch: { coach?: boolean; reveal?: boolean; subject?: string },
  now = new Date(),
): ProgressState {
  const day = todayKey(now);
  const existing = state.sessionInsights.find((s) => s.day === day);
  const base: SessionInsight = existing || {
    day,
    questions: 0,
    coachUses: 0,
    reveals: 0,
    subjects: [],
  };
  const subjects =
    patch.subject && !base.subjects.includes(patch.subject)
      ? [...base.subjects, patch.subject].slice(-8)
      : base.subjects;
  const next: SessionInsight = {
    ...base,
    questions: base.questions + 1,
    coachUses: base.coachUses + (patch.coach ? 1 : 0),
    reveals: base.reveals + (patch.reveal ? 1 : 0),
    subjects,
  };
  const sessionInsights = [
    ...state.sessionInsights.filter((s) => s.day !== day),
    next,
  ].slice(-14);
  return { ...state, sessionInsights };
}

export function addConcept(state: ProgressState, concept: string): ProgressState {
  const c = concept.trim();
  if (!c) return state;
  if (state.conceptsLearned.some((x) => x.toLowerCase() === c.toLowerCase())) return state;
  return { ...state, conceptsLearned: [...state.conceptsLearned.slice(-24), c] };
}
