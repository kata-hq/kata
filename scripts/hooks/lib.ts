// Pure logic of the Claude Code hooks (`.claude/settings.json`). The hook scripts only do I/O.

import { isAbsolute, relative, sep } from "node:path";

/** Files Biome checks. */
const BIOME_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json", ".jsonc"];
/** Files a TypeScript project checks. */
const TYPED_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"];
/** Root folders that are a TypeScript project without being a workspace package. */
const ROOT_PROJECTS = ["scripts", "tests/architecture"];

/** How to type-check the code around a changed file. */
export type Typecheck =
  | { readonly kind: "package"; readonly dir: string } // `bun run typecheck` in a workspace package
  | { readonly kind: "project"; readonly tsconfig: string }; // `tsc --noEmit -p <dir>` from the repo root

/** What the post-edit hook checks for one changed file. Paths are relative to the repo root. */
export type EditPlan =
  | { readonly kind: "skip"; readonly reason: string }
  | { readonly kind: "check"; readonly file: string; readonly typecheck: Typecheck | null };

/** Reads `tool_input.file_path` from the PostToolUse hook input, if any. */
export function editedFile(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;
  const toolInput = (input as { tool_input?: unknown }).tool_input;
  if (typeof toolInput !== "object" || toolInput === null) return null;
  const path = (toolInput as { file_path?: unknown }).file_path;
  return typeof path === "string" && path !== "" ? path : null;
}

/** True when the Stop hook input says Claude is already continuing because of a Stop hook. */
export function stopHookActive(input: unknown): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    (input as { stop_hook_active?: unknown }).stop_hook_active === true
  );
}

/** Decides what to check for a changed file (absolute or relative to `root`). */
export function planEdit(root: string, file: string): EditPlan {
  const rel = (isAbsolute(file) ? relative(root, file) : file).split(sep).join("/");
  if (rel === "" || rel.startsWith("../") || isAbsolute(rel))
    return { kind: "skip", reason: "outside the repo" };
  if (!BIOME_EXTENSIONS.some((ext) => rel.endsWith(ext))) return { kind: "skip", reason: "not a code file" };
  const parts = rel.split("/");
  if (parts.some((part) => part === "node_modules" || part === "generated")) {
    return { kind: "skip", reason: "generated or installed code" };
  }
  if (!TYPED_EXTENSIONS.some((ext) => rel.endsWith(ext)))
    return { kind: "check", file: rel, typecheck: null };
  return { kind: "check", file: rel, typecheck: typecheckFor(parts) };
}

function typecheckFor(parts: readonly string[]): Typecheck | null {
  const [top, name] = parts;
  if ((top === "apps" || top === "packages") && name !== undefined && parts.length > 2) {
    return { kind: "package", dir: `${top}/${name}` };
  }
  const rel = parts.join("/");
  const project = ROOT_PROJECTS.find((dir) => rel.startsWith(`${dir}/`));
  if (project === undefined || rel.startsWith("tests/architecture/fixtures/")) return null;
  return { kind: "project", tsconfig: project };
}

/** The last `lines` lines of a command output: enough to show the errors without flooding the context. */
export function tail(output: string, lines: number): string {
  const all = output.trimEnd().split("\n");
  return all.length <= lines
    ? all.join("\n")
    : [`… (${all.length - lines} lines cut)`, ...all.slice(-lines)].join("\n");
}
