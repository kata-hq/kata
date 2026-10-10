# Backend module pattern

The API (`apps/api`) is one process made of modules. Each module lives in `apps/api/src/modules/<module>/` and has the same layout. The health module is the reference implementation.

## Layout

```
apps/api/src/
  server.ts                 entry point: env → createApp → Bun.serve, graceful shutdown
  app.ts                    THE app-level composition root, exports `type AppType`
  env.ts                    Zod schema of every env variable
  logger.ts                 JSON line logger
  shared/http/              request log middleware, error format, Hono env type
  shared/persistence/       RepositoryError, Prisma error mapping, unit of work, test db helpers
  persistence-modules.ts    ordered list of modules with a database schema
  modules/health/
    domain/                 system-check.ts, health-status.ts
    application/            health-service.ts (+ .test.ts)
    infrastructure/         health-prisma-client.ts, prisma-system-check-repository.ts, health-unit-of-work.ts
    http/                   health-routes.ts (+ .test.ts)
    prisma/                 schema.prisma, prisma.config.ts, migrations/, seed.ts, generated/ (gitignored)
    module.ts               the module composition root
    index.ts                the module public API
```

| Folder / file | Contains | May import |
|---|---|---|
| `domain/` | Entities and value types (`SystemCheck`, `HealthStatus`), repository **interfaces** (`SystemCheckRepository`), domain error types. | `@kata/shared`, `shared/persistence/repository-error.ts`. No Prisma, no Hono. |
| `application/` | The public service **interface** (`HealthService`) and the service **classes** that implement it (`SystemCheckHealthService`). Dependencies come through the constructor and are interfaces (domain repositories, the `Logger`). | `domain/`, `@kata/shared`, `src/logger.ts` (the `Logger` type), other modules' `index.ts` (types). Never Prisma or Hono. |
| `infrastructure/` | Prisma repositories implementing the domain interfaces (`PrismaSystemCheckRepository`), the module's Prisma client factory (`createHealthPrismaClient`), its unit of work. | `domain/`, `prisma/generated/`, `shared/persistence/`. |
| `http/` | A route factory that takes the service interface and returns a Hono app (`createHealthRoutes(service)`), plus Zod request schemas when a route has input. | `application/` (interface types), `domain/` (types), `hono`. |
| `prisma/` | The module's Prisma schema, config, migrations and seed. See [database.md](database.md). | |
| `module.ts` | `createHealthModule({ prisma, logger })` → `{ service, routes }`. The only file of the module that calls `new` on its classes. | Everything in the module. |
| `index.ts` | The public API: `createHealthModule`, `createHealthPrismaClient`, `createHealthRoutes` (for app tests with a fake service), and the types `HealthService`, `HealthStatus`, `DbStatus`, `HealthRoutes`, `HealthModule`, `HealthModuleDeps`, `HealthPrismaClient`. | The module's own files. |

Code outside a module imports **only** `modules/<module>/index.ts`. Tests inside the module may import its internal files.

## Composition roots

There are two levels, and nothing else creates objects with `new`:

1. **Module root** (`module.ts`). It receives what it cannot build itself (its Prisma client, the logger, other modules' services) and wires its classes with constructor injection:

   ```ts
   export function createHealthModule({ prisma, logger }: HealthModuleDeps): HealthModule {
     const service = new SystemCheckHealthService(new PrismaSystemCheckRepository(prisma), logger);
     return { service, routes: createHealthRoutes(service) };
   }
   ```

2. **App root** (`apps/api/src/app.ts`). `createApp(env, logger)` builds each module's Prisma client, calls each module root in dependency order, and passes the routes to `buildApp`, which adds the request log, the error handler and the 404 handler, then mounts each module at `/api/<module>`. `createApp` returns `{ app, close }`; `close` disconnects every Prisma client. `server.ts` calls `createApp` once per process start, and once more on each reload under `bun --hot` (it closes the previous app's clients first). It calls `close` on `SIGINT` / `SIGTERM`.

Manual constructor injection only: no DI container, no decorators, no service locator. Add an interface or a layer only when there is a current need for it.

### Hono RPC

`buildApp` must chain `.route()` calls (`return app.route("/api/health", …).route("/api/<next>", …)`) and each route factory must chain `.get()` / `.post()` on `new Hono()`. The return type carries every route, status code and body type; `export type AppType = ReturnType<typeof buildApp>` gives the web client `hc<AppType>(…)`. `@kata/api` exports `src/app.ts`, so the web app imports `import type { AppType } from "@kata/api"`. A route returns each status with its own `c.json(body, status)` so the client can narrow on `res.status`.

## Results and errors

- **Expected failures are `Result`s**, not exceptions (`ok(...)`, `err(...)` from `@kata/shared`, narrowed with `r.ok`).
- **Repositories** return `Result<T, RepositoryError>` (`unique-violation`, `not-found`, `foreign-key-violation`). Prisma errors are mapped in one place, `shared/persistence/prisma-errors.ts` (`runQuery`). Anything else (lost connection, a bug) is thrown.
- **Services** return `Result<T, E>` with a module error type the routes can turn into a status. They catch a thrown error only when it is an expected outcome of their use case: `HealthService.check()` returns `Err({ db: "down" })` when the repository throws, because detecting an outage is its job, and logs the error name and code (`warn`) so a bug does not pass silently for an outage.
- **Routes** map `Ok` / `Err` to status codes. An error they do not handle is thrown to the app error handler.
- **Error responses** always have the body `{ "error": { "code": string, "message": string } }` (`shared/http/errors.ts`). Unknown routes → 404 `not_found`. A `HTTPException` keeps its status. Any other thrown error → 500 `internal_error`, logged with its stack; the stack and message never reach the client.
- **Transactions** use the module's unit of work (`createHealthUnitOfWork`): commit on `Ok`, roll back on `Err` or throw. One transaction never spans two modules.

## Using another module

A module that needs another module's behavior depends on that module's **public service interface**, never on its repositories, Prisma client or tables. Example: a future `academic` module that needs the health service.

```ts
// modules/academic/application/course-service.ts
import type { HealthService } from "../../health/index.ts";

export class CourseService {
  constructor(
    private readonly courses: CourseRepository, // academic's own domain interface
    private readonly health: HealthService,     // another module, through its index.ts
  ) {}
}

// modules/academic/module.ts
export type AcademicModuleDeps = { readonly prisma: AcademicPrismaClient; readonly health: HealthService };

export function createAcademicModule({ prisma, health }: AcademicModuleDeps) {
  const service = new CourseService(new PrismaCourseRepository(prisma), health);
  return { service, routes: createAcademicRoutes(service) };
}

// app.ts (createApp): build the dependency first, then pass its service.
const health = createHealthModule({ prisma: healthPrisma, logger });
const academic = createAcademicModule({ prisma: academicPrisma, health: health.service });
```

The allowed direction between modules is fixed (see `persistence-modules.ts`): a module may depend only on modules listed before it. In a unit test, pass a fake object that implements the interface (`const health: HealthService = { check: async () => ok(...) }`).

## Tests

- `application/*.test.ts`: the service with fake repositories (classes implementing the domain interface). No database.
- `http/*.test.ts`: the route factory with a fake service, through `routes.request(...)`.
- `src/app.test.ts`: `buildApp` with fake services: status codes, request log line, error format, `AppType` with `hc`.
- `infrastructure/*.int.test.ts` and `module.int.test.ts`: real Postgres (`bun run test:int`).
