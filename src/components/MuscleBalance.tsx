import { Activity, Dumbbell, Flame, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@/lib/gym-store";
import bodyPaths from "@/lib/body-paths";

type Range = "week" | "30d" | "90d" | "all";
type MuscleKey =
  | "trapezius"
  | "deltoids"
  | "chest"
  | "upper-back"
  | "serratus"
  | "biceps"
  | "triceps"
  | "forearm"
  | "abs"
  | "obliques"
  | "lower-back"
  | "gluteal"
  | "quadriceps"
  | "hamstring"
  | "adductors"
  | "hip-flexors"
  | "calves"
  | "tibialis";
type MuscleStat = { key: MuscleKey; sets: number; level: number; soreness: number };
type BodyView = { vb: string; p: Record<string, string[]> };

type BodyPaths = { male: { front: BodyView; back: BodyView } };
const paths = bodyPaths as BodyPaths;

const LOWER_BODY_MUSCLES = new Set<MuscleKey>([
  "gluteal",
  "quadriceps",
  "hamstring",
  "adductors",
  "hip-flexors",
  "calves",
  "tibialis",
]);

const MUSCLES: MuscleKey[] = [
  "trapezius",
  "deltoids",
  "chest",
  "upper-back",
  "serratus",
  "biceps",
  "triceps",
  "forearm",
  "abs",
  "obliques",
  "lower-back",
  "gluteal",
  "quadriceps",
  "hamstring",
  "adductors",
  "hip-flexors",
  "calves",
  "tibialis",
];
const NAMES: Record<MuscleKey, string> = {
  trapezius: "Traps",
  deltoids: "Shoulders",
  chest: "Chest",
  "upper-back": "Back · lats",
  serratus: "Serratus",
  biceps: "Biceps",
  triceps: "Triceps",
  forearm: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  "lower-back": "Lower back",
  gluteal: "Glutes",
  quadriceps: "Quads",
  hamstring: "Hamstrings",
  adductors: "Adductors",
  "hip-flexors": "Hip flexors",
  calves: "Calves",
  tibialis: "Shins",
};
const RANGES: { key: Range; label: string; days: number | null }[] = [
  { key: "week", label: "Week", days: 7 },
  { key: "30d", label: "30d", days: 30 },
  { key: "90d", label: "90d", days: 90 },
  { key: "all", label: "All", days: null },
];
const ALIAS: Record<string, MuscleKey> = {
  chest: "chest",
  pectorals: "chest",
  shoulders: "deltoids",
  shoulder: "deltoids",
  delts: "deltoids",
  deltoids: "deltoids",
  back: "upper-back",
  lats: "upper-back",
  rhomboids: "upper-back",
  rhomboid: "upper-back",
  "latissimus dorsi": "upper-back",
  "back muscles": "upper-back",
  "upper back": "upper-back",
  traps: "trapezius",
  trapezius: "trapezius",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  forearm: "forearm",
  core: "abs",
  abs: "abs",
  abdominals: "abs",
  obliques: "obliques",
  "lower back": "lower-back",
  glutes: "gluteal",
  gluteal: "gluteal",
  quads: "quadriceps",
  quadriceps: "quadriceps",
  legs: "quadriceps",
  hamstrings: "hamstring",
  hamstring: "hamstring",
  adductors: "adductors",
  "hip flexors": "hip-flexors",
  calves: "calves",
  tibialis: "tibialis",
};
const BODY_PART_WEIGHTS: Partial<Record<string, Partial<Record<MuscleKey, number>>>> = {
  chest: { chest: 1 },
  back: { "upper-back": 0.75, "lower-back": 0.25 },
  shoulders: { deltoids: 1 },
  "upper arms": { biceps: 0.5, triceps: 0.5 },
  "lower arms": { forearm: 1 },
  waist: { abs: 0.7, obliques: 0.3 },
  "upper legs": { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  "lower legs": { calves: 0.8, tibialis: 0.2 },
  "full body": {
    chest: 0.2,
    "upper-back": 0.2,
    gluteal: 0.2,
    quadriceps: 0.2,
    hamstring: 0.1,
    abs: 0.1,
  },
};

function slug(value: string) {
  return ALIAS[value.toLowerCase().trim()];
}
function exerciseWeights(exercise: {
  name: string;
  muscle?: string;
}): Partial<Record<MuscleKey, number>> {
  const text = `${exercise.muscle ?? ""} ${exercise.name}`.toLowerCase();
  const weights: Partial<Record<MuscleKey, number>> = {};
  const add = (key: MuscleKey, weight: number) => {
    weights[key] = Math.max(weights[key] ?? 0, weight);
  };
  const direct = slug(exercise.muscle ?? "");
  if (direct === "upper-back" && /^(back|back muscles)$/i.test(exercise.muscle ?? "")) {
    Object.entries(BODY_PART_WEIGHTS["back"] ?? {}).forEach(([key, weight]) =>
      add(key as MuscleKey, weight ?? 0),
    );
  } else if (direct) add(direct, 1);
  if (/bench|fly|pec|push.?up/.test(text)) add("chest", 1);
  if (/row|pull|lat|deadlift|pulldown/.test(text)) add("upper-back", 0.8);
  if (/press|lateral|raise|clean/.test(text)) add("deltoids", 0.8);
  if (/curl|bicep|hammer/.test(text)) add("biceps", 1);
  if (/tricep|pushdown|dip/.test(text)) add("triceps", 1);
  if (/squat|leg press|quad|lunge/.test(text)) add("quadriceps", 1);
  if (/romanian|hamstring|leg curl/.test(text)) add("hamstring", 1);
  if (/glute|hip thrust/.test(text)) add("gluteal", 1);
  if (/calf/.test(text)) add("calves", 1);
  if (/plank|core|ab|leg raise|carry/.test(text)) add("abs", 1);
  if (!Object.keys(weights).length)
    Object.assign(weights, BODY_PART_WEIGHTS[(exercise.muscle ?? "").toLowerCase()] ?? { abs: 1 });
  const total = Object.values(weights).reduce((sum, value) => sum + (value ?? 0), 0) || 1;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, (value ?? 0) / total]),
  ) as Partial<Record<MuscleKey, number>>;
}

function isInRange(date: string, range: Range) {
  if (range === "all") return true;
  const now = new Date();
  const then = new Date(`${date}T12:00:00`);
  if (range === "week") {
    const monday = new Date(now);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return then >= monday;
  }
  const days = range === "30d" ? 30 : 90;
  return now.getTime() - then.getTime() < days * 86400000;
}

function calculateStats(sessions: Session[], range: Range): MuscleStat[] {
  const load: Partial<Record<MuscleKey, number>> = {};
  sessions
    .filter((session) => isInRange(session.date, range))
    .forEach((session) =>
      session.exercises.forEach((exercise) => {
        const completed = exercise.sets.filter((set) => set.done).length;
        if (!completed) return;
        Object.entries(exerciseWeights(exercise)).forEach(([key, weight]) => {
          const muscle = key as MuscleKey;
          load[muscle] = (load[muscle] ?? 0) + completed * (weight ?? 0);
        });
      }),
    );
  const max = Math.max(...MUSCLES.map((key) => load[key] ?? 0), 0);
  return MUSCLES.map((key) => {
    const sets = Math.round((load[key] ?? 0) * 10) / 10;
    const level = sets ? Math.max(1, Math.min(4, Math.ceil((sets / max) * 4))) : 0;
    return { key, sets: Math.round(sets), level, soreness: Math.round((level / 4) * 100) };
  });
}

type SignalMode = "balance" | "fatigue" | "strength";
function heatColor(level: number) {
  return ["#8FA1B7", "#8FA1B7", "#4D91DF", "#1764D8", "#D9534F"][level] ?? "#8FA1B7";
}
function signalColor(level: number, mode: SignalMode = "balance") {
  if (mode === "fatigue")
    return ["#B8C9DE", "#79A8E5", "#F0C56B", "#EE915D", "#D9534F"][level] ?? "#B8C9DE";
  if (mode === "strength")
    return ["#D9534F", "#EE915D", "#F0C56B", "#79A8E5", "#1764D8"][level] ?? "#B8C9DE";
  return heatColor(level);
}
function state(level: number) {
  return level >= 4 ? "Loaded" : level >= 2 ? "Working" : "Fresh";
}

export function MuscleBalance({
  sessions,
  exerciseNames = [],
}: {
  sessions: Session[];
  exerciseNames?: string[];
}) {
  const [range, setRange] = useState<Range>("week");
  const [selected, setSelected] = useState<MuscleKey | null>(null);
  const [section, setSection] = useState<"balance" | "fatigue" | "strength">("balance");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo(() => calculateStats(sessions, range), [sessions, range]);
  const trained = stats.filter((item) => item.level > 0).length;
  const totalSets = stats.reduce((sum, item) => sum + item.sets, 0);
  const average = trained
    ? Math.round(stats.reduce((sum, item) => sum + item.soreness, 0) / trained)
    : 0;
  const balanceLoad = Object.fromEntries(stats.map((item) => [item.key, item.level]));
  const selectedStat = selected ? stats.find((item) => item.key === selected) : undefined;

  const signals = useMemo(() => {
    const latest: Partial<Record<MuscleKey, number>> = {};
    const recentUnits: Partial<Record<MuscleKey, number>> = {};
    for (const session of sessions) {
      const trainedAt = new Date(`${session.date}T12:00:00`).getTime();
      const ageHours = Math.max(0, (now - trainedAt) / 3_600_000);
      for (const exercise of session.exercises) {
        const completed = exercise.sets.filter((set) => set.done).length;
        if (!completed) continue;
        for (const [key, weight] of Object.entries(exerciseWeights(exercise))) {
          const muscle = key as MuscleKey;
          if (weight && (latest[muscle] === undefined || trainedAt > latest[muscle]!)) {
            latest[muscle] = trainedAt;
          }
          if (!weight || ageHours > 14 * 24) continue;
          const halfLifeHours = LOWER_BODY_MUSCLES.has(muscle)
            ? 48
            : ["biceps", "triceps", "forearm", "calves"].includes(muscle)
              ? 24
              : 30;
          recentUnits[muscle] =
            (recentUnits[muscle] ?? 0) +
            completed * weight * 0.5 * Math.pow(0.5, ageHours / halfLifeHours);
        }
      }
    }

    const fatigue = {} as Record<MuscleKey, number>;
    const retention = {} as Record<MuscleKey, number>;
    const rows = MUSCLES.map((key) => {
      const units = recentUnits[key] ?? 0;
      const fatigueScore = 1 - Math.exp(-units / 4);
      const fatigueLevel =
        fatigueScore < 0.15
          ? 0
          : fatigueScore < 0.25
            ? 1
            : fatigueScore < 0.4
              ? 2
              : fatigueScore < 0.55
                ? 3
                : 4;
      fatigue[key] = fatigueLevel;
      const last = latest[key];
      const daysSince = last === undefined ? null : Math.max(0, (now - last) / 86_400_000);
      const retained =
        daysSince === null
          ? 0.5
          : daysSince <= 14
            ? 1
            : Math.max(0.5, 0.5 + 0.5 * Math.pow(0.5, (daysSince - 14) / 28));
      retention[key] = retained;
      return {
        key,
        label: NAMES[key],
        units: Math.round(units * 10) / 10,
        fatigueScore,
        fatigueLevel,
        readiness: Math.round((1 - fatigueScore) * 100),
        daysSince: daysSince === null ? null : Math.floor(daysSince),
        retained,
      };
    });
    const strength = Object.fromEntries(
      MUSCLES.map((key) => [key, Math.max(0, Math.min(4, Math.round((retention[key] - 0.5) * 8)))]),
    ) as Record<MuscleKey, number>;
    return { fatigue, retention, strength, rows };
  }, [sessions, now]);

  const strengthExercises = useMemo(() => {
    const best = new Map<
      MuscleKey,
      Map<string, { name: string; est: number; weight: number; reps: number; date: string }>
    >();
    for (const session of sessions) {
      for (const exercise of session.exercises) {
        const weights = exerciseWeights(exercise);
        for (const set of exercise.sets) {
          if (!set.done || set.weight <= 0 || set.reps <= 0) continue;
          const est = set.weight * (1 + Math.min(set.reps, 12) / 30);
          for (const [key, contribution] of Object.entries(weights)) {
            if (!contribution) continue;
            const muscle = key as MuscleKey;
            const rows = best.get(muscle) ?? new Map();
            const prior = rows.get(exercise.name);
            if (!prior || est > prior.est)
              rows.set(exercise.name, {
                name: exercise.name,
                est,
                weight: set.weight,
                reps: set.reps,
                date: session.date,
              });
            best.set(muscle, rows);
          }
        }
      }
    }
    return Object.fromEntries(
      MUSCLES.map((key) => [
        key,
        [...(best.get(key)?.values() ?? [])].sort((a, b) => b.est - a.est).slice(0, 6),
      ]),
    ) as Record<
      MuscleKey,
      { name: string; est: number; weight: number; reps: number; date: string }[]
    >;
  }, [sessions]);

  const highFatigue = [...signals.rows]
    .sort((a, b) => b.fatigueScore - a.fatigueScore)
    .filter((row) => row.units > 0)
    .slice(0, 6);
  const lowRetention = [...signals.rows]
    .filter((row) => row.retained < 0.999)
    .sort((a, b) => a.retained - b.retained)
    .slice(0, 8);
  const upperBackHint = "Lats · rhomboids · upper back";
  const renderTargetCard = (stat: MuscleStat) => (
    <button
      type="button"
      key={stat.key}
      onClick={() => setSelected(selected === stat.key ? null : stat.key)}
      className={`muscle-target-card text-left ${""} ${selected === stat.key ? "is-selected" : ""}`}
      aria-pressed={selected === stat.key}
    >
      <MiniMap load={balanceLoad} selected={stat.key} />
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-xs font-bold">{NAMES[stat.key]}</span>
        <span className="muscle-status" style={{ color: heatColor(stat.level) }}>
          {stat.soreness}%
        </span>
      </div>
      {stat.key === "upper-back" ? (
        <p className="mt-0.5 text-[8px] text-muted-foreground">{upperBackHint}</p>
      ) : null}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/8">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(4, stat.soreness)}%`, background: heatColor(stat.level) }}
        />
      </div>
      <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {stat.sets} sets · {state(stat.level)}
      </p>
    </button>
  );
  const sectionTabs = [
    { key: "balance" as const, label: "Muscle Balance" },
    { key: "fatigue" as const, label: "Fatigue" },
    { key: "strength" as const, label: "Strength" },
  ];

  return (
    <section className="muscle-overview-shell glass mb-7 overflow-hidden rounded-[2rem] p-4 sm:p-5">
      <div className="muscle-overview-topline flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-primary">
          <span className="h-2 w-2 rounded-full bg-accent" /> PRIME / TRAINING HEAT
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          OFFLINE CORE
        </span>
      </div>
      <div
        className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-secondary/60 p-1"
        role="tablist"
        aria-label="Training heat sections"
      >
        {sectionTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={section === tab.key}
            onClick={() => {
              setSection(tab.key);
              setSelected(null);
            }}
            className={`rounded-full px-2 py-2.5 text-[10px] font-bold transition-all sm:text-xs ${section === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === "balance" ? (
        <div className="mt-4" role="tabpanel">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Muscle balance</h2>
              <p className="text-[10px] text-muted-foreground">
                Completed, weighted sets by muscle group
              </p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[9px] font-semibold text-muted-foreground">
              {trained}/18 trained
            </span>
          </div>
          <div className="muscle-range-tabs mt-3 grid grid-cols-4 gap-1 rounded-full p-1">
            {RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setRange(item.key);
                  setSelected(null);
                }}
                className={`rounded-full px-2 py-2.5 text-xs font-bold transition-all ${range === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric value={totalSets} label="weighted sets" />
            <Metric value={`${average}%`} label="avg heat" />
            <Metric
              value={stats
                .filter(
                  (row) =>
                    row.key === "upper-back" || row.key === "lower-back" || row.key === "trapezius",
                )
                .reduce((sum, row) => sum + row.sets, 0)}
              label="back sets"
            />
          </div>
          <div className="muscle-heat-card mt-4 rounded-[1.6rem] p-3 sm:p-4">
            <div className="flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                <Activity className="h-4 w-4" /> Training heat
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                FRONT / BACK
              </span>
            </div>
            <div className="muscle-map-frame mt-3">
              <BodyMap
                load={balanceLoad}
                selected={selected}
                onMuscle={setSelected}
                mode="balance"
              />
            </div>
            <div className="muscle-anatomy-labels">
              <span>FRONT</span>
              <span>BACK</span>
            </div>
            <div className="muscle-legend mt-3 flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
              <Legend color="#B8C9DE" label="fresh" />
              <Legend color="#1764D8" label="working" />
              <Legend color="#D9534F" label="loaded" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              Target muscles
            </p>
            <span className="text-[10px] text-muted-foreground">Tap to highlight</span>
          </div>
          <div className="muscle-target-grid mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map(renderTargetCard)}
          </div>
          {selectedStat ? (
            <div className="muscle-selected-detail mt-3 rounded-2xl px-3 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                  {NAMES[selectedStat.key]}
                </p>
                <span className="text-xs text-muted-foreground">
                  {selectedStat.sets} weighted sets · {selectedStat.soreness}% heat
                </span>
              </div>
              {selectedStat.key === "upper-back" ? (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Includes latissimus, rhomboids and upper-back work.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {exerciseNames
                  .filter(
                    (name) =>
                      slug(name) === selectedStat.key ||
                      (selectedStat.key === "upper-back" &&
                        /back|lat|row|pull|deadlift/i.test(name)) ||
                      new RegExp(selectedStat.key.replace("-", "[ -]"), "i").test(name),
                  )
                  .slice(0, 8)
                  .map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-primary/8 px-2 py-1 text-[9px] text-primary"
                    >
                      {name}
                    </span>
                  ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Only completed sets count. Back includes latissimus, rhomboids and upper-back work;
              lower back and traps remain separate muscle groups.
            </span>
          </div>
        </div>
      ) : null}

      {section === "fatigue" ? (
        <div className="mt-4" role="tabpanel">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Fatigue</h2>
              <p className="text-[10px] text-muted-foreground">
                Recent completed work · muscle-specific decay
              </p>
            </div>
            <Flame className="mt-1 h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric value={highFatigue[0]?.label ?? "Fresh"} label="most recent load" />
            <Metric
              value={highFatigue[0] ? `${highFatigue[0].readiness}%` : "—"}
              label="recovery estimate"
            />
          </div>
          <div className="muscle-map-frame mt-4">
            <BodyMap
              load={signals.fatigue}
              selected={selected}
              onMuscle={setSelected}
              mode="fatigue"
            />
          </div>
          <div className="muscle-anatomy-labels">
            <span>FRONT</span>
            <span>BACK</span>
          </div>
          <div className="muscle-legend mt-3 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
            <Legend color="#B8C9DE" label="ready" />
            <Legend color="#F0C56B" label="recovering" />
            <Legend color="#D9534F" label="fatigued" />
          </div>
          {highFatigue.length ? (
            <div className="mt-4 space-y-2">
              {highFatigue.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/45 px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.daysSince === null
                      ? "—"
                      : item.daysSince === 0
                        ? "today"
                        : `${item.daysSince}d ago`}
                  </span>
                  <span className="w-20 text-right text-xs font-semibold">
                    {item.readiness}% ready
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
              Complete and save a workout to start the fatigue view.
            </p>
          )}
          {selected ? (
            <div className="mt-3 rounded-2xl bg-secondary/40 p-3 text-sm">
              <strong>{NAMES[selected]}</strong>
              <span className="ml-2 text-muted-foreground">
                {signals.rows.find((row) => row.key === selected)?.readiness ?? 100}% recovery
                estimate
              </span>
            </div>
          ) : null}
          <p className="mt-4 flex items-start gap-2 text-[9px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Estimate uses completed sets, muscle-specific decay and no effort/RIR ratings; it is a
            training signal, not a physiological or medical measurement.
          </p>
        </div>
      ) : null}

      {section === "strength" ? (
        <div className="mt-4" role="tabpanel">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Strength</h2>
              <p className="text-[10px] text-muted-foreground">
                Retained strength by trained muscle
              </p>
            </div>
            <Dumbbell className="mt-1 h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric
              value={`${Math.round((Object.values(signals.retention).reduce((sum, value) => sum + value, 0) / MUSCLES.length) * 100)}%`}
              label="avg retention"
            />
            <Metric value={lowRetention.length} label="below full retention" />
          </div>
          <div className="muscle-map-frame mt-4">
            <BodyMap
              load={signals.strength}
              selected={selected}
              onMuscle={setSelected}
              mode="strength"
            />
          </div>
          <div className="muscle-anatomy-labels">
            <span>FRONT</span>
            <span>BACK</span>
          </div>
          <div className="muscle-legend mt-3 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
            <Legend color="#D9534F" label="detrained" />
            <Legend color="#F0C56B" label="retaining" />
            <Legend color="#1764D8" label="full" />
          </div>
          {selected ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Exercises · {NAMES[selected]}</h3>
              {strengthExercises[selected].length ? (
                strengthExercises[selected].map((row) => (
                  <div
                    key={row.name}
                    className="mb-2 flex items-center gap-3 rounded-2xl bg-secondary/45 px-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                    <span className="text-right text-xs font-semibold">
                      {Math.round(row.est)} kg
                    </span>
                    <span className="text-[9px] text-muted-foreground">est. 1RM</span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-secondary/40 p-3 text-xs text-muted-foreground">
                  No loaded work sets for this muscle yet.
                </p>
              )}
            </div>
          ) : null}
          {lowRetention.length ? (
            <div className="mt-4 space-y-2">
              {lowRetention.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelected(item.key)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-secondary/35 px-3 py-2.5 text-left"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                  <span className="w-14 text-right text-xs font-semibold">
                    {Math.round(item.retained * 100)}%
                  </span>
                  <span className="w-16 text-right text-[10px] text-muted-foreground">
                    {item.daysSince === null
                      ? "not trained"
                      : `${Math.floor(item.daysSince / 7)}w ago`}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Every muscle is within the 14-day full-retention window.
            </p>
          )}
          <p className="mt-4 flex items-start gap-2 text-[9px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Retention stays full for 14 days after a completed set, then decays toward a 50% floor
            with a 28-day half-life. Estimated 1RM uses Epley, capped at 12 reps; it is not a tested
            max.
          </p>
        </div>
      ) : null}
    </section>
  );
}
function BodyMap({
  load,
  selected,
  onMuscle,
  mode = "balance",
}: {
  load: Record<string, number>;
  selected: MuscleKey | null;
  onMuscle: (muscle: MuscleKey) => void;
  mode?: SignalMode;
}) {
  return (
    <div className="prime-body-map">
      <BodyView
        view={paths.male.front}
        load={load}
        selected={selected}
        onMuscle={onMuscle}
        mode={mode}
      />
      <BodyView
        view={paths.male.back}
        load={load}
        selected={selected}
        onMuscle={onMuscle}
        mode={mode}
      />
    </div>
  );
}
function BodyView({
  view,
  load,
  selected,
  focus,
  viewBoxCrop,
  mode = "balance",
  onMuscle,
}: {
  view: BodyView;
  load: Record<string, number>;
  selected: MuscleKey | null;
  focus?: MuscleKey;
  viewBoxCrop?: string;
  mode?: SignalMode;
  onMuscle: (muscle: MuscleKey) => void;
}) {
  const inert = ["head", "hair", "neck", "hands", "feet", "knees", "ankles"];
  return (
    <svg className="prime-body-svg" viewBox={viewBoxCrop ?? view.vb} role="group">
      {inert.flatMap((key) =>
        (view.p[key] ?? []).map((d, index) => (
          <path key={`${key}-${index}`} className="body-silhouette" d={d} />
        )),
      )}
      {MUSCLES.flatMap((key) =>
        (view.p[key] ?? []).map((d, index) => (
          <path
            key={`${key}-${index}`}
            className={`body-muscle ${selected === key ? "is-selected" : ""} ${focus && focus !== key ? "is-muted" : ""} ${focus === key ? "is-focus" : ""}`}
            d={d}
            fill={signalColor(focus && focus !== key ? 0 : (load[key] ?? 0), mode)}
            onClick={() => onMuscle(key)}
          >
            <title>{NAMES[key]}</title>
          </path>
        )),
      )}
    </svg>
  );
}
const BACK_VIEW_MUSCLES = new Set<MuscleKey>([
  "trapezius",
  "deltoids",
  "upper-back",
  "triceps",
  "forearm",
  "lower-back",
  "gluteal",
  "hamstring",
  "calves",
]);
function MiniMap({ load, selected }: { load: Record<string, number>; selected: MuscleKey }) {
  const lowerBody = LOWER_BODY_MUSCLES.has(selected);
  const backView = BACK_VIEW_MUSCLES.has(selected);
  const view = backView ? paths.male.back : paths.male.front;
  const [viewX = 0, viewY = 0, viewWidth = 727, viewHeight = 1280] = view.vb
    .split(/\s+/)
    .map(Number);
  const cropWidth = 507;
  const cropX = viewX + (viewWidth - cropWidth) / 2;
  const cropY = lowerBody ? viewY + 540 : viewY;
  const cropHeight = lowerBody ? viewHeight - 540 : 540;
  const crop = `${cropX} ${cropY} ${cropWidth} ${cropHeight}`;
  const illustrationLoad = { ...load, [selected]: Math.max(3, load[selected] ?? 0) };
  return (
    <div
      className="muscle-target-thumb"
      data-view={backView ? "back" : "front"}
      aria-label={`${backView ? "Back" : "Front"} view, ${NAMES[selected]}`}
    >
      <BodyView
        view={view}
        load={illustrationLoad}
        focus={selected}
        selected={selected}
        viewBoxCrop={crop}
        onMuscle={() => undefined}
      />
      <span className="muscle-map-view-label">{backView ? "BACK" : "FRONT"}</span>
    </div>
  );
}
function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="muscle-mini-metric rounded-2xl px-3 py-3">
      <span className="display text-2xl leading-none">{value}</span>
      <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
