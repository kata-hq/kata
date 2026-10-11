// Production server of the web image: serves the static SPA build and proxies `/api` to the API.
// Bun APIs only (no dependencies), so the runtime image needs no node_modules.
import { stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

export type ServeEnv = {
  /** Port this server listens on. */
  readonly WEB_PORT: number;
  /** Origin of the API (for example `http://api:3000`). `/api/*` is forwarded there. */
  readonly API_URL: string;
};

/** Parses the environment. Throws one error that names every missing or invalid variable (never its value). */
export function parseServeEnv(source: Readonly<Record<string, string | undefined>>): ServeEnv {
  const problems: string[] = [];
  const rawPort = source["WEB_PORT"] ?? "8080";
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65_535) problems.push("WEB_PORT: must be a port number");
  const apiUrl = source["API_URL"];
  if (apiUrl === undefined || apiUrl === "") problems.push("API_URL: missing");
  else if (!/^https?:$/.test(URL.parse(apiUrl)?.protocol ?? ""))
    problems.push("API_URL: must be an http(s):// URL");
  if (problems.length > 0) throw new Error(`Invalid web environment: ${problems.join("; ")}`);
  return { WEB_PORT: port, API_URL: apiUrl as string };
}

/** Vite names built files `<name>-<8 char hash>.<ext>`: they never change, so browsers may keep them for a year. */
const HASHED_FILE = /-[\w-]{8}\.\w+$/;
const IMMUTABLE = "public, max-age=31536000, immutable";
/** Everything else (index.html, unhashed files such as `assets/stylex.css`) is revalidated on each load. */
const REVALIDATE = "no-cache";

/** Request headers that describe one connection, not the request: never forwarded. */
const HOP_BY_HOP = ["connection", "keep-alive", "transfer-encoding", "upgrade", "host"];

export type HandlerOptions = {
  /** Directory of the client build (`build/client`). */
  readonly root: string;
  readonly apiUrl: string;
};

export function createHandler({ root, apiUrl }: HandlerOptions): (request: Request) => Promise<Response> {
  const rootDir = resolve(root);
  const upstream = new URL(apiUrl);

  return async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return proxy(request, url, upstream);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    const path = filePath(rootDir, url.pathname);
    if (path === undefined) return new Response("Bad Request", { status: 400 });
    if (await isFile(path)) {
      const cache = url.pathname.startsWith("/assets/") && HASHED_FILE.test(path) ? IMMUTABLE : REVALIDATE;
      return new Response(Bun.file(path), { headers: { "cache-control": cache } });
    }
    // A missing build file is a real 404; any other path is a client route of the SPA.
    if (url.pathname.startsWith("/assets/")) return new Response("Not Found", { status: 404 });
    return new Response(Bun.file(join(rootDir, "index.html")), {
      headers: { "cache-control": REVALIDATE, "content-type": "text/html; charset=utf-8" },
    });
  };
}

/** The file for a URL path, or undefined when the path is malformed or leaves the build directory. */
function filePath(rootDir: string, pathname: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  const path = resolve(rootDir, `.${decoded}`);
  return path === rootDir || path.startsWith(rootDir + sep) ? path : undefined;
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function proxy(request: Request, url: URL, upstream: URL): Promise<Response> {
  const target = new URL(url.pathname + url.search, upstream);
  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : null,
      redirect: "manual",
      // Pass the body through as the API sent it (keeps content-encoding correct).
      decompress: false,
    });
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch {
    return Response.json(
      { error: { code: "bad_gateway", message: "The API cannot be reached" } },
      { status: 502 },
    );
  }
}

/** Starts the server. Stops it on SIGINT/SIGTERM (the process is PID 1 in a container). */
export function startServer(env: ServeEnv, root: string): Bun.Server<undefined> {
  const server = Bun.serve({ port: env.WEB_PORT, fetch: createHandler({ root, apiUrl: env.API_URL }) });
  console.log(JSON.stringify({ level: "info", msg: "web started", port: server.port, api: env.API_URL }));
  return server;
}

if (import.meta.main) {
  const server = startServer(parseServeEnv(process.env), join(import.meta.dir, "../build/client"));
  const shutdown = () => void server.stop().then(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
