import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Dumbbell,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { DaySplit, Exercise } from "@/lib/gym-store";
import { uid } from "@/lib/gym-store";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";

export type CoachDraft = { name: string; focus: string; exercises: Exercise[] };
export type CoachApplyMode = "replace" | "append";

type Goal = "strength" | "muscle" | "general";
type Level = "beginner" | "returning" | "intermediate" | "advanced";
type Equipment = "gym" | "dumbbells" | "bodyweight";
type Focus = "powerlifting" | "upper" | "lower" | "full";
type Limit = "shoulder" | "knee" | "lowerBack";
type Answers = {
  goal: Goal;
  level: Level;
  days: number;
  minutes: number;
  equipment: Equipment;
  focus: Focus;
  limits: Limit[];
};

const FOCUS_BY_EQUIPMENT: Record<Equipment, Record<Focus, string[]>> = {
  gym: {
    powerlifting: [
      "Back Squat",
      "Bench Press",
      "Deadlift",
      "Barbell Row",
      "Overhead Press",
      "Plank",
    ],
    upper: [
      "Bench Press",
      "Barbell Row",
      "Overhead Press",
      "Lat Pulldown",
      "Triceps Pushdown",
      "Barbell Curl",
    ],
    lower: [
      "Back Squat",
      "Romanian Deadlift",
      "Leg Press",
      "Lying Leg Curl",
      "Hip Thrust",
      "Plank",
    ],
    full: [
      "Back Squat",
      "Bench Press",
      "Barbell Row",
      "Romanian Deadlift",
      "Lateral Raise",
      "Plank",
    ],
  },
  dumbbells: {
    powerlifting: [
      "Goblet Squat",
      "Dumbbell Bench Press",
      "Dumbbell Romanian Deadlift",
      "One Arm Dumbbell Row",
      "Standing Dumbbell Press",
      "Plank",
    ],
    upper: [
      "Dumbbell Bench Press",
      "One Arm Dumbbell Row",
      "Standing Dumbbell Press",
      "Lateral Raise",
      "Dumbbell Curl",
      "Lying Dumbbell Extension",
    ],
    lower: [
      "Goblet Squat",
      "Dumbbell Romanian Deadlift",
      "Bulgarian Split Squat",
      "Dumbbell Hip Thrust",
      "Dumbbell Calf Raise",
      "Plank",
    ],
    full: [
      "Goblet Squat",
      "Dumbbell Bench Press",
      "One Arm Dumbbell Row",
      "Dumbbell Romanian Deadlift",
      "Lateral Raise",
      "Plank",
    ],
  },
  bodyweight: {
    powerlifting: [
      "Bodyweight Squat",
      "Push Up",
      "Inverted Row",
      "Glute Bridge",
      "Pike Push Up",
      "Plank",
    ],
    upper: [
      "Push Up",
      "Inverted Row",
      "Pike Push Up",
      "Diamond Push Up",
      "Chin Up Hold",
      "Side Plank",
    ],
    lower: [
      "Bodyweight Squat",
      "Glute Bridge",
      "Single Leg Glute Bridge",
      "Nordic Curl",
      "Bodyweight Calf Raise",
      "Side Plank",
    ],
    full: ["Bodyweight Squat", "Push Up", "Inverted Row", "Glute Bridge", "Bird Dog", "Plank"],
  },
};

const EQUIPMENT_FALLBACK: Record<Equipment, string[]> = {
  gym: [
    "Chest Supported Dumbbell Row",
    "Seated Cable Row",
    "Leg Extension",
    "Seated Leg Curl",
    "Pallof Press",
    "Cable Curl",
    "Face Pull",
    "Hip Thrust",
    "Machine Chest Press",
    "Crunch",
  ],
  dumbbells: [
    "Dumbbell Bench Press",
    "Chest Supported Dumbbell Row",
    "Dumbbell Hip Thrust",
    "Single Leg Glute Bridge",
    "Dumbbell Calf Raise",
    "Plank",
    "Side Plank",
    "Dead Bug",
    "Dumbbell Curl",
  ],
  bodyweight: [
    "Glute Bridge",
    "Single Leg Glute Bridge",
    "Bird Dog",
    "Dead Bug",
    "Side Plank",
    "Crunch",
    "Bodyweight Calf Raise",
    "Inverted Row",
    "Push Up",
  ],
};

const QUESTION_COUNT = 7;
const focusLabel: Record<Focus, string> = {
  powerlifting: "Powerlifting strength",
  upper: "Upper body",
  lower: "Lower body",
  full: "Full body",
};

function inferFocus(split: DaySplit): Focus {
  const text = `${split.name} ${split.focus}`.toLowerCase();
  if (/powerlift|squat|deadlift|bench/.test(text)) return "powerlifting";
  if (/lower|leg|quad|hamstring|glute/.test(text)) return "lower";
  if (/upper|push|pull|chest|back|shoulder/.test(text)) return "upper";
  return "full";
}

function violatesLimit(name: string, limits: Limit[]) {
  const n = name.toLowerCase();
  if (limits.includes("shoulder") && /bench|press|fly|push.?up|dip|upright row|pike/.test(n))
    return true;
  if (limits.includes("knee") && /squat|lunge|leg press|leg extension|step up|jump/.test(n))
    return true;
  if (
    limits.includes("lowerBack") &&
    /deadlift|good morning|barbell row|bent over|romanian|superman|kroc row/.test(n)
  )
    return true;
  return false;
}

function buildDraft(answers: Answers, split: DaySplit): CoachDraft {
  const catalog = new Map(EXERCISE_LIBRARY.map((item) => [item.name, item]));
  const targetCount =
    answers.minutes <= 30 ? 3 : answers.minutes <= 45 ? 4 : answers.minutes <= 60 ? 5 : 6;
  const candidates = [
    ...FOCUS_BY_EQUIPMENT[answers.equipment][answers.focus],
    ...Object.values(FOCUS_BY_EQUIPMENT[answers.equipment]).flat(),
    ...EQUIPMENT_FALLBACK[answers.equipment],
  ];
  const selected: (typeof EXERCISE_LIBRARY)[number][] = [];
  const seen = new Set<string>();
  for (const name of candidates) {
    if (selected.length >= targetCount || seen.has(name) || violatesLimit(name, answers.limits))
      continue;
    const item = catalog.get(name);
    if (!item) continue;
    if (answers.equipment === "dumbbells" && !["Dumbbell", "Bodyweight"].includes(item.equipment))
      continue;
    if (answers.equipment === "bodyweight" && item.equipment !== "Bodyweight") continue;
    selected.push(item);
    seen.add(name);
  }

  const priorLoads = new Map(split.exercises.map((exercise) => [exercise.name, exercise.weight]));
  const exercises = selected.map((item, index): Exercise => {
    const primary = answers.focus === "powerlifting" ? index < 3 : index < 2;
    let sets = primary ? 4 : 3;
    let reps = primary ? 5 : 10;
    if (answers.level === "beginner") {
      sets = primary ? 3 : 2;
      reps = primary ? 6 : 10;
    } else if (answers.level === "returning") {
      sets = primary ? 3 : 2;
      reps = primary ? 6 : 10;
    } else if (answers.level === "advanced") {
      sets = primary ? 5 : 3;
      reps = primary ? 3 : 8;
    } else if (answers.goal === "muscle") {
      sets = 3;
      reps = primary ? 8 : 12;
    } else if (answers.goal === "general") {
      sets = 3;
      reps = 10;
    }
    if (answers.goal === "muscle" && answers.level !== "beginner" && answers.level !== "returning")
      reps = primary ? 8 : 12;
    return {
      id: uid(),
      name: item.name,
      muscle: item.muscle,
      sets,
      reps,
      weight: priorLoads.get(item.name) ?? 0,
    };
  });

  const name =
    focusLabel[answers.focus] +
    (answers.goal === "muscle"
      ? " · Hypertrophy"
      : answers.goal === "general"
        ? " · Fitness"
        : " · Strength");
  const focus = `${focusLabel[answers.focus]} · ${answers.goal === "strength" ? "Strength" : answers.goal === "muscle" ? "Muscle growth" : "General fitness"}`;
  return { name, focus, exercises };
}

function Choice({
  value,
  selected,
  title,
  detail,
  onSelect,
}: {
  value: string;
  selected: string;
  title: string;
  detail?: string;
  onSelect: (value: string) => void;
}) {
  const active = value === selected;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(value)}
      className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${active ? "border-primary bg-primary/10 text-foreground" : "border-white/10 bg-background/25 text-muted-foreground hover:border-primary/35"}`}
    >
      <span className="flex items-center justify-between gap-2 text-xs font-semibold">
        {title}
        {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
      </span>
      {detail ? (
        <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
          {detail}
        </span>
      ) : null}
    </button>
  );
}

export function CoachPlanBuilder({
  split,
  targetDay,
  onClose,
  onApply,
}: {
  split: DaySplit;
  targetDay: string;
  onClose: () => void;
  onApply: (draft: CoachDraft, mode: CoachApplyMode) => void;
}) {
  const [answers, setAnswers] = useState<Answers>({
    goal: "strength",
    level: "returning",
    days: 4,
    minutes: 60,
    equipment: "gym",
    focus: inferFocus(split),
    limits: [],
  });
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CoachDraft | null>(null);
  const [mode, setMode] = useState<CoachApplyMode>("replace");
  const update = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));
  const options = useMemo(() => buildDraft(answers, split), [answers, split]);

  const questions = [
    {
      title: "What are you training for?",
      subtitle: "Your goal guides the session's sets, reps and movement choices.",
    },
    {
      title: "Where are you starting from?",
      subtitle: "Pick the level that best describes your recent training.",
    },
    {
      title: "How often can you train?",
      subtitle:
        "Choose a realistic weekly schedule. This session will be assigned to the selected day.",
    },
    {
      title: "How long do you have?",
      subtitle: "The exercise count is adjusted to fit the time you selected.",
    },
    {
      title: "What equipment can you use?",
      subtitle: "The builder only picks movements available in PRIME's exercise library.",
    },
    {
      title: "What should this session focus on?",
      subtitle: `The workout will be added to ${targetDay} in your split.`,
    },
    {
      title: "Any movements to work around?",
      subtitle: "Select any limits. This is not injury assessment or medical advice.",
    },
  ];

  const currentQuestion = questions[step]!;

  const next = () => {
    if (step < QUESTION_COUNT - 1) setStep((current) => current + 1);
    else setDraft(options);
  };
  const back = () => {
    if (draft) setDraft(null);
    else setStep((current) => Math.max(0, current - 1));
  };
  const toggleLimit = (limit: Limit) =>
    update(
      "limits",
      answers.limits.includes(limit)
        ? answers.limits.filter((item) => item !== limit)
        : [...answers.limits, limit],
    );

  return (
    <div className="rounded-2xl border border-primary/20 bg-background/25 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Coach workout builder
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Answer by selecting options; nothing changes in your split until you apply the draft.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close workout builder"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background/45 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!draft ? (
        <>
          <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span>
              Question {step + 1} of {QUESTION_COUNT}
            </span>
            <span>
              {targetDay} · {split.name}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((step + 1) / QUESTION_COUNT) * 100}%` }}
            />
          </div>
          <h3 className="mt-4 text-base font-semibold">{currentQuestion.title}</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            {currentQuestion.subtitle}
          </p>

          {step === 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Choice
                value="strength"
                selected={answers.goal}
                title="Get stronger"
                detail="Strength-focused rep ranges"
                onSelect={(value) => update("goal", value as Goal)}
              />
              <Choice
                value="muscle"
                selected={answers.goal}
                title="Build muscle"
                detail="Moderate reps and volume"
                onSelect={(value) => update("goal", value as Goal)}
              />
              <Choice
                value="general"
                selected={answers.goal}
                title="General fitness"
                detail="Balanced, sustainable work"
                onSelect={(value) => update("goal", value as Goal)}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Choice
                value="beginner"
                selected={answers.level}
                title="New to lifting"
                detail="Keep the session simple and manageable"
                onSelect={(value) => update("level", value as Level)}
              />
              <Choice
                value="returning"
                selected={answers.level}
                title="Returning after a break"
                detail="Build consistency before adding volume"
                onSelect={(value) => update("level", value as Level)}
              />
              <Choice
                value="intermediate"
                selected={answers.level}
                title="Training regularly"
                detail="Comfortable with core movements"
                onSelect={(value) => update("level", value as Level)}
              />
              <Choice
                value="advanced"
                selected={answers.level}
                title="Experienced"
                detail="Consistent training history"
                onSelect={(value) => update("level", value as Level)}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={answers.days === days}
                  onClick={() => update("days", days)}
                  className={`rounded-2xl border px-2 py-3 text-center ${answers.days === days ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-background/25 text-muted-foreground"}`}
                >
                  <span className="block text-lg font-bold">{days}</span>
                  <span className="text-[9px]">days</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[30, 45, 60, 75].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={answers.minutes === minutes}
                  onClick={() => update("minutes", minutes)}
                  className={`rounded-2xl border px-2 py-3 text-center ${answers.minutes === minutes ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-background/25 text-muted-foreground"}`}
                >
                  <Clock3 className="mx-auto mb-1 h-4 w-4" />
                  <span className="text-xs font-semibold">{minutes} min</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Choice
                value="gym"
                selected={answers.equipment}
                title="Full gym"
                detail="Barbells, machines and cables"
                onSelect={(value) => update("equipment", value as Equipment)}
              />
              <Choice
                value="dumbbells"
                selected={answers.equipment}
                title="Dumbbells + bench"
                detail="Dumbbells and bodyweight only"
                onSelect={(value) => update("equipment", value as Equipment)}
              />
              <Choice
                value="bodyweight"
                selected={answers.equipment}
                title="Bodyweight"
                detail="No external equipment"
                onSelect={(value) => update("equipment", value as Equipment)}
              />
            </div>
          ) : null}

          {step === 5 ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Choice
                value="powerlifting"
                selected={answers.focus}
                title="Powerlifting"
                detail="Squat, bench and deadlift patterns"
                onSelect={(value) => update("focus", value as Focus)}
              />
              <Choice
                value="upper"
                selected={answers.focus}
                title="Upper body"
                detail="Chest, back, shoulders and arms"
                onSelect={(value) => update("focus", value as Focus)}
              />
              <Choice
                value="lower"
                selected={answers.focus}
                title="Lower body"
                detail="Legs, glutes and trunk"
                onSelect={(value) => update("focus", value as Focus)}
              />
              <Choice
                value="full"
                selected={answers.focus}
                title="Full body"
                detail="A balanced whole-body session"
                onSelect={(value) => update("focus", value as Focus)}
              />
            </div>
          ) : null}

          {step === 6 ? (
            <div className="mt-3 space-y-2">
              {(
                [
                  { key: "shoulder", title: "Avoid shoulder-loaded pressing" },
                  { key: "knee", title: "Avoid deep knee-flexion movements" },
                  { key: "lowerBack", title: "Avoid heavy spinal loading / hinges" },
                ] as const
              ).map(({ key, title }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={answers.limits.includes(key)}
                  onClick={() => toggleLimit(key)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs ${answers.limits.includes(key) ? "border-primary bg-primary/10" : "border-white/10 bg-background/25"}`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-md border ${answers.limits.includes(key) ? "border-primary bg-primary text-primary-foreground" : "border-white/20"}`}
                  >
                    {answers.limits.includes(key) ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  {title}
                </button>
              ))}
              <p className="flex items-start gap-2 rounded-xl bg-amber-400/5 p-2.5 text-[9px] leading-relaxed text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                If movement causes pain or you have an injury, consult a qualified clinician. These
                choices only filter the exercise suggestions.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
            >
              {step === QUESTION_COUNT - 1 ? "Build workout" : "Continue"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{draft.name}</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {draft.focus} · {answers.days} days/week · {answers.minutes} min · {targetDay}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">
              <Dumbbell className="h-3 w-3" />
              {draft.exercises.length} movements
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {draft.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-background/25 px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{exercise.name}</span>
                  <span className="block text-[9px] text-muted-foreground">
                    {exercise.muscle} · {exercise.sets} sets × {exercise.reps} reps
                  </span>
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {exercise.weight ? `${exercise.weight} kg` : "set load"}
                </span>
              </div>
            ))}
          </div>
          {draft.exercises.length <
          (answers.minutes <= 30
            ? 3
            : answers.minutes <= 45
              ? 4
              : answers.minutes <= 60
                ? 5
                : 6) ? (
            <p className="mt-2 text-[9px] text-amber-300">
              Some movements were filtered by your selected restrictions; the Coach used the safe
              matches available in the chosen equipment group.
            </p>
          ) : null}
          {split.exercises.length && !split.rest ? (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                How should this update {targetDay}?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={mode === "replace"}
                  onClick={() => setMode("replace")}
                  className={`rounded-xl border p-2.5 text-left text-[10px] ${mode === "replace" ? "border-primary bg-primary/10" : "border-white/10 bg-background/20"}`}
                >
                  <span className="block font-semibold">Replace session</span>
                  <span className="mt-1 block text-muted-foreground">
                    Keep the rest of your split unchanged.
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "append"}
                  onClick={() => setMode("append")}
                  className={`rounded-xl border p-2.5 text-left text-[10px] ${mode === "append" ? "border-primary bg-primary/10" : "border-white/10 bg-background/20"}`}
                >
                  <span className="block font-semibold">Add exercises</span>
                  <span className="mt-1 block text-muted-foreground">
                    Keep the current {split.exercises.length} and append these.
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-primary/5 p-2.5 text-[10px] text-muted-foreground">
              This will turn {targetDay} into a training day. Other days remain unchanged.
            </p>
          )}
          <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">
            This is a draft from your selected answers and PRIME's local exercise library. Review it
            before applying. New exercise loads start unset so you can choose working weights in
            Split Builder.
          </p>
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change answers
            </button>
            <button
              type="button"
              onClick={() => onApply(draft, mode)}
              disabled={!draft.exercises.length}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Apply to {targetDay}'s split
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
