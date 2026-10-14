import { describe, expect, test } from "bun:test";
import { normalize, tokenize } from "./text.ts";

describe("normalize (C1)", () => {
  test.each([
    ["Exposé", "expose"],
    ["EXPOSE", "expose"],
    ["exposé", "expose"],
    ["Après-demain", "apres-demain"],
    ["Lecture", "lecture"],
    ["Œuvre", "oeuvre"],
    ["ÉCO", "eco"],
    ["Ça", "ca"],
    ["aujourd’hui", "aujourd'hui"],
    ["Révision CC", "revision cc"],
  ])("%p → %p", (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  test("case and accents do not change the result", () => {
    expect(normalize("Présentation ÉCO")).toBe(normalize("presentation eco"));
    expect(normalize("PRÉSENTATION")).toBe(normalize("présentation"));
  });
});

describe("tokenize", () => {
  test("keeps each word as typed, normalised and with its position", () => {
    expect(tokenize("DM Compta vendredi")).toEqual([
      { text: "DM", norm: "dm", index: 0 },
      { text: "Compta", norm: "compta", index: 3 },
      { text: "vendredi", norm: "vendredi", index: 10 },
    ]);
  });

  test.each([
    ["  lire   chap 3  ", ["lire", "chap", "3"]],
    ["dm, compta ; vendredi!", ["dm", "compta", "vendredi"]],
    ["partiel compta 15/11.", ["partiel", "compta", "15/11"]],
    ["« exposé » (éco)", ["expose", "eco"]],
    ["réviser à 14h30", ["reviser", "a", "14h30"]],
    ["aujourd’hui", ["aujourd'hui"]],
    ["", []],
    [" , ; ", []],
    ["« »", []],
  ])("%p → %p", (input, expected) => {
    expect(tokenize(input).map((token) => token.norm)).toEqual(expected);
  });
});
