// The allowed dependency directions between backend modules (apps/api/src/modules/<module>/).
// Mirrors the table in docs/architecture.md: change both together.
// A module may import another module only if it is listed here, and then only through its index.ts
// (module-public-api.grit). Cross-module foreign keys follow the same direction (downward only).

export const MODULE_GRAPH = {
  health: [],
  platform: [],
  identity: ["platform"],
  academic: ["identity", "platform"],
  work: ["academic", "platform"],
  notes: ["academic", "platform"],
  planning: ["work", "academic", "platform"],
} as const satisfies Record<string, readonly string[]>;

export type ModuleName = keyof typeof MODULE_GRAPH;

export function isKnownModule(name: string): name is ModuleName {
  return Object.hasOwn(MODULE_GRAPH, name);
}

export function allowedDependencies(name: ModuleName): readonly string[] {
  return MODULE_GRAPH[name];
}
