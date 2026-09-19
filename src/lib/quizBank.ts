export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type QuizItem = {
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

const QUIZ_BANK: QuizItem[] = [
  // science
  {
    topic: "science",
    question: "Why does the sky look blue on a clear day?",
    options: ["The ocean paints it", "Air scatters blue light most", "The sun is blue", "Clouds are blue underneath"],
    correctIndex: 1,
    explanation: "Sunlight has many colors. Tiny bits of air scatter blue light more than other colors.",
  },
  {
    topic: "science",
    question: "What do plants need for photosynthesis?",
    options: ["Only soil", "Only darkness", "Sunlight, water, and carbon dioxide", "Only wind"],
    correctIndex: 2,
    explanation: "Plants use sunlight, water, and carbon dioxide to make food.",
  },
  {
    topic: "science",
    question: "What state of matter is steam?",
    options: ["Solid", "Liquid", "Gas", "Plasma toy"],
    correctIndex: 2,
    explanation: "Steam is water as a gas — tiny water particles moving freely in the air.",
  },
  {
    topic: "science",
    question: "Which tool measures temperature?",
    options: ["Ruler", "Thermometer", "Scale", "Compass"],
    correctIndex: 1,
    explanation: "A thermometer measures how hot or cold something is.",
  },
  {
    topic: "science",
    question: "What pulls objects toward Earth?",
    options: ["Magnetism only", "Gravity", "Wind", "Electricity"],
    correctIndex: 1,
    explanation: "Gravity is the force that pulls objects toward Earth.",
  },
  {
    topic: "science",
    question: "What do lungs help your body do?",
    options: ["Digest food", "Pump blood", "Breathe in oxygen", "Make bones"],
    correctIndex: 2,
    explanation: "Lungs take in oxygen from the air and help remove carbon dioxide.",
  },
  {
    topic: "science",
    question: "Which material usually floats in water?",
    options: ["A steel nail", "A wooden cork", "A rock", "A glass marble"],
    correctIndex: 1,
    explanation: "A cork is less dense than water, so it floats.",
  },
  {
    topic: "science",
    question: "What causes day and night on Earth?",
    options: ["The Moon hiding the Sun", "Earth spinning", "Clouds turning off lights", "Stars blinking"],
    correctIndex: 1,
    explanation: "Earth rotates, so different sides face the Sun — that's day and night.",
  },
  // space
  {
    topic: "space",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Mercury"],
    correctIndex: 2,
    explanation: "Mars looks reddish because of iron-rich dust on its surface.",
  },
  {
    topic: "space",
    question: "Why do astronauts wear space suits?",
    options: ["To look cool in photos", "To carry food only", "For air, pressure, and temperature protection", "Because space is noisy"],
    correctIndex: 2,
    explanation: "Space has no breathable air and extreme temperatures — suits keep astronauts safe.",
  },
  {
    topic: "space",
    question: "What does Earth orbit?",
    options: ["The Moon", "The Sun", "Mars", "A comet"],
    correctIndex: 1,
    explanation: "Earth travels around the Sun once each year.",
  },
  {
    topic: "space",
    question: "What is a shooting star usually?",
    options: ["A star falling from the sky", "A tiny meteor burning up", "A plane light", "Lightning"],
    correctIndex: 1,
    explanation: "Most 'shooting stars' are small bits of rock heating up as they enter Earth's air.",
  },
  {
    topic: "space",
    question: "Which is closest to Earth?",
    options: ["The Sun", "The Moon", "Jupiter", "Saturn"],
    correctIndex: 1,
    explanation: "The Moon is Earth's nearest big neighbor in space.",
  },
  {
    topic: "space",
    question: "What galaxy do we live in?",
    options: ["Andromeda only", "The Milky Way", "The Solar Ocean", "The Ring Galaxy"],
    correctIndex: 1,
    explanation: "Our solar system is part of the Milky Way galaxy.",
  },
  // math
  {
    topic: "math",
    question: "What is 7 × 6?",
    options: ["36", "42", "48", "56"],
    correctIndex: 1,
    explanation: "7 groups of 6 (or 6 groups of 7) make 42.",
  },
  {
    topic: "math",
    question: "Which fraction is larger: 1/2 or 1/4?",
    options: ["1/4", "They are equal", "1/2", "Neither exists"],
    correctIndex: 2,
    explanation: "Half of something is more than a quarter of it.",
  },
  {
    topic: "math",
    question: "What is 15 + 27?",
    options: ["32", "42", "52", "412"],
    correctIndex: 1,
    explanation: "15 + 27 = 42.",
  },
  {
    topic: "math",
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctIndex: 1,
    explanation: "A hexagon has six sides.",
  },
  {
    topic: "math",
    question: "What is 100 − 37?",
    options: ["63", "73", "67", "53"],
    correctIndex: 0,
    explanation: "100 − 37 = 63.",
  },
  {
    topic: "math",
    question: "If a pizza has 8 slices and you eat 3, what fraction is left?",
    options: ["3/8", "5/8", "8/3", "1/3"],
    correctIndex: 1,
    explanation: "8 − 3 = 5 slices left, so 5/8 of the pizza remains.",
  },
  {
    topic: "math",
    question: "What is 9 × 9?",
    options: ["18", "72", "81", "99"],
    correctIndex: 2,
    explanation: "Nine groups of nine make 81.",
  },
  {
    topic: "math",
    question: "Which number is even?",
    options: ["17", "21", "24", "33"],
    correctIndex: 2,
    explanation: "Even numbers can be split into two equal whole groups — 24 can.",
  },
  // nature / history / arts / tech extras for mixed
  {
    topic: "nature",
    question: "What do bees help plants do?",
    options: ["Sleep", "Pollinate flowers", "Make thunder", "Grow rocks"],
    correctIndex: 1,
    explanation: "Bees carry pollen between flowers, helping plants make seeds and fruit.",
  },
  {
    topic: "nature",
    question: "Where do most fish get oxygen?",
    options: ["From soil", "From water through gills", "From moonlight", "From sand"],
    correctIndex: 1,
    explanation: "Fish pull oxygen from water using their gills.",
  },
  {
    topic: "nature",
    question: "What is a baby frog called?",
    options: ["Cub", "Tadpole", "Chick", "Pup"],
    correctIndex: 1,
    explanation: "Baby frogs start as tadpoles that live in water.",
  },
  {
    topic: "history",
    question: "The ancient pyramids of Giza are in which country?",
    options: ["Italy", "Egypt", "Japan", "Brazil"],
    correctIndex: 1,
    explanation: "The famous pyramids of Giza are in Egypt.",
  },
  {
    topic: "history",
    question: "Who were the Vikings mainly known as?",
    options: ["Desert farmers only", "Seafarers and explorers from Scandinavia", "Moon miners", "Rainforest builders"],
    correctIndex: 1,
    explanation: "Vikings were Norse people known for sailing, trading, and exploring.",
  },
  {
    topic: "arts",
    question: "Primary colors are usually which set?",
    options: ["Green, orange, purple", "Red, yellow, blue", "Black, white, gray", "Pink, brown, gold"],
    correctIndex: 1,
    explanation: "Red, yellow, and blue are the classic primary colors for mixing paints.",
  },
  {
    topic: "arts",
    question: "How many keys does a standard piano have?",
    options: ["48", "66", "88", "120"],
    correctIndex: 2,
    explanation: "A modern standard piano has 88 keys.",
  },
  {
    topic: "tech",
    question: "What is a program on a computer?",
    options: ["A random spark", "A list of instructions to follow", "A type of battery", "A kind of screen"],
    correctIndex: 1,
    explanation: "Programs are step-by-step instructions computers follow very quickly.",
  },
  {
    topic: "tech",
    question: "What does Wi‑Fi help a device do?",
    options: ["Cook food", "Connect to a network without a cable", "Print paper forever", "Charge by magic"],
    correctIndex: 1,
    explanation: "Wi‑Fi lets devices join a network wirelessly.",
  },
  {
    topic: "tech",
    question: "What is the brain of a computer often called?",
    options: ["The keyboard", "The CPU", "The mouse", "The speaker"],
    correctIndex: 1,
    explanation: "The CPU (central processing unit) does the main calculating and decision work.",
  },
  {
    topic: "big",
    question: "What does recycling mainly help with?",
    options: ["Making more trash", "Reusing materials so we waste less", "Turning off gravity", "Stopping rain"],
    correctIndex: 1,
    explanation: "Recycling turns used materials into new things, which helps reduce waste.",
  },
  {
    topic: "science",
    question: "What happens to water when it freezes?",
    options: ["It becomes a gas", "It becomes a solid", "It disappears", "It turns into metal"],
    correctIndex: 1,
    explanation: "Freezing changes liquid water into solid ice.",
  },
  {
    topic: "space",
    question: "About how long does Earth take to orbit the Sun?",
    options: ["One day", "One month", "One year", "One hour"],
    correctIndex: 2,
    explanation: "One full trip around the Sun is about one year.",
  },
  {
    topic: "math",
    question: "What is half of 48?",
    options: ["12", "18", "24", "36"],
    correctIndex: 2,
    explanation: "Half means divide by 2: 48 ÷ 2 = 24.",
  },
];

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Simple seeded RNG so client/server can pass a seed for variety. */
export function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function withShuffledOptions(item: QuizItem, rng: () => number): QuizQuestion {
  const indexed = item.options.map((text, i) => ({ text, i }));
  shuffleInPlace(indexed, rng);
  const correctIndex = indexed.findIndex((o) => o.i === item.correctIndex);
  return {
    question: item.question,
    options: indexed.map((o) => o.text),
    correctIndex,
    explanation: item.explanation,
  };
}

export function buildDemoQuiz(options?: {
  topic?: string;
  seed?: number;
  excludeQuestions?: string[];
  count?: number;
}): QuizQuestion[] {
  const topic = (options?.topic || "mixed").toLowerCase();
  const count = options?.count ?? 4;
  const exclude = new Set((options?.excludeQuestions || []).map((q) => q.trim().toLowerCase()));
  const rng = makeRng(options?.seed ?? Date.now());

  let pool = QUIZ_BANK.filter((q) => !exclude.has(q.question.toLowerCase()));
  if (topic !== "mixed") {
    const focused = pool.filter((q) => q.topic === topic);
    // If focus pool is small after excludes, top up from other topics
    pool = focused.length >= count ? focused : [...focused, ...pool.filter((q) => q.topic !== topic)];
  }

  if (pool.length < count) {
    pool = [...QUIZ_BANK];
  }

  shuffleInPlace(pool, rng);
  const picked = pool.slice(0, count).map((item) => withShuffledOptions(item, rng));
  return picked;
}

export function demoQuizJson(topic?: string, seed?: number, excludeQuestions?: string[]): string {
  return JSON.stringify(buildDemoQuiz({ topic, seed, excludeQuestions }));
}
