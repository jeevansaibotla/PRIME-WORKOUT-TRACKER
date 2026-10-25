import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BarChart3, CalendarDays, Dumbbell, History, Home, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Today", icon: Home },
  { to: "/muscles", label: "Stats", icon: Activity },
  { to: "/plan", label: "Plan", icon: Layers },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/history", label: "History", icon: History },
  { to: "/exercises", label: "Library", icon: Dumbbell },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="cinematic-stage relative min-h-[100svh] min-h-[100dvh] overflow-x-hidden bg-background">
      <div className="cinematic-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[30rem]" aria-hidden>
        <div className="aurora-field" />
        <div className="aurora-grid" />
        <span className="aurora-spark aurora-spark-one" />
        <span className="aurora-spark aurora-spark-two" />
        <span className="aurora-spark aurora-spark-three" />
      </div>

      <div className="app-content-width mobile-compact-x relative mx-auto w-full px-5 pb-[calc(7.25rem+var(--safe-bottom))] pt-[max(1.5rem,calc(var(--safe-top)+1rem))]">
        <div className="prime-header-row mb-5 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground/85">
          <span className="prime-header-brand flex items-center gap-2">
            <span className="prime-header-dot h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            PRIME / COMMAND
          </span>
          <span className="prime-header-status">OFFLINE CORE</span>
        </div>
        <main className="scene-shell">{children}</main>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto w-full max-w-2xl px-3 pb-2 sm:px-4">
          <div className="prime-nav-shell glass cinematic-chip mobile-scroll-x flex items-center justify-between gap-0.5 overflow-x-auto rounded-[2rem] px-1.5 py-2 shadow-[0_18px_55px_-24px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
            {items.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "prime-nav-item mobile-tap-target relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold tracking-tight transition-all duration-300",
                    active
                      ? "is-active bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground active:scale-95",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-x-4 -top-1 h-0.5 rounded-full bg-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_70%,transparent)]" />
                  ) : null}
                  <Icon
                    className={cn(
                      "prime-nav-icon h-5 w-5 transition-transform",
                      active && "scale-110 text-glow",
                    )}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  <span className="w-full truncate text-center">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="scene-header mb-6 flex items-end justify-between rise">
      <div>
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-primary">
          Performance workspace
        </p>
        <h1 className="text-4xl leading-none">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right}
      <div className="cinematic-divider absolute -bottom-4 left-0 right-0" aria-hidden />
    </header>
  );
}
