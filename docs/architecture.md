# Architecture

Kata is one Bun monorepo: a Hono API (`apps/api`), a React Router SPA (`apps/web`), and internal packages (`packages/*`). This page is the map of the backend modules, the rules between them, and the tools that enforce every rule. The module internals (layers, composition roots) are in [module-pattern.md](module-pattern.md); the database per module is in [database.md](database.md).

## Backend modules

The API is one process made of modules in `apps/api/src/modules/<module>/`. Each module owns a Postgres schema, a Prisma client and its migrations. Today only `health` exists; the others are the target from the product spec.

| Module | Owns | May depend on |
|---|---|---|
| `health` | system checks (`/api/health`) | nothing |
| `platform` | cross-cutting services (notifications, admin) | nothing |
| `identity` | users, sessions, workspaces | `platform` |
| `academic` | semesters, courses, timetable | `identity`, `platform` |
| `work` | tasks, exams | `academic`, `platform` |
| `notes` | notes | `academic`, `platform` |
| `planning` | study blocks, replanning | `work`, `academic`, `platform` |

"Depends on" means: the module's code may import that module's `index.ts`, and its module root (`module.ts`) receives that module's service. Every other direction is forbidden. The same table is declared once in code, in [`tests/architecture/module-graph.ts`](../tests/architecture/module-graph.ts); change both together.

### Rules between modules

- **Public API only.** Code outside a module imports only `modules/<module>/index.ts`. Inside its own folder a module imports its files freely.
- **Injected services.** A module uses another module through its service interface, received by its `module.ts` from the app composition root (`apps/api/src/app.ts`). No module creates another module's classes.
- **Own client.** A module reads and writes only its own schema with its own Prisma client. It never imports another module's `prisma/` folder, generated client or client factory.
- **No Prisma in the core.** `domain/` and `application/` never import Prisma. Services depend on repository interfaces in `domain/`; the Prisma repositories in `infrastructure/` are injected by `module.ts`.
- **Foreign keys go downward.** A table may reference a table of a module that comes earlier in the migration order (`apps/api/src/persistence-modules.ts`: `health`, `identity`, `academic`, `work`, `planning`, `notes`, `platform`). Write those foreign keys by hand in migration SQL. A transaction covers one module only.

### Frontend

- `apps/web` styles only through `@kata/design-system` (see [design-system.md](design-system.md)).
- `apps/web` imports `@kata/api` with `import type` only (the Hono RPC `AppType`); it calls the API through `app/api-client.ts`.

## Spec rules A1–A7 and what we do

The product spec ([product/mvp-spec-fr.html](product/mvp-spec-fr.html), §10.4) lists the boundary rules A1–A7. Our layout differs from the spec's (`apps/*` and `packages/*` instead of `services/api` and `lib/*`), and the kickoff overrides A4.

| Spec | Rule (summary) | Kata |
|---|---|---|
| A1 | A backend module imports only `lib/*` packages and its own files, never another module. | A module may import another module's `index.ts`, and only along the graph above (`module-public-api.grit` + module graph test). Shared code lives in `apps/api/src/shared/` and `packages/*`. |
| A2 | Modules talk through a port the caller owns; the app wires it (DI). | Modules talk through the other module's public service interface, injected by `module.ts` from `app.ts` (manual constructor DI). A caller-owned port can be added when a module needs to narrow it. |
| A3 | A module uses only its own Prisma client. | Same (`module-prisma-isolation.grit`). |
| A4 | No foreign key between modules; IDs checked through the port. | **Overridden:** cross-module foreign keys are allowed downward only (migration order), written in SQL. See [database.md](database.md). |
| A5 | Frontend imports the backend with `import type` only. | Same (`web-api-type-only.grit`). |
| A6 | `lib/planner` and `lib/capture-parser` have no I/O. | Not enforced yet: those packages do not exist. Add a rule when they are created. |
| A7 | Enforced by Biome rules (editor feedback) + `tests/architecture` in CI. | Same: GritQL plugins and `noRestrictedImports` in Biome, architecture tests in `tests/architecture`, all run by `bun run check`. |

## Guardrails

Every rule above is checked by a tool, and every failure message says how to fix it. `bun run check` runs all of them. Each rule has a fixture that breaks it and a test that checks the rule reports it (see [testing.md](testing.md#guardrails)).

### Biome (editor and `bun run lint`)

Registered in the root [`biome.json`](../biome.json); the plugins are in [`packages/config/biome-plugins/`](../packages/config/biome-plugins/).

| Rule | Where | Applies to | Reports |
|---|---|---|---|
| Styling libraries | `noRestrictedImports` in `biome.json` | everywhere | `tailwindcss`, `styled-components`, `styled-jsx`, `@emotion/*`, `@vanilla-extract/*`, `@linaria/*`, `@pandacss/*`, `@stitches/*`, `@mui/*`, `@chakra-ui/*`, `goober`, `jss`, `sass`, `less`, `postcss`, `clsx`, `classnames`, … |
| CSS imports | `noRestrictedImports` in `biome.json` | outside `packages/design-system` | imports of `*.css`, `*.scss`, `*.sass`, `*.less` (CSS modules too) |
| No `style=` | `no-inline-style.grit` | outside `packages/design-system` | a JSX `style` attribute |
| No string `className=` | `no-string-classname.grit` | outside `packages/design-system` | `className="…"`, `className={"…"}`, ``className={`…`}`` |
| Tokens only in `stylex.create` | `stylex-tokens-only.grit` | outside `packages/design-system` | hex / `rgb()` / `hsl()` / named colors, `px` / `rem` / `em` sizes, numeric sizes, literal `fontFamily` / `fontWeight` |
| Type-only API import | `web-api-type-only.grit` | `apps/web` | value, inline-`type`, re-export and dynamic imports of `@kata/api` |
| Module public API | `module-public-api.grit` | `apps/api/src` | an import into `modules/<other>/` that is not its `index.ts` (relative or by path), from a module or from app-level code |
| Module Prisma isolation | `module-prisma-isolation.grit` | `apps/api/src/modules` | an import of another module's `prisma/` folder, generated client or `infrastructure/*prisma*` file |
| No Prisma in the core | `no-prisma-in-core.grit` | `modules/*/domain`, `modules/*/application` | `@prisma/*`, `prisma`, any `prisma/` path, `infrastructure/*prisma*` |

The `.css` link that the web app needs for StyleX in dev (`<link href="/virtual:stylex.css">`) is a string, not an import, so it is allowed.

### Architecture tests (`bun run test:arch`)

For rules that need the file system or a view across files. In [`tests/architecture/`](../tests/architecture/).

| Rule | Where | Reports |
|---|---|---|
| No stylesheet files outside the design system | `rules.ts` `stylesheetsOutsideDesignSystem` | any `*.css`, `*.scss`, `*.sass`, `*.less` file outside `packages/design-system` |
| Module dependency direction | `rules.ts` `moduleDependencyViolations`, graph in `module-graph.ts` | an import from one module into another that the graph does not allow; a module folder missing from the graph |

### Tests and coverage

| Rule | Where |
|---|---|
| 90% line coverage per workspace | `coverageThreshold` in each workspace `bunfig.toml`, run by `bun run test:coverage` |
| Everything above, in order, fail fast | `bun run check` ([`scripts/check.ts`](../scripts/check.ts)) |

Suppressing a guardrail (`biome-ignore lint/plugin: …`) needs a reason in the comment and a reviewer's agreement.
