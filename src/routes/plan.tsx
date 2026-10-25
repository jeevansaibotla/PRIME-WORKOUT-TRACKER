import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Moon, Save, Search, Dumbbell, X, Bot } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AICoach } from "@/components/AICoach";
import { useGym } from "@/hooks/use-gym";
import {
  WEEKDAYS,
  WEEKDAYS_SHORT,
  computeStreak,
  getSplit,
  todayISO,
  uid,
  type DaySplit,
} from "@/lib/gym-store";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from "@/lib/exercise-library";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMemo } from "react";
import { planningFeedback } from "@/lib/training-analytics";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Weekly Split Builder — IRONPRIDE" },
      {
        name: "description",
        content: "Create and edit your weekly gym split day by day. Saved offline on your device.",
      },
      { property: "og:title", content: "Weekly Split Builder — IRONPRIDE" },
      {
        property: "og:description",
        content: "Design a split for every weekday and let IRONPRIDE load it automatically.",
      },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { data, updatePlan } = useGym();
  const [day, setDay] = useState(() => new Date().getDay());
  const [showCoach, setShowCoach] = useState(false);
  const split = getSplit(data.plan, day);
  const targetDayName = WEEKDAYS[day] ?? "selected day";
  const feedback = useMemo(
    () =>
      planningFeedback(data.plan, data.sessions)[day] ?? {
        overlap: [],
        message: "Plan feedback is not available for this day",
      },
    [data.plan, data.sessions, day],
  );

  const patch = (p: Partial<DaySplit>) => updatePlan(day, { ...split, ...p });
  const applyCoachWorkout = (
    draft: import("@/components/CoachPlanBuilder").CoachDraft,
    mode: import("@/components/CoachPlanBuilder").CoachApplyMode,
  ) => {
    const current = getSplit(data.plan, day);
    const append = mode === "append" && !current.rest && current.exercises.length > 0;
    const exercises = append ? [...current.exercises, ...draft.exercises] : draft.exercises;
    updatePlan(day, {
      name: append ? current.name : draft.name,
      focus: append && current.focus ? `${current.focus} · ${draft.focus}` : draft.focus,
      rest: false,
      exercises,
    });
    toast(`${draft.exercises.length} Coach exercises applied to ${WEEKDAYS[day]}.`);
    setShowCoach(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Split Builder"
        subtitle="Auto-synced to your calendar"
        right={
          <button
            type="button"
            onClick={() => setShowCoach((value) => !value)}
            aria-expanded={showCoach}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Bot className="h-4 w-4" /> Coach
          </button>
        }
      />
      {showCoach ? (
        <AICoach
          key={`plan-coach-${day}-${split.name}`}
          data={data}
          split={split}
          streak={computeStreak(data.sessions, data.plan)}
          doneToday={data.sessions.some((session) => session.date === todayISO())}
          active={Boolean(data.activeSession)}
          initiallyOpen
          targetDay={targetDayName}
          onApplyWorkout={applyCoachWorkout}
        />
      ) : null}

      <div className="mb-5 flex gap-2">
        {WEEKDAYS_SHORT.map((d, i) => (
          <button
            key={d}
            onClick={() => setDay(i)}
            className={`flex-1 rounded-2xl py-3 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
              i === day
                ? "crimson-fill text-primary-foreground glow-red"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <section className="glass mb-4 rounded-3xl p-4 rise">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            Plan intelligence
          </p>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${feedback.overlap.length ? "text-destructive" : "text-primary"}`}
          >
            {feedback.overlap.length ? "Caution" : "Ready"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {feedback.message}. This is an offline training signal, not medical advice.
        </p>
      </section>

      <section className="glass mb-4 space-y-3 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">{WEEKDAYS[day]}</p>
        <input
          value={split.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Split name"
          className="w-full rounded-2xl bg-secondary px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={split.focus}
          onChange={(e) => patch({ focus: e.target.value })}
          placeholder="Muscle focus"
          className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => patch({ rest: !split.rest })}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
            split.rest ? "glass-red" : "bg-secondary text-muted-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Moon className="h-4 w-4" /> Rest Day
          </span>
          <span className="text-xs uppercase tracking-widest">{split.rest ? "On" : "Off"}</span>
        </button>
      </section>

      {!split.rest && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl">Exercises</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {split.exercises.length} total
            </span>
          </div>

          <div className="space-y-3">
            {split.exercises.map((exercise, idx) => (
              <div key={exercise.id} className="glass rounded-3xl p-4 rise">
                <div className="flex items-start gap-3">
                  <input
                    value={exercise.name}
                    onChange={(e) =>
                      patch({
                        exercises: split.exercises.map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                    className="flex-1 bg-transparent text-base font-semibold outline-none"
                  />
                  <button
                    onClick={() =>
                      patch({ exercises: split.exercises.filter((_, i) => i !== idx) })
                    }
                    className="rounded-xl bg-secondary p-2 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remove exercise"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  value={exercise.muscle}
                  onChange={(e) =>
                    patch({
                      exercises: split.exercises.map((x, i) =>
                        i === idx ? { ...x, muscle: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="Muscle group"
                  className="mt-1 w-full bg-transparent text-xs uppercase tracking-widest text-primary outline-none"
                />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(["sets", "reps", "weight"] as const).map((field) => (
                    <label key={field} className="rounded-2xl bg-secondary px-3 py-2">
                      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                        {field === "weight" ? "kg" : field}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={exercise[field]}
                        onChange={(e) =>
                          patch({
                            exercises: split.exercises.map((x, i) =>
                              i === idx ? { ...x, [field]: Number(e.target.value) } : x,
                            ),
                          })
                        }
                        className="w-full bg-transparent text-lg font-semibold outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                patch({
                  exercises: [
                    ...split.exercises,
                    {
                      id: uid(),
                      name: "New Exercise",
                      muscle: "Chest",
                      sets: 3,
                      reps: 10,
                      weight: 20,
                    },
                  ],
                })
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-4 text-[11px] font-bold uppercase tracking-widest text-primary transition-transform active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Manual
            </button>

            <Drawer>
              <DrawerTrigger asChild>
                <button className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-4 text-[11px] font-bold uppercase tracking-widest text-primary transition-transform active:scale-95">
                  <Search className="h-3.5 w-3.5" /> Browse
                </button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh] bg-background px-4 pb-10">
                <DrawerHeader className="px-0">
                  <div className="flex items-center justify-between">
                    <DrawerTitle className="text-2xl">Exercise Library</DrawerTitle>
                    <DrawerClose asChild>
                      <button className="rounded-full bg-secondary p-2">
                        <X className="h-4 w-4" />
                      </button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>
                <ExercisePicker
                  onSelect={(ex) => {
                    patch({
                      exercises: [
                        ...split.exercises,
                        {
                          id: uid(),
                          name: ex.name,
                          muscle: ex.muscle,
                          sets: 3,
                          reps: 10,
                          weight: 0,
                        },
                      ],
                    });
                    toast.success(`Added ${ex.name}`);
                  }}
                />
              </DrawerContent>
            </Drawer>
          </div>
        </>
      )}

      <button
        onClick={() => toast.success(`${WEEKDAYS[day]} split saved offline`)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl crimson-fill py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground glow-red transition-transform active:scale-95"
      >
        <Save className="h-4 w-4" /> Saved to this device
      </button>
    </AppShell>
  );
}

function ExercisePicker({ onSelect }: { onSelect: (ex: (typeof EXERCISE_LIBRARY)[0]) => void }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);

  const results = useMemo(
    () =>
      EXERCISE_LIBRARY.filter(
        (e) =>
          (!muscle || e.muscle === muscle) &&
          (e.name + e.muscle + e.equipment).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, muscle],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="glass mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movements"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[null, ...MUSCLE_GROUPS].map((m) => (
          <button
            key={m ?? "all"}
            onClick={() => setMuscle(m)}
            className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-widest transition-all ${
              muscle === m
                ? "crimson-fill text-primary-foreground glow-red"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {m ?? "All"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pb-20 no-scrollbar">
        {results.map((e) => (
          <button
            key={e.name}
            onClick={() => onSelect(e)}
            className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.muscle} · {e.equipment}
              </p>
            </div>
            <Plus className="h-4 w-4 text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}
