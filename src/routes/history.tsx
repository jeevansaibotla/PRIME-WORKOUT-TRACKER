import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useGym } from "@/hooks/use-gym";
import { WEEKDAYS_SHORT, todayISO, type Session } from "@/lib/gym-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Workout History — IRONPRIDE" },
      {
        name: "description",
        content: "A crimson calendar of every training day you have completed, stored offline.",
      },
      { property: "og:title", content: "Workout History — IRONPRIDE" },
      {
        property: "og:description",
        content: "Review past sessions, volume and duration on your training calendar.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data } = useGym();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Session | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const trained = new Set(data.sessions.map((s) => s.date));

  const cell = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <AppShell>
      <PageHeader title="History" subtitle="Every roar recorded" />

      <section className="glass rounded-3xl p-5 rise">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-xl bg-secondary p-2"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-lg font-semibold">
            {cursor.toLocaleString("en-US", { month: "long" })} {year}
          </p>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-xl bg-secondary p-2"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {WEEKDAYS_SHORT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: first }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const iso = cell(day);
            const isTrained = trained.has(iso);
            const isToday = iso === todayISO();
            return (
              <span
                key={day}
                className={`flex aspect-square items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isTrained
                    ? "crimson-fill text-primary-foreground glow-red"
                    : isToday
                      ? "border border-primary/50 text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
      </section>

      <h2 className="mb-3 mt-6 text-2xl">Sessions</h2>
      {data.sessions.length === 0 ? (
        <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No sessions yet. Finish your first workout to light up the calendar.
        </p>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="glass flex w-full items-center gap-3 rounded-3xl p-4 rise text-left transition-transform active:scale-[0.98]"
            >
              <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.splitName}</p>
                <p className="text-xs text-muted-foreground">
                  {s.date} · {s.durationMin} min · {s.exercises.length} exercises
                </p>
                <p className="text-xs text-primary">Volume: {Math.round(s.volume)} kg</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {selected ? <SessionDetail session={selected} onClose={() => setSelected(null)} /> : null}
    </AppShell>
  );
}

function SessionDetail({ session, onClose }: { session: Session; onClose: () => void }) {
  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-xl animate-pop-in">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 ember-bg" aria-hidden />
      <div className="relative mx-auto w-full max-w-md px-5 pb-12 pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-3xl leading-none">{session.splitName}</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {new Date(session.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              · {session.durationMin} min
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-2xl bg-secondary p-2.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <MiniStat value={totalSets} label="Sets" />
          <MiniStat value={session.exercises.length} label="Exercises" />
          <MiniStat value={Math.round(session.volume)} label="kg vol" />
        </div>

        <div className="mt-6 space-y-4">
          {session.exercises.map((e, i) => (
            <div key={i} className="glass rounded-3xl p-4 rise">
              <p className="font-semibold">
                {i + 1}. {e.name}
              </p>
              <div className="mt-3 space-y-2">
                {e.sets.map((s, si) => (
                  <div key={si} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {si + 1}. {s.weight ? `${s.weight} kg` : "Bodyweight"} × {s.reps} reps
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        s.done ? "crimson-fill glow-red" : "bg-secondary"
                      }`}
                      aria-label={s.done ? "Completed" : "Not completed"}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-4 text-center">
      <p className="text-2xl leading-none display text-primary">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
