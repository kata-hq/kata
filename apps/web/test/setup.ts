import { afterEach } from "bun:test";
import { join } from "node:path";
import { unpluginFactory } from "@stylexjs/unplugin";
import { cleanup } from "@testing-library/react";
import { plugin } from "bun";

// `stylex.create` throws when it is not compiled, so tests compile StyleX the same way the
// app build does: this Bun plugin runs the StyleX unplugin transform on our own TS files.
type StylexTransform = (code: string, id: string) => Promise<{ code: string } | null | undefined>;

const stylex = unpluginFactory(
  {
    dev: true,
    runtimeInjection: false,
    unstable_moduleResolution: { type: "commonJS", rootDir: join(import.meta.dir, "../../..") },
  },
  { framework: "bun" },
) as unknown as { transform: StylexTransform };

plugin({
  name: "stylex-test",
  setup(build) {
    build.onLoad({ filter: /\.tsx?$/ }, async ({ path }) => {
      const code = await Bun.file(path).text();
      const result = path.includes("/node_modules/") ? null : await stylex.transform(code, path);
      return { contents: result?.code ?? code, loader: path.endsWith(".tsx") ? "tsx" : "ts" };
    });
  },
});

afterEach(cleanup);
