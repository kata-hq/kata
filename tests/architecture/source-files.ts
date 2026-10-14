// File walking and import parsing shared by the architecture tests.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Folders that never hold our sources: dependencies, build output, generated code, other worktrees. */
const SKIPPED_DIRS = new Set([
  "node_modules",
  ".git",
  ".claude",
  ".react-router",
  "build",
  "dist",
  "coverage",
  "generated",
]);

/** Every file under `root` (relative, with `/`), skipping SKIPPED_DIRS and the given relative folders. */
export function listFiles(root: string, skip: readonly string[] = []): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const rel = relative(root, path).split(sep).join("/");
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name) && !skip.includes(rel)) walk(path);
      } else if (entry.isFile()) {
        files.push(rel);
      }
    }
  };
  walk(root);
  return files.sort();
}

const IMPORT_PATTERNS = [
  /\b(?:import|export)\s[^;]*?\bfrom\s*["']([^"']+)["']/g, // import x from "a"; export { x } from "a"
  /\bimport\s*["']([^"']+)["']/g, // import "a"
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // import("a")
];

/** The module specifiers a TS/JS source imports or re-exports (static, side-effect and dynamic imports). */
export function importSpecifiers(source: string): string[] {
  const code = stripComments(source);
  return IMPORT_PATTERNS.flatMap((pattern) => [...code.matchAll(pattern)].map((match) => match[1] ?? ""));
}

/** The source without block comments and whole-line `//` comments. */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

export function readText(root: string, file: string): string {
  return readFileSync(join(root, file), "utf8");
}
