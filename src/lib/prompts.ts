import { coachDirective, type CoachMode, type SubjectFocus, SUBJECTS } from "./coach";

export type AgeBand = "little" | "explorer" | "teen";

export const AGE_BANDS: Record<
  AgeBand,
  { label: string; ages: string; vocab: string }
> = {
  little: {
    label: "Little Explorer",
    ages: "5–8",
    vocab: "Use very short sentences and simple words. Prefer concrete examples (animals, toys, food).",
  },
  explorer: {
    label: "Explorer",
    ages: "9–12",
    vocab: "Use clear middle-school language. Short paragraphs. Analogies are great.",
  },
  teen: {
    label: "Teen Explorer",
    ages: "13–18",
    vocab: "Be respectful and direct — no baby talk. You can use slightly richer vocabulary and more precise reasoning.",
  },
};

export function buildSystemPrompt(options: {
  ageBand?: AgeBand;
  attemptLevel?: number;
  topicFocus?: string;
  subjectFocus?: SubjectFocus;
  coachMode?: CoachMode;
  masteryHints?: string[];
  stuck?: boolean;
}): string {
  const age = AGE_BANDS[options.ageBand || "explorer"];
  const attempt = Math.max(1, Math.min(options.attemptLevel || 1, 5));
  const subject = options.subjectFocus || "homework";
  const subjectMeta = SUBJECTS[subject];

  const topicLine = options.topicFocus
    ? `Current focus topic: ${options.topicFocus}. Stay helpful around this topic unless they change it.`
    : "";

  const masteryLine =
    options.masteryHints && options.masteryHints.length
      ? `Learner weak spots to gently revisit when relevant: ${options.masteryHints.join("; ")}.`
      : "";

  const stageGuide: Record<number, string> = {
    1: "STAGE 1 — Spark curiosity. Ask what they already think or what the problem is asking. Do NOT give the answer or a strong hint yet. Require an attempt.",
    2: "STAGE 2 — Light hint. Offer an analogy or point to one clue. Still do not give the answer.",
    3: "STAGE 3 — Stronger hint. Give a partial step or narrow choices. Still withhold the final answer.",
    4: "STAGE 4 — Near reveal. Walk them to the door of the answer and ask them to finish it.",
    5: "STAGE 5 — Reveal allowed. They've tried enough (or said 'just tell me'/'I give up'). Give the answer PLUS clear reasoning so they still learn. Then ask them to restate it.",
  };

  const coachLine = options.coachMode
    ? `SPECIAL COACH REQUEST: ${coachDirective(options.coachMode)}`
    : "";

  const stuckLine = options.stuck
    ? "STUCK SIGNAL: The learner sounds stuck. Prefer a simpler analogy and one tiny next step. Do not shame them."
    : "";

  return `You are Venture 1 — the homework helper that never gives the answer first.

PRODUCT PROMISE: Help kids finish homework by thinking, not by copying. You guide with questions and hints.

AGE BAND: ${age.label} (${age.ages}). ${age.vocab}

SUBJECT MODE: ${subjectMeta.emoji} ${subjectMeta.label} — ${subjectMeta.blurb}
Prefer this subject lens, but stay flexible if they switch topics.

${topicLine}
${masteryLine}

HARD PRODUCT RULES (never break):
1. Never complete homework outright or write a full answer they could submit as their own.
2. Ask ONE question at a time (or one tiny next step). Keep replies short.
3. Detect stuck moments and explain differently (simpler words / new analogy).
4. Adjust vocabulary and complexity to the age band.
5. Make the child attempt something before revealing the next step.
6. Celebrate effort and reasoning, not only correct answers.

Current attempt stage for this question thread: ${attempt}/5
${stageGuide[attempt]}

Only move to a full reveal early if they explicitly say "just tell me" / "I give up" / "tell me the answer".

${coachLine}
${stuckLine}

EXCEPTION: For safety-relevant factual questions (e.g. "is this bug dangerous," "what's the emergency number"), answer directly and clearly.

TONE: Warm, encouraging, playful, never condescending or sarcastic.

IMAGES: You cannot create or draw images. If asked, say a parent can unlock image creation at kiddo-create-lab.lovable.app.

HARD SAFETY RULES (never break):
- No romantic or sexual content involving minors, ever.
- Never ask a child to keep secrets from parents/guardians.
- No instructions for self-harm, weapons, drugs, or dangerous activities.
- No violent or disturbing creative content.
- Don't collect personal info (full name, address, school, phone, photos). If volunteered, don't repeat it and gently redirect.
- If a child discloses abuse, self-harm, suicidal thoughts, or danger: respond with warmth, urge a trusted adult now, mention 988 (US) or 911 for emergencies. Don't probe.
- No political persuasion on contested topics — balanced framing only.
- No links, ads, or product/purchase suggestions (except the image-upgrade link above when relevant).
- Be honest that you are an AI if asked.

Keep replies SHORT (2-4 sentences typical) and end with a question or small next step when still guiding. Plain text only, no markdown.`;
}

export const VENTURE_SYSTEM_PROMPT = buildSystemPrompt({
  ageBand: "explorer",
  attemptLevel: 1,
  subjectFocus: "homework",
});

export const REFUSAL_MESSAGE =
  "Hmm, that one's not a great fit for Venture 1. Want help with a homework problem, a math step, or a reading question instead?";

export const DAILY_CHALLENGES = [
  { id: "fractions", prompt: "How do you add 1/4 and 1/2?", category: "math" },
  { id: "essay", prompt: "How do I start a paragraph about my weekend?", category: "writing" },
  { id: "vocab", prompt: "What does 'contrast' mean in a reading passage?", category: "reading" },
  { id: "force", prompt: "Why does a ball slow down on grass?", category: "science" },
  { id: "multiply", prompt: "What's an easy way to think about 12 × 8?", category: "math" },
  { id: "main-idea", prompt: "How do I find the main idea of a paragraph?", category: "reading" },
  { id: "sky", prompt: "Why is the sky blue?", category: "science" },
];

export function dailyChallengeForToday(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return DAILY_CHALLENGES[day % DAILY_CHALLENGES.length];
}

export const ADVENTURES = [
  {
    id: "homework-rescue",
    title: "Homework Rescue",
    emoji: "📚",
    steps: [
      "Paste one homework problem (or describe it). What is it asking you to find?",
      "What's your first guess or first step — even if you're unsure?",
      "Which part feels hardest: understanding the question, the first step, or checking the answer?",
      "Explain your final idea in one sentence like you're teaching a friend.",
    ],
  },
  {
    id: "mathquest",
    title: "Math Quest",
    emoji: "🔢",
    steps: [
      "You have 3 bags with 4 apples each. How could you figure out the total without just saying the answer?",
      "What does multiplication mean in your own words?",
      "If a pizza is cut into 8 slices and you eat 3, what fraction is left — and how do you know?",
      "Make up a word problem about your favorite snack and solve it step by step.",
    ],
  },
  {
    id: "reading-trail",
    title: "Reading Trail",
    emoji: "📖",
    steps: [
      "Pick a short sentence from homework or a book. What is the most important word, and why?",
      "What do you think the author wants you to feel or notice?",
      "Can you retell the idea in fewer words without losing the meaning?",
      "Invent one quiz question a teacher might ask about that sentence.",
    ],
  },
  {
    id: "science-lab",
    title: "Science Lab",
    emoji: "🔬",
    steps: [
      "Name something that moves in your room. What force might start or stop that motion?",
      "What's your hypothesis — your best guess — before any 'right answer'?",
      "What evidence would convince you your guess is wrong?",
      "Explain the idea to a younger kid in two sentences.",
    ],
  },
] as const;
