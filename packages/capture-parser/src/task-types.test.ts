// Rule C3: task types from TaskType.aliases. The fixture types carry the spec's C3 aliases.
import { describe, expect, test } from "bun:test";
import { parseCapture } from "./parse.ts";
import { context } from "./testing/context.ts";
import type { Capture, CaptureContext } from "./types.ts";

function capture(input: string, overrides: Partial<CaptureContext> = {}): Capture {
  const result = parseCapture(input, context(overrides));
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe("task types (C3)", () => {
  test.each([
    ["DM compta vendredi", "homework", "DM"],
    ["devoir maison stats", "homework", "devoir maison"],
    ["tp chimie", "lab_report", "tp"],
    ["compte rendu chimie", "lab_report", "compte rendu"],
    ["Compte-rendu chimie", "lab_report", "Compte-rendu"],
    ["exposé marketing", "presentation", "exposé"],
    ["EXPOSE marketing", "presentation", "EXPOSE"],
    ["oral anglais", "presentation", "oral"],
    ["Présentation éco", "presentation", "Présentation"],
    ["lire chap 3 demain 14h", "reading", "lire"],
    ["lecture droit", "reading", "lecture"],
    ["lectures droit", "reading", "lectures"],
    ["réviser stats", "revision", "réviser"],
    ["REVISION stats", "revision", "REVISION"],
    ["cc stats", "exam", "cc"],
    ["partiel compta 15/11", "exam", "partiel"],
    ["Exam anglais", "exam", "Exam"],
    ["réviser partiel compta", "revision", "réviser"],
    ["stats: réviser", "revision", "réviser"],
    ["dmx compta", null, null],
    ["lirec", null, null],
    ["exposition", null, null],
    ["chap 3", null, null],
  ])("%p → %p (%p)", (input, key, matched) => {
    const { taskType } = capture(input);
    const actual: (string | null)[] = taskType === null ? [null, null] : [taskType.key, taskType.matched];
    expect(actual).toEqual([key, matched]);
  });

  test("the label comes from the data", () => {
    expect(capture("DM compta").taskType).toEqual({ key: "homework", label: "DM", matched: "DM" });
  });

  test("without task types in the context, there is no type", () => {
    expect(capture("DM compta", { taskTypes: [] }).taskType).toBeNull();
  });

  test("an alias made only of punctuation never matches", () => {
    const taskTypes = [{ key: "odd", label: "Odd", aliases: ["« »"] }];
    expect(capture("« » DM", { taskTypes }).taskType).toBeNull();
  });

  test("words used by the date are not types", () => {
    const taskTypes = [{ key: "weird", label: "Weird", aliases: ["demain"] }];
    expect(capture("demain", { taskTypes }).taskType).toBeNull();
    expect(capture("demain demain", { taskTypes }).taskType?.matched).toBe("demain");
  });

  test("the date is unchanged by the type", () => {
    expect(capture("DM compta vendredi").deadline?.date).toBe("2026-10-16");
  });
});
