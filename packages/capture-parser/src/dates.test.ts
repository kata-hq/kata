// Rule C2 (dates and times) and K-R7 (end of day). Reference: Wednesday 14 October 2026, 09:00 in Paris.
import { describe, expect, test } from "bun:test";
import { parseCapture } from "./parse.ts";
import { context } from "./testing/context.ts";
import type { CaptureContext, Deadline } from "./types.ts";

function deadlineOf(input: string, overrides: Partial<CaptureContext> = {}): Deadline | null {
  const result = parseCapture(input, context(overrides));
  if (!result.ok) throw new Error(result.error.message);
  return result.value.deadline;
}

type Row = [input: string, date: string, time: string | null, matched: string];

describe("dates (C2)", () => {
  test.each<Row>([
    ["DM compta vendredi", "2026-10-16", null, "vendredi"],
    ["partiel compta 15/11", "2026-11-15", null, "15/11"],
    ["lire chap 3 demain 14h", "2026-10-15", "14:00", "demain 14h"],
    ["aujourd'hui", "2026-10-14", null, "aujourd'hui"],
    ["Aujourd’hui", "2026-10-14", null, "Aujourd’hui"],
    ["exposé auj", "2026-10-14", null, "auj"],
    ["demain", "2026-10-15", null, "demain"],
    ["après-demain", "2026-10-16", null, "après-demain"],
    ["Après-Demain", "2026-10-16", null, "Après-Demain"],
    ["apres demain", "2026-10-16", null, "apres demain"],
    ["lundi", "2026-10-19", null, "lundi"],
    ["mardi prochain", "2026-10-20", null, "mardi prochain"],
    ["mercredi", "2026-10-21", null, "mercredi"],
    ["JEUDI", "2026-10-15", null, "JEUDI"],
    ["samedi", "2026-10-17", null, "samedi"],
    ["dimanche", "2026-10-18", null, "dimanche"],
    ["le 12", "2026-11-12", null, "le 12"],
    ["le 14", "2026-10-14", null, "le 14"],
    ["le 31", "2026-10-31", null, "le 31"],
    ["le 12/11", "2026-11-12", null, "le 12/11"],
    ["12/10", "2027-10-12", null, "12/10"],
    ["20/10", "2026-10-20", null, "20/10"],
    ["12/10/2026", "2026-10-12", null, "12/10/2026"],
    ["3/1/27", "2027-01-03", null, "3/1/27"],
    ["20.10", "2026-10-20", null, "20.10"],
    ["semaine prochaine", "2026-10-19", null, "semaine prochaine"],
    ["pour la semaine prochaine", "2026-10-19", null, "pour la semaine prochaine"],
    ["dans 3 jours", "2026-10-17", null, "dans 3 jours"],
    ["dans un jour", "2026-10-15", null, "dans un jour"],
    ["dans 2 semaines", "2026-10-28", null, "dans 2 semaines"],
    ["DM pour demain", "2026-10-15", null, "pour demain"],
    ["avant vendredi", "2026-10-16", null, "avant vendredi"],
    ["d'ici jeudi", "2026-10-15", null, "d'ici jeudi"],
    ["ce vendredi", "2026-10-16", null, "ce vendredi"],
    ["le vendredi", "2026-10-16", null, "le vendredi"],
    ["demain ou vendredi", "2026-10-15", null, "demain"],
  ])("%p → %s %s (%p)", (input, date, time, matched) => {
    expect(deadlineOf(input)).toMatchObject({ date, time, matched });
  });
});

describe("times (C2)", () => {
  test.each<Row>([
    ["demain 14h30", "2026-10-15", "14:30", "demain 14h30"],
    ["demain à 8h", "2026-10-15", "08:00", "demain à 8h"],
    ["demain vers 17:45", "2026-10-15", "17:45", "demain vers 17:45"],
    ["14h demain", "2026-10-15", "14:00", "14h demain"],
    ["à 14h vendredi", "2026-10-16", "14:00", "à 14h vendredi"],
    ["réviser 18h", "2026-10-14", "18:00", "18h"],
    ["réviser à 8h", "2026-10-15", "08:00", "à 8h"],
    ["réviser 9h", "2026-10-15", "09:00", "9h"],
    ["0h", "2026-10-15", "00:00", "0h"],
  ])("%p → %s %s (%p)", (input, date, time, matched) => {
    expect(deadlineOf(input)).toMatchObject({ date, time, matched });
  });
});

describe("not a date", () => {
  test.each([
    "DM compta",
    "31/02",
    "31/02/2027",
    "le 32",
    "le 0",
    "le chapitre",
    "25h",
    "14h75",
    "dans trois mois",
    "dans la semaine",
    "lire chap 3",
    "12/13",
    "",
  ])("%p has no deadline", (input) => {
    expect(deadlineOf(input)).toBeNull();
  });
});

describe("deadline instant (K-R7)", () => {
  test("without a time, the deadline is 23:59 local time (summer time in Paris)", () => {
    expect(deadlineOf("vendredi")?.instant).toBe("2026-10-16T21:59:00Z");
  });

  test("after the change to winter time, 23:59 local is 22:59 UTC", () => {
    expect(deadlineOf("le 25")?.instant).toBe("2026-10-25T22:59:00Z");
    expect(deadlineOf("partiel compta 15/11")?.instant).toBe("2026-11-15T22:59:00Z");
  });

  test("with a time, the deadline is that local time", () => {
    expect(deadlineOf("demain 14h")?.instant).toBe("2026-10-15T12:00:00Z");
  });

  test("dates and times follow the person's time zone", () => {
    expect(deadlineOf("demain", { timeZone: "America/Montreal" })).toEqual({
      date: "2026-10-15",
      time: null,
      instant: "2026-10-16T03:59:00Z",
      matched: "demain",
    });
  });

  test("today is the local day of the reference, not the UTC day", () => {
    expect(deadlineOf("demain", { reference: "2026-10-14T22:30:00Z" })?.date).toBe("2026-10-16");
  });

  test("le 31 skips months without a 31st", () => {
    expect(deadlineOf("le 31", { reference: "2026-11-05T09:00:00Z" })?.date).toBe("2026-12-31");
  });
});
