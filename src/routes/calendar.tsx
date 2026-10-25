import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/hooks/use-gym";
import { WEEKDAYS_SHORT, getSplit, todayISO } from "@/lib/gym-store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Training Calendar — IRONPRIDE" },
      {
        name: "description",
        content:
          "Your split auto-mapped onto every day of the month, with logged workouts highlighted in crimson.",
      },
      { property: "og:title", content: "Training Calendar — IRONPRIDE" },
      {
        property: "og:description",
        content: "See which split lands on each date and which days you actually trained.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { data } = useGym();
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const logged = new Set(data.sessions.map((s) => s.date));
  const today = todayISO();
  const todaySplit = getSplit(data.plan, new Date().getDay());

  const iso = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const monthSessions = data.sessions.filter((s) =>
    s.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  );

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between rise">
        <div>
          <h1 className="text-4xl leading-none">Calendar</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {cursor.toLocaleString("en-US", { month: "long" })} {year}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="glass grid h-10 w-10 place-items-center rounded-full"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="glass grid h-10 w-10 place-items-center rounded-full"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="glass-red mb-5 flex items-center gap-3 rounded-3xl p-4 rise">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Today: {todaySplit.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {todaySplit.exercises.length} exercises · {todaySplit.focus}
          </p>
        </div>
        {!todaySplit.rest && (
          <Link
            to="/workout"
            className="shrink-0 rounded-2xl crimson-fill px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Start
          </Link>
        )}
      </section>

      <section className="glass rounded-3xl p-4 rise">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {WEEKDAYS_SHORT.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
            const date = iso(day);
            const dow = new Date(year, month, day).getDay();
            const split = getSplit(data.plan, dow);
            const isLogged = logged.has(date);
            const isToday = date === today;
            return (
              <div
                key={day}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 text-center transition-all ${
                  isLogged
                    ? "crimson-fill text-primary-foreground glow-red"
                    : isToday
                      ? "border border-primary/60 bg-primary/10 text-primary"
                      : "bg-secondary/40 text-foreground"
                }`}
              >
                <span className="text-sm font-semibold leading-none">{day}</span>
                <span className="mt-1 h-1 w-1 rounded-full bg-current opacity-70" />
                <span className="mt-0.5 w-full truncate text-[8px] uppercase tracking-wide opacity-70">
                  {split.rest ? "Rest" : split.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full crimson-fill" /> Workout logged
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/40" /> Split scheduled
        </span>
      </div>

      <h2 className="mb-3 mt-6 text-2xl">This month's workouts</h2>
      {monthSessions.length === 0 ? (
        <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No workouts logged this month.
        </p>
      ) : (
        <div className="space-y-3">
          {monthSessions.map((s) => (
            <div key={s.id} className="glass rounded-3xl p-4">
              <p className="font-semibold">{s.splitName}</p>
              <p className="text-xs text-muted-foreground">
                {s.date} · {s.durationMin} min · {Math.round(s.volume)} kg
              </p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
