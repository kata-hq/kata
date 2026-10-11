import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bunFetchApi } from "../test/happy-dom.ts";
import { createHandler, parseServeEnv, startServer } from "./serve.ts";

let root: string;
let upstream: Bun.Server<undefined>;
let handle: (request: Request) => Promise<Response>;
const domFetchApi = { fetch, Request, Response, Headers };

beforeAll(async () => {
  // The bunfig preload installs happy-dom, which replaces fetch/Request/Response. This is server code: use Bun's.
  Object.assign(globalThis, bunFetchApi);
  root = await mkdtemp(join(tmpdir(), "kata-web-serve-"));
  await mkdir(join(root, "assets"));
  await writeFile(join(root, "index.html"), "<!doctype html><title>Kata</title>");
  await writeFile(join(root, "assets", "entry.client-CdCTR-0c.js"), "console.log(1)");
  await writeFile(join(root, "assets", "stylex.css"), "body{}");
  await writeFile(join(root, "favicon.ico"), "icon");
  // Fake API: echoes what it received.
  upstream = Bun.serve({
    port: 0,
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/redirect") return Response.redirect("/elsewhere", 302);
      return Response.json(
        {
          method: request.method,
          path: url.pathname + url.search,
          body: await request.text(),
          forwardedHost: request.headers.get("x-forwarded-host"),
          custom: request.headers.get("x-custom"),
        },
        { status: 201, headers: { "x-upstream": "yes" } },
      );
    },
  });
  handle = createHandler({ root, apiUrl: `http://localhost:${upstream.port}` });
});

afterAll(async () => {
  await upstream.stop(true);
  await rm(root, { recursive: true, force: true });
  Object.assign(globalThis, domFetchApi);
});

const get = (path: string, init?: RequestInit) => handle(new Request(`http://web.test${path}`, init));

describe("static files", () => {
  test("serves index.html at / without long cache", async () => {
    const response = await get("/");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("<title>Kata</title>");
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });

  test("falls back to index.html for client routes (SPA)", async () => {
    const response = await get("/dev/preview?x=1");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await response.text()).toContain("<title>Kata</title>");
  });

  test("caches hashed assets for a year", async () => {
    const response = await get("/assets/entry.client-CdCTR-0c.js");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("console.log(1)");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  test("revalidates unhashed assets and root files", async () => {
    expect((await get("/assets/stylex.css")).headers.get("cache-control")).toBe("no-cache");
    expect((await get("/favicon.ico")).headers.get("cache-control")).toBe("no-cache");
  });

  test("returns 404 for a missing asset instead of the SPA", async () => {
    expect((await get("/assets/missing-AAAAAAAA.js")).status).toBe(404);
  });

  test("never serves files outside the build directory", async () => {
    const response = await get("/%2e%2e%2f%2e%2e%2fetc%2fpasswd");
    expect(response.status).toBe(400);
  });

  test("rejects a malformed path", async () => {
    expect((await get("/%E0%A4%A")).status).toBe(400);
  });

  test("rejects methods other than GET and HEAD", async () => {
    const response = await get("/", { method: "POST" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });
});

describe("/api proxy", () => {
  test("forwards method, path, query, body and headers to API_URL", async () => {
    const response = await get("/api/health?full=1", {
      method: "POST",
      body: "ping",
      headers: { "x-custom": "1" },
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("x-upstream")).toBe("yes");
    expect(await response.json()).toEqual({
      method: "POST",
      path: "/api/health?full=1",
      body: "ping",
      forwardedHost: "web.test",
      custom: "1",
    });
  });

  test("passes redirects through instead of following them", async () => {
    const response = await get("/api/redirect");
    expect(response.status).toBe(302);
  });

  test("answers 502 with the API error body when the API is unreachable", async () => {
    const offline = createHandler({ root, apiUrl: "http://127.0.0.1:1" });
    const response = await offline(new Request("http://web.test/api/health"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: { code: "bad_gateway", message: "The API cannot be reached" },
    });
  });
});

describe("parseServeEnv", () => {
  test("defaults WEB_PORT to 8080", () => {
    expect(parseServeEnv({ API_URL: "http://api:3000" })).toEqual({
      WEB_PORT: 8080,
      API_URL: "http://api:3000",
    });
  });

  test("names every invalid variable", () => {
    expect(() => parseServeEnv({ WEB_PORT: "abc" })).toThrow(
      "WEB_PORT: must be a port number; API_URL: missing",
    );
    expect(() => parseServeEnv({ WEB_PORT: "70000", API_URL: "ftp://x" })).toThrow(
      "WEB_PORT: must be a port number; API_URL: must be an http(s):// URL",
    );
  });
});

test("startServer serves over HTTP", async () => {
  // Port 0: the OS picks a free port.
  const server = startServer({ WEB_PORT: 0, API_URL: `http://localhost:${upstream.port}` }, root);
  try {
    const response = await fetch(`http://localhost:${server.port}/`);
    expect(response.status).toBe(200);
  } finally {
    await server.stop(true);
  }
});
