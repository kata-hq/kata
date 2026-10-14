// Test data shared by the parser's tests: the courses and task types of a typical Licence student.
// The task types follow the spec's rule C3 and K-R5 (real values are seeded by the work module).
import type { CaptureContext, CourseCandidate, TaskTypeCandidate } from "../types.ts";

/** Wednesday 14 October 2026, 09:00 in Paris. */
export const REFERENCE = "2026-10-14T07:00:00Z";

export const TASK_TYPES: readonly TaskTypeCandidate[] = [
  { key: "homework", label: "DM", aliases: ["dm", "devoir", "devoir maison"] },
  { key: "lab_report", label: "Compte rendu de TP", aliases: ["tp", "compte rendu"] },
  { key: "presentation", label: "Exposé", aliases: ["exposé", "oral", "présentation"] },
  { key: "reading", label: "Lecture", aliases: ["lire", "lecture"] },
  { key: "revision", label: "Révision", aliases: ["réviser", "révision"] },
  { key: "exam", label: "Examen", aliases: ["cc", "partiel", "exam", "examen"] },
];

export const COURSES: readonly CourseCandidate[] = [
  { id: "compta", name: "Comptabilité générale", shortName: "Compta", aliases: [] },
  { id: "eco", name: "Microéconomie", shortName: "Micro", aliases: ["éco", "eco"] },
  { id: "droit", name: "Droit des contrats", shortName: null, aliases: ["contrats"] },
  { id: "stats", name: "Statistiques descriptives", shortName: "Stats", aliases: [] },
  { id: "anglais", name: "Anglais", shortName: null, aliases: ["english"] },
  { id: "marketing", name: "Marketing fondamental", shortName: "Marketing", aliases: [] },
  { id: "management", name: "Management des organisations", shortName: "Management", aliases: [] },
];

export function context(overrides: Partial<CaptureContext> = {}): CaptureContext {
  return {
    reference: REFERENCE,
    timeZone: "Europe/Paris",
    courses: COURSES,
    taskTypes: TASK_TYPES,
    ...overrides,
  };
}
