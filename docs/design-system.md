# Design system

`@kata/design-system` (`packages/design-system`) holds the tokens, themes and components that every app uses. It exports its `src/` directly (no build step) and is styled with StyleX.

## The hard rule

Apps style only through design-system components.

- No CSS files, CSS modules, Tailwind or other CSS-in-JS.
- No `style=` and no string `className=` in apps.
- Apps may call `stylex.create` only with token values (`@kata/design-system/tokens.stylex`). No raw colors, sizes or shadows.
- Components expose typed variant props (`size`, `tone`, `gap`, ...). They never accept `style` or `className`. If a component cannot do what you need, add a variant to the design system; do not work around it in the app.

## Tokens

Defined with `stylex.defineVars` in `src/tokens.stylex.ts`. Import them from `@kata/design-system/tokens.stylex`: StyleX only recognizes vars when the import path ends in `.stylex`, so `src/index.ts` does not re-export them.

| Group | Keys |
|---|---|
| `color` | `bg`, `bgSubtle`, `surface`, `border`, `borderStrong`, `text`, `textMuted`, `accent`, `accentHover`, `accentSubtle`, `accentText`, `danger`, `dangerSubtle`, `dangerText`, `success`, `successText`, `warning`, `warningText`, `focusRing`, `overlay` |
| `space` | `none` 0, `xxs` 2px, `xs` 4px, `sm` 8px, `md` 12px, `lg` 16px, `xl` 24px, `xxl` 32px, `xxxl` 48px |
| `radius` | `none`, `sm` 4px, `md` 8px, `lg` 12px, `full` |
| `font` | families `familySans`, `familyMono`; sizes `sizeXs` … `sizeXxxl` (0.75rem – 1.875rem); weights `weightRegular`, `weightMedium`, `weightSemibold`, `weightBold`; line heights `lineHeightTight`, `lineHeightNormal`, `lineHeightRelaxed` |
| `shadow` | `none`, `sm`, `md`, `lg` |
| `zIndex` | `base`, `dropdown`, `sticky`, `overlay`, `modal`, `popover`, `toast`, `tooltip` |
| `motion` | `durationFast`, `durationNormal`, `durationSlow`, `easingStandard`, `easingEnter`, `easingExit` |

`*Text` colors are the foreground to use on top of the matching fill (for example `accentText` on `accent`).

## Themes

- Token defaults follow the system color scheme (`prefers-color-scheme`).
- `lightTheme` and `darkTheme` (`stylex.createTheme`, `src/theme/themes.ts`) force one scheme. When you change a color, change it in both `tokens.stylex.ts` and `themes.ts`.
- `ThemeProvider` is the root of every app. `theme` is `"system"` (default), `"light"` or `"dark"`. It applies the theme, the base text color, background and font, and `color-scheme`.

```tsx
<ThemeProvider theme="system">
  <App />
</ThemeProvider>
```

## Components

All components accept `id`, `role`, `aria-*`, `data-testid` and `children` (`CommonProps`). `SpaceToken` is a key of `space`.

| Component | Props |
|---|---|
| `Box` | `as` (`div`, `section`, `article`, `main`, `header`, `footer`, `nav`, `aside`, `ul`, `ol`, `li`), `padding`, `paddingX`, `paddingY` (SpaceToken), `background` (`bg`, `bgSubtle`, `surface`), `radius` (radius key), `border` (boolean), `grow` (boolean) |
| `Stack` | `as` (same as Box), `direction` (`row`, `column`; default `column`), `gap` (SpaceToken; default `none`), `align` (`start`, `center`, `end`, `stretch`, `baseline`), `justify` (`start`, `center`, `end`, `between`, `around`, `evenly`), `wrap` (boolean) |
| `Text` | `as` (`span`, `p`, `div`, `strong`, `em`, `small`, `code`; default `span`), `size` (`xs` … `xl`; default `md`), `weight` (`regular`, `medium`, `semibold`, `bold`), `tone` (`default`, `muted`, `accent`, `danger`, `success`, `warning`), `align` (`start`, `center`, `end`), `truncate` (boolean) |
| `Heading` | `level` (1–4, required; renders `h1`–`h4`), `tone` |
| `Card` | `as` (`div`, `section`, `article`), `variant` (`outlined`, `elevated`), `padding` (SpaceToken; default `lg`) |
| `Icon` | `name` (`check`, `x`, `plus`, `chevron-down`, `info`, `alert`, `sun`, `moon`), `size` (`sm` 16px, `md` 20px, `lg` 24px), `tone`, `label`. Without `label` the icon is decorative (`aria-hidden`); with it, it is `role="img"` with that name. |
| `ThemeProvider` | `theme` (`system`, `light`, `dark`) |

## Add a component

1. Create `src/components/<Name>.tsx`. Style it with `stylex.create` using tokens only.
2. Type its props as `CommonProps & { ...variants }`. Each variant is a union of keys, mapped to a `stylex.create` entry (see `Stack` for the pattern). Never add `style` or `className`.
3. Use Base UI (`@base-ui/react`) for behavior (focus, keyboard, ARIA) on interactive components.
4. Export the component and its prop types from `src/index.ts`.
5. Add `src/components/<Name>.test.tsx`: it renders, each variant changes the class, and ARIA attributes are correct.
6. Add it to the table above.

## Tests

`bun run --filter @kata/design-system test` (or `bun test` inside `packages/design-system`). The package `bunfig.toml` preloads happy-dom and a Bun plugin that compiles StyleX with `@stylexjs/unplugin` (uncompiled `stylex.create` throws). Bun only reads `bunfig.toml` from the current directory, so `bun test packages/design-system` from the repo root does not load it; use the package script.

`tsconfig.json` checks the browser source without Bun types; `tsconfig.test.json` adds Bun types for the tests. `bun run typecheck` runs both.
