import { buildSystemPrompt, type AgeBand } from "./prompts";
import { demoQuizJson } from "./quizBank";

export type { QuizQuestion } from "./quizBank";
export { buildDemoQuiz, demoQuizJson } from "./quizBank";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY;
}

export function demoReply(userText: string, attemptLevel = 1): string {
  const lower = userText.toLowerCase();
  const stage = Math.max(1, Math.min(attemptLevel, 5));

  if (/\b(just )?tell me( the)? answer\b/.test(lower) || /\bi give up\b/.test(lower)) {
    return "Okay — unlock time. Tell me the very last clue you already noticed, and I'll fill in only the missing piece so you still own the discovery.";
  }

  const sky = lower.includes("sky") || lower.includes("blue");
  const math = lower.includes("12") || lower.includes("multiply") || /\d+\s*[x×*]\s*\d+/.test(lower);
  const computer = lower.includes("computer") || lower.includes("code");
  const dino = lower.includes("dino");
  const dream = lower.includes("dream");
  const money = lower.includes("money");

  if (sky) {
    const replies = [
      "Great explorer question! Before any facts: what color do you think sunlight is when it leaves the Sun?",
      "Hint: sunlight is a mix of many colors. Which color do you think air bounces around the most — red, green, or blue?",
      "Stronger clue: shorter wavelengths bounce more in air. Blue light has a shorter wavelength than red. What does that suggest for the sky?",
      "You're one step away: if blue gets scattered all over the sky, what color should we see looking up?",
      "Reveal: air scatters blue light more than other colors, so the sky looks blue. Can you explain that back in your own words?",
    ];
    return replies[stage - 1];
  }

  if (math) {
    const replies = [
      "Math adventure! What does multiplying mean in your own words — groups, hops, or something else?",
      "Try a lighter hint: 12 × 8 means 12 groups of 8 (or 8 groups of 12). What's an easier nearby fact you know, like 10 × 8?",
      "Partial step: 10 × 8 = 80. Now what would 2 × 8 add on top of that?",
      "Almost there — combine those pieces. What total do you get?",
      "Reveal: 12 × 8 = 96, because 10×8=80 and 2×8=16, and 80+16=96. Want to try 12 × 9 the same way?",
    ];
    return replies[stage - 1];
  }

  if (computer) {
    const replies = [
      "Computers are super-fast rule followers. What do you think a program is made of — ideas, instructions, or electricity?",
      "Hint: every choice a computer makes is basically yes/no. How could big decisions be built from tiny yes/no steps?",
      "Stronger clue: code is a list of instructions the machine follows in order. What happens if one instruction is wrong?",
      "Finish this: a computer 'thinks' by running instructions very quickly. What should we call the person who writes those instructions?",
      "Reveal: computers follow programs — step-by-step instructions. They don't understand like humans; they execute rules extremely fast. What would you program first?",
    ];
    return replies[stage - 1];
  }

  if (dino) {
    const replies = [
      "Dino detective mode! What kinds of clues would you hunt for — rocks, fossils, or both?",
      "Hint: something big changed Earth's climate long ago. What could change a whole planet's weather?",
      "Stronger clue: scientists found a special layer of dust around the world from the same time. What might that dust be from?",
      "Nearly there: a huge space rock is one leading idea. How would that hurt dinosaurs that needed plants or prey?",
      "Reveal: a massive asteroid impact (plus climate chaos) is a top explanation. Many plants and animals couldn't survive the aftermath. What would YOU have investigated first?",
    ];
    return replies[stage - 1];
  }

  if (dream) {
    const replies = [
      "Dreams are mysterious! What do YOU notice most in dreams — stories, feelings, or weird mash-ups?",
      "Hint: your brain stays busy while you sleep. What jobs might a sleeping brain still need to do?",
      "Stronger clue: dreams often remix memories and feelings. Why might that be useful practice?",
      "Almost: scientists think dreams may help with memory and emotions. Which of those feels more true for you?",
      "Reveal: dreams likely help the brain sort memories and feelings — but nobody has one final answer yet. What's your best theory?",
    ];
    return replies[stage - 1];
  }

  if (money) {
    const replies = [
      "Money is a tool people invented to trade. Before coins, people swapped things. What problem does swapping create?",
      "Hint: if you have apples and need shoes, you need someone who wants apples AND has shoes. What would make that easier?",
      "Stronger clue: money is something most people agree has value for trading. Why is that more flexible than bartering?",
      "Finish the idea: money stores value so you can buy later. What else does it help people compare?",
      "Reveal: money makes trading easier by being a shared measure of value. Prices help compare goods. What would you invent as money on a desert island?",
    ];
    return replies[stage - 1];
  }

  const generic = [
    "Ooh, let's explore that! What's your best guess so far — even a wild one helps.",
    "Nice thinking so far. What's one clue in the question that feels most important?",
    "Stronger nudge: break it into a smaller piece. What's the first tiny question inside this big one?",
    "You're close — try saying the answer in one short sentence, and I'll help you check it.",
    "Here's the idea in plain words, then you restate it: every tough question hides a smaller step. What's your takeaway?",
  ];
  return generic[stage - 1];
}

type GenOptions = {
  system?: string;
  messages: ChatTurn[];
  maxTokens?: number;
  model?: string;
  ageBand?: AgeBand;
  attemptLevel?: number;
  topicFocus?: string;
  quizSeed?: number;
  excludeQuestions?: string[];
};

async function chatWithAnthropic(options: {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
}): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": options.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      system: options.system,
      messages: options.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic error (${res.status})`);
  }
  const text = (data.content || [])
    .map((b) => b.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!text) throw new Error("Empty model response");
  return text;
}

async function chatWithOpenAI(options: {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
}): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.6,
      max_tokens: options.maxTokens,
      messages: [{ role: "system", content: options.system }, ...options.messages],
    }),
  });

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI error (${res.status})`);
  }
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty model response");
  return content;
}

export async function generateReply(
  options: GenOptions,
): Promise<{ text: string; demo: boolean; provider: string }> {
  const system =
    options.system ||
    buildSystemPrompt({
      ageBand: options.ageBand,
      attemptLevel: options.attemptLevel,
      topicFocus: options.topicFocus,
    });
  const maxTokens = options.maxTokens || 1200;
  const messages = options.messages.slice(-16);

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const model = options.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    const text = await chatWithAnthropic({
      apiKey: anthropicKey,
      model,
      system,
      messages,
      maxTokens,
    });
    return { text, demo: false, provider: "anthropic" };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const text = await chatWithOpenAI({
      apiKey: openaiKey,
      model,
      system,
      messages,
      maxTokens,
    });
    return { text, demo: false, provider: "openai" };
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const isQuiz =
    system.toLowerCase().includes("quiz") ||
    lastUser.toLowerCase().includes("generate the quiz");
  const topicMatch = system.match(/focused on ([^.\n]+)/i);
  let topic = "mixed";
  if (topicMatch?.[1]) {
    const raw = topicMatch[1].toLowerCase();
    if (raw.includes("science")) topic = "science";
    else if (raw.includes("space")) topic = "space";
    else if (raw.includes("math")) topic = "math";
    else if (raw.includes("nature")) topic = "nature";
    else if (raw.includes("history")) topic = "history";
    else if (raw.includes("art")) topic = "arts";
    else if (raw.includes("tech")) topic = "tech";
  }
  // Prefer explicit seed from user message: "seed=12345"
  const seedFromMsg = lastUser.match(/seed\s*=\s*(\d+)/i);
  const seed = options.quizSeed ?? (seedFromMsg ? Number(seedFromMsg[1]) : Date.now());
  const excludeFromMsg = [...lastUser.matchAll(/EXCLUDE:\s*(.+)$/gim)].flatMap((m) =>
    m[1].split("|").map((s) => s.trim()).filter(Boolean),
  );
  return {
    text: isQuiz
      ? demoQuizJson(topic, seed, options.excludeQuestions || excludeFromMsg)
      : demoReply(lastUser, options.attemptLevel || 1),
    demo: true,
    provider: "demo",
  };
}

/** OpenAI SSE streaming; falls back to full reply for Anthropic/demo. */
export async function streamReply(
  options: GenOptions,
  onDelta: (chunk: string) => void,
): Promise<{ text: string; demo: boolean; provider: string }> {
  const system =
    options.system ||
    buildSystemPrompt({
      ageBand: options.ageBand,
      attemptLevel: options.attemptLevel,
      topicFocus: options.topicFocus,
    });
  const messages = options.messages.slice(-16);
  const maxTokens = options.maxTokens || 1200;

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Prefer OpenAI for true token streaming when available
  if (openaiKey && !anthropicKey) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: maxTokens,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(err || `OpenAI stream error (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content || "";
          if (delta) {
            full += delta;
            onDelta(delta);
          }
        } catch {
          // ignore partial JSON
        }
      }
    }
    return { text: full.trim(), demo: false, provider: "openai" };
  }

  // Anthropic or demo: generate full then "stream" in chunks for UX
  const result = await generateReply(options);
  const words = result.text.split(/(\s+)/);
  for (const w of words) {
    onDelta(w);
  }
  return result;
}
