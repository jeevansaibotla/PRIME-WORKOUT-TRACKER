import animationIndex from "@/lib/exercise-animation-index.json";

type AnimationEntry = {
  slug: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  frames: number;
};
const entries = animationIndex as AnimationEntry[];

function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchAnimation(name: string) {
  const key = normalized(name);
  const direct = entries.find((item) => normalized(item.name) === key);
  if (direct) return direct;
  const withoutEquipment = key.replace(
    /^(barbell|dumbbell|machine|cable|smith machine|ez barbell|weighted) /,
    "",
  );
  return entries.find((item) => normalized(item.name) === withoutEquipment);
}

export function ExerciseAnimation({ name, compact = false }: { name: string; compact?: boolean }) {
  const exercise = matchAnimation(name);
  if (!exercise) {
    return (
      <div
        className={`exercise-animation-unavailable ${compact ? "is-compact" : ""}`}
        role="status"
      >
        <span className="exercise-animation-symbol" aria-hidden="true">
          ↗
        </span>
        <span>No licensed movement animation is available for this exercise yet.</span>
      </div>
    );
  }

  return (
    <figure className={`exercise-animation ${compact ? "is-compact" : ""}`}>
      <div
        className="exercise-animation-frames"
        role="img"
        aria-label={`Three-frame movement animation for ${exercise.name}`}
      >
        {[1, 2, 3].map((frame) => (
          <img
            key={frame}
            src={`/exercise-guide/${exercise.slug}/frame-${frame}.webp`}
            alt=""
            aria-hidden="true"
            className={`exercise-animation-frame frame-${frame}`}
            loading="lazy"
            decoding="async"
          />
        ))}
        <span className="exercise-animation-orbit" aria-hidden="true" />
      </div>
      <figcaption className="exercise-animation-caption">
        <span>
          {exercise.name} · {exercise.primaryMuscle}
        </span>
        <span className="exercise-animation-attribution">Workout Guide / CC BY-SA 4.0</span>
      </figcaption>
    </figure>
  );
}
