import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Gauge,
  Moon,
  Sparkles,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AICoach } from "@/components/AICoach";
import { useGym } from "@/hooks/use-gym";
import { syncPrimeWidgetState } from "@/lib/prime-widget";
import {
  computeStreak,
  formatMinutes,
  getSplit,
  todayISO,
  weekMinutes,
  weekVolume,
  WEEKDAYS_SHORT,
} from "@/lib/gym-store";
import primeHero from "@/assets/prime-muscle-fibers-hero-v2.png";

const DAILY_QUOTES = [
  {
    text: "We're either getting better or we're getting worse.",
    highlight: "getting better",
    author: "David Goggins",
  },
  {
    text: "The will must be stronger than the skill.",
    highlight: "stronger than the skill",
    author: "Muhammad Ali",
  },
  {
    text: "You've got to find a way to bounce back.",
    highlight: "bounce back",
    author: "LeBron James",
  },
  {
    text: "When you become fit, you feel you can do anything.",
    highlight: "you can do anything",
    author: "Virat Kohli",
  },
  {
    text: "Start weak. Stay patient. Let every honest rep make you harder to break.",
    highlight: "every honest rep",
    author: "PRIME",
  },
  {
    text: "The weight on the bar is temporary. The strength you build is yours.",
    highlight: "The strength you build",
    author: "PRIME",
  },
  {
    text: "Nobody gets strong by wishing. Learn the lift, then return to it.",
    highlight: "return to it",
    author: "PRIME",
  },
  {
    text: "One clean rep at a time. The comeback is built between the big days.",
    highlight: "One clean rep",
    author: "PRIME",
  },
  {
    text: "You do not need to feel ready. You need a plan and the courage to begin.",
    highlight: "the courage to begin",
    author: "PRIME",
  },
  {
    text: "Weak today is a starting point, not a life sentence.",
    highlight: "a starting point",
    author: "PRIME",
  },
  {
    text: "Respect the warm-up. Own the working sets. Recover enough to do it again.",
    highlight: "do it again",
    author: "PRIME",
  },
  {
    text: "Do not chase a reckless max. Build the base that makes it inevitable.",
    highlight: "Build the base",
    author: "PRIME",
  },
] as const;

function getDailyQuote() {
  const now = new Date();
  const dayIndex = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_QUOTES[dayIndex % DAILY_QUOTES.length] ?? DAILY_QUOTES[0];
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PRIME — Performance Command" },
      {
        name: "description",
        content:
          "A bright, offline-first performance workspace for training, progress, and consistency.",
      },
      { property: "og:title", content: "PRIME — Performance Command" },
      {
        property: "og:description",
        content: "Train with clarity. Track everything locally. Build momentum.",
      },
    ],
  }),
  component: Today,
});

function Today() {
  const { data, hydrated } = useGym();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const split = getSplit(data.plan, now.getDay());
  const streak = computeStreak(data.sessions, data.plan);
  const doneToday = data.sessions.some((session) => session.date === todayISO(now));
  const active = Boolean(data.activeSession);
  const minutesThisWeek = weekMinutes(data.sessions);
  const volumeThisWeek = Math.round(weekVolume(data.sessions));
  const totalVolume = Math.round(data.sessions.reduce((sum, session) => sum + session.volume, 0));
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const duration = Math.max(20, split.exercises.length * 11);
  const actionLabel = split.rest
    ? "Recovery View"
    : active
      ? "Resume Workout"
      : doneToday
        ? "Train Again"
        : "Start Workout";

  useEffect(() => {
    if (!hydrated) return;
    void syncPrimeWidgetState({
      dayLabel: now.toLocaleDateString("en-US", { weekday: "short" }),
      profileName: data.profile.name || "Athlete",
      splitName: split.rest ? "Rest Day" : split.name,
      focus: split.focus,
      isRest: split.rest,
      exerciseCount: split.exercises.length,
      status: split.rest ? "RECOVERY MODE" : `${split.exercises.length} MOVES READY`,
    });
  }, [
    data.profile.name,
    hydrated,
    now,
    split.focus,
    split.name,
    split.rest,
    split.exercises.length,
  ]);

  if (!hydrated) return null;

  return (
    <AppShell>
      <header className="hero-panel relative mb-7 overflow-hidden rounded-[2.35rem] border border-primary/15 bg-card shadow-[0_28px_70px_-34px_color-mix(in_oklab,var(--primary)_42%,transparent)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-primary/8" />
        <div className="prime-muscle-field absolute inset-0" aria-hidden="true" />
        <img
          src={primeHero}
          alt="Abstract muscle fibers with cobalt performance energy and signal-red highlights"
          className="hero-visual prime-muscle-visual absolute inset-0 h-full w-full object-cover object-right"
          width={2304}
          height={1536}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/75 via-transparent to-transparent" />
        <div className="relative z-10 min-h-[23rem] p-5 pb-6 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-white/58 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_10px_var(--success)]" />{" "}
              Live field
            </div>
            <Link
              to="/profile"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-white/58 text-primary shadow-sm backdrop-blur-md transition-transform active:scale-90"
              aria-label="Open profile"
            >
              <UserRound className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 max-w-[68%] sm:mt-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              {greeting} · {dateLabel}
            </p>
            <h1 className="mt-2 text-6xl leading-[0.78] tracking-tight text-foreground">
              {data.profile.name || "Athlete"}
            </h1>
            <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-foreground/70">
              Train with intent. Let the work become visible.
            </p>
          </div>

          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Today's vector
              </p>
              <p className="mt-1 text-2xl leading-none display">
                {split.rest ? "Restore" : split.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{split.focus}</p>
            </div>
            <Link
              to={split.rest ? "/calendar" : "/workout"}
              className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-[0_14px_26px_-16px_color-mix(in_oklab,var(--primary)_80%,transparent)] transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {actionLabel}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <SectionHeading eyebrow="Week in motion" title="Your training rail" icon={CalendarDays} />
      <WeekRail plan={data.plan} sessions={data.sessions} currentDay={now.getDay()} />

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary">
            Momentum deck
          </p>
          <h2 className="mt-1 text-3xl leading-none">The numbers that matter</h2>
        </div>
        <Activity className="mb-1 h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mb-7 grid grid-cols-2 gap-3">
        <DataCard
          icon={Clock3}
          value={formatMinutes(minutesThisWeek)}
          label="Time this week"
          note="consistency"
        />
        <DataCard icon={Zap} value={streak} label="Days in motion" note="streak" />
        <DataCard
          icon={Target}
          value={`${volumeThisWeek} kg`}
          label="Volume this week"
          note="load moved"
        />
        <DataCard
          icon={Gauge}
          value={`${totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} kg`}
          label="Total volume"
          note="lifetime"
        />
      </div>
      <DisciplineTicker />

      <SectionHeading eyebrow="Coach briefing" title="Your next best move" icon={Sparkles} />
      <AICoach data={data} split={split} streak={streak} doneToday={doneToday} active={active} />

      <SectionHeading eyebrow="Daily signal" title="Field note" icon={Sparkles} />
      <DailyQuoteCard />

      {split.rest ? (
        <>
          <SectionHeading eyebrow="Recovery protocol" title="Rest day" icon={Moon} />
          <section className="recovery-day-card glass mb-7 overflow-hidden rounded-[2rem] p-5">
            <div className="flex items-start gap-4">
              <div className="recovery-day-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-primary">
                  No session scheduled
                </p>
                <h2 className="mt-1 text-4xl leading-none">Recover with intent</h2>
                <p className="mt-2 max-w-[19rem] text-sm leading-relaxed text-muted-foreground">
                  {split.focus}. Use today for sleep, mobility, walking, and coming back stronger.
                </p>
              </div>
            </div>
            <Link
              to="/calendar"
              className="recovery-day-link mt-5 flex min-h-14 items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-primary-foreground transition-all active:scale-[0.985]"
            >
              <span>Open recovery view</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        </>
      ) : (
        <>
          <SectionHeading eyebrow="Today's mission" title="Start your workout" icon={Dumbbell} />
          <section className="today-workout-card glass mb-7 overflow-hidden rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-primary">
                  Primary session
                </p>
                <h2 className="mt-1 text-4xl leading-none">{split.name}</h2>
                <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
                  {split.focus}
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-center">
                <p className="text-xl leading-none display">{split.exercises.length}</p>
                <p className="text-[8px] uppercase tracking-widest text-muted-foreground">moves</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
              <Metric icon={Clock3} value={`${duration} min`} label="estimated" />
              <span className="h-8 w-px bg-border" />
              <Metric icon={Dumbbell} value={`${split.exercises.length}`} label="exercises" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {split.exercises.slice(0, 4).map((exercise) => (
                <span
                  key={exercise.id}
                  className="rounded-full border border-primary/15 bg-primary/6 px-3 py-1.5 text-[10px] font-semibold text-foreground/70"
                >
                  {exercise.name}
                </span>
              ))}
            </div>
            <Link
              to="/workout"
              className="premium-workout-cta mt-5 flex min-h-16 items-center justify-between rounded-[1.25rem] px-4 py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.985]"
            >
              <span className="premium-workout-cta-copy">
                <span className="premium-workout-cta-kicker">Session command</span>
                <span className="premium-workout-cta-label">{actionLabel}</span>
              </span>
              <span className="premium-workout-cta-arrow" aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </section>
        </>
      )}

      {data.sessions[0] ? (
        <Link
          to="/history"
          className="glass mt-7 flex items-center justify-between rounded-[2rem] p-4"
        >
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-primary">
              Latest signal
            </p>
            <p className="mt-1 text-lg font-semibold">{data.sessions[0].splitName}</p>
            <p className="text-xs text-muted-foreground">
              {data.sessions[0].date} · {data.sessions[0].durationMin} min ·{" "}
              {Math.round(data.sessions[0].volume)} kg volume
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      ) : null}
    </AppShell>
  );
}

function DisciplineTicker() {
  return (
    <section className="discipline-ticker glass mb-7" aria-label="Prime discipline reminder">
      <div className="discipline-ticker-label">Daily standard</div>
      <div className="discipline-ticker-window">
        <div className="live-training-ticker-track">
          <div className="live-training-ticker-set">
            <span>Break the pattern today, or the loop will repeat tomorrow.</span>
            <span>Comfort is a cycle. Cut it.</span>
            <span>Do the work before the excuses arrive.</span>
          </div>
          <div className="live-training-ticker-set" aria-hidden="true">
            <span>Break the pattern today, or the loop will repeat tomorrow.</span>
            <span>Comfort is a cycle. Cut it.</span>
            <span>Do the work before the excuses arrive.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyQuoteCard() {
  const quote = getDailyQuote();
  const escaped = quote.highlight.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const parts = quote.text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <section className="glass-red relative mb-7 overflow-hidden rounded-[2rem] p-5">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
          <span className="activity-ping h-1.5 w-1.5 rounded-full bg-primary" />
          PRIME field note
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Today only
        </span>
      </div>
      <blockquote className="relative z-10 mt-5 max-w-[21rem] text-xl font-medium leading-relaxed text-foreground/80">
        “
        {parts.map((part, index) =>
          part.toLowerCase() === quote.highlight.toLowerCase() ? (
            <span
              key={index}
              className="display mx-1 inline-block text-3xl italic text-primary text-glow"
            >
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          ),
        )}
        ”
      </blockquote>
      <div className="cinematic-divider relative z-10 mb-0 mt-5" aria-hidden />
      <p className="relative z-10 mt-3 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {quote.author === "PRIME" ? "Original PRIME performance note" : `— ${quote.author}`}
      </p>
    </section>
  );
}

function DataCard({
  icon: Icon,
  value,
  label,
  note,
}: {
  icon: typeof Activity;
  value: string | number;
  label: string;
  note: string;
}) {
  return (
    <div className="glass rounded-[1.6rem] p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{note}</span>
      </div>
      <p className="mt-4 text-3xl leading-none display">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Activity;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-3xl leading-none">{title}</h2>
      </div>
      <Icon className="mb-1 h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="text-sm font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function WeekRail({
  plan,
  sessions,
  currentDay,
}: {
  plan: ReturnType<typeof getSplit>[];
  sessions: { date: string }[];
  currentDay: number;
}) {
  const trained = useMemo(() => new Set(sessions.map((session) => session.date)), [sessions]);
  return (
    <div className="glass mb-7 rounded-[2rem] p-4">
      <div className="flex items-center justify-between gap-1">
        {WEEKDAYS_SHORT.map((day, index) => {
          const date = new Date();
          date.setDate(date.getDate() - date.getDay() + index);
          const iso = todayISO(date);
          const isCurrent = index === currentDay;
          const isDone = trained.has(iso);
          return (
            <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl text-[10px] font-bold transition-all ${isCurrent ? "bg-primary text-primary-foreground shadow-[0_10px_18px_-10px_color-mix(in_oklab,var(--primary)_80%,transparent)]" : isDone ? "bg-accent/30 text-accent-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`text-[9px] uppercase tracking-widest ${isCurrent ? "font-bold text-primary" : "text-muted-foreground"}`}
              >
                {day}
              </span>
              <span className="w-full truncate text-center text-[8px] text-muted-foreground">
                {plan[index]?.rest ? "Reset" : plan[index]?.name.replace(" Day", "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
