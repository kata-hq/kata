// Architecture rules checked over files (see rules.ts). Each runs on the repo, where it must find nothing,
// and on its fixture, where it must report each planted violation with its fix.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "./lint-fixtures.ts";
import {
  contentModels,
  moduleDependencyViolations,
  moduleEdges,
  pureLibraryViolations,
  stylesheetsOutsideDesignSystem,
  unscopedContentQueries,
} from "./rules.ts";

const fixtures = join(import.meta.dir, "fixtures", "arch");

describe("no stylesheet outside the design system", () => {
  test("the repo has none", () => {
    expect(stylesheetsOutsideDesignSystem(repoRoot)).toEqual([]);
  });

  test("the fixture's .css and .scss files are reported with the fix, the design system's are not", () => {
    const violations = stylesheetsOutsideDesignSystem(join(fixtures, "stylesheets"));

    expect(violations).toEqual([
      expect.stringContaining("apps/web/app/stray.css: stylesheet outside @kata/design-system. Delete it"),
      expect.stringContaining("apps/web/app/theme.scss: stylesheet outside @kata/design-system. Delete it"),
    ]);
    expect(violations[0]).toContain("stylex.create with tokens from @kata/design-system/tokens.stylex");
  });
});

describe("module dependencies follow tests/architecture/module-graph.ts", () => {
  test("the repo follows the graph", () => {
    expect(moduleDependencyViolations(repoRoot)).toEqual([]);
  });

  test("imports are resolved to module edges, including dynamic imports", () => {
    expect(moduleEdges(join(fixtures, "modules"))).toEqual([
      {
        from: "academic",
        to: "identity",
        file: "apps/api/src/modules/academic/application/course-service.ts",
        specifier: "../../identity/index.ts",
      },
      {
        from: "health",
        to: "identity",
        file: "apps/api/src/modules/health/module.ts",
        specifier: "../identity/index.ts",
      },
      {
        from: "identity",
        to: "academic",
        file: "apps/api/src/modules/identity/application/user-service.ts",
        specifier: "../../academic/index.ts",
      },
    ]);
  });

  test("the fixture's forbidden edges and undeclared module are reported with the fix", () => {
    const violations = moduleDependencyViolations(join(fixtures, "modules"));

    expect(violations).toEqual([
      expect.stringContaining(
        'apps/api/src/modules/billing/: module "billing" is not in the module graph. Add it with its allowed dependencies to tests/architecture/module-graph.ts',
      ),
      expect.stringContaining(
        'apps/api/src/modules/health/module.ts: module "health" imports module "identity" (../identity/index.ts). Allowed dependencies of health: none.',
      ),
      expect.stringContaining(
        'apps/api/src/modules/identity/application/user-service.ts: module "identity" imports module "academic" (../../academic/index.ts). Allowed dependencies of identity: platform.',
      ),
    ]);
    expect(violations[1]).toContain("Invert the dependency (inject a service through module.ts)");
  });
});

describe("pure packages have no I/O (rule A6)", () => {
  test("the repo's pure packages import nothing else and read no clock", () => {
    expect(pureLibraryViolations(repoRoot)).toEqual([]);
  });

  test("the fixture's imports and impure calls are reported with the fix, allowed code is not", () => {
    const violations = pureLibraryViolations(join(fixtures, "pure"));
    const clock = "packages/capture-parser/src/clock.ts: uses";
    const io = "packages/planner/src/io.ts:";

    expect(violations).toEqual([
      expect.stringContaining(`${clock} Date.now() in a pure package (rule A6). Take the reference instant`),
      expect.stringContaining(`${clock} new Date()`),
      expect.stringContaining(`${clock} Temporal.Now`),
      expect.stringContaining(
        `${io} imports "node:fs" in a pure package (rule A6). Import only the package's own files`,
      ),
      expect.stringContaining(`${io} imports "@prisma/client"`),
      expect.stringContaining(`${io} uses Math.random()`),
      expect.stringContaining(`${io} uses performance.now()`),
      expect.stringContaining(`${io} uses fetch()`),
      expect.stringContaining(`${io} uses process`),
      expect.stringContaining(`${io} uses Bun`),
    ]);
  });
});

describe("content-model queries go through the workspace scope", () => {
  test("the repo has no unscoped query", () => {
    expect(unscopedContentQueries(repoRoot)).toEqual([]);
  });

  test("content models are the models with a workspaceId field", () => {
    expect(contentModels(join(fixtures, "scoping"))).toEqual(new Map([["academic", ["course"]]]));
  });

  test("the fixture's unscoped queries are reported with file, line and fix; scoped ones, creates and tests are not", () => {
    const violations = unscopedContentQueries(join(fixtures, "scoping"));

    expect(violations).toEqual([
      expect.stringContaining(
        'apps/api/src/modules/academic/infrastructure/unscoped-course-repository.ts:6: course.findMany(…) on content model "course" does not filter by workspace and deletedAt.',
      ),
      expect.stringContaining(
        'apps/api/src/modules/academic/infrastructure/unscoped-course-repository.ts:10: course.update(…) on content model "course"',
      ),
    ]);
    expect(violations[0]).toContain("Build its where with scoped(workspaceId, { … })");
  });
});
