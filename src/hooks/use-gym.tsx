import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultData,
  loadData,
  saveData,
  uid,
  type ActiveSession,
  type CustomExercise,
  type DaySplit,
  type Exercise,
  type GymData,
  type Session,
  type WeightEntry,
} from "@/lib/gym-store";

type Ctx = {
  data: GymData;
  hydrated: boolean;
  updatePlan: (dayIndex: number, split: DaySplit) => void;
  savePlan: (plan: DaySplit[]) => void;
  addSession: (session: Session) => void;
  updateProfile: (patch: Partial<GymData["profile"]>) => void;
  addWeightEntry: (entry: WeightEntry) => void;
  removeWeightEntry: (date: string) => void;
  addCustomExercise: (ex: Omit<CustomExercise, "id">) => void;
  removeCustomExercise: (id: string) => void;
  startWorkout: (dayIndex: number, splitName: string, exercises: Exercise[]) => void;
  updateActiveSession: (patch: Partial<ActiveSession>) => void;
  finishWorkout: (session: Session) => void;
  cancelWorkout: () => void;
  replaceData: (data: GymData) => void;
  reset: () => void;
};

const GymContext = createContext<Ctx | null>(null);

function clearActiveSession(current: GymData): GymData {
  const next = { ...current };
  delete next.activeSession;
  return next;
}

export function GymProvider({ children }: { children: React.ReactNode }) {
  // The local store is tiny and synchronous. Loading it during initial state
  // removes the blank first frame that made startup feel delayed on Android.
  const [data, setData] = useState<GymData>(() => loadData());
  const hydrated = true;

  // Accepts either a full next-state object OR an updater function that
  // receives the latest state. The updater form must be used whenever two
  // updates can happen back-to-back in the same tick (e.g. marking a set
  // done immediately starts the rest timer) — otherwise the second update
  // spreads from a stale `data` closure and silently discards the first
  // one. That was the cause of the "done" tick / % complete not sticking.
  const persist = useCallback((next: GymData | ((prev: GymData) => GymData)) => {
    setData((prev) => {
      const resolved = typeof next === "function" ? (next as (prev: GymData) => GymData)(prev) : next;
      saveData(resolved);
      return resolved;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      hydrated,
      updatePlan: (dayIndex, split) =>
        persist({ ...data, plan: data.plan.map((d, i) => (i === dayIndex ? split : d)) }),
      savePlan: (plan) => persist({ ...data, plan }),
      addSession: (session) => persist({ ...data, sessions: [session, ...data.sessions] }),
      updateProfile: (patch) => persist({ ...data, profile: { ...data.profile, ...patch } }),
      addWeightEntry: (entry) =>
        persist({
          ...data,
          profile: { ...data.profile, weight: entry.weight },
          weightHistory: [entry, ...(data.weightHistory ?? [])].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        }),
      removeWeightEntry: (date) =>
        persist({
          ...data,
          weightHistory: (data.weightHistory ?? []).filter((w) => w.date !== date),
        }),
      addCustomExercise: (ex) =>
        persist({ ...data, custom: [{ ...ex, id: uid() }, ...(data.custom ?? [])] }),
      removeCustomExercise: (id) =>
        persist({ ...data, custom: (data.custom ?? []).filter((c) => c.id !== id) }),
      startWorkout: (dayIndex, splitName, exercises) =>
        persist({
          ...data,
          activeSession: {
            startTime: Date.now(),
            dayIndex,
            splitName,
            currentExerciseIndex: 0,
            log: Object.fromEntries(
              exercises.map((e) => [
                e.id,
                Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: 0, done: false })),
              ]),
            ),
            restEndsAt: null,
          },
        }),
      updateActiveSession: (patch) =>
        persist((prev) => {
          if (!prev.activeSession) return clearActiveSession(prev);
          return { ...prev, activeSession: { ...prev.activeSession, ...patch } };
        }),
      finishWorkout: (session) =>
        persist((prev) => ({
          ...clearActiveSession(prev),
          sessions: [session, ...prev.sessions],
        })),
      cancelWorkout: () => persist((prev) => clearActiveSession(prev)),
      replaceData: (next) => persist({ ...defaultData(), ...next, profile: { ...defaultData().profile, ...(next.profile ?? {}) }, plan: next.plan?.length === 7 ? next.plan : defaultData().plan, sessions: Array.isArray(next.sessions) ? next.sessions : [], custom: Array.isArray(next.custom) ? next.custom : [], weightHistory: Array.isArray(next.weightHistory) ? next.weightHistory : [] }),
      reset: () => persist(defaultData()),
    }),
    [data, hydrated, persist],
  );

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}


export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used inside GymProvider");
  return ctx;
}
