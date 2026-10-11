import { renderToReadableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";

// SPA mode renders HTML on the server only for the `index.html` shell (build) and the dev server.
// This replaces React Router's default entry, which needs the `isbot` package to detect crawlers;
// with no SSR there are no crawler requests to detect, so it always waits for the full render.
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  let status = responseStatusCode;
  const body = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} />, {
    onError(error: unknown) {
      status = 500;
      console.error(error);
    },
  });
  await body.allReady;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status });
}
