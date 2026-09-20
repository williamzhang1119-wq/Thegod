export type CoachMode =
  | "got_it"
  | "simpler"
  | "another_way"
  | "example"
  | "hint"
  | "check_work"
  | "quiz_me";

export type SubjectFocus =
  | "homework"
  | "math"
  | "reading"
  | "writing"
  | "science"
  | "world"
  | "arts"
  | "open";

export const SUBJECTS: Record<
  SubjectFocus,
  { label: string; emoji: string; blurb: string }
> = {
  homework: {
    label: "Homework",
    emoji: "📚",
    blurb: "Paste a problem — guide, don't spoil",
  },
  math: { label: "Math", emoji: "🔢", blurb: "Steps, not spoilers" },
  reading: { label: "Reading", emoji: "📖", blurb: "Understand, then explain" },
  writing: { label: "Writing", emoji: "✍️", blurb: "Outline and revise together" },
  science: { label: "Science", emoji: "🔬", blurb: "How the world works" },
  world: {
    label: "World",
    emoji: "🌍",
    blurb: "History, places, cultures, nature",
  },
  arts: { label: "Arts", emoji: "🎨", blurb: "Music, drawing, stories, sports" },
  open: { label: "Explore", emoji: "🧭", blurb: "Any curious kid-safe question" },
};

export const COACH_ACTIONS: Array<{
  id: CoachMode;
  label: string;
  short: string;
  burnsLadder: boolean;
}> = [
  { id: "got_it", label: "I get it", short: "Got it", burnsLadder: false },
  { id: "simpler", label: "Simpler", short: "Simpler", burnsLadder: false },
  { id: "another_way", label: "Another way", short: "Another way", burnsLadder: false },
  { id: "example", label: "Show example", short: "Example", burnsLadder: false },
  { id: "hint", label: "Give a hint", short: "Hint", burnsLadder: true },
  { id: "check_work", label: "Check my work", short: "Check", burnsLadder: false },
  { id: "quiz_me", label: "Quiz me", short: "Quiz", burnsLadder: false },
];

export function coachDirective(mode: CoachMode): string {
  switch (mode) {
    case "got_it":
      return "The learner says they understand. Briefly confirm the key idea in one sentence, then ask them to restate it in their own words OR offer a tiny stretch question. Do not dump a full lecture.";
    case "simpler":
      return "The learner is stuck or confused. Explain the SAME idea with much simpler words, a concrete everyday analogy, and shorter sentences. Do not give the final answer unless already at reveal stage.";
    case "another_way":
      return "Explain the SAME idea with a completely different analogy or approach (visual, story, or step diagram in words). Still withhold the final answer unless reveal stage.";
    case "example":
      return "Give a closely related EXAMPLE problem (not the exact homework answer) and walk through ONE guided step, then ask the learner to try the next step themselves.";
    case "hint":
      return "Give the next-ladder hint for the current question. Keep it one clue, then ask what they notice.";
    case "check_work":
      return "The learner wants you to check their attempt. Ask them to paste/share their answer or steps if missing. If they shared work: mark what's solid, ask one precise fix question for any error, and NEVER rewrite the whole solution for them to copy.";
    case "quiz_me":
      return "Ask ONE short check question about what you just taught (multiple choice verbally or fill-in). Wait for their reply; do not reveal the answer yet. Prefer a fresh angle — not a word-for-word repeat of the last question.";
  }
}

export function detectStuck(text: string): boolean {
  const lower = text.toLowerCase();
  return [
    /\bi\s*(don'?t|do not)\s+know\b/,
    /\bi'?m\s+stuck\b/,
    /\bhelp\s+me\b/,
    /\bconfused\b/,
    /\bno\s+idea\b/,
    /\bthis\s+is\s+hard\b/,
    /\bi\s+give\s+up\b/,
    /\bidk\b/,
    /\bhuh\??\b/,
  ].some((p) => p.test(lower));
}

export function detectRevealRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return [
    /\bjust\s+tell\s+me\b/,
    /\btell\s+me\s+the\s+answer\b/,
    /\bi\s+give\s+up\b/,
    /\bwhat'?s\s+the\s+answer\b/,
    /\bgive\s+me\s+the\s+answer\b/,
  ].some((p) => p.test(lower));
}

export function inferSubject(text: string): SubjectFocus | null {
  const lower = text.toLowerCase();
  if (/\b(\d+\s*[x×*+\-/÷]\s*\d+|fraction|equation|algebra|geometry|multiply|divide|percent)\b/.test(lower)) {
    return "math";
  }
  if (/\b(paragraph|essay|sentence|grammar|write|thesis|outline)\b/.test(lower)) {
    return "writing";
  }
  if (/\b(read|passage|story|chapter|vocab|character|theme)\b/.test(lower)) {
    return "reading";
  }
  if (
    /\b(science|atom|gravity|cell|planet|experiment|energy|force|chemistry|biology|physics|electric|magnet)\b/.test(
      lower,
    )
  ) {
    return "science";
  }
  if (
    /\b(history|ancient|civilization|geography|continent|country|map|culture|language|ocean|animal|nature|forest|dinosaur)\b/.test(
      lower,
    )
  ) {
    return "world";
  }
  if (
    /\b(art|music|paint|draw|song|instrument|dance|sport|soccer|basketball|hobby)\b/.test(lower)
  ) {
    return "arts";
  }
  if (/\b(homework|worksheet|assignment|problem)\b/.test(lower)) {
    return "homework";
  }
  if (
    /\b(why|how come|what is|what's|how does|how do|tell me about|curious)\b/.test(lower)
  ) {
    return "open";
  }
  return null;
}
