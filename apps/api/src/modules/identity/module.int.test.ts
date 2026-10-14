import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { createLogger } from "../../logger.ts";
import { resetTestDatabase } from "../../shared/persistence/database-admin.ts";
import { testDatabaseUrl } from "../../shared/persistence/test-database.ts";
import { AUTH_BASE_PATH, createIdentityModule, createIdentityPrismaClient } from "./index.ts";

const ORIGIN = "http://localhost:5173";
const url = testDatabaseUrl();
const db = createIdentityPrismaClient(url);
const lines: string[] = [];
const identity = createIdentityModule({
  prisma: db,
  logger: createLogger({ level: "debug", write: (line) => lines.push(line) }),
  auth: { secret: "a-test-secret-of-at-least-32-characters", baseURL: ORIGIN },
});
const app = new Hono().route(AUTH_BASE_PATH, identity.authRoutes);

const LEA = { name: "Léa", email: "lea@example.com", password: "correct-horse-1" };

function post(path: string, body: unknown, cookie?: string) {
  return app.request(`${ORIGIN}${AUTH_BASE_PATH}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function session(cookie: string | undefined) {
  const res = await app.request(`${ORIGIN}${AUTH_BASE_PATH}/get-session`, {
    headers: cookie ? { cookie } : {},
  });
  return (await res.json()) as { user: { email: string; timezone: string; locale: string } } | null;
}

/** The `name=value` part of the session cookie set by a response. */
function sessionCookie(res: Response): string | undefined {
  const cookie = res.headers.getSetCookie().find((value) => value.includes("session_token="));
  return cookie?.split(";")[0];
}

beforeEach(async () => {
  await resetTestDatabase(url, ["identity"]);
  lines.length = 0;
});
afterAll(() => db.$disconnect());

describe("sign-up", () => {
  test("creates the user, hashes the password and signs in with an HttpOnly, SameSite=Lax cookie", async () => {
    const res = await post("/sign-up/email", LEA);

    expect(res.status).toBe(200);
    const setCookie = res.headers.getSetCookie().find((value) => value.includes("session_token="));
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect((await session(sessionCookie(res)))?.user).toMatchObject({
      email: LEA.email,
      timezone: "Europe/Paris",
      locale: "fr",
    });

    const user = await db.user.findUniqueOrThrow({
      where: { email: LEA.email },
      include: { accounts: true },
    });
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
    expect(user.accounts).toHaveLength(1);
    expect(user.accounts[0]?.providerId).toBe("credential");
    expect(user.accounts[0]?.password).not.toContain(LEA.password);
  });

  test("an email already used fails and creates nothing", async () => {
    await post("/sign-up/email", LEA);

    const res = await post("/sign-up/email", { ...LEA, name: "Other" });

    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" });
    expect(await db.user.count()).toBe(1);
  });

  test.each([
    ["a bad email", { ...LEA, email: "not-an-email" }],
    ["a password under 8 characters", { ...LEA, password: "short" }],
  ])("%s fails with 400 and creates nothing", async (_, body) => {
    const res = await post("/sign-up/email", body);

    expect(res.status).toBe(400);
    expect(await db.user.count()).toBe(0);
  });
});

describe("sign-in and sign-out", () => {
  beforeEach(async () => {
    await post("/sign-up/email", LEA);
  });

  test("good credentials give a session cookie", async () => {
    const res = await post("/sign-in/email", { email: LEA.email, password: LEA.password });

    expect(res.status).toBe(200);
    expect((await session(sessionCookie(res)))?.user.email).toBe(LEA.email);
  });

  test("a wrong password is 401 without a cookie", async () => {
    const res = await post("/sign-in/email", { email: LEA.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(sessionCookie(res)).toBeUndefined();
  });

  test("sign-out ends the session", async () => {
    const signIn = await post("/sign-in/email", { email: LEA.email, password: LEA.password });
    const cookie = sessionCookie(signIn);

    const res = await post("/sign-out", {}, cookie);

    expect(res.status).toBe(200);
    expect(await session(cookie)).toBeNull();
  });
});

test("no log line holds an email, a password or a token", async () => {
  const signUp = await post("/sign-up/email", LEA);
  await post("/sign-up/email", LEA);
  await post("/sign-in/email", { email: LEA.email, password: "wrong-password" });
  await post("/sign-out", {}, sessionCookie(signUp));

  const logs = lines.join("\n");
  expect(logs).not.toContain(LEA.email);
  expect(logs).not.toContain(LEA.password);
  expect(logs).not.toContain("session_token");
});
