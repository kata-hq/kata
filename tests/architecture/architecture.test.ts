// Architecture rules checked over files (see rules.ts). Each runs on the repo, where it must find nothing,
// and on its fixture, where it must report each planted violation with its fix.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { repoRoot } from "./lint-fixtures.ts";
import { moduleDependencyViolations, moduleEdges, stylesheetsOutsideDesignSystem } from "./rules.ts";

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
