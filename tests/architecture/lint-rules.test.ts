// Each Biome guardrail (GritQL plugin or noRestrictedImports) has a fixture that breaks it. This test lints
// the fixtures with the real configuration and checks that every rule reports, with its fix message,
// and that the "allowed" fixtures stay clean.
import { beforeAll, describe, expect, test } from "bun:test";
import { type LintDiagnostic, lintFixtures, lintFixturesDir } from "./lint-fixtures.ts";

const FIX_STYLING = "Use components from @kata/design-system";
const FIX_STYLEX =
  "Use tokens: color.*, space.*, radius.*, font.*, shadow.* from @kata/design-system/tokens.stylex";

/** Fixture → the guardrail diagnostics it must produce: [category, message fragment, count]. */
const expected: Record<string, readonly [category: string, message: string, count: number][]> = {
  "apps/web/app/inline-style.tsx": [
    ["plugin", `Inline style= is not allowed outside @kata/design-system. ${FIX_STYLING}`, 1],
  ],
  "apps/web/app/string-classname.tsx": [
    ["plugin", `String className= is not allowed outside @kata/design-system. ${FIX_STYLING}`, 3],
  ],
  "apps/web/app/stylex-raw-color.tsx": [["plugin", `Raw value in stylex.create. ${FIX_STYLEX}`, 4]],
  "apps/web/app/stylex-raw-size.tsx": [["plugin", `Raw value in stylex.create. ${FIX_STYLEX}`, 4]],
  "apps/web/app/stylex-raw-font.tsx": [["plugin", `Raw value in stylex.create. ${FIX_STYLEX}`, 2]],
  "apps/web/app/css-import.tsx": [
    [
      "lint/style/noRestrictedImports",
      `CSS files are not allowed outside @kata/design-system. ${FIX_STYLING}; for custom layout use stylex.create with tokens from @kata/design-system/tokens.stylex.`,
      3,
    ],
  ],
  "apps/web/app/styling-library.tsx": [
    ["lint/style/noRestrictedImports", `Styling libraries are not allowed. ${FIX_STYLING}`, 3],
  ],
  "apps/web/app/api-value-import.ts": [
    ["plugin", "Value import of @kata/api in the web app. Import only its types (import type { AppType }", 4],
  ],
  "apps/api/src/modules/work/application/cross-module-internal.ts": [
    [
      "plugin",
      "Import academic only through modules/academic/index.ts and inject its service via the module composition root",
      2,
    ],
  ],
  "apps/api/src/app-internal-import.ts": [
    [
      "plugin",
      "Import health only through modules/health/index.ts and inject its service via the module composition root",
      1,
    ],
  ],
  "apps/api/src/modules/work/infrastructure/other-module-prisma.ts": [
    [
      "plugin",
      "Do not import the academic module's Prisma client or prisma/ folder: each module owns its schema and client. Call academic through modules/academic/index.ts",
      2,
    ],
  ],
  "apps/api/src/modules/work/application/prisma-in-service.ts": [
    [
      "plugin",
      "Services depend on the repository interface in domain/. Inject the Prisma repository from module.ts.",
      3,
    ],
  ],
  "apps/api/src/modules/work/domain/prisma-in-domain.ts": [
    [
      "plugin",
      "Services depend on the repository interface in domain/. Inject the Prisma repository from module.ts.",
      1,
    ],
  ],
  // Clean: everything allowed, including design-system-only exceptions.
  "apps/web/app/allowed.tsx": [],
  "apps/api/src/modules/work/allowed.ts": [],
  "packages/design-system/src/Allowed.tsx": [],
};

const isGuardrail = (d: LintDiagnostic) =>
  d.category === "plugin" || d.category === "lint/style/noRestrictedImports";

let diagnostics: LintDiagnostic[] = [];

beforeAll(async () => {
  diagnostics = (await lintFixtures()).filter(isGuardrail);
}, 30_000);

describe("biome guardrails report each fixture with its fix message", () => {
  for (const [file, rules] of Object.entries(expected)) {
    test(file, () => {
      const found = diagnostics.filter((d) => d.file === file);
      const summary = (list: readonly LintDiagnostic[]) => list.map((d) => `${d.category}: ${d.message}`);

      for (const [category, message, count] of rules) {
        const matching = found.filter((d) => d.category === category && d.message.includes(message));
        expect(matching.length, summary(found).join("\n")).toBe(count);
      }
      const total = rules.reduce((sum, [, , count]) => sum + count, 0);
      expect(summary(found)).toHaveLength(total);
    });
  }

  test("every fixture file is listed above", () => {
    const onDisk = [...new Bun.Glob("**/*.{ts,tsx}").scanSync(lintFixturesDir)];
    expect(onDisk.sort()).toEqual(Object.keys(expected).sort());
  });
});
