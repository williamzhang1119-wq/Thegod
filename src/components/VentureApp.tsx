"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  COACH_ACTIONS,
  SUBJECTS,
  detectRevealRequest,
  detectStuck,
  inferSubject,
  type CoachMode,
  type SubjectFocus,
} from "@/lib/coach";
import {
  ADVENTURES,
  AGE_BANDS,
  dailyChallengeForToday,
  type AgeBand,
} from "@/lib/prompts";
import {
  addConcept,
  addTopic,
  bumpSessionInsight,
  defaultProgress,
  levelFromXp,
  loadProgress,
  masteryPct,
  recordMastery,
  saveProgress,
  todayKey,
  touchStreak,
  weakSubjects,
  type ProgressState,
} from "@/lib/progress";

type Role = "user" | "assistant";
type ChatTurn = { role: Role; content: string };

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type ChatItem =
  | {
      kind: "message";
      id: string;
      role: Role;
      content: string;
      html?: boolean;
      coachable?: boolean;
    }
  | { kind: "toast"; id: string; content: string }
  | { kind: "typing"; id: string }
  | {
      kind: "quiz";
      id: string;
      questions: QuizQuestion[];
      current: number;
      score: number;
      selected: number | null;
      revealed: boolean;
      finished: boolean;
    };

const CATEGORIES = [
  {
    id: "science",
    emoji: "🔬",
    label: "Science Explorer",
    keywords: ["science", "atom", "chemistry", "physics", "biology", "experiment", "gravity", "molecule", "element", "sky", "rainbow"],
  },
  {
    id: "nature",
    emoji: "🌿",
    label: "Nature Explorer",
    keywords: ["animal", "plant", "ocean", "ecosystem", "forest", "dinosaur", "insect", "species", "habitat"],
  },
  {
    id: "space",
    emoji: "🚀",
    label: "Space Explorer",
    keywords: ["space", "planet", "star", "galaxy", "moon", "astronaut", "universe", "solar", "rocket"],
  },
  {
    id: "history",
    emoji: "📜",
    label: "History Explorer",
    keywords: ["history", "ancient", "war", "king", "queen", "civilization", "egypt", "castle", "empire"],
  },
  {
    id: "math",
    emoji: "🔢",
    label: "Math Explorer",
    keywords: ["math", "number", "multiply", "divide", "equation", "fraction", "geometry", "plus", "minus"],
  },
  {
    id: "arts",
    emoji: "🎨",
    label: "Arts Explorer",
    keywords: ["art", "music", "paint", "draw", "song", "instrument", "color", "dance", "sculpture"],
  },
  {
    id: "tech",
    emoji: "💻",
    label: "Tech Explorer",
    keywords: ["computer", "internet", "code", "coding", "robot", "technology", "app", "wifi", "software"],
  },
  {
    id: "big",
    emoji: "🤔",
    label: "Big-Question Explorer",
    keywords: ["why do we", "feelings", "fair", "exist", "dream", "happy", "sad", "meaning", "alive", "money"],
  },
] as const;

const STARTERS = [
  "Help me with 3/4 + 1/8",
  "What's the main idea of this paragraph?",
  "How do I start my essay?",
  "Why does ice float?",
  "Check my work: 12 × 8 = 96",
  "I don't get fractions — help",
];

const QUIZ_TOPICS = [
  { id: "mixed", label: "Mixed" },
  { id: "math", label: "Math" },
  { id: "science", label: "Science" },
  { id: "reading", label: "Reading" },
];

const STORAGE_BADGES = "venture1-badges";
const STORAGE_CHAT = "venture1-chat-v3";
const STORAGE_AGE = "venture1-age";
const STORAGE_SUBJECT = "venture1-subject";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageRequest(text: string) {
  const lower = text.toLowerCase();
  return [
    /\bdraw\b/,
    /\bpaint\b/,
    /illustrat/,
    /\bsketch\b/,
    /(make|generate|create|show)\s+(me\s+)?(an?\s+)?(image|picture|photo|drawing|illustration)/,
    /(image|picture|photo|drawing)\s+of\b/,
  ].some((p) => p.test(lower));
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

const WELCOME =
  "Hi — I'm Venture 1 🧭 the homework helper that never gives the answer first. Pick a subject, paste a problem, and use the big buttons under my replies when you need simpler, another way, a hint, or a check.";

export function VentureApp() {
  const daily = useMemo(() => dailyChallengeForToday(), []);
  const [items, setItems] = useState<ChatItem[]>([
    {
      kind: "message",
      id: "welcome",
      role: "assistant",
      content: WELCOME,
      coachable: false,
    },
  ]);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const [turnCount, setTurnCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [popBadges, setPopBadges] = useState<Set<string>>(new Set());
  const [readAloud, setReadAloud] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("explorer");
  const [subjectFocus, setSubjectFocus] = useState<SubjectFocus>("homework");
  const [attemptLevel, setAttemptLevel] = useState(1);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [quizTopic, setQuizTopic] = useState("mixed");
  const [progress, setProgress] = useState<ProgressState>(defaultProgress());
  const [showParent, setShowParent] = useState(false);
  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [adventureStep, setAdventureStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [threadAttempts, setThreadAttempts] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const meterPct = Math.min(turnCount / 6, 1) * 100;
  const levelInfo = levelFromXp(progress.xp);
  const weak = useMemo(() => weakSubjects(progress), [progress]);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setCanListen(Boolean(SR));
    try {
      const raw = localStorage.getItem(STORAGE_BADGES);
      if (raw) setEarnedBadges(new Set(JSON.parse(raw) as string[]));
      const age = localStorage.getItem(STORAGE_AGE) as AgeBand | null;
      if (age === "little" || age === "explorer" || age === "teen") setAgeBand(age);
      const sub = localStorage.getItem(STORAGE_SUBJECT) as SubjectFocus | null;
      if (sub && sub in SUBJECTS) setSubjectFocus(sub);
      const saved = loadProgress();
      setProgress(touchStreak(saved));
      const chatRaw = localStorage.getItem(STORAGE_CHAT) || localStorage.getItem("venture1-chat-v2");
      if (chatRaw) {
        const parsed = JSON.parse(chatRaw) as { items?: ChatItem[]; history?: ChatTurn[] };
        if (parsed.items?.length) setItems(parsed.items.filter((i) => i.kind !== "typing"));
        if (parsed.history?.length) setHistory(parsed.history);
        setShowStarters(false);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [items, busy]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_BADGES, JSON.stringify(Array.from(earnedBadges)));
      localStorage.setItem(STORAGE_AGE, ageBand);
      localStorage.setItem(STORAGE_SUBJECT, subjectFocus);
      saveProgress({ ...progress, badges: Array.from(earnedBadges) });
      localStorage.setItem(
        STORAGE_CHAT,
        JSON.stringify({
          items: items.filter((i) => i.kind === "message" || i.kind === "toast").slice(-40),
          history: history.slice(-20),
        }),
      );
    } catch {
      // ignore
    }
  }, [earnedBadges, ageBand, subjectFocus, progress, items, history, hydrated]);

  const speak = (text: string) => {
    if (!readAloud || !canSpeak) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.05;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const bumpMeter = () => {
    setTurnCount((prev) => {
      const next = Math.min(prev + 1, 6);
      if (next >= 6) setTimeout(() => setTurnCount(0), 900);
      return next;
    });
  };

  const gainXp = (amount: number, topic?: string) => {
    setProgress((prev) => {
      let next = touchStreak(prev);
      next = { ...next, xp: next.xp + amount };
      if (topic) next = addTopic(next, topic);
      return next;
    });
  };

  const checkForNewBadges = (text: string) => {
    const lower = text.toLowerCase();
    const newly = CATEGORIES.filter(
      (cat) => !earnedBadges.has(cat.id) && cat.keywords.some((k) => lower.includes(k)),
    );
    if (!newly.length) return;
    setEarnedBadges((prev) => {
      const next = new Set(prev);
      newly.forEach((cat) => next.add(cat.id));
      return next;
    });
    newly.forEach((cat) => {
      setItems((prev) => [
        ...prev,
        { kind: "toast", id: uid(), content: `🎉 New stamp earned: ${cat.emoji} ${cat.label}!` },
      ]);
      setPopBadges((p) => new Set(p).add(cat.id));
      setTimeout(() => {
        setPopBadges((p) => {
          const n = new Set(p);
          n.delete(cat.id);
          return n;
        });
      }, 500);
      gainXp(15, cat.label);
    });
  };

  async function callChatStream(payload: {
    messages: ChatTurn[];
    attemptLevel: number;
    coachMode?: CoachMode;
    stuck?: boolean;
    onDelta: (t: string) => void;
  }): Promise<string> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        messages: payload.messages,
        ageBand,
        attemptLevel: payload.attemptLevel,
        subjectFocus,
        coachMode: payload.coachMode,
        stuck: payload.stuck,
        masteryHints: weak,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API returned ${res.status}: ${errText}`);
    }

    const ctype = res.headers.get("content-type") || "";
    if (!ctype.includes("text/event-stream")) {
      const data = (await res.json()) as {
        content?: Array<{ text?: string }>;
        reply?: string;
      };
      const text = Array.isArray(data.content)
        ? data.content.map((b) => b.text || "").filter(Boolean).join("\n").trim()
        : (data.reply || "").trim();
      payload.onDelta(text);
      return text;
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No stream");
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop() || "";
      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as {
            type?: string;
            text?: string;
            error?: string;
          };
          if (json.type === "delta" && json.text) {
            full += json.text;
            payload.onDelta(json.text);
          } else if (json.type === "done" && json.text) {
            full = json.text;
          } else if (json.type === "error") {
            throw new Error(json.error || "Stream error");
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
    return full.trim();
  }

  async function sendMessage(
    raw?: string,
    opts?: { coachMode?: CoachMode; silentUser?: boolean },
  ) {
    const coachMode = opts?.coachMode;
    const text =
      raw?.trim() ||
      (coachMode
        ? ({
            got_it: "I get it!",
            simpler: "Can you make that simpler?",
            another_way: "Explain it another way.",
            example: "Show me an example.",
            hint: "Give me a hint.",
            check_work: "Can you check my work?",
            quiz_me: "Quiz me on this.",
          }[coachMode] as string)
        : input.trim());
    if (!text || busy) return;

    setShowStarters(false);
    if (!opts?.silentUser && !coachMode) setInput("");

    const inferred = inferSubject(text);
    if (inferred && subjectFocus === "homework") {
      // soft auto-tag without fighting explicit subject picks later
    }
    if (inferred && subjectFocus === "open") {
      setSubjectFocus(inferred);
    }

    if (!opts?.silentUser) {
      setItems((prev) => [...prev, { kind: "message", id: uid(), role: "user", content: text }]);
    }

    const stuck = detectStuck(text) || coachMode === "simpler";
    const wantsReveal = detectRevealRequest(text);
    let stage = activeQuestion ? Math.min(5, attemptLevel + (coachMode === "hint" || !coachMode ? 1 : 0)) : 1;
    if (coachMode === "hint") stage = Math.min(5, Math.max(attemptLevel + 1, 2));
    if (coachMode && coachMode !== "hint") stage = attemptLevel;
    if (stuck && stage < 3) stage = Math.min(3, stage + 1);
    if (wantsReveal) stage = 5;
    if (!activeQuestion && !coachMode) setActiveQuestion(text);
    setAttemptLevel(stage);
    setThreadAttempts((n) => n + 1);

    const nextHistory: ChatTurn[] = [...history, { role: "user", content: text }];
    setHistory(nextHistory);

    if (isImageRequest(text)) {
      setItems((prev) => [
        ...prev,
        { kind: "message", id: uid(), role: "assistant", content: "upgrade", html: true },
      ]);
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "I can't create images on the free plan yet — upgrading unlocks image creation!",
        },
      ]);
      return;
    }

    setBusy(true);
    const streamId = uid();
    setItems((prev) => [
      ...prev.map((item) =>
        item.kind === "message" ? { ...item, coachable: false } : item,
      ),
      { kind: "message", id: streamId, role: "assistant", content: "", coachable: true },
    ]);

    try {
      const reply =
        (await callChatStream({
          messages: nextHistory,
          attemptLevel: stage,
          coachMode,
          stuck,
          onDelta: (delta) => {
            setItems((prev) =>
              prev.map((item) =>
                item.kind === "message" && item.id === streamId
                  ? { ...item, content: item.content + delta }
                  : item,
              ),
            );
          },
        })) || "Hmm, my brain got a little fuzzy there — can you ask me that again?";

      setItems((prev) =>
        prev.map((item) =>
          item.kind === "message" && item.id === streamId
            ? { ...item, content: reply, coachable: true }
            : item,
        ),
      );
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      speak(reply);
      bumpMeter();
      checkForNewBadges(`${text} ${reply}`);

      const subjectKey = subjectFocus === "open" ? inferred || "open" : subjectFocus;
      const success =
        coachMode === "got_it" || coachMode === "quiz_me" || (stage >= 3 && !wantsReveal);
      const reveal = stage >= 5 || wantsReveal;

      setProgress((p) => {
        let next = touchStreak(p);
        next = {
          ...next,
          questionsAsked: next.questionsAsked + 1,
          xp: next.xp + 8 + stage * 2 + (coachMode === "got_it" ? 12 : 0),
          coachUses: next.coachUses + (coachMode ? 1 : 0),
          revealsUsed: next.revealsUsed + (reveal ? 1 : 0),
        };
        if (reveal) {
          next = {
            ...next,
            attemptsBeforeReveal: [...next.attemptsBeforeReveal.slice(-19), threadAttempts + 1],
          };
        }
        next = recordMastery(next, subjectKey, success);
        next = bumpSessionInsight(next, {
          coach: Boolean(coachMode),
          reveal,
          subject: subjectKey,
        });
        if (coachMode === "got_it" && activeQuestion) {
          next = addConcept(next, activeQuestion.slice(0, 60));
        }
        return next;
      });

      if (daily.prompt.toLowerCase() === (activeQuestion || text).toLowerCase()) {
        setProgress((p) =>
          p.dailyChallengeDone === todayKey()
            ? p
            : { ...p, dailyChallengeDone: todayKey(), xp: p.xp + 25 },
        );
        setItems((prev) => [
          ...prev,
          {
            kind: "toast",
            id: uid(),
            content: "⭐ Daily challenge complete! +25 XP",
          },
        ]);
      }

      if (adventureId) {
        const adv = ADVENTURES.find((a) => a.id === adventureId);
        if (adv && adventureStep >= adv.steps.length - 1) {
          setProgress((p) => ({
            ...p,
            adventuresCompleted: p.adventuresCompleted + 1,
            xp: p.xp + 40,
          }));
          setItems((prev) => [
            ...prev,
            {
              kind: "toast",
              id: uid(),
              content: `${adv.emoji} Adventure complete: ${adv.title}! +40 XP`,
            },
          ]);
          setAdventureId(null);
          setAdventureStep(0);
        }
      }
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === "message" && item.id === streamId
            ? {
                ...item,
                content: "Oops, I got tangled up in my own thoughts! Can you try asking me again?",
                coachable: true,
              }
            : item,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function onCoach(mode: CoachMode) {
    if (mode === "quiz_me" && !history.length) {
      void startQuiz();
      return;
    }
    void sendMessage(undefined, { coachMode: mode });
  }

  async function startQuiz() {
    if (busy) return;
    setBusy(true);
    setItems((prev) => [...prev, { kind: "typing", id: "typing" }]);

    const topicHints = Array.from(earnedBadges)
      .map((id) => CATEGORIES.find((c) => c.id === id)?.label.replace(" Explorer", ""))
      .filter(Boolean);

    const focus =
      quizTopic === "mixed"
        ? subjectFocus === "open" || subjectFocus === "homework"
          ? "math, reading, science, and writing homework skills"
          : SUBJECTS[subjectFocus].label
        : quizTopic;

    const quizSystemPrompt = `You generate quiz questions for Venture 1, a homework helper for kids. Create exactly 4 fun, age-appropriate multiple-choice questions for kids aged 6-14, medium difficulty, focused on ${focus}.${
      topicHints.length
        ? ` The child has shown interest in: ${topicHints.join(", ")}. Naturally include at least 2 questions touching those topics.`
        : ""
    }${
      weak.length ? ` Include at least one question reinforcing weak spots: ${weak.join(", ")}.` : ""
    }
Respond with ONLY raw valid JSON, no markdown formatting, no code fences, no extra commentary — exactly this shape:
[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          system: quizSystemPrompt,
          messages: [{ role: "user", content: "Generate the quiz now." }],
          ageBand,
          subjectFocus,
        }),
      });
      if (!res.ok) throw new Error("quiz failed");
      const data = (await res.json()) as { content?: Array<{ text?: string }>; reply?: string };
      let raw = Array.isArray(data.content)
        ? data.content.map((b) => b.text || "").join("\n")
        : data.reply || "";
      raw = raw.replace(/```json|```/g, "").trim();
      const questions = JSON.parse(raw) as QuizQuestion[];
      setItems((prev) => [
        ...prev.filter((i) => i.kind !== "typing"),
        {
          kind: "quiz",
          id: uid(),
          questions,
          current: 0,
          score: 0,
          selected: null,
          revealed: false,
          finished: false,
        },
      ]);
    } catch {
      setItems((prev) => [
        ...prev.filter((i) => i.kind !== "typing"),
        {
          kind: "message",
          id: uid(),
          role: "assistant",
          content: "Hmm, I couldn't put a quiz together just now — want to try the button again?",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function updateQuiz(id: string, patch: Partial<Extract<ChatItem, { kind: "quiz" }>>) {
    setItems((prev) =>
      prev.map((item) => (item.kind === "quiz" && item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function onQuizSelect(quizId: string, optionIndex: number) {
    const quiz = items.find((i) => i.kind === "quiz" && i.id === quizId) as
      | Extract<ChatItem, { kind: "quiz" }>
      | undefined;
    if (!quiz || quiz.revealed || quiz.finished) return;
    const correct = quiz.questions[quiz.current]?.correctIndex === optionIndex;
    updateQuiz(quizId, {
      selected: optionIndex,
      revealed: true,
      score: correct ? quiz.score + 1 : quiz.score,
    });
    bumpMeter();
    if (correct) {
      gainXp(10, quizTopic);
      setProgress((p) => recordMastery(p, subjectFocus, true));
    } else {
      setProgress((p) => recordMastery(p, subjectFocus, false));
    }
  }

  function onQuizNext(quizId: string) {
    const quiz = items.find((i) => i.kind === "quiz" && i.id === quizId) as
      | Extract<ChatItem, { kind: "quiz" }>
      | undefined;
    if (!quiz) return;
    if (quiz.current >= quiz.questions.length - 1) {
      updateQuiz(quizId, { finished: true });
      setProgress((p) => ({
        ...p,
        quizzesCompleted: p.quizzesCompleted + 1,
        xp: p.xp + 20 + quiz.score * 5,
      }));
      return;
    }
    updateQuiz(quizId, { current: quiz.current + 1, selected: null, revealed: false });
  }

  function startAdventure(id: string) {
    const adv = ADVENTURES.find((a) => a.id === id);
    if (!adv) return;
    setAdventureId(id);
    setAdventureStep(0);
    setShowStarters(false);
    setAttemptLevel(1);
    setThreadAttempts(0);
    setActiveQuestion(adv.steps[0]);
    setItems((prev) => [
      ...prev,
      {
        kind: "message",
        id: uid(),
        role: "assistant",
        content: `${adv.emoji} Adventure started: ${adv.title}!\n\nStep 1/${adv.steps.length}: ${adv.steps[0]}`,
        coachable: true,
      },
    ]);
  }

  function nextAdventureStep() {
    if (!adventureId) return;
    const adv = ADVENTURES.find((a) => a.id === adventureId);
    if (!adv) return;
    const next = adventureStep + 1;
    if (next >= adv.steps.length) {
      void sendMessage("I finished the adventure — what's my recap?");
      return;
    }
    setAdventureStep(next);
    setAttemptLevel(1);
    setThreadAttempts(0);
    setActiveQuestion(adv.steps[next]);
    setItems((prev) => [
      ...prev,
      {
        kind: "message",
        id: uid(),
        role: "assistant",
        content: `${adv.emoji} Step ${next + 1}/${adv.steps.length}: ${adv.steps[next]}`,
        coachable: true,
      },
    ]);
  }

  function newQuestionMode() {
    setActiveQuestion(null);
    setAttemptLevel(1);
    setThreadAttempts(0);
    setItems((prev) => [
      ...prev,
      {
        kind: "toast",
        id: uid(),
        content: "🧭 New question — hint ladder reset to Stage 1",
      },
    ]);
  }

  function clearChat() {
    setItems([
      {
        kind: "message",
        id: "welcome",
        role: "assistant",
        content: "Fresh map! I'm Venture 1 🧭 Paste a homework problem and I'll guide — not spoil.",
        coachable: false,
      },
    ]);
    setHistory([]);
    setShowStarters(true);
    setActiveQuestion(null);
    setAttemptLevel(1);
    setThreadAttempts(0);
    setAdventureId(null);
    setAdventureStep(0);
  }

  function practiceWeakSpot() {
    if (!weak.length) {
      void sendMessage("Quiz me on something I should practice.");
      return;
    }
    const spot = weak[0];
    setSubjectFocus(
      (["math", "reading", "writing", "science"] as SubjectFocus[]).includes(spot as SubjectFocus)
        ? (spot as SubjectFocus)
        : "homework",
    );
    void sendMessage(`I want to practice ${spot}. Give me one guided problem — don't reveal the answer yet.`);
  }

  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("Listening... 🎧");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setVoiceStatus("");
      void sendMessage(transcript);
    };
    recognition.onerror = (event) => {
      setVoiceStatus(
        event.error === "not-allowed"
          ? "Microphone access is blocked — check your browser settings."
          : "Didn't catch that — try again!",
      );
    };
    recognition.onend = () => {
      setListening(false);
      setTimeout(() => setVoiceStatus(""), 2500);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // ignore
    }
  }

  const meterStyle = useMemo(() => ({ width: `${meterPct}%` }), [meterPct]);
  const xpStyle = useMemo(() => ({ width: `${levelInfo.pct}%` }), [levelInfo.pct]);
  const dailyDone = progress.dailyChallengeDone === todayKey();
  const lastCoachableId = [...items]
    .reverse()
    .find((i) => i.kind === "message" && i.role === "assistant" && i.coachable)?.id;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  }

  const todayInsight = progress.sessionInsights.find((s) => s.day === todayKey());

  return (
    <div className="app">
      <div className="header">
        <svg
          className={`mascot${busy ? " thinking" : ""}`}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="50" cy="50" r="38" fill="#FFFDF7" stroke="#2E2A22" strokeWidth="4" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#C98A2C" strokeWidth="2" strokeDasharray="2 5" />
          <text x="50" y="20" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontSize="10" fontWeight="700" fill="#2E2A22">N</text>
          <text x="50" y="86" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontSize="10" fontWeight="700" fill="#2E2A22">S</text>
          <text x="16" y="54" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontSize="10" fontWeight="700" fill="#2E2A22">W</text>
          <text x="84" y="54" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontSize="10" fontWeight="700" fill="#2E2A22">E</text>
          <g id="needle">
            <path d="M50 26 L58 50 L50 74 L42 50 Z" fill="#C1502E" stroke="#2E2A22" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M50 26 L58 50 L50 50 Z" fill="#E3A857" />
          </g>
          <circle cx="50" cy="50" r="5.5" fill="#2E2A22" />
        </svg>
        <div className="header-copy">
          <h1>Venture 1</h1>
          <p>The homework helper that never gives the answer first</p>
        </div>
        <div className="header-meters">
          <div className="meter-wrap">
            <div className="meter-label">Explorer</div>
            <div className="meter">
              <div className="meter-fill" style={meterStyle} />
            </div>
          </div>
          <div className="xp-wrap">
            <div className="xp-label">Lvl {levelInfo.level}</div>
            <div className="meter">
              <div className="meter-fill" style={xpStyle} />
            </div>
          </div>
        </div>
        {canSpeak ? (
          <button
            type="button"
            className={`voice-toggle-btn${readAloud ? " active" : ""}`}
            aria-label="Toggle read-aloud"
            title={readAloud ? "Read replies aloud (on)" : "Read replies aloud (off)"}
            onClick={() => {
              setReadAloud((v) => {
                if (v && canSpeak) window.speechSynthesis.cancel();
                return !v;
              });
            }}
          >
            {readAloud ? "🔊" : "🔇"}
          </button>
        ) : null}
      </div>

      <div className="layout">
        <aside className="sidebar">
          <div className="stats-row">
            <div className="stat-chip">
              🔥 Streak <strong>{progress.streak}d</strong>
            </div>
            <div className="stat-chip">
              ⭐ XP <strong>{progress.xp}</strong>
            </div>
            <div className="stat-chip">
              ❓ Asked <strong>{progress.questionsAsked}</strong>
            </div>
            <div className="stat-chip">
              🧠 Mastery{" "}
              <strong>
                {progress.mastery.length
                  ? `${Math.round(
                      progress.mastery.reduce((s, m) => s + masteryPct(m), 0) /
                        progress.mastery.length,
                    )}%`
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="subject-grid" role="group" aria-label="Subject focus">
            {(Object.keys(SUBJECTS) as SubjectFocus[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`subject-chip${subjectFocus === key ? " active" : ""}`}
                onClick={() => setSubjectFocus(key)}
              >
                <span>{SUBJECTS[key].emoji}</span>
                {SUBJECTS[key].label}
              </button>
            ))}
          </div>

          <div className="toolbar">
            <select
              className="age-select"
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value as AgeBand)}
              aria-label="Age band"
            >
              {(Object.keys(AGE_BANDS) as AgeBand[]).map((k) => (
                <option key={k} value={k}>
                  {AGE_BANDS[k].label} ({AGE_BANDS[k].ages})
                </option>
              ))}
            </select>
            <select
              className="topic-select"
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              aria-label="Quiz topic"
            >
              {QUIZ_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  Quiz: {t.label}
                </option>
              ))}
            </select>
            <button type="button" className="tool-btn" onClick={() => setShowParent(true)}>
              👪 Parent report
            </button>
            <button
              type="button"
              className="tool-btn"
              onClick={practiceWeakSpot}
              disabled={busy}
            >
              🧩 Practice weak spot
            </button>
            <button type="button" className="tool-btn" onClick={newQuestionMode} disabled={busy}>
              🆕 New question
            </button>
            <button type="button" className="tool-btn" onClick={clearChat} disabled={busy}>
              🧹 Clear
            </button>
          </div>

          <div className="daily-card">
            <h3>⭐ Today&apos;s challenge</h3>
            <p>
              {daily.prompt}
              {dailyDone ? " — completed!" : " — earn bonus XP"}
            </p>
            <button
              type="button"
              className="tool-btn primary"
              disabled={busy || dailyDone}
              onClick={() => {
                setActiveQuestion(null);
                setAttemptLevel(1);
                setThreadAttempts(0);
                void sendMessage(daily.prompt);
              }}
            >
              {dailyDone ? "Done for today" : "Start challenge"}
            </button>
          </div>

          <div className="adventure-card">
            <h3>🗺️ Guided adventures</h3>
            <p>Multi-step quests that teach through questions.</p>
            <div className="toolbar">
              {ADVENTURES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="tool-btn"
                  disabled={busy}
                  onClick={() => startAdventure(a.id)}
                >
                  {a.emoji} {a.title}
                </button>
              ))}
              {adventureId ? (
                <button type="button" className="tool-btn primary" disabled={busy} onClick={nextAdventureStep}>
                  Next adventure step →
                </button>
              ) : null}
            </div>
          </div>

          {progress.mastery.length ? (
            <div className="mastery-card">
              <h3>📈 Subject mastery</h3>
              <div className="mastery-list">
                {[...progress.mastery]
                  .sort((a, b) => masteryPct(b) - masteryPct(a))
                  .slice(0, 5)
                  .map((m) => (
                    <div key={m.subject} className="mastery-row">
                      <span>{m.subject}</span>
                      <div className="mastery-bar">
                        <div className="mastery-fill" style={{ width: `${masteryPct(m)}%` }} />
                      </div>
                      <strong>{masteryPct(m)}%</strong>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="passport" id="passport">
            <span className="passport-label">🎒 Passport</span>
            {CATEGORIES.map((cat) => {
              const earned = earnedBadges.has(cat.id);
              const pop = popBadges.has(cat.id);
              return (
                <div
                  key={cat.id}
                  className={`badge${earned ? " earned" : ""}${pop ? " pop" : ""}`}
                  title={earned ? `${cat.label} — earned!` : `${cat.label} — not yet discovered`}
                >
                  {cat.emoji}
                </div>
              );
            })}
          </div>

          <button type="button" className="quiz-btn" disabled={busy} onClick={() => void startQuiz()}>
            🎯 Quiz Me!
          </button>
        </aside>

        <section className="main-pane">
          <div className="hint-ladder" aria-label="Hint ladder">
            <div className="hint-ladder-top">
              <span>Hint ladder · Stage {attemptLevel}/5</span>
              <span>
                {activeQuestion
                  ? `Attempts this thread: ${threadAttempts}`
                  : "Paste a problem to begin"}
              </span>
            </div>
            <div className="hint-steps">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={`hint-step${attemptLevel >= n ? " on" : ""}`} />
              ))}
            </div>
          </div>

          <div className="chat" ref={chatRef} role="log" aria-live="polite">
            {items.map((item) => {
              if (item.kind === "toast") {
                return (
                  <div key={item.id} className="badge-toast">
                    {item.content}
                  </div>
                );
              }
              if (item.kind === "typing") {
                return (
                  <div key={item.id} className="row bot">
                    <div className="avatar">🧭</div>
                    <div className="bubble typing">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                );
              }
              if (item.kind === "quiz") {
                if (item.finished) {
                  return (
                    <div key={item.id} className="quiz-card">
                      <div className="quiz-question">
                        🏁 You scored {item.score} out of {item.questions.length}!
                      </div>
                      <div className="quiz-explanation">
                        {item.score === item.questions.length
                          ? "Amazing work, true explorer! You got every question right."
                          : "Nice thinking! Every question you try makes you a sharper explorer."}
                      </div>
                      <button
                        type="button"
                        className="quiz-next"
                        onClick={() => {
                          setItems((prev) => prev.filter((i) => i.id !== item.id));
                          void startQuiz();
                        }}
                      >
                        🎯 Take another quiz
                      </button>
                    </div>
                  );
                }
                const q = item.questions[item.current];
                return (
                  <div key={item.id} className="quiz-card">
                    <div className="quiz-progress">
                      Question {item.current + 1} of {item.questions.length}
                    </div>
                    <div className="quiz-question">{q.question}</div>
                    <div className="quiz-options">
                      {q.options.map((opt, i) => {
                        let cls = "quiz-option";
                        if (item.revealed) {
                          if (i === q.correctIndex) cls += " correct";
                          else if (i === item.selected) cls += " incorrect";
                        }
                        return (
                          <button
                            key={`${item.id}-${i}`}
                            type="button"
                            className={cls}
                            disabled={item.revealed}
                            onClick={() => onQuizSelect(item.id, i)}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {item.revealed ? (
                      <>
                        <div className="quiz-explanation">
                          {(item.selected === q.correctIndex ? "✅ Yes! " : "Not quite — ") +
                            q.explanation}
                        </div>
                        <button type="button" className="quiz-next" onClick={() => onQuizNext(item.id)}>
                          {item.current === item.questions.length - 1
                            ? "See my score"
                            : "Next question →"}
                        </button>
                      </>
                    ) : null}
                  </div>
                );
              }

              if (!item.content && item.role === "assistant") {
                return (
                  <div key={item.id} className="row bot">
                    <div className="avatar">🧭</div>
                    <div className="bubble typing">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.id} className={`row ${item.role === "user" ? "user" : "bot"}`}>
                  <div className="avatar">{item.role === "user" ? "🙂" : "🧭"}</div>
                  <div className="bubble-col">
                    {item.html ? (
                      <div className="bubble">
                        I can&apos;t draw pictures on this plan yet! Ask a parent or guardian to upgrade
                        your membership at{" "}
                        <a
                          className="upgrade-link"
                          href="https://kiddo-create-lab.lovable.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          kiddo-create-lab.lovable.app
                        </a>{" "}
                        to unlock image creation.
                      </div>
                    ) : (
                      <div className="bubble">{item.content}</div>
                    )}
                    {item.role === "assistant" &&
                    item.coachable &&
                    item.id === lastCoachableId &&
                    !busy ? (
                      <div className="coach-actions" role="group" aria-label="Coach actions">
                        {COACH_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            className={`coach-btn${action.id === "got_it" ? " primary" : ""}`}
                            onClick={() => onCoach(action.id)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {showStarters ? (
            <div className="starter-row">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="starter"
                  disabled={busy}
                  onClick={() => {
                    setActiveQuestion(null);
                    setAttemptLevel(1);
                    setThreadAttempts(0);
                    void sendMessage(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form className="inputbar" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Paste a homework problem or ask for help…"
              maxLength={300}
              disabled={busy}
              autoComplete="off"
            />
            {canListen ? (
              <button
                type="button"
                className={`mic-btn${listening ? " listening" : ""}`}
                aria-label="Speak your question"
                title="Speak your question"
                disabled={busy}
                onClick={toggleMic}
              >
                🎤
              </button>
            ) : null}
            <button type="submit" className="send-btn" aria-label="Send" disabled={busy || !input.trim()}>
              ➤
            </button>
          </form>
          <div className="voice-status">{voiceStatus}</div>
          <div className="footnote">
            One question at a time · attempt before the next step · never a copied answer
          </div>
        </section>
      </div>

      {showParent ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>👪 Parent report</h2>
            <p>
              Level {levelInfo.level} · {progress.xp} XP · {progress.streak}-day streak
            </p>
            <ul>
              <li>Questions asked: {progress.questionsAsked}</li>
              <li>Coach actions used: {progress.coachUses}</li>
              <li>Full reveals used: {progress.revealsUsed}</li>
              <li>Quizzes completed: {progress.quizzesCompleted}</li>
              <li>Adventures completed: {progress.adventuresCompleted}</li>
              <li>Passport stamps: {earnedBadges.size}/{CATEGORIES.length}</li>
              <li>
                Weak spots: {weak.length ? weak.join(", ") : "none yet — keep practicing"}
              </li>
              <li>
                Concepts noted:{" "}
                {progress.conceptsLearned.length
                  ? progress.conceptsLearned.slice(-5).join(" · ")
                  : "none yet"}
              </li>
              <li>
                Today: {todayInsight ? `${todayInsight.questions} turns, ${todayInsight.coachUses} coach taps` : "no session yet"}
              </li>
              <li>Age band: {AGE_BANDS[ageBand].label}</li>
              <li>Subject focus: {SUBJECTS[subjectFocus].label}</li>
              <li>Daily challenge today: {dailyDone ? "done" : "not yet"}</li>
            </ul>
            {progress.mastery.length ? (
              <div className="mastery-list compact">
                {progress.mastery.map((m) => (
                  <div key={m.subject} className="mastery-row">
                    <span>{m.subject}</span>
                    <div className="mastery-bar">
                      <div className="mastery-fill" style={{ width: `${masteryPct(m)}%` }} />
                    </div>
                    <strong>{masteryPct(m)}%</strong>
                  </div>
                ))}
              </div>
            ) : null}
            <p>
              Venture 1 is built as a homework helper that never gives the answer first. Chat stays
              on this device (browser storage) unless you clear it.
            </p>
            <div className="modal-actions">
              <button type="button" className="tool-btn" onClick={() => setShowParent(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
