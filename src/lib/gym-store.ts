/**
 * PRIME local storage engine — fully offline.
 * Everything the app knows lives in the browser's localStorage.
 */

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weight: number;
};

export type DaySplit = {
  name: string;
  focus: string;
  rest: boolean;
  exercises: Exercise[];
};

export type LoggedSet = { reps: number; weight: number; done: boolean };

export type Session = {
  id: string;
  date: string; // yyyy-mm-dd
  dayIndex: number;
  splitName: string;
  durationMin: number;
  volume: number;
  exercises: { name: string; muscle?: string; sets: LoggedSet[] }[];
};

export type CustomExercise = { id: string; name: string; muscle: string; equipment: string };

export type WeightEntry = { date: string; weight: number };

export type ActiveSession = {
  startTime: number;
  dayIndex: number;
  splitName: string;
  currentExerciseIndex: number;
  log: Record<string, LoggedSet[]>;
  restEndsAt: number | null;
};

export type GymData = {
  profile: { name: string; goal: string; weight: number };
  plan: DaySplit[]; // index 0 = Sunday .. 6 = Saturday
  sessions: Session[];
  custom: CustomExercise[];
  weightHistory: WeightEntry[];
  activeSession?: ActiveSession;
};

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const KEY = "ironpride.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

const ex = (
  name: string,
  muscle: string,
  sets: number,
  reps: number,
  weight: number,
): Exercise => ({
  id: uid(),
  name,
  muscle,
  sets,
  reps,
  weight,
});

export function defaultData(): GymData {
  return {
    profile: { name: "Athlete", goal: "Build Lean Muscle", weight: 68.5 },
    weightHistory: [],
    plan: [
      { name: "Rest Day", focus: "Recovery", rest: true, exercises: [] },
      {
        name: "Push Day",
        focus: "Chest · Shoulders · Triceps",
        rest: false,
        exercises: [
          ex("Bench Press", "Chest", 4, 10, 60),
          ex("Incline Dumbbell Press", "Chest", 3, 12, 22),
          ex("Overhead Press", "Shoulders", 4, 8, 35),
          ex("Cable Fly", "Chest", 3, 15, 15),
          ex("Triceps Pushdown", "Triceps", 3, 12, 25),
        ],
      },
      {
        name: "Pull Day",
        focus: "Back · Biceps",
        rest: false,
        exercises: [
          ex("Deadlift", "Back", 4, 6, 100),
          ex("Pull Up", "Back", 4, 8, 0),
          ex("Barbell Row", "Back", 4, 10, 55),
          ex("Barbell Curl", "Biceps", 3, 12, 25),
        ],
      },
      {
        name: "Leg Day",
        focus: "Quads · Hamstrings · Calves",
        rest: false,
        exercises: [
          ex("Back Squat", "Quads", 5, 8, 90),
          ex("Romanian Deadlift", "Hamstrings", 4, 10, 70),
          ex("Leg Press", "Quads", 3, 12, 140),
          ex("Standing Calf Raise", "Calves", 4, 15, 60),
        ],
      },
      {
        name: "Arms + Shoulders",
        focus: "Shoulders · Biceps · Triceps",
        rest: false,
        exercises: [
          ex("Incline Bench Press", "Chest", 4, 10, 50),
          ex("Lat Pulldown", "Back", 4, 12, 55),
          ex("Lateral Raise", "Shoulders", 3, 15, 10),
          ex("Hammer Curl", "Biceps", 3, 12, 14),
        ],
      },
      {
        name: "Power & Core",
        focus: "Full Body · Core",
        rest: false,
        exercises: [
          ex("Clean & Press", "Full Body", 4, 6, 45),
          ex("Weighted Plank", "Core", 3, 60, 10),
          ex("Hanging Leg Raise", "Core", 3, 15, 0),
          ex("Farmer Carry", "Full Body", 3, 40, 30),
        ],
      },
      { name: "Rest Day", focus: "Active Recovery · Mobility", rest: true, exercises: [] },
    ],
    sessions: [],
    custom: [],
  };
}

export function loadData(): GymData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as GymData;
    if (!parsed?.plan || parsed.plan.length !== 7) return defaultData();
    return { ...defaultData(), ...parsed };
  } catch {
    return defaultData();
  }
}

export function saveData(data: GymData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export const todayISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function computeStreak(sessions: Session[], plan: DaySplit[] = []): number {
  const days = new Set(sessions.map((session) => session.date));
  const isPlannedRest = (date: Date) => plan[date.getDay()]?.rest === true;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  // A scheduled rest day is a neutral day, not a broken training streak.
  // A planned training day with no completed session still ends the streak.
  if (!days.has(todayISO(cursor)) && !isPlannedRest(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  // The limit also protects malformed plans that mark every weekday as rest.
  for (let checked = 0; checked < 366; checked += 1) {
    const day = todayISO(cursor);
    if (days.has(day)) {
      streak += 1;
    } else if (!isPlannedRest(cursor)) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function weekVolume(sessions: Session[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return sessions
    .filter((s) => new Date(s.date) >= new Date(todayISO(start)))
    .reduce((sum, s) => sum + s.volume, 0);
}

/** Total minutes trained since Sunday of the current week. */
export function weekMinutes(sessions: Session[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return sessions
    .filter((s) => new Date(s.date) >= new Date(todayISO(start)))
    .reduce((sum, s) => sum + s.durationMin, 0);
}

export const formatMinutes = (mins: number) =>
  mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;

export type WeekPoint = { weekStart: string; weekLabel: string; volume: number; workouts: number };

/** Buckets sessions into calendar weeks (Sun-Sat), oldest to newest. */
export function weeklySeries(sessions: Session[], weeksCount = 6): WeekPoint[] {
  const startOfWeek = (d: Date) => {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() - s.getDay());
    return s;
  };
  const thisWeekStart = startOfWeek(new Date());
  const weeks: WeekPoint[] = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const inRange = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= start && d < end;
    });
    weeks.push({
      weekStart: todayISO(start),
      weekLabel: `${start.getDate()} ${start.toLocaleString("en-US", { month: "short" })}`,
      volume: inRange.reduce((sum, s) => sum + s.volume, 0),
      workouts: inRange.length,
    });
  }
  return weeks;
}

/** Real gym plate increments. */
export const WEIGHT_STEPS = [1.25, 2.5, 5, 7.5, 10, 12.5, 20] as const;

export const roundWeight = (w: number) => Math.max(0, Math.round(w * 100) / 100);

export const REST_FALLBACK: DaySplit = {
  name: "Rest Day",
  focus: "Recovery",
  rest: true,
  exercises: [],
};

export const getSplit = (plan: DaySplit[], index: number): DaySplit => {
  const split = plan[index] ?? REST_FALLBACK;
  // Older local data could retain exercises after a day was switched to recovery.
  // Treat every recovery day as an empty movement list everywhere in the app.
  return split.rest ? { ...split, exercises: [] } : split;
};
