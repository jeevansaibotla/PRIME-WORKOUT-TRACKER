import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Hourglass,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
  Trash2,
} from "lucide-react";
import { useGym } from "@/hooks/use-gym";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import {
  WEIGHT_STEPS,
  WEEKDAYS,
  getSplit,
  roundWeight,
  todayISO,
  uid,
  type LoggedSet,
} from "@/lib/gym-store";
import { toast } from "sonner";
import { loadOpenGymCatalogue, type OpenExercise } from "@/lib/opengym-catalogue";

const guideFor = (catalog: OpenExercise[], name: string) => {
  const key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return catalog.find(
    (item) =>
      item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim() === key,
  );
};

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Active Workout — PRIME" },
      {
        name: "description",
        content: "Log every set, rep and kilo with a full-screen rest timer. Fully offline.",
      },
      { property: "og:title", content: "Active Workout — PRIME" },
      {
        property: "og:description",
        content: "Track sets, reps, load, and rest in the PRIME performance console.",
      },
    ],
  }),
  component: WorkoutPage,
});

const REST_SECONDS = 90;

function WorkoutPage() {
  const { data, hydrated, startWorkout, updateActiveSession, finishWorkout, cancelWorkout } =
    useGym();
  const navigate = useNavigate();

  const dayIndex = new Date().getDay();
  const split = getSplit(data.plan, dayIndex);

  const active = data.activeSession;

  const [step, setStep] = useState<number>(2.5);
  const [left, setLeft] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [guideCatalog, setGuideCatalog] = useState<OpenExercise[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  // Guards against re-creating a session the instant one is finished/cancelled
  // (finishWorkout/cancelWorkout clear activeSession synchronously, which would
  // otherwise re-trigger the auto-start effect below before navigation away completes).
  const leavingRef = useRef(false);

  // Previous session's sets for whichever exercise is currently selected — computed
  // unconditionally (before the rest-day/no-active-session early return below) so the
  // hook order stays stable. `active` may still be null here, so everything is optional.
  const previewExercise = split.exercises[active?.currentExerciseIndex ?? 0];
  const previousExerciseSets = useMemo(() => {
    if (!previewExercise) return undefined;
    const past = data.sessions.find((sess) =>
      sess.exercises.some((e) => e.name === previewExercise.name),
    );
    return past?.exercises.find((e) => e.name === previewExercise.name)?.sets;
  }, [data.sessions, previewExercise]);

  useEffect(() => {
    let live = true;
    void loadOpenGymCatalogue()
      .then((items) => {
        if (live) setGuideCatalog(items);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  // Initialize active session if not exists
  useEffect(() => {
    if (!active && !split.rest && hydrated && !leavingRef.current) {
      startWorkout(dayIndex, split.name, split.exercises);
    }
  }, [active, split, dayIndex, startWorkout, hydrated]);

  // Sync rest timer
  useEffect(() => {
    if (!active?.restEndsAt) {
      setLeft(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.round((active.restEndsAt! - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        updateActiveSession({ restEndsAt: null });
        setFullscreen(false);
      }
    };

    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [active?.restEndsAt, updateActiveSession]);

  const startRest = useCallback(
    (seconds = REST_SECONDS) => {
      setPausedLeft(null);
      updateActiveSession({ restEndsAt: Date.now() + seconds * 1000 });
      setFullscreen(true);
    },
    [updateActiveSession],
  );

  const togglePause = () => {
    if (active?.restEndsAt) {
      setPausedLeft(Math.max(0, Math.round((active.restEndsAt - Date.now()) / 1000)));
      updateActiveSession({ restEndsAt: null });
    } else if (pausedLeft !== null) {
      updateActiveSession({ restEndsAt: Date.now() + pausedLeft * 1000 });
      setPausedLeft(null);
    }
  };

  // Background duration timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active?.startTime) return;
    const t = setInterval(() => {
      setElapsed(Math.round((Date.now() - active.startTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [active?.startTime]);

  if (!hydrated) return null;

  if (split.rest || !active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="text-4xl">Rest Day</h1>
        <p className="text-sm text-muted-foreground">
          {WEEKDAYS[dayIndex]} is scheduled for recovery. Adjust it in the Split Builder.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-2xl crimson-fill px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground"
        >
          Back home
        </button>
      </div>
    );
  }

  const current = active.currentExerciseIndex;
  const exercise = split.exercises[current];
  const movementGuide = exercise ? guideFor(guideCatalog, exercise.name) : undefined;
  const guideInstructions = movementGuide?.instructions ?? [];

  if (!exercise) {
    return (
      <div className="cinematic-stage flex min-h-[100svh] min-h-[100dvh] items-center justify-center bg-background px-5">
        <div className="glass max-w-sm rounded-3xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Session complete
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            No exercise is available at this position.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-5 rounded-2xl crimson-fill px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground"
          >
            Back home
          </button>
        </div>
      </div>
    );
  }

  const log = active.log;
  const sets = (exercise && log[exercise.id]) ?? [];
  const totalSets = Object.values(log).flat().length;
  const doneSets = Object.values(log)
    .flat()
    .filter((s) => s.done).length;

  const volume = Object.values(log)
    .flat()
    .filter((s) => s.done)
    .reduce((sum, s) => sum + s.reps * s.weight, 0);

  const setSet = (i: number, patch: Partial<LoggedSet>) => {
    const newSets = sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    updateActiveSession({
      log: { ...log, [exercise.id]: newSets },
    });
  };

  const bumpWeight = (i: number, dir: 1 | -1) =>
    setSet(i, { weight: roundWeight((sets[i]?.weight ?? 0) + dir * step) });

  const completeSet = (i: number) => {
    const wasDone = sets[i]?.done ?? false;
    setSet(i, { done: !wasDone });
    if (!wasDone) startRest();
  };

  const finish = () => {
    leavingRef.current = true;
    finishWorkout({
      id: uid(),
      date: todayISO(),
      dayIndex: active.dayIndex,
      splitName: active.splitName,
      durationMin: Math.max(1, Math.round((Date.now() - active.startTime) / 60000)),
      volume,
      exercises: split.exercises.map((e) => ({
        name: e.name,
        muscle: e.muscle,
        sets: log[e.id] ?? [],
      })),
    });
    toast.success("Session logged. Beast mode.");
    navigate({ to: "/history" });
  };

  const progress = (doneSets / Math.max(1, totalSets)) * 100;
  const displayLeft = active.restEndsAt !== null ? left : (pausedLeft ?? left);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="cinematic-stage relative min-h-[100svh] min-h-[100dvh] overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72" aria-hidden>
        <div className="aurora-field" />
      </div>
      <div className="app-content-width relative mx-auto w-full px-4 pb-[calc(10rem+var(--safe-bottom))] pt-[max(1.5rem,calc(var(--safe-top)+1rem))] sm:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="mobile-tap-target grid place-items-center rounded-2xl bg-secondary p-2.5"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="truncate text-2xl leading-none sm:text-3xl">{split.name}</h1>
            <p className="mt-1 text-[10px] font-bold text-primary animate-pulse">
              {formatTime(elapsed)}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Cancel this workout? All progress will be lost.")) {
                leavingRef.current = true;
                cancelWorkout();
                navigate({ to: "/" });
              }
            }}
            className="mobile-tap-target grid place-items-center rounded-2xl bg-primary/10 p-2.5 text-primary"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
          {current + 1} / {split.exercises.length} exercises · {Math.round(progress)}% complete
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full crimson-fill glow-red transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="glow-strip mt-3" aria-hidden />
        {movementGuide ? (
          <section className="glass mt-4 overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => setGuideOpen((v) => !v)}
              aria-expanded={guideOpen}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-primary">
                  Guided technique
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {movementGuide.description || "Review each cue before your next set."}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-180" : ""}`}
              />
            </button>
            {guideOpen && guideInstructions.length > 0 ? (
              <div className="border-t border-border/60 px-3 pb-3 pt-2">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-primary">
                  <span>
                    Step {Math.min(guideStep + 1, guideInstructions.length)} /{" "}
                    {guideInstructions.length}
                  </span>
                  <span>Form cue</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((guideStep + 1) / guideInstructions.length) * 100}%` }}
                  />
                </div>
                <ExerciseAnimation name={exercise.name} compact />
                <p className="mt-3 min-h-10 text-sm leading-relaxed">
                  {guideInstructions[guideStep] || guideInstructions[0]}
                </p>
                <div className="mt-3 flex justify-between">
                  <button
                    onClick={() => setGuideStep((v) => Math.max(0, v - 1))}
                    disabled={!guideStep}
                    className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setGuideStep((v) => (v + 1) % guideInstructions.length)}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Next cue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {split.exercises.map((e, i) => (
            <button
              key={e.id}
              onClick={() => updateActiveSession({ currentExerciseIndex: i })}
              className={`shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                i === current
                  ? "crimson-fill text-primary-foreground glow-red"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>

        <section className="glass mt-5 rounded-3xl p-4 rise sm:p-5">
          <h2 className="text-2xl leading-none">{exercise.name}</h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-primary">
            {exercise.muscle} · target {exercise.sets}×{exercise.reps}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Step
            </span>
            {WEIGHT_STEPS.map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                  step === s
                    ? "crimson-fill text-primary-foreground glow-red"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                +{s}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2.5">
            {sets.map((s, i) => (
              <div
                key={i}
                className={`rounded-2xl p-3 transition-colors ${
                  s.done ? "glass-red" : "bg-secondary/60"
                }`}
              >
                <div className="grid grid-cols-[28px_minmax(0,1fr)_44px] items-center gap-2">
                  <span className="text-center text-sm font-bold text-primary">{i + 1}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="rounded-xl bg-background/40 px-2 py-1.5">
                      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">
                        Reps
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={s.reps}
                        onChange={(e) => setSet(i, { reps: Number(e.target.value) })}
                        className="w-full bg-transparent text-lg font-semibold outline-none"
                      />
                    </label>
                    <label className="rounded-xl bg-background/40 px-2 py-1.5">
                      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">
                        Weight kg
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={s.weight}
                        onChange={(e) => setSet(i, { weight: Number(e.target.value) })}
                        className="w-full bg-transparent text-lg font-semibold outline-none"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => completeSet(i)}
                    aria-label={`Complete set ${i + 1}`}
                    className={`grid h-11 w-11 place-items-center rounded-2xl transition-all active:scale-90 ${
                      s.done
                        ? "crimson-fill text-primary-foreground glow-red"
                        : "bg-background/50 text-muted-foreground"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 pl-7">
                  <button
                    onClick={() => bumpWeight(i, -1)}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-background/50 text-muted-foreground active:scale-90"
                    aria-label="Decrease weight"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => bumpWeight(i, 1)}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-background/50 text-primary active:scale-90"
                    aria-label="Increase weight"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.weight ? `${s.weight} kg × ${s.reps}` : "bodyweight"}
                  </span>
                </div>
                {previousExerciseSets?.[i] ? (
                  <p className="mt-1.5 pl-7 text-[10px] text-muted-foreground">
                    Last time:{" "}
                    <span className="font-semibold text-foreground/80">
                      {previousExerciseSets[i].weight
                        ? `${previousExerciseSets[i].weight} kg`
                        : "Bodyweight"}{" "}
                      × {previousExerciseSets[i].reps}
                    </span>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="glass mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Rest Timer
            </p>
            <p className="text-4xl leading-none display text-glow">
              {String(Math.floor(displayLeft / 60)).padStart(2, "0")}:
              {String(displayLeft % 60).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Volume {Math.round(volume)} kg</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => startRest()}
              className="rounded-full bg-secondary p-3"
              aria-label="Restart timer"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={togglePause}
              className="rounded-full crimson-fill p-3 text-primary-foreground glow-red"
              aria-label="Toggle timer"
            >
              {active.restEndsAt !== null ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
          </div>
        </section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-xl px-4 pb-2 sm:px-6 layer-promote">
        <button
          onClick={finish}
          className="w-full rounded-2xl crimson-fill py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground glow-red transition-transform active:scale-95"
        >
          Finish Workout
        </button>
      </div>

      {fullscreen ? (
        <RestOverlay
          left={displayLeft}
          total={REST_SECONDS}
          running={active.restEndsAt !== null}
          onToggle={togglePause}
          onAdd={() =>
            updateActiveSession({ restEndsAt: (active.restEndsAt ?? Date.now()) + 30_000 })
          }
          onClose={() => setFullscreen(false)}
          completedSets={doneSets}
          totalSets={totalSets}
          onSkip={() => {
            updateActiveSession({ restEndsAt: null });
            setPausedLeft(null);
            setLeft(0);
            setFullscreen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function RestOverlay({
  left,
  total,
  running,
  onToggle,
  onAdd,
  onSkip,
  onClose,
  completedSets,
  totalSets,
}: {
  left: number;
  total: number;
  running: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onSkip: () => void;
  onClose: () => void;
  completedSets: number;
  totalSets: number;
}) {
  const pct = Math.min(100, Math.max(0, (left / total) * 100));
  const progressPct = Math.min(100, Math.max(0, (completedSets / Math.max(1, totalSets)) * 100));
  const ringRadius = 108;
  const ringCirc = 2 * Math.PI * ringRadius;

  return (
    <div className="rest-overlay safe-top safe-bottom fixed inset-0 z-50 overflow-y-auto bg-background px-5">
      <div className="rest-overlay-atmosphere" aria-hidden="true" />
      <header className="rest-command-header">
        <span className="rest-command-brand">
          <span className="rest-command-dot" /> PRIME / COMMAND
        </span>
        <span className="rest-command-status">OFFLINE CORE</span>
        <button onClick={onClose} aria-label="Minimise timer" className="rest-close-button">
          <X className="h-6 w-6" />
        </button>
      </header>

      <main className="rest-overlay-content">
        <div className="rest-heading">
          <p className="rest-title">REST</p>
          <span className="rest-title-mark" aria-hidden="true" />
          <p className="rest-subtitle">FOCUS. RECOVER. COME BACK STRONGER.</p>
        </div>

        <div className="rest-dial-shell" aria-label={`${left} seconds remaining`}>
          <div className="rest-dial-halo" aria-hidden="true" />
          <svg className="rest-dial-svg" viewBox="0 0 240 240" aria-hidden="true">
            <circle cx="120" cy="120" r={ringRadius} className="rest-dial-track" />
            <circle
              cx="120"
              cy="120"
              r={ringRadius}
              className="rest-dial-progress"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringCirc * (1 - pct / 100)}
            />
          </svg>
          <div className="rest-dial-inner">
            <Hourglass className="rest-hourglass" strokeWidth={1.5} />
            <p className="rest-time">
              {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
            </p>
            <p className="rest-time-label">SECONDS REMAINING</p>
            <span className="rest-dial-marker" aria-hidden="true" />
          </div>
        </div>

        <p className="rest-affirmation">
          REST IS PART OF THE PROCESS.
          <br />
          <span>TRUST IT.</span>
        </p>

        <div className="rest-controls">
          <button onClick={onSkip} className="rest-control-group" aria-label="Skip rest">
            <span className="rest-control-button rest-control-secondary">
              <FastForward className="h-6 w-6" />
            </span>
            <span className="rest-control-label">SKIP</span>
          </button>

          <button
            onClick={onToggle}
            className="rest-control-group rest-control-primary"
            aria-label={running ? "Pause rest timer" : "Resume rest timer"}
          >
            <span className="rest-control-button rest-control-main">
              {running ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </span>
            <span className="rest-control-label">{running ? "PAUSE" : "RESUME"}</span>
          </button>

          <button onClick={onAdd} className="rest-control-group" aria-label="Add 30 seconds">
            <span className="rest-control-button rest-control-secondary rest-plus-label">+30</span>
            <span className="rest-control-label">+30 SECS</span>
          </button>
        </div>

        <section className="rest-workout-progress" aria-label="Workout progress">
          <div className="rest-progress-heading">
            <span>WORKOUT PROGRESS</span>
            <span>
              {completedSets} / {totalSets}
            </span>
          </div>
          <div className="rest-progress-track">
            <span className="rest-progress-fill" style={{ width: `${progressPct}%` }} />
            {[0, 1, 2, 3, 4, 5, 6].map((point) => (
              <span
                key={point}
                className={`rest-progress-point ${point / 6 <= progressPct / 100 ? "is-done" : ""}`}
                style={{ left: `${(point / 6) * 100}%` }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
