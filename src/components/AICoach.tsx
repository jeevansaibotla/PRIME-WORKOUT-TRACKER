import {
  Bot,
  ChevronDown,
  Dumbbell,
  KeyRound,
  Send,
  Settings2,
  Sparkles,
  Target,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DaySplit, GymData } from "@/lib/gym-store";
import {
  CoachPlanBuilder,
  type CoachApplyMode,
  type CoachDraft,
} from "@/components/CoachPlanBuilder";

type CoachProps = {
  data: GymData;
  split: DaySplit;
  streak: number;
  doneToday: boolean;
  active: boolean;
  initiallyOpen?: boolean;
  targetDay?: string;
  onApplyWorkout?: (draft: CoachDraft, mode: CoachApplyMode) => void;
};

type CoachMessage = {
  id: number;
  role: "coach" | "athlete";
  text: string;
  mode?: "offline" | "online";
};

const quickPrompts = [
  "Plan my session",
  "What should I lift next?",
  "Show my last performance",
  "Suggest an exercise substitute",
  "Give me a warm-up",
  "Should I deload?",
  "Give me a recovery check",
  "Explain progressive overload",
];

const ONLINE_KEY_STORAGE = "prime.coach.gemini.key";
const FREE_MODEL = "gemini-3.7-flash";
const ONLINE_MODE_STORAGE = "prime.coach.online";

function buildOfflineReply(
  prompt: string,
  data: GymData,
  split: DaySplit,
  streak: number,
  doneToday: boolean,
) {
  const normalized = prompt.toLowerCase();
  const firstName = data.profile.name.trim().split(/\s+/)[0] || "Athlete";
  const exercise = split.exercises[0]?.name ?? "your first movement";
  const latest = data.sessions[0];
  const recentVolume = data.sessions.slice(0, 4).reduce((sum, session) => sum + session.volume, 0);
  const lastExercise = latest?.exercises[0];
  const lastSet = lastExercise?.sets[lastExercise.sets.length - 1];

  if (
    normalized.includes("substitut") ||
    normalized.includes("replacement") ||
    normalized.includes("alternative")
  ) {
    const substitutions: Record<string, string> = {
      squat: "leg press, goblet squat, or Bulgarian split squat",
      deadlift: "Romanian deadlift, rack pull, or back extension",
      bench: "dumbbell bench press, push-up, or chest press machine",
      row: "seated cable row, one-arm dumbbell row, or machine row",
      pulldown: "pull-up, assisted pull-up, or straight-arm pulldown",
      curl: "hammer curl, incline dumbbell curl, or cable curl",
    };
    const match = Object.entries(substitutions).find(([word]) => normalized.includes(word));
    return `${firstName}, keep the same movement pattern and target muscle. Try ${match?.[1] ?? "a controlled dumbbell, cable, or machine variation"}. Match the effort, keep the tempo clean, and log the substitute so your history stays useful.`;
  }

  if (normalized.includes("warm") || normalized.includes("prepare")) {
    return `${firstName}, use a 7-minute ramp: 2 minutes of easy movement, joint circles for the target area, then 3 progressively heavier warm-up sets before ${exercise}. Stop the warm-up before fatigue; it should make the first work set feel sharper.`;
  }

  if (
    normalized.includes("deload") ||
    normalized.includes("fatigue") ||
    normalized.includes("tired")
  ) {
    const signal =
      data.sessions.length >= 3
        ? `You have ${data.sessions.length} logged sessions available for review.`
        : "Your history is still building, so use how you feel as the primary signal.";
    return `${signal} If performance, sleep, motivation, and joint comfort are all trending down for several sessions, reduce load by 10–15% or cut one set per movement for a week. Do not turn one tired day into a diagnosis.`;
  }

  if (
    normalized.includes("next") ||
    normalized.includes("lift") ||
    normalized.includes("weight") ||
    normalized.includes("overload")
  ) {
    const reference = lastSet?.weight
      ? `${lastSet.weight} kg × ${lastSet.reps}`
      : "your last logged set";
    return `${firstName}, use double progression: repeat ${reference} with clean form first. When you can complete the target reps with 1–2 reps in reserve across the sets, add the smallest available load next time. Earn the jump; do not chase it.`;
  }

  if (
    normalized.includes("last") ||
    normalized.includes("performance") ||
    normalized.includes("previous")
  ) {
    if (!latest)
      return `${firstName}, no completed session is stored yet. Finish one workout and I will use its sets, reps, load, and volume as your next comparison point.`;
    return `Your latest logged session was ${latest.splitName} on ${latest.date}: ${Math.round(latest.volume)} kg total volume over ${latest.durationMin} minutes. ${lastExercise && lastSet ? `${lastExercise.name} finished at ${lastSet.weight || "bodyweight"} kg × ${lastSet.reps}.` : "Keep logging completed sets so the comparison becomes more precise."}`;
  }

  if (
    normalized.includes("recovery") ||
    normalized.includes("recover") ||
    normalized.includes("sleep")
  ) {
    return `${firstName}, recovery is a training input. Take 5–8 minutes for easy mobility, hydrate, walk if it helps you loosen up, and aim for a full night of sleep. Keep today's effort controlled so you can attack ${exercise} with intent next time.`;
  }

  if (
    normalized.includes("consistent") ||
    normalized.includes("motivat") ||
    normalized.includes("habit")
  ) {
    const streakLine =
      streak > 0
        ? `You already have a ${streak}-day streak to protect.`
        : "Your next win is simply showing up today.";
    return `${streakLine} Make the promise smaller: put on your training shoes, complete the warm-up, and let momentum take over. Consistency beats one heroic session. Make the minimum session count.`;
  }

  if (
    normalized.includes("plan") ||
    normalized.includes("session") ||
    normalized.includes("workout")
  ) {
    if (split.rest)
      return `${firstName}, today is a recovery day. Use 10 minutes for walking and mobility, then come back fresh for your next training split.`;
    return `Today's focus is ${split.name}: ${split.focus}. Start with ${exercise}, use the first set to dial in technique, then keep 1–2 clean reps in reserve until the final working set. ${doneToday ? "You have already logged a session today, so a light mobility block is the smarter finish." : "The goal is quality work, not rushing the clock."}`;
  }

  if (
    normalized.includes("goal") ||
    normalized.includes("progress") ||
    normalized.includes("trend")
  ) {
    return `Your current goal is ${data.profile.goal.toLowerCase()}. PRIME sees ${data.sessions.length} logged sessions and ${Math.round(recentVolume)} kg across the last four recorded sessions. Track the small signals: completed sessions, better form, and steady load or rep progress.`;
  }

  return `${firstName}, I can work locally with your split, goal, streak, sets, volume, previous performance, recovery signals, exercise substitutions, warm-ups, deload guidance, and progressive-overload decisions. Ask for a specific action and I will keep the recommendation grounded in your data.`;
}

function buildOnlineContext(
  data: GymData,
  split: DaySplit,
  streak: number,
  doneToday: boolean,
  active: boolean,
) {
  const sessions = data.sessions.slice(0, 8).map((session) => ({
    date: session.date,
    split: session.splitName,
    durationMin: session.durationMin,
    volume: Math.round(session.volume),
    exercises: session.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.map((set) => ({ reps: set.reps, weight: set.weight, done: set.done })),
    })),
  }));
  return {
    athlete: { name: data.profile.name, goal: data.profile.goal, weightKg: data.profile.weight },
    today: {
      split: split.name,
      focus: split.focus,
      isRest: split.rest,
      exerciseCount: split.exercises.length,
      doneToday,
      active,
    },
    streak,
    recentSessions: sessions,
  };
}

async function askFreeGemini(
  prompt: string,
  data: GymData,
  split: DaySplit,
  streak: number,
  doneToday: boolean,
  active: boolean,
  apiKey: string,
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${FREE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: "You are PRIME Coach, a concise evidence-aware strength coach. Give practical, conservative fitness guidance. Use the provided local context, do not invent logged data, do not diagnose injuries, and recommend a qualified professional for medical concerns. Respond in 2–5 short paragraphs or a compact numbered plan.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Athlete request:\n${prompt}\n\nLocal PRIME context:\n${JSON.stringify(buildOnlineContext(data, split, streak, doneToday, active))}`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 500, temperature: 0.6 },
      }),
    },
  );
  if (!response.ok) throw new Error("Free online coach request failed");
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Free online coach returned no response");
  return text;
}

export function AICoach({
  data,
  split,
  streak,
  doneToday,
  active,
  initiallyOpen = false,
  targetDay = "selected day",
  onApplyWorkout,
}: CoachProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const [input, setInput] = useState("");
  const [onlineMode, setOnlineMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ONLINE_MODE_STORAGE) === "true";
  });
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ONLINE_KEY_STORAGE) ?? "";
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(
    () => initiallyOpen && Boolean(onApplyWorkout),
  );
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 1,
      role: "coach",
      mode: "offline",
      text: `Your ${split.rest ? "recovery day" : `${split.name} plan`} is ready. I can help you train with more intent today.`,
    },
  ]);

  const status = useMemo(() => {
    if (thinking) return "THINKING";
    if (onlineMode && apiKey && typeof navigator !== "undefined" && navigator.onLine)
      return active ? "FREE ONLINE · IN SESSION" : "FREE ONLINE READY";
    if (active) return "IN SESSION";
    if (doneToday) return "SESSION LOGGED";
    if (split.rest) return "RECOVERY MODE";
    return "OFFLINE READY";
  }, [active, apiKey, doneToday, onlineMode, split.rest, thinking]);

  const askCoach = async (prompt: string) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || thinking) return;
    setInput("");
    setMessages((current) => [...current, { id: Date.now(), role: "athlete", text: cleanPrompt }]);
    setThinking(true);
    try {
      const useOnline =
        onlineMode && apiKey && typeof navigator !== "undefined" && navigator.onLine;
      const reply = useOnline
        ? await askFreeGemini(cleanPrompt, data, split, streak, doneToday, active, apiKey)
        : buildOfflineReply(cleanPrompt, data, split, streak, doneToday);
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "coach", text: reply, mode: useOnline ? "online" : "offline" },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "coach",
          mode: "offline",
          text: `${buildOfflineReply(cleanPrompt, data, split, streak, doneToday)}\n\nOnline mode was unavailable, so I used the on-device coach instead.`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const saveOnlineSettings = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONLINE_MODE_STORAGE, onlineMode ? "true" : "false");
      if (apiKey.trim()) window.localStorage.setItem(ONLINE_KEY_STORAGE, apiKey.trim());
      else window.localStorage.removeItem(ONLINE_KEY_STORAGE);
    }
    setShowSettings(false);
  };

  return (
    <section className="coach-shell glass-red mb-7 overflow-hidden rounded-[2rem]">
      <div className="coach-sheen" aria-hidden />
      <div className="relative z-10 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 text-left"
          aria-expanded={open}
          aria-controls="ai-coach-panel"
        >
          <span className="coach-avatar grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-primary-foreground">
            <Bot className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="display text-2xl leading-none">PRIME Coach</span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-primary">
                {onlineMode && apiKey ? "Free Online + Offline" : "Offline"}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {onlineMode && apiKey && typeof navigator !== "undefined" && navigator.onLine ? (
                <Wifi className="h-3 w-3 text-success" />
              ) : (
                <WifiOff className="h-3 w-3 text-success" />
              )}
              {status}
            </span>
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-background/35 text-muted-foreground transition-colors hover:text-foreground">
            {open ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {!open ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-background/20 px-3 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-gold" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Plan sessions, review progress, choose substitutions, manage fatigue, and get recovery
              cues from your local training data.
            </p>
          </div>
        ) : (
          <div id="ai-coach-panel" className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/15 bg-background/20 px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {onlineMode && apiKey ? (
                  <Wifi className="h-3.5 w-3.5 text-success" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {onlineMode && apiKey ? "Free-tier online coach enabled" : "Offline coach active"}
              </span>
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="grid h-8 w-8 place-items-center rounded-xl bg-background/45 text-muted-foreground hover:text-foreground"
                aria-label="Coach connection settings"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>

            {showSettings ? (
              <div className="rounded-2xl border border-primary/15 bg-background/25 p-3">
                <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5 text-primary" /> Gemini free-tier key stored only
                  on this device
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Paste your Gemini API key"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-background/45 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  autoComplete="off"
                />
                <label className="mt-3 flex items-center gap-2 text-xs text-foreground/80">
                  <input
                    type="checkbox"
                    checked={onlineMode}
                    onChange={(event) => setOnlineMode(event.target.checked)}
                  />
                  Use free-tier online Coach when internet is available
                </label>
                <button
                  type="button"
                  onClick={saveOnlineSettings}
                  className="mt-3 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground"
                >
                  Save Coach mode
                </button>
              </div>
            ) : null}

            {onApplyWorkout ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowWorkoutBuilder((value) => !value)}
                  aria-expanded={showWorkoutBuilder}
                  className="flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-primary/8 px-3 py-3 text-left transition-colors hover:bg-primary/12"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" /> Build a workout with Coach
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                    {targetDay}
                  </span>
                </button>
                {showWorkoutBuilder ? (
                  <CoachPlanBuilder
                    split={split}
                    targetDay={targetDay}
                    onClose={() => setShowWorkoutBuilder(false)}
                    onApply={(draft, mode) => {
                      onApplyWorkout(draft, mode);
                      setShowWorkoutBuilder(false);
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "athlete" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "athlete"
                        ? "max-w-[84%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-xs leading-relaxed text-primary-foreground"
                        : "max-w-[92%] rounded-2xl rounded-bl-md border border-white/8 bg-background/25 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/85"
                    }
                  >
                    {message.text}
                    {message.role === "coach" ? (
                      <span className="mt-2 block text-[8px] font-bold uppercase tracking-[0.16em] text-primary/70">
                        {message.mode === "online" ? "Free-tier insight" : "Offline insight"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {thinking ? (
                <div className="max-w-[70%] rounded-2xl rounded-bl-md border border-white/8 bg-background/25 px-3.5 py-2.5 text-xs text-muted-foreground">
                  PRIME Coach is thinking…
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void askCoach(prompt)}
                  disabled={thinking}
                  className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/15 active:scale-95 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void askCoach(input);
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background/35 p-1.5 pl-3"
            >
              <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask PRIME Coach anything..."
                className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground/65"
                aria-label="Ask PRIME Coach"
              />
              <button
                type="submit"
                disabled={thinking}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl crimson-fill text-primary-foreground transition-transform active:scale-90 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/75">
              <Target className="h-3 w-3 text-primary" />
              Local workout records stay on-device. Free-tier mode sends only the question and
              compact training context, subject to Gemini quota and provider terms.
              <Zap className="ml-auto h-3 w-3 shrink-0 text-gold" />
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
