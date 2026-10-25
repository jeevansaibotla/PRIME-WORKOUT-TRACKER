export type OpenExercise = {
  id: string;
  name: string;
  bodyPart?: string;
  equipment?: string;
  target?: string;
  secondaryMuscles?: string[];
  category?: string;
  description?: string;
  instructions?: string[];
  textSource?: string;
};
let cataloguePromise: Promise<OpenExercise[]> | null = null;
/** Load the bundled offline catalogue only on screens that need it. */
export function loadOpenGymCatalogue(): Promise<OpenExercise[]> {
  if (!cataloguePromise)
    cataloguePromise = fetch("/open-gym-exercises.json")
      .then((response) => {
        if (!response.ok) throw new Error("Exercise catalogue could not be loaded");
        return response.json() as Promise<OpenExercise[]>;
      })
      .catch((error) => {
        cataloguePromise = null;
        throw error;
      });
  return cataloguePromise;
}
