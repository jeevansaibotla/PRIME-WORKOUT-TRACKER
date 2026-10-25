import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { useGym } from "@/hooks/use-gym";
import { MUSCLE_GROUPS } from "@/lib/exercise-library";
import { loadOpenGymCatalogue, type OpenExercise } from "@/lib/opengym-catalogue";
import { toast } from "sonner";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "Exercise Library — PRIME" },
      {
        name: "description",
        content:
          "Search 5,600+ strength, mobility, cardio and rehabilitation movements with coaching instructions.",
      },
    ],
  }),
  component: ExercisesPage,
});

type CatalogItem = {
  id?: string;
  name: string;
  muscle: string;
  equipment: string;
  custom?: boolean;
  details?: OpenExercise;
};
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const aliases: Record<string, string> = {
  pecs: "chest",
  pectorals: "chest",
  lats: "back",
  delts: "shoulders",
  abs: "core",
  abdominals: "core",
  dumbbells: "dumbbell",
  barbells: "barbell",
  bodyweight: "body weight",
};

function muscleLabel(exercise: OpenExercise) {
  const target = fold(exercise.target || "");
  if (/quad|thigh/.test(target)) return "Quads";
  if (/glute/.test(target)) return "Glutes";
  if (/hamstring/.test(target)) return "Hamstrings";
  if (/calf|soleus/.test(target)) return "Calves";
  if (/bicep/.test(target)) return "Biceps";
  if (/tricep/.test(target)) return "Triceps";
  if (/delt|shoulder/.test(target)) return "Shoulders";
  if (/pect|chest/.test(target)) return "Chest";
  if (/lat|back|rhomboid|trapezius|spine/.test(target)) return "Back";
  if (/abs|oblique|core/.test(target)) return "Core";
  const part = fold(exercise.bodyPart || "");
  if (part.includes("chest")) return "Chest";
  if (part.includes("shoulder")) return "Shoulders";
  if (part.includes("back")) return "Back";
  if (part.includes("leg")) return /ham/.test(target) ? "Hamstrings" : "Quads";
  if (part.includes("waist")) return "Core";
  return exercise.category === "cardio" ? "Cardio" : "Full Body";
}

function score(item: CatalogItem, query: string) {
  const tokens = fold(query)
    .split(/\s+/)
    .map((token) => aliases[token] || token)
    .filter(Boolean);
  if (!tokens.length) return 1;
  const name = fold(item.name);
  const text = fold(
    `${item.name} ${item.muscle} ${item.equipment} ${item.details?.category || ""} ${item.details?.target || ""} ${(item.details?.secondaryMuscles || []).join(" ")} ${item.details?.description || ""}`,
  );
  if (!tokens.every((token) => text.includes(token))) return -1;
  return tokens.reduce(
    (total, token) =>
      total + (name === token ? 12 : name.startsWith(token) ? 8 : name.includes(token) ? 5 : 1),
    0,
  );
}

function ExercisesPage() {
  const { data, addCustomExercise, removeCustomExercise } = useGym();
  const [db, setDb] = useState<OpenExercise[]>([]);
  const [catalogueError, setCatalogueError] = useState(false);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [category, setCategory] = useState("All types");
  const [selected, setSelected] = useState<OpenExercise | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("Chest");
  const [equipment, setEquipment] = useState("Barbell");

  useEffect(() => {
    let live = true;
    void loadOpenGymCatalogue()
      .then((items) => {
        if (live) setDb(items);
      })
      .catch(() => {
        if (live) setCatalogueError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const catalog = useMemo<CatalogItem[]>(
    () => [
      ...db.map((item) => ({
        id: item.id,
        name: item.name,
        muscle: muscleLabel(item),
        equipment: item.equipment || "Other",
        details: item,
      })),
      ...(data.custom ?? []).map((item) => ({
        name: item.name,
        muscle: item.muscle,
        equipment: item.equipment,
        custom: true,
        id: item.id,
      })),
    ],
    [data.custom, db],
  );
  const categories = useMemo(
    () => [
      "All types",
      ...Array.from(new Set(db.map((item) => item.category).filter(Boolean) as string[])).sort(),
    ],
    [db],
  );
  const ranked = useMemo(
    () =>
      catalog
        .map((item) => ({ item, score: score(item, query) }))
        .filter(
          (result) =>
            result.score >= 0 &&
            (!muscle || result.item.muscle === muscle) &&
            (category === "All types" || result.item.details?.category === category),
        )
        .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)),
    [catalog, category, muscle, query],
  );
  const results = ranked.slice(0, 80);
  const saveCustom = () => {
    if (!name.trim()) {
      toast.error("Name your movement first");
      return;
    }
    addCustomExercise({
      name: name.trim(),
      muscle: primary,
      equipment: equipment.trim() || "Other",
    });
    setName("");
    setShowForm(false);
    toast.success("Custom movement saved offline");
  };

  return (
    <AppShell>
      <PageHeader
        title="Exercises"
        subtitle={`${catalog.length.toLocaleString()} movements · offline library`}
      />
      <div className="glass mb-3 flex items-center gap-3 rounded-2xl px-4 py-3 rise">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercise, muscle, equipment, instructions…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-xs text-primary">
            Clear
          </button>
        )}
      </div>
      <p className="mb-3 text-[10px] text-muted-foreground">
        {catalogueError
          ? "The offline movement catalogue did not load. Reload this screen to retry."
          : db.length
            ? `Search understands aliases and descriptions. Showing ${results.length} of ${ranked.length.toLocaleString()} matches.`
            : "Loading the offline movement catalogue…"}
      </p>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {[null, ...MUSCLE_GROUPS].map((item) => (
          <button
            key={item ?? "all"}
            onClick={() => setMuscle(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-all ${muscle === item ? "crimson-fill text-primary-foreground glow-red" : "bg-secondary text-muted-foreground"}`}
          >
            {item ?? "All muscles"}
          </button>
        ))}
      </div>
      <label className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        Movement type{" "}
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2 text-foreground"
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <button
        onClick={() => setShowForm((value) => !value)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3 text-[11px] font-bold uppercase tracking-widest text-primary"
      >
        <Plus className="h-4 w-4" /> Add custom movement
      </button>
      {showForm && (
        <section className="glass mb-5 space-y-3 rounded-3xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Custom metadata
          </p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Movement name"
            className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
              className="rounded-2xl bg-secondary px-3 py-3 text-sm outline-none"
            >
              {[...MUSCLE_GROUPS, "Full Body", "Core"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              value={equipment}
              onChange={(event) => setEquipment(event.target.value)}
              placeholder="Equipment"
              className="rounded-2xl bg-secondary px-3 py-3 text-sm outline-none"
            />
          </div>
          <button
            onClick={saveCustom}
            className="w-full rounded-2xl crimson-fill py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Save movement
          </button>
        </section>
      )}
      {selected && (
        <section className="glass-red mb-4 overflow-hidden rounded-3xl p-4 rise" key={selected.id}>
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
                Guided movement · {selected.category || "custom"}
              </p>
              <h2 className="mt-1 text-xl leading-tight">{selected.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.target || muscleLabel(selected)} · {selected.equipment || "No equipment"}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close guide"
              className="rounded-full p-1 text-muted-foreground"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {selected.description ||
              "Use a controlled range of motion and stop if you feel sharp pain."}
          </p>
          <ExerciseAnimation name={selected.name} />
          {selected.instructions?.length ? (
            <div className="mt-3 rounded-2xl bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
                  Step {Math.min(guideStep + 1, selected.instructions.length)} of{" "}
                  {selected.instructions.length}
                </span>
                <span className="text-[9px] text-muted-foreground">Follow at your own pace</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((guideStep + 1) / selected.instructions.length) * 100}%` }}
                />
              </div>
              <p className="mt-3 min-h-12 text-sm leading-relaxed">
                {selected.instructions[guideStep] || selected.instructions[0]}
              </p>
              <div className="mt-3 flex justify-between">
                <button
                  onClick={() => setGuideStep((step) => Math.max(0, step - 1))}
                  disabled={!guideStep}
                  className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => setGuideStep((step) => (step + 1) % selected.instructions!.length)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Next step
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No step-by-step instructions are available for this movement.
            </p>
          )}
          <p className="mt-3 text-[9px] text-muted-foreground">
            Movement text: OpenGym catalogue. Illustrations: Workout Guide by Bryl Lim and
            Everkinetic, CC BY-SA 4.0. See bundled attribution and licence.
          </p>
        </section>
      )}
      <div className="space-y-2.5">
        {results.map(({ item }) => (
          <div
            key={`${item.custom ? "custom" : "library"}-${item.id ?? item.name}`}
            className="glass flex items-center gap-3 rounded-2xl p-4"
          >
            <button
              type="button"
              onClick={() => {
                setSelected(item.details ?? null);
                setGuideStep(0);
              }}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Dumbbell className="h-4 w-4" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.muscle} · {item.equipment}
                  {item.details?.category ? ` · ${item.details.category}` : ""}
                  {item.custom ? " · Custom" : ""}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            {item.custom && (
              <button
                onClick={() => removeCustomExercise(item.id!)}
                className="rounded-xl p-2 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {ranked.length > 80 && (
          <p className="rounded-xl bg-secondary/50 p-3 text-center text-xs text-muted-foreground">
            Refine your search to narrow the remaining {ranked.length - 80} results.
          </p>
        )}
        {results.length === 0 && (
          <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
            No movements match those filters.
          </p>
        )}
      </div>
    </AppShell>
  );
}
