import type { DaySplit, GymData, Session } from "@/lib/gym-store";

export type MuscleKey =
  | "trapezius" | "deltoids" | "chest" | "upper-back" | "serratus" | "biceps" | "triceps" | "forearm"
  | "abs" | "obliques" | "lower-back" | "gluteal" | "quadriceps" | "hamstring" | "adductors" | "hip-flexors" | "calves" | "tibialis";

export const MUSCLE_KEYS: MuscleKey[] = ["trapezius", "deltoids", "chest", "upper-back", "serratus", "biceps", "triceps", "forearm", "abs", "obliques", "lower-back", "gluteal", "quadriceps", "hamstring", "adductors", "hip-flexors", "calves", "tibialis"];
export const MUSCLE_LABELS: Record<MuscleKey, string> = { trapezius: "Traps", deltoids: "Shoulders", chest: "Chest", "upper-back": "Upper back", serratus: "Serratus", biceps: "Biceps", triceps: "Triceps", forearm: "Forearms", abs: "Abs", obliques: "Obliques", "lower-back": "Lower back", gluteal: "Glutes", quadriceps: "Quads", hamstring: "Hamstrings", adductors: "Adductors", "hip-flexors": "Hip flexors", calves: "Calves", tibialis: "Shins" };
const ALIAS: Record<string, MuscleKey> = { chest: "chest", pectorals: "chest", shoulders: "deltoids", shoulder: "deltoids", delts: "deltoids", deltoids: "deltoids", back: "upper-back", lats: "upper-back", "upper back": "upper-back", traps: "trapezius", trapezius: "trapezius", biceps: "biceps", triceps: "triceps", forearms: "forearm", forearm: "forearm", core: "abs", abs: "abs", abdominals: "abs", obliques: "obliques", "lower back": "lower-back", glutes: "gluteal", gluteal: "gluteal", quads: "quadriceps", quadriceps: "quadriceps", legs: "quadriceps", hamstrings: "hamstring", hamstring: "hamstring", adductors: "adductors", "hip flexors": "hip-flexors", calves: "calves", tibialis: "tibialis", shins: "tibialis" };
const BODY_PART: Record<string, Partial<Record<MuscleKey, number>>> = { chest: { chest: 1 }, back: { "upper-back": .75, "lower-back": .25 }, shoulders: { deltoids: 1 }, "upper arms": { biceps: .5, triceps: .5 }, "lower arms": { forearm: 1 }, waist: { abs: .7, obliques: .3 }, "upper legs": { quadriceps: .4, hamstring: .35, gluteal: .25 }, "lower legs": { calves: .8, tibialis: .2 }, "full body": { chest: .2, "upper-back": .2, gluteal: .2, quadriceps: .2, hamstring: .1, abs: .1 } };

export const canonicalMuscle = (value: string | undefined): MuscleKey | null => ALIAS[String(value ?? "").toLowerCase().trim()] ?? null;

export function weightsForExercise(exercise: { name: string; muscle?: string }): Partial<Record<MuscleKey, number>> {
  const text = `${exercise.muscle ?? ""} ${exercise.name}`.toLowerCase();
  const weights: Partial<Record<MuscleKey, number>> = {};
  const add = (key: MuscleKey, value: number) => { weights[key] = Math.max(weights[key] ?? 0, value); };
  const direct = canonicalMuscle(exercise.muscle);
  if (direct) add(direct, 1);
  if (/bench|fly|pec|push.?up/.test(text)) add("chest", 1);
  if (/row|pull|lat|deadlift|pulldown/.test(text)) add("upper-back", .8);
  if (/press|lateral|raise|clean/.test(text)) add("deltoids", .8);
  if (/curl|bicep|hammer/.test(text)) add("biceps", 1);
  if (/tricep|pushdown|dip/.test(text)) add("triceps", 1);
  if (/squat|leg press|quad|lunge/.test(text)) add("quadriceps", 1);
  if (/romanian|hamstring|leg curl/.test(text)) add("hamstring", 1);
  if (/glute|hip thrust/.test(text)) add("gluteal", 1);
  if (/calf/.test(text)) add("calves", 1);
  if (/plank|core|ab|leg raise|carry/.test(text)) add("abs", 1);
  if (!Object.keys(weights).length) Object.assign(weights, BODY_PART[String(exercise.muscle ?? "").toLowerCase()] ?? { abs: 1 });
  const total = Object.values(weights).reduce((sum, value) => sum + (value ?? 0), 0) || 1;
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, (value ?? 0) / total])) as Partial<Record<MuscleKey, number>>;
}

export function effectiveSets(session: Session): number { return session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.done).length, 0); }
export function sessionLoad(session: Session) { const load: Partial<Record<MuscleKey, number>> = {}; session.exercises.forEach((exercise) => { const sets = exercise.sets.filter((set) => set.done).length; if (!sets) return; Object.entries(weightsForExercise(exercise)).forEach(([key, weight]) => { const muscle = key as MuscleKey; load[muscle] = (load[muscle] ?? 0) + sets * (weight ?? 0); }); }); return load; }

export type MuscleInsight = { key: MuscleKey; label: string; sets: number; lastTrained: string | null; daysSince: number | null; state: "Fresh" | "Working" | "Loaded" | "Neglected"; soreness: number; trend: "up" | "steady" | "down" };
const daysBetween = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86400000));
export function muscleInsights(sessions: Session[], rangeDays: number | null = 30): MuscleInsight[] {
  const cutoff = rangeDays == null ? 0 : Date.now() - rangeDays * 86400000;
  const filtered = sessions.filter((session) => new Date(`${session.date}T12:00:00`).getTime() >= cutoff);
  const current: Partial<Record<MuscleKey, number>> = {}; const previous: Partial<Record<MuscleKey, number>> = {}; const latest: Partial<Record<MuscleKey, string>> = {};
  filtered.forEach((session) => { const target = new Date(`${session.date}T12:00:00`).getTime() >= Date.now() - Math.min(rangeDays ?? 30, 14) * 86400000 ? current : previous; Object.entries(sessionLoad(session)).forEach(([key, value]) => { const muscle = key as MuscleKey; target[muscle] = (target[muscle] ?? 0) + (value ?? 0); if (!latest[muscle] || session.date > latest[muscle]!) latest[muscle] = session.date; }); });
  return MUSCLE_KEYS.map((key) => { const sets = Math.round((current[key] ?? 0) * 10) / 10; const last = latest[key] ?? null; const days = last ? daysBetween(last) : null; const soreness = Math.min(100, Math.round(sets * 16 + (days != null && days < 3 ? (3 - days) * 12 : 0))); const state: MuscleInsight["state"] = !last || (days != null && days > 10) ? "Neglected" : soreness >= 70 ? "Loaded" : soreness >= 28 ? "Working" : "Fresh"; const before = previous[key] ?? 0; return { key, label: MUSCLE_LABELS[key], sets: Math.round(sets), lastTrained: last, daysSince: days, state, soreness, trend: sets > before * 1.1 ? "up" : sets < before * .8 ? "down" : "steady" }; });
}

export function exerciseHistory(sessions: Session[], name: string) { return sessions.filter((session) => session.exercises.some((exercise) => exercise.name === name)).sort((a, b) => b.date.localeCompare(a.date)).map((session) => { const exercise = session.exercises.find((item) => item.name === name)!; const done = exercise.sets.filter((set) => set.done); return { date: session.date, bestWeight: Math.max(0, ...done.map((set) => set.weight)), bestReps: Math.max(0, ...done.map((set) => set.reps)), volume: done.reduce((sum, set) => sum + set.reps * set.weight, 0), sets: done.length }; }); }
export function weeklyAnalytics(sessions: Session[], count = 8) { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay()); return Array.from({ length: count }, (_, index) => { const weekStart = new Date(start); weekStart.setDate(start.getDate() - (count - index - 1) * 7); const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7); const inWeek = sessions.filter((session) => { const date = new Date(`${session.date}T12:00:00`); return date >= weekStart && date < weekEnd; }); return { label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }), workouts: inWeek.length, sets: inWeek.reduce((sum, session) => sum + effectiveSets(session), 0), volume: Math.round(inWeek.reduce((sum, session) => sum + session.volume, 0)) }; }); }
export function planningFeedback(plan: DaySplit[], sessions: Session[]) { const insights = muscleInsights(sessions, 14); const recent = new Set(insights.filter((item) => item.daysSince != null && item.daysSince < 2).map((item) => item.key)); return plan.map((day, index) => { const planned = new Set(day.exercises.flatMap((exercise) => Object.keys(weightsForExercise(exercise)) as MuscleKey[])); const overlap = [...planned].filter((key) => recent.has(key)); return { index, name: day.name, overlap: overlap.map((key) => MUSCLE_LABELS[key]), message: day.rest ? "Recovery buffer" : overlap.length ? `Overlap: ${overlap.map((key) => MUSCLE_LABELS[key]).join(", ")}` : "Ready to train" }; }); }

export function dataToCsv(data: GymData) { const rows = [["date", "workout", "exercise", "muscle", "set", "reps", "weight", "done"]]; data.sessions.forEach((session) => session.exercises.forEach((exercise) => exercise.sets.forEach((set, index) => rows.push([session.date, session.splitName, exercise.name, exercise.muscle ?? "", String(index + 1), String(set.reps), String(set.weight), String(set.done)])))); return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n"); }
export function downloadText(filename: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
