import { describe, expect, test } from "bun:test";
import { editedFile, planEdit, stopHookActive, tail } from "./lib.ts";

const ROOT = "/repo";

describe("editedFile", () => {
  test("reads tool_input.file_path", () => {
    expect(editedFile({ tool_input: { file_path: "/repo/a.ts" } })).toBe("/repo/a.ts");
  });
  test("returns null for missing or invalid input", () => {
    expect(editedFile(null)).toBeNull();
    expect(editedFile({})).toBeNull();
    expect(editedFile({ tool_input: { file_path: 3 } })).toBeNull();
  });
});

describe("stopHookActive", () => {
  test("is true only for stop_hook_active: true", () => {
    expect(stopHookActive({ stop_hook_active: true })).toBe(true);
    expect(stopHookActive({ stop_hook_active: false })).toBe(false);
    expect(stopHookActive(null)).toBe(false);
  });
});

describe("planEdit", () => {
  test("checks a workspace file with its package typecheck", () => {
    expect(planEdit(ROOT, "/repo/apps/api/src/app.ts")).toEqual({
      kind: "check",
      file: "apps/api/src/app.ts",
      typecheck: { kind: "package", dir: "apps/api" },
    });
  });
  test("checks root scripts and architecture tests with their tsconfig", () => {
    expect(planEdit(ROOT, "/repo/scripts/check.ts")).toMatchObject({
      typecheck: { kind: "project", tsconfig: "scripts" },
    });
    expect(planEdit(ROOT, "tests/architecture/rules.ts")).toMatchObject({
      typecheck: { kind: "project", tsconfig: "tests/architecture" },
    });
  });
  test("runs only biome on JSON and on files outside a TypeScript project", () => {
    expect(planEdit(ROOT, "/repo/biome.json")).toEqual({
      kind: "check",
      file: "biome.json",
      typecheck: null,
    });
    expect(planEdit(ROOT, "/repo/apps/web/package.json")).toMatchObject({ typecheck: null });
    expect(planEdit(ROOT, "/repo/tests/architecture/fixtures/x.ts")).toMatchObject({ typecheck: null });
  });
  test("skips non-code files, files outside the repo and generated code", () => {
    expect(planEdit(ROOT, "/repo/docs/workflow.md")).toMatchObject({
      kind: "skip",
      reason: "not a code file",
    });
    expect(planEdit(ROOT, "/elsewhere/a.ts")).toMatchObject({ kind: "skip", reason: "outside the repo" });
    expect(planEdit(ROOT, "/repo/apps/api/src/modules/health/prisma/generated/client.ts")).toMatchObject({
      kind: "skip",
    });
  });
});

describe("tail", () => {
  test("keeps short output", () => {
    expect(tail("a\nb\n", 5)).toBe("a\nb");
  });
  test("cuts long output and says so", () => {
    expect(tail("1\n2\n3\n4", 2)).toBe("… (2 lines cut)\n3\n4");
  });
});
