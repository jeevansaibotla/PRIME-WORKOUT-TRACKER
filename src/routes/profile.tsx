import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FileUp,
  RotateCcw,
  Save,
  ShieldCheck,
  Table2,
  Target,
  UserRound,
  WifiOff,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ProgressPhotoGallery } from "@/components/ProgressPhotoGallery";
import { useGym } from "@/hooks/use-gym";
import { computeStreak, todayISO } from "@/lib/gym-store";
import { dataToCsv, downloadText } from "@/lib/training-analytics";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Command — PRIME" },
      {
        name: "description",
        content:
          "Your athlete profile, training goals, progress snapshot, and private backup controls.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, updateProfile, reset, replaceData } = useGym();
  const [editing, setEditing] = useState(false);

  const exportData = () => {
    downloadText("prime-backup.json", JSON.stringify(data, null, 2), "application/json");
    toast.success("JSON backup exported");
  };

  const exportCsv = () => {
    downloadText("prime-training-log.csv", dataToCsv(data), "text/csv;charset=utf-8");
    toast.success("CSV training log exported");
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.plan) || !Array.isArray(parsed.sessions)) {
          throw new Error("invalid");
        }
        replaceData(parsed);
        toast.success("Backup restored offline");
      } catch {
        toast.error("That file is not a valid PRIME backup");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const streak = computeStreak(data.sessions, data.plan);
  const totalMinutes = data.sessions.reduce((sum, session) => sum + session.durationMin, 0);
  const totalHours =
    totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1).replace(/\.0$/, "")}` : "0";
  const initials =
    data.profile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "P";

  const weekStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay());
    return todayISO(date);
  }, []);
  const sessionsThisWeek = data.sessions.filter((session) => session.date >= weekStart).length;
  const plannedTrainingDays = data.plan.filter((day) => !day.rest).length;
  const weeklyPercent = plannedTrainingDays
    ? Math.min(100, Math.round((sessionsThisWeek / plannedTrainingDays) * 100))
    : 0;

  return (
    <AppShell>
      <PageHeader title="Your Command" subtitle="Build a better version. Every day." />

      <section className="profile-identity-card glass-red relative mb-5 overflow-hidden rounded-[2rem] p-5 sm:p-6 rise">
        <div className="profile-identity-glow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-4 sm:gap-5">
          <div className="profile-avatar-orb grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center rounded-full border border-white/70 text-2xl font-bold text-primary shadow-[0_12px_34px_-18px_rgba(23,100,216,.7)] sm:h-20 sm:w-20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary">
              Athlete profile
            </p>
            {editing ? (
              <label className="mt-1 block">
                <span className="sr-only">Your name</span>
                <input
                  autoFocus
                  value={data.profile.name}
                  onChange={(event) => updateProfile({ name: event.target.value })}
                  className="w-full min-w-0 border-b border-primary/25 bg-transparent py-1 text-3xl display outline-none focus:border-primary"
                  placeholder="Your name"
                />
              </label>
            ) : (
              <h2 className="mt-1 truncate text-3xl leading-none display">
                {data.profile.name || "Athlete"}
              </h2>
            )}
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {editing
                ? "Edit your training identity and goal below."
                : data.profile.goal || "Set your next training goal."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-white/60 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm transition-transform active:scale-95"
            aria-expanded={editing}
          >
            {editing ? <Check className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{editing ? "Done" : "Edit profile"}</span>
          </button>
        </div>

        <div className="relative mt-5 grid grid-cols-3 divide-x divide-border/70 rounded-2xl border border-white/60 bg-white/36 py-3">
          <QuickStat icon={Activity} value={data.sessions.length} label="Workouts" />
          <QuickStat icon={Target} value={streak} label="Day streak" />
          <QuickStat
            icon={Clock3}
            value={totalHours}
            label="Hours trained"
            suffix={totalMinutes >= 60 ? "h" : ""}
          />
        </div>
      </section>

      <section className="profile-goal-card glass relative mb-5 overflow-hidden rounded-[1.8rem] p-5 sm:p-6">
        <div className="profile-goal-glow pointer-events-none absolute -right-8 -top-10 h-40 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
              <Target className="h-3.5 w-3.5" /> Training focus
            </p>
            {editing ? (
              <label className="mt-2 block">
                <span className="sr-only">Training goal</span>
                <input
                  value={data.profile.goal}
                  onChange={(event) => updateProfile({ goal: event.target.value })}
                  className="w-full rounded-xl border border-primary/12 bg-background/50 px-3 py-2 text-lg font-semibold outline-none focus:border-primary/50"
                />
              </label>
            ) : (
              <h2 className="mt-2 text-2xl leading-tight display sm:text-3xl">
                {data.profile.goal || "Choose your focus"}
              </h2>
            )}
          </div>
          <div className="shrink-0 rounded-2xl border border-primary/10 bg-white/45 px-3 py-2 text-right">
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Current weight
            </p>
            {editing ? (
              <label className="mt-1 flex items-center justify-end gap-1">
                <span className="sr-only">Body weight in kilograms</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={data.profile.weight}
                  onChange={(event) => updateProfile({ weight: Number(event.target.value) })}
                  className="w-16 bg-transparent text-right text-lg font-bold outline-none"
                />
                <span className="text-xs text-muted-foreground">kg</span>
              </label>
            ) : (
              <p className="mt-1 text-xl font-bold">
                {data.profile.weight}
                <span className="ml-1 text-xs font-medium text-muted-foreground">kg</span>
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl border border-border/70 bg-background/35 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Weekly plan
              </p>
              <p className="mt-1 text-sm font-semibold">
                {plannedTrainingDays
                  ? `${Math.min(sessionsThisWeek, plannedTrainingDays)} of ${plannedTrainingDays} planned sessions`
                  : "No training days scheduled"}
              </p>
            </div>
            <span className="text-sm font-bold text-primary">
              {plannedTrainingDays ? `${weeklyPercent}%` : "—"}
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="Weekly scheduled sessions completed"
            aria-valuemin={0}
            aria-valuemax={plannedTrainingDays || 1}
            aria-valuenow={Math.min(sessionsThisWeek, plannedTrainingDays)}
          >
            <span
              className="block h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-[width] duration-500"
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
            {plannedTrainingDays
              ? "Completed sessions this week compared with the training days in your split."
              : "Add training days to your weekly split to track your schedule here."}
          </p>
        </div>
      </section>

      <div className="mb-2 flex items-end justify-between px-1">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
            Your workspace
          </p>
          <h2 className="mt-1 text-2xl leading-none">Shortcuts</h2>
        </div>
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          Private · on this device
        </span>
      </div>
      <section className="glass mb-5 overflow-hidden rounded-[1.8rem]">
        <Shortcut
          to="/progress"
          icon={BarChart3}
          title="Progress & analytics"
          detail="Review lifts, volume and trends"
        />
        <Shortcut
          to="/plan"
          icon={Activity}
          title="Training split"
          detail="Adjust your weekly workout plan"
        />
        <Shortcut
          to="/calendar"
          icon={CalendarDays}
          title="Week overview"
          detail="See scheduled training and recovery"
          last
        />
      </section>

      <ProgressPhotoGallery />

      <section className="glass mb-5 rounded-[1.8rem] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Your training data stays yours</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              PRIME works offline. Profile details, workout history and analytics are stored on this
              device. Export a backup before changing phones or reinstalling.
            </p>
          </div>
          <WifiOff className="mt-1 h-4 w-4 shrink-0 text-primary/65" />
        </div>
      </section>

      <div className="mb-2 px-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
          Data controls
        </p>
        <h2 className="mt-1 text-2xl leading-none">Backup & restore</h2>
      </div>
      <section className="glass mb-5 rounded-[1.8rem] p-4 sm:p-5">
        <button
          type="button"
          onClick={exportData}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_10px_26px_-17px_color-mix(in_oklab,var(--primary)_80%,transparent)] transition-transform active:scale-[.99]"
        >
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Export full backup
          </span>
          <ArrowDownToLine className="h-4 w-4" />
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/16 bg-primary/[0.045] px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary/10"
          >
            <Table2 className="h-4 w-4" /> CSV training log
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/16 bg-primary/[0.045] px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary/10">
            <FileUp className="h-4 w-4" /> Restore backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={importData}
              className="sr-only"
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          if (
            !window.confirm(
              "Reset all PRIME data on this device? Export a backup first if you may need it.",
            )
          )
            return;
          reset();
          toast.success("Data reset to default split");
        }}
        className="mb-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/15 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset all data
      </button>
    </AppShell>
  );
}

function QuickStat({
  icon: Icon,
  value,
  label,
  suffix = "",
}: {
  icon: typeof Activity;
  value: string | number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center px-1 text-center">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-2xl leading-none display">
        {value}
        <span className="ml-0.5 text-xs font-semibold text-muted-foreground">{suffix}</span>
      </p>
      <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[9px]">
        {label}
      </p>
    </div>
  );
}

function Shortcut({
  to,
  icon: Icon,
  title,
  detail,
  last = false,
}: {
  to: string;
  icon: typeof Activity;
  title: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex min-h-[4.5rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/[0.035] ${last ? "" : "border-b border-border/55"}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/[0.075] text-primary transition-transform group-hover:scale-105">
        <Icon className="h-[1.15rem] w-[1.15rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-[10px] text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
