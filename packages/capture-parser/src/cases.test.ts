// Rule C7: the end-to-end case table. Every parsing error found in the beta becomes a row here
// (failing first), then the fix (see docs/testing.md). Reference: Wednesday 14 October 2026, 09:00, Paris.
import { expect, test } from "bun:test";
import { parseCapture } from "./parse.ts";
import { context } from "./testing/context.ts";

type Case = {
  readonly input: string;
  readonly course: string | null;
  readonly type: string | null;
  readonly date: string | null;
  readonly time?: string;
  readonly title: string;
};

const CASES: readonly Case[] = [
  // Journey P3 and the spec's examples.
  { input: "DM compta vendredi", course: "compta", type: "homework", date: "2026-10-16", title: "DM compta" },
  {
    input: "partiel compta 15/11",
    course: "compta",
    type: "exam",
    date: "2026-11-15",
    title: "partiel compta",
  },
  {
    input: "lire chap 3 demain 14h",
    course: null,
    type: "reading",
    date: "2026-10-15",
    time: "14:00",
    title: "chap 3",
  },
  // Everyday lines of a Licence student.
  {
    input: "Exposé marketing mardi prochain",
    course: "marketing",
    type: "presentation",
    date: "2026-10-20",
    title: "Exposé marketing",
  },
  {
    input: "réviser stats pour le 20/10",
    course: "stats",
    type: "revision",
    date: "2026-10-20",
    title: "réviser stats",
  },
  {
    input: "CC micro lundi 8h",
    course: "eco",
    type: "exam",
    date: "2026-10-19",
    time: "08:00",
    title: "CC micro",
  },
  {
    input: "compte rendu TP chimie dans 3 jours",
    course: null,
    type: "lab_report",
    date: "2026-10-17",
    title: "TP chimie",
  },
  {
    input: "Oral anglais semaine prochaine",
    course: "anglais",
    type: "presentation",
    date: "2026-10-19",
    title: "Oral anglais",
  },
  {
    input: "lire articles droit des contrats avant jeudi",
    course: "droit",
    type: "reading",
    date: "2026-10-15",
    title: "articles",
  },
  {
    input: "DM stats exercices 4 à 7 pour après-demain",
    course: "stats",
    type: "homework",
    date: "2026-10-16",
    title: "exercices 4 à 7",
  },
  { input: "rendre DM éco le 2", course: "eco", type: "homework", date: "2026-11-02", title: "rendre" },
  { input: "Réviser les intégrales", course: null, type: "revision", date: null, title: "les intégrales" },
  {
    input: "acheter le polycopié de management",
    course: "management",
    type: null,
    date: null,
    title: "acheter le polycopié",
  },
  {
    input: "exam anglais 12/12/2026 10h",
    course: "anglais",
    type: "exam",
    date: "2026-12-12",
    time: "10:00",
    title: "exam anglais",
  },
  { input: "TD stats demain", course: "stats", type: null, date: "2026-10-15", title: "TD" },
  { input: "lecture chapitre 2 Micro", course: "eco", type: "reading", date: null, title: "chapitre 2" },
  {
    input: "devoir maison compta d'ici vendredi",
    course: "compta",
    type: "homework",
    date: "2026-10-16",
    title: "devoir maison compta",
  },
  {
    input: "préparer exposé marketting jeudi 10h30",
    course: "marketing",
    type: "presentation",
    date: "2026-10-15",
    time: "10:30",
    title: "préparer",
  },
  {
    input: "réviser statistiques dans 2 semaines",
    course: "stats",
    type: "revision",
    date: "2026-10-28",
    title: "réviser statistiques",
  },
  {
    input: "partiel Comptabilité générale 15/01",
    course: "compta",
    type: "exam",
    date: "2027-01-15",
    title: "partiel Comptabilité générale",
  },
  { input: "DM", course: null, type: "homework", date: null, title: "DM" },
  { input: "vendredi", course: null, type: null, date: "2026-10-16", title: "vendredi" },
  { input: "appeler le secrétariat", course: null, type: null, date: null, title: "appeler le secrétariat" },
  {
    input: "lire 2 articles en anglais pour demain",
    course: "anglais",
    type: "reading",
    date: "2026-10-15",
    title: "2 articles",
  },
  { input: "DM compat vendredi", course: "compta", type: "homework", date: "2026-10-16", title: "DM compat" },
  {
    input: "QCM stats aujourd'hui 18h",
    course: "stats",
    type: null,
    date: "2026-10-14",
    time: "18:00",
    title: "QCM",
  },
  {
    input: "exposé groupe marketing ce vendredi à 14h",
    course: "marketing",
    type: "presentation",
    date: "2026-10-16",
    time: "14:00",
    title: "groupe",
  },
  {
    input: "Lecture : Le Rouge et le Noir",
    course: null,
    type: "reading",
    date: null,
    title: "Le Rouge et le Noir",
  },
  {
    input: "cc droit le 3/11 à 9h",
    course: "droit",
    type: "exam",
    date: "2026-11-03",
    time: "09:00",
    title: "cc droit",
  },
  {
    input: "révision management mercredi",
    course: "management",
    type: "revision",
    date: "2026-10-21",
    title: "révision management",
  },
  { input: "TP compta 31/02", course: "compta", type: "lab_report", date: null, title: "31/02" },
  {
    input: "rendre le dossier de stats avant le 12",
    course: "stats",
    type: null,
    date: "2026-11-12",
    title: "rendre le dossier",
  },
];

test.each(CASES.map((row) => [row.input, row] as const))("%p", (input, row) => {
  const result = parseCapture(input, context());
  if (!result.ok) throw new Error(result.error.message);
  const { course, taskType, deadline, title } = result.value;
  expect({
    course: course?.id ?? null,
    type: taskType?.key ?? null,
    date: deadline?.date ?? null,
    time: deadline?.time ?? undefined,
    title,
  }).toEqual({ course: row.course, type: row.type, date: row.date, time: row.time, title: row.title });
});

test("the table holds at least 30 lines", () => {
  expect(CASES.length).toBeGreaterThanOrEqual(30);
});
