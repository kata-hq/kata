import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { transformAsync } from "@babel/core";
import stylexPlugin, { type Rule } from "@stylexjs/babel-plugin";

// Compiles the token and theme files the way a production build does and checks the emitted CSS:
// the defaults follow the system scheme, and each forced theme sets its own palette.

const root = join(import.meta.dir, "../..");
const files = ["src/palette.stylex.ts", "src/tokens.stylex.ts", "src/theme/themes.ts"];

const compileCss = async (): Promise<string> => {
  const rules: Rule[] = [];
  for (const file of files) {
    const filename = join(root, file);
    const result = await transformAsync(await Bun.file(filename).text(), {
      filename,
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ["typescript"] },
      plugins: [
        [
          stylexPlugin,
          {
            dev: false,
            runtimeInjection: false,
            unstable_moduleResolution: { type: "commonJS", rootDir: root },
          },
        ],
      ],
    });
    rules.push(...((result?.metadata?.stylex ?? []) as Rule[]));
  }
  return stylexPlugin.processStylexRules(rules, false);
};

type CssRule = { selector: string; body: string; dark: boolean };

/** Flat list of rules, flagging the ones inside the dark color-scheme media query. */
const parseRules = (css: string): CssRule[] =>
  [...css.matchAll(/(@media \(prefers-color-scheme: dark\)\{)?([^{}@]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[2] ?? "").trim(),
    body: m[3] ?? "",
    dark: m[1] !== undefined,
  }));

/** Name of the custom property that a `:root` default rule sets to `value`. */
const varFor = (rules: CssRule[], value: string): string => {
  const rule = rules.find((r) => !r.dark && r.selector.startsWith(":root") && r.body.includes(`:${value};`));
  const name = rule?.body
    .split(";")
    .find((d) => d.endsWith(`:${value}`))
    ?.split(":")[0];
  if (name === undefined) throw new Error(`no token default with value ${value}`);
  return name;
};

const themeRules = (rules: CssRule[]) => rules.filter((r) => !r.dark && !r.selector.startsWith(":root"));

describe("theme CSS", async () => {
  const rules = parseRules(await compileCss());
  const text = varFor(rules, "#15171c"); // color.text (light)
  const shadowMd = varFor(rules, "0 4px 16px rgba(15, 18, 25, 0.12)"); // shadow.md (light)

  test("token defaults switch to dark values under prefers-color-scheme: dark", () => {
    const darkDefaults = rules.filter((r) => r.dark && r.selector.startsWith(":root"));
    expect(darkDefaults.some((r) => r.body.includes(`${text}:#ecedf1`))).toBe(true);
    expect(darkDefaults.some((r) => r.body.includes(`${shadowMd}:0 4px 16px rgba(0, 0, 0, 0.5)`))).toBe(true);
  });

  test("the forced light and dark themes each set their palette on a class", () => {
    const bodies = themeRules(rules).map((r) => r.body);
    expect(bodies.some((b) => b.includes(`${text}:#15171c`))).toBe(true);
    expect(bodies.some((b) => b.includes(`${text}:#ecedf1`))).toBe(true);
    expect(bodies.some((b) => b.includes(`${shadowMd}:0 4px 16px rgba(15, 18, 25, 0.12)`))).toBe(true);
    expect(bodies.some((b) => b.includes(`${shadowMd}:0 4px 16px rgba(0, 0, 0, 0.5)`))).toBe(true);
  });

  test("every color var is set by both forced themes", () => {
    const colorRoot = rules.find(
      (r) => !r.dark && r.selector.startsWith(":root") && r.body.includes(`${text}:`),
    );
    const colorVars = (colorRoot?.body ?? "")
      .split(";")
      .filter(Boolean)
      .map((d) => d.split(":")[0]);
    const colorThemes = themeRules(rules).filter((r) => r.body.includes(`${text}:`));
    expect(colorThemes).toHaveLength(2);
    for (const theme of colorThemes) {
      for (const name of colorVars) expect(theme.body).toContain(`${name}:`);
    }
  });
});
