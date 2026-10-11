// Architecture rules that GritQL cannot express: they need the file system or a view across files.
// Each returns the violations as messages that say how to fix them. The tests run them on the repo
// (no violation allowed) and on tests/architecture/fixtures/arch (each rule must report).
import { dirname, join, posix } from "node:path";
import { allowedDependencies, isKnownModule } from "./module-graph.ts";
import { importSpecifiers, listFiles, readText } from "./source-files.ts";

const DESIGN_SYSTEM = "packages/design-system/";
const FIXTURES = "tests/architecture/fixtures";
const MODULES = "apps/api/src/modules/";

/** No stylesheet outside the design system: apps style through design-system components and StyleX tokens. */
export function stylesheetsOutsideDesignSystem(root: string): string[] {
  return listFiles(root, [FIXTURES])
    .filter((file) => /\.(css|scss|sass|less)$/.test(file) && !file.startsWith(DESIGN_SYSTEM))
    .map(
      (file) =>
        `${file}: stylesheet outside @kata/design-system. Delete it: use components from @kata/design-system; for custom layout use stylex.create with tokens from @kata/design-system/tokens.stylex.`,
    );
}

export type ModuleEdge = {
  readonly from: string;
  readonly to: string;
  readonly file: string;
  readonly specifier: string;
};

/** Every import from one backend module into another, resolved from the importing file's path. */
export function moduleEdges(root: string): ModuleEdge[] {
  const edges: ModuleEdge[] = [];
  for (const file of listFiles(join(root, MODULES)).map((f) => MODULES + f)) {
    if (!/\.(ts|tsx|mts)$/.test(file)) continue;
    const from = moduleOf(file);
    if (from === undefined) continue;
    for (const specifier of importSpecifiers(readText(root, file))) {
      if (!specifier.startsWith(".")) continue;
      const to = moduleOf(posix.normalize(posix.join(dirname(file), specifier)));
      if (to !== undefined && to !== from) edges.push({ from, to, file, specifier });
    }
  }
  return edges;
}

/** Module dependencies must follow MODULE_GRAPH (tests/architecture/module-graph.ts, docs/architecture.md). */
export function moduleDependencyViolations(root: string): string[] {
  const violations: string[] = [];
  const modules = new Set(
    listFiles(join(root, MODULES))
      .filter((file) => file.includes("/"))
      .map((file) => file.split("/")[0] ?? ""),
  );
  for (const name of modules) {
    if (!isKnownModule(name)) {
      violations.push(
        `${MODULES}${name}/: module "${name}" is not in the module graph. Add it with its allowed dependencies to tests/architecture/module-graph.ts and docs/architecture.md.`,
      );
    }
  }
  for (const edge of moduleEdges(root)) {
    if (!isKnownModule(edge.from)) continue;
    const allowed = allowedDependencies(edge.from);
    if (allowed.includes(edge.to)) continue;
    violations.push(
      `${edge.file}: module "${edge.from}" imports module "${edge.to}" (${edge.specifier}). Allowed dependencies of ${edge.from}: ${allowed.length === 0 ? "none" : allowed.join(", ")}. Invert the dependency (inject a service through module.ts) or, if the architecture changes, update tests/architecture/module-graph.ts and docs/architecture.md.`,
    );
  }
  return violations;
}

function moduleOf(path: string): string | undefined {
  if (!path.startsWith(MODULES)) return undefined;
  return path.slice(MODULES.length).split("/")[0];
}
