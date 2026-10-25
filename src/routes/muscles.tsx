import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MuscleBalance } from "@/components/MuscleBalance";
import { useGym } from "@/hooks/use-gym";

export const Route = createFileRoute("/muscles")({
  head: () => ({
    meta: [
      { title: "Stats — PRIME" },
      {
        name: "description",
        content: "Whole-body training heat and approximate soreness in PRIME.",
      },
    ],
  }),
  component: MuscleBalancePage,
});

function MuscleBalancePage() {
  const { data } = useGym();
  return (
    <AppShell>
      <PageHeader
        title="Stats"
        subtitle="muscle balance · fatigue · strength"
        right={<Activity className="h-5 w-5 text-primary" />}
      />
      <MuscleBalance
        sessions={data.sessions}
        exerciseNames={[
          ...data.plan.flatMap((split) => split.exercises.map((exercise) => exercise.name)),
          ...data.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name)),
          ...(data.custom ?? []).map((exercise) => exercise.name),
        ].filter((name, index, names) => names.indexOf(name) === index)}
      />
    </AppShell>
  );
}
