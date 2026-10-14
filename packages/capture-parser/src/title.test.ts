// Rules C6 (title from the remaining words) and C5 (no date: "Sans date").
import { describe, expect, test } from "bun:test";
import { parseCapture } from "./parse.ts";
import { context } from "./testing/context.ts";
import type { Capture } from "./types.ts";

function capture(input: string): Capture {
  const result = parseCapture(input, context());
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe("title (C6)", () => {
  test.each([
    ["lire chap 3 demain 14h", "chap 3"],
    ["DM compta vendredi", "DM compta"],
    ["partiel compta 15/11", "partiel compta"],
    ["DM de compta pour vendredi exercices 1 à 4", "exercices 1 à 4"],
    ["Exposé Marketing sur la RSE", "sur la RSE"],
    ["lire Les Misérables", "Les Misérables"],
    ["Réviser les intégrales", "les intégrales"],
    ["DM compta - exercices 2 et 3 - vendredi", "exercices 2 et 3"],
    ["TP chimie : rapport final", "chimie rapport final"],
    ["  rendre   le   rapport  ", "rendre le rapport"],
    ["demain", "demain"],
    ["pour demain", "pour demain"],
    ["DM de stats", "DM de stats"],
    ["", ""],
  ])("%p → %p", (input, title) => {
    expect(capture(input).title).toBe(title);
  });

  test("the title does not change what was read", () => {
    expect(capture("DM compta vendredi")).toMatchObject({
      course: { id: "compta" },
      taskType: { key: "homework" },
      deadline: { date: "2026-10-16" },
    });
  });
});

describe("no date (C5)", () => {
  test.each([
    ["Réviser les intégrales", "revision", null],
    ["DM compta", "homework", "compta"],
    ["exposé marketing la semaine d'après", "presentation", "marketing"],
  ])("%p has no deadline, but its type and course are read", (input, key, courseId) => {
    const { deadline, taskType, course } = capture(input);
    expect(deadline).toBeNull();
    expect(taskType?.key).toBe(key);
    expect(course?.id ?? null).toBe(courseId);
  });
});
