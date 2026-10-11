// Runs the repo's real Biome configuration on tests/architecture/fixtures/lint.
// The root biome.json excludes the fixtures (they break the rules on purpose), so this writes a copy of it
// to a temp dir with that one exclusion removed and plugin paths made absolute, then runs `biome lint`.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

export const repoRoot = resolve(import.meta.dir, "../..");
export const lintFixturesDir = join(import.meta.dir, "fixtures", "lint");

export type LintDiagnostic = {
  /** Path relative to tests/architecture/fixtures/lint. */
  readonly file: string;
  /** `plugin` for GritQL plugins, else the rule category (e.g. `lint/style/noRestrictedImports`). */
  readonly category: string;
  readonly message: string;
};

type BiomeConfig = {
  files: { includes: string[] };
  plugins: { path: string; includes?: string[] }[];
  vcs?: unknown;
  extends?: string[];
  $schema?: string;
};

type JsonReport = {
  diagnostics: {
    category: string;
    message: string;
    location: { path: string | null };
  }[];
};

async function fixtureConfig(): Promise<BiomeConfig> {
  const config = (await Bun.file(join(repoRoot, "biome.json")).json()) as BiomeConfig;
  delete config.$schema;
  config.vcs = { enabled: false };
  config.extends = [join(repoRoot, "packages/config/biome.base.json")];
  config.files.includes = config.files.includes.filter((pattern) => !pattern.includes("tests/architecture"));
  config.plugins = config.plugins.map((plugin) => ({ ...plugin, path: resolve(repoRoot, plugin.path) }));
  return config;
}

export async function lintFixtures(): Promise<LintDiagnostic[]> {
  const dir = mkdtempSync(join(tmpdir(), "kata-lint-fixtures-"));
  try {
    await Bun.write(join(dir, "biome.json"), JSON.stringify(await fixtureConfig()));
    const biome = Bun.spawn(
      [
        join(repoRoot, "node_modules/.bin/biome"),
        "lint",
        "--reporter=json",
        "--max-diagnostics=none",
        `--config-path=${dir}`,
        lintFixturesDir,
      ],
      { cwd: repoRoot, stdout: "pipe", stderr: "pipe" },
    );
    const [stdout, stderr] = await Promise.all([new Response(biome.stdout).text(), biome.exited]).then(
      async ([out]) => [out, await new Response(biome.stderr).text()] as const,
    );
    const start = stdout.indexOf("{");
    if (start === -1) throw new Error(`biome lint printed no JSON report.\n${stdout}\n${stderr}`);
    const report = JSON.parse(stdout.slice(start)) as JsonReport;
    return report.diagnostics.map((diagnostic) => ({
      file: relative(lintFixturesDir, resolve(repoRoot, diagnostic.location.path ?? "")),
      category: diagnostic.category,
      message: diagnostic.message,
    }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
