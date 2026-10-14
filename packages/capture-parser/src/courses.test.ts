// Rule C4: course by alias / short name / name, then start of the name, then close text; else none.
import { describe, expect, test } from "bun:test";
import { similarity } from "./courses.ts";
import { parseCapture } from "./parse.ts";
import { context } from "./testing/context.ts";
import type { Capture, CaptureContext, CourseCandidate } from "./types.ts";

function capture(input: string, overrides: Partial<CaptureContext> = {}): Capture {
  const result = parseCapture(input, context(overrides));
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function courseOf(input: string, overrides: Partial<CaptureContext> = {}): (string | null)[] {
  const { course } = capture(input, overrides);
  return course === null ? [null, null] : [course.id, course.matched];
}

const course = (id: string, name: string): CourseCandidate => ({ id, name, shortName: null, aliases: [] });

describe("pass 1: alias, short name or name, exact (C4)", () => {
  test.each([
    ["DM compta vendredi", "compta", "compta"],
    ["Compta", "compta", "Compta"],
    ["exposé ÉCO", "eco", "ÉCO"],
    ["réviser Micro", "eco", "Micro"],
    ["lire contrats", "droit", "contrats"],
    ["lire Droit des contrats", "droit", "Droit des contrats"],
    ["lire droit-des-contrats", "droit", "droit-des-contrats"],
    ["anglais oral", "anglais", "anglais"],
    ["english essay", "anglais", "english"],
    ["statis eco", "eco", "eco"],
    ["Microéconomie", "eco", "Microéconomie"],
  ])("%p → %p (%p)", (input, id, matched) => {
    expect(courseOf(input)).toEqual([id, matched]);
  });

  test("the full course is returned with its name", () => {
    expect(capture("DM compta vendredi").course).toEqual({
      id: "compta",
      name: "Comptabilité générale",
      matched: "compta",
    });
  });
});

describe("pass 2: start of the name (C4)", () => {
  test.each([
    ["DM statis", "stats", "statis"],
    ["réviser comptabilité", "compta", "comptabilité"],
    ["comptabilite gen chap 2", "compta", "comptabilite gen"],
    ["droit des contrats", "droit", "droit des contrats"],
    ["lire droit chap 4", "droit", "droit"],
    ["exposé manag", "management", "manag"],
    ["exposé mark", "marketing", "mark"],
    ["DM micro-eco", null, null],
  ])("%p → %p (%p)", (input, id, matched) => {
    expect(courseOf(input)).toEqual([id, matched]);
  });

  test("a start that ends on a short word stops before it", () => {
    expect(courseOf("statistiques de demain")).toEqual(["stats", "statistiques"]);
  });
});

describe("pass 3: close text (C4)", () => {
  test.each([
    ["DM comtpa vendredi", "compta", "comtpa"],
    ["oral angalis", "anglais", "angalis"],
    ["exposé marketting", "marketing", "marketting"],
    ["réviser statz", "stats", "statz"],
    ["lire englsh", "anglais", "englsh"],
  ])("%p → %p (%p)", (input, id, matched) => {
    expect(courseOf(input)).toEqual([id, matched]);
  });
});

describe("no course (C4: a wrong course is worse than no course)", () => {
  test.each(["lire chap 3 demain 14h", "exercice 4", "DM math", "DM ma", "de la", "123", "générale", "DM"])(
    "%p has no course",
    (input) => {
      expect(capture(input).course).toBeNull();
    },
  );

  test("two courses that start the same way give no course", () => {
    const courses = [course("ana", "Analyse"), course("anat", "Anatomie")];
    expect(courseOf("DM ana", { courses })).toEqual([null, null]);
    expect(courseOf("DM anal", { courses })).toEqual(["ana", "anal"]);
  });

  test("two courses equally close give no course", () => {
    const courses = [course("droit", "Droit"), course("doigt", "Doigt")];
    expect(courseOf("droigt", { courses })).toEqual([null, null]);
  });

  test("two courses with the same alias give no course", () => {
    const courses = [
      { ...course("a", "Algèbre"), aliases: ["maths"] },
      { ...course("b", "Analyse"), aliases: ["maths"] },
    ];
    expect(courseOf("DM maths", { courses })).toEqual([null, null]);
  });

  test("the closest course wins over a less close one", () => {
    const courses = [course("chimie", "Chimie"), course("chinois", "Chinois")];
    expect(courseOf("chimei", { courses })).toEqual(["chimie", "chimei"]);
  });

  test("without courses there is no course", () => {
    expect(capture("DM compta", { courses: [] }).course).toBeNull();
  });

  test("words used by the date or the type are not courses", () => {
    const courses = [course("dm", "DM"), course("demain", "Demain")];
    expect(capture("DM demain", { courses }).course).toBeNull();
  });
});

describe("similarity", () => {
  test.each([
    ["compta", "compta", 1],
    ["comtpa", "compta", 1 - 1 / 6],
    ["anglais", "angalis", 1 - 1 / 7],
    ["abc", "xyz", 0],
    ["", "", 1],
    ["", "abc", 0],
  ])("%p ~ %p = %p", (a, b, expected) => {
    expect(similarity(a, b)).toBeCloseTo(expected);
  });
});
