import { createFileRoute } from "@tanstack/react-router";
import { Flame, TrendingUp, Trophy, Trash2, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useGym } from "@/hooks/use-gym";
import { computeStreak, todayISO, weeklySeries } from "@/lib/gym-store";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import { toast } from "sonner";
import { exerciseHistory, muscleInsights, weeklyAnalytics } from "@/lib/training-analytics";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress & PRs — IRONPRIDE" },
      {
        name: "description",
        content: "Bodyweight trend, volume trends, personal records and streaks — all offline.",
      },
      { property: "og:title", content: "Progress & PRs — IRONPRIDE" },
      {
        property: "og:description",
        content: "See your strength curve, bodyweight trend and top lifts, all computed on-device.",
      },
    ],
  }),
  component: ProgressPage,
});

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function ProgressPage() {
  const { data, addWeightEntry, removeWeightEntry } = useGym();
  const [weightInput, setWeightInput] = useState("");

  const weightHistory = data.weightHistory ?? [];
  const weightSeries = useMemo(
    () =>
      [...weightHistory]
        .reverse()
        .map((w) => ({ label: shortDate(w.date), weight: w.weight, date: w.date })),
    [weightHistory],
  );

  const prs = new Map<string, number>();
  for (const s of data.sessions) {
    for (const e of s.exercises) {
      const best = Math.max(0, ...e.sets.filter((x) => x.done).map((x) => x.weight));
      if (best > (prs.get(e.name) ?? 0)) prs.set(e.name, best);
    }
  }
  const topPrs = [...prs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const totalVolume = data.sessions.reduce((sum, s) => sum + s.volume, 0);
  const muscleInsightsData = useMemo(() => muscleInsights(data.sessions, 30), [data.sessions]);
  const recoveryLoaded = muscleInsightsData.filter((item) => item.state === "Loaded").length;
  const neglectedMuscles = muscleInsightsData
    .filter((item) => item.state === "Neglected")
    .slice(0, 4);
  const analyticsWeeks = useMemo(() => weeklyAnalytics(data.sessions, 8), [data.sessions]);

  const weeklyPoints = useMemo(() => weeklySeries(data.sessions, 8), [data.sessions]);
  const volumeSeries = useMemo(
    () => weeklyPoints.map((w) => ({ label: w.weekLabel, volume: Math.round(w.volume) })),
    [weeklyPoints],
  );
  const workoutSeries = useMemo(
    () => weeklyPoints.map((w) => ({ label: w.weekLabel, workouts: w.workouts })),
    [weeklyPoints],
  );

  const muscleFocus = useMemo(() => {
    const muscleByName = new Map<string, string>();
    for (const e of EXERCISE_LIBRARY) muscleByName.set(e.name, e.muscle);
    for (const c of data.custom ?? []) muscleByName.set(c.name, c.muscle);
    for (const d of data.plan) for (const e of d.exercises) muscleByName.set(e.name, e.muscle);

    const earliest = weeklyPoints[0]?.weekStart;
    const counts = new Map<string, number>();
    for (const s of data.sessions) {
      if (earliest && s.date < earliest) continue;
      for (const e of s.exercises) {
        const muscle = muscleByName.get(e.name) ?? "Other";
        const doneSets = e.sets.filter((x) => x.done).length;
        if (doneSets > 0) counts.set(muscle, (counts.get(muscle) ?? 0) + doneSets);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.sessions, data.custom, data.plan, weeklyPoints]);
  const maxMuscleSets = Math.max(1, ...muscleFocus.map(([, v]) => v));

  const exerciseNames = useMemo(
    () => [...new Set(data.sessions.flatMap((s) => s.exercises.map((e) => e.name)))].sort(),
    [data.sessions],
  );
  const [selectedExercise, setSelectedExercise] = useState("");
  const exerciseSeries = useMemo(() => {
    if (!selectedExercise) return [];
    return [...data.sessions]
      .reverse()
      .map((s) => {
        const ex = s.exercises.find((e) => e.name === selectedExercise);
        if (!ex) return null;
        const best = Math.max(0, ...ex.sets.filter((x) => x.done).map((x) => x.weight));
        return { label: shortDate(s.date), weight: best };
      })
      .filter((p): p is { label: string; weight: number } => p !== null);
  }, [data.sessions, selectedExercise]);

  const handleLogWeight = () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    addWeightEntry({ date: todayISO(), weight: val });
    setWeightInput("");
    toast.success("Weight logged");
  };

  return (
    <AppShell>
      <PageHeader title="Progress" subtitle="Numbers never lie" />

      {/* Bodyweight — headline section */}
      <section className="glass mb-5 rounded-3xl p-5 rise">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bodyweight</p>
          </div>
          {weightHistory[0] ? (
            <span className="text-2xl leading-none display text-primary">
              {weightHistory[0].weight}
              <span className="ml-1 text-xs font-normal text-muted-foreground">kg</span>
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Weight (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleLogWeight}
            className="rounded-2xl crimson-fill px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-transform active:scale-95"
          >
            Log
          </button>
        </div>

        <div className="mt-5">
          <TrendChart
            id="bodyweight"
            data={weightSeries}
            dataKey="weight"
            height={180}
            valueSuffix=" kg"
            emptyLabel="Log weight at least twice to see your trend."
          />
        </div>

        {weightHistory.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            {weightHistory.slice(0, 5).map((w) => (
              <div key={w.date} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(w.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{w.weight} kg</span>
                  <button
                    onClick={() => removeWeightEntry(w.date)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Metric icon={Flame} value={computeStreak(data.sessions, data.plan)} label="Streak" />
        <Metric icon={Trophy} value={data.sessions.length} label="Sessions" />
        <Metric icon={TrendingUp} value={`${(totalVolume / 1000).toFixed(1)}k`} label="Total kg" />
      </div>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Volume per week</p>
        <div className="mt-4">
          <TrendChart
            id="volume-week"
            data={volumeSeries}
            dataKey="volume"
            valueSuffix=" kg"
            emptyLabel="Log a workout to build your weekly trend."
          />
        </div>
      </section>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Workouts per week</p>
        <div className="mt-4">
          <TrendChart
            id="workouts-week"
            data={workoutSeries}
            dataKey="workouts"
            height={130}
            emptyLabel="No workouts logged yet this stretch."
          />
        </div>
      </section>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Muscle group focus
        </p>
        <div className="mt-4 space-y-3">
          {muscleFocus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sets logged yet.</p>
          ) : (
            muscleFocus.map(([muscle, sets]) => (
              <div key={muscle}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{muscle}</span>
                  <span className="font-semibold">{sets} sets</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full crimson-fill glow-red transition-all duration-500"
                    style={{ width: `${(sets / maxMuscleSets) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Exercise progression
        </p>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="mt-3 w-full rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select an exercise...</option>
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {selectedExercise ? (
          <div className="mt-6">
            <TrendChart
              id="exercise-progression"
              data={exerciseSeries}
              dataKey="weight"
              valueSuffix=" kg"
              emptyLabel="Log this exercise in another session to see progression."
            />
            {(() => {
              const history = exerciseHistory(data.sessions, selectedExercise);
              const latest = history[0];
              const previous = history[1];
              return latest ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric icon={TrendingUp} value={`${latest.bestWeight} kg`} label="Last best" />
                  <Metric icon={Trophy} value={`${latest.volume} kg`} label="Last volume" />
                  <Metric
                    icon={Flame}
                    value={
                      previous
                        ? `${latest.bestWeight - previous.bestWeight >= 0 ? "+" : ""}${latest.bestWeight - previous.bestWeight} kg`
                        : "New"
                    }
                    label="Vs previous"
                  />
                </div>
              ) : null;
            })()}
          </div>
        ) : null}
      </section>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Recovery signal
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Approximate training freshness from recent completed sets.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            {recoveryLoaded} loaded
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {muscleInsightsData
            .filter((item) => item.sets > 0 || item.state === "Neglected")
            .slice(0, 8)
            .map((item) => (
              <div key={item.key} className="rounded-2xl bg-secondary/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold">{item.label}</span>
                  <span
                    className={`text-[9px] font-bold uppercase ${item.state === "Loaded" ? "text-destructive" : item.state === "Working" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {item.state}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {item.lastTrained ? `${item.daysSince}d since last hit` : "No recent sets"}
                </p>
              </div>
            ))}
        </div>
        {neglectedMuscles.length > 0 ? (
          <p className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            Undertrained signal: {neglectedMuscles.map((item) => item.label).join(", ")}. Consider
            adding one controlled movement this week.
          </p>
        ) : null}
      </section>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Training load pulse
        </p>
        <div className="mt-4 space-y-3">
          {analyticsWeeks.slice(-4).map((week) => (
            <div key={week.label} className="flex items-center gap-3">
              <span className="w-12 text-[10px] text-muted-foreground">{week.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, week.sets * 4)}%` }}
                />
              </div>
              <span className="w-14 text-right text-[10px] font-bold">{week.sets} sets</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass mb-5 rounded-3xl p-5 rise">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Personal records (est. 1RM)
        </p>
        <div className="mt-3 space-y-2">
          {topPrs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No personal records yet.</p>
          ) : (
            topPrs.map(([name, weight]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl bg-secondary/40 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-muted-foreground">{name}</span>
                <span className="text-sm font-bold text-primary">{weight} kg</span>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

function TrendChart({
  id,
  data,
  dataKey,
  height = 150,
  valueSuffix = "",
  emptyLabel,
}: {
  id: string;
  data: Record<string, string | number>[];
  dataKey: string;
  height?: number;
  valueSuffix?: string;
  emptyLabel: string;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-background/30"
        style={{ height }}
      >
        <p className="max-w-[220px] text-center text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="text-primary" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
          <XAxis
            dataKey="label"
            tick={{ fill: "currentColor", fontSize: 10, opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
            contentStyle={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)", marginBottom: 2 }}
            formatter={(value: number) => [`${value}${valueSuffix}`, ""]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="currentColor"
            strokeWidth={2.5}
            fill={`url(#grad-${id})`}
            dot={{ r: 3, fill: "currentColor", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Flame;
  value: string | number;
  label: string;
}) {
  return (
    <div className="glass rounded-3xl px-3 py-4 text-center rise">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-2 text-2xl leading-none display">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
