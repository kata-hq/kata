import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, useLoaderData } from "react-router";
import { createApiClient } from "../../../api-client.ts";
import { fetchHealth } from "../api/health-api.ts";
import { formatCheckTime, HealthView } from "./HealthView.tsx";

const lastCheck = "2026-10-10T08:00:00.000Z";
const later = "2026-10-10T08:05:00.000Z";

type FakeAnswer = { status: number; body: unknown } | Error;

/** A real `hc<AppType>` client whose fetch answers from `answers`, one per request (the last one repeats). */
function fakeClient(...answers: FakeAnswer[]) {
  const requests: string[] = [];
  const fetch = (async (input: RequestInfo | URL) => {
    requests.push(new Request(input).url);
    const answer = answers[Math.min(requests.length - 1, answers.length - 1)];
    if (answer === undefined || answer instanceof Error) throw answer ?? new Error("no answer");
    return Response.json(answer.body, { status: answer.status });
  }) as typeof globalThis.fetch;
  return { client: createApiClient("http://kata.test", fetch), requests };
}

/** Renders the health view behind a route whose loader uses `client`, like `routes/home.tsx`. */
function renderHealth(client: ReturnType<typeof fakeClient>["client"]) {
  const Stub = createRoutesStub([
    {
      path: "/",
      loader: () => fetchHealth(client),
      Component: () => <HealthView health={useLoaderData<typeof fetchHealth>()} />,
    },
  ]);
  return render(<Stub initialEntries={["/"]} />);
}

describe("HealthView", () => {
  test("shows API ok, database ok and the last check time", async () => {
    const { client, requests } = fakeClient({ status: 200, body: { api: "ok", db: "ok", lastCheck } });
    renderHealth(client);

    expect(await screen.findByText("API ok")).toBeDefined();
    expect(screen.getByText("Database ok")).toBeDefined();
    expect(screen.getByText(`Last system check: ${formatCheckTime(lastCheck)}`)).toBeDefined();
    expect(requests).toEqual(["http://kata.test/api/health"]);
  });

  test("shows database down from the 503 body", async () => {
    const { client } = fakeClient({ status: 503, body: { api: "ok", db: "down", lastCheck } });
    renderHealth(client);

    expect(await screen.findByText("Database down")).toBeDefined();
    expect(screen.getByText("API ok")).toBeDefined();
    expect(screen.getByText(`Last system check: ${formatCheckTime(lastCheck)}`)).toBeDefined();
  });

  test("shows an error when the API cannot be reached", async () => {
    const { client } = fakeClient(new TypeError("Failed to fetch"));
    renderHealth(client);

    expect((await screen.findByRole("alert")).textContent).toBe("Cannot reach the API (Failed to fetch).");
    expect(screen.queryByText("API ok")).toBeNull();
  });

  test("shows an error when a proxy answers instead of the API", async () => {
    const { client } = fakeClient({ status: 502, body: {} });
    renderHealth(client);

    expect((await screen.findByRole("alert")).textContent).toBe("Cannot reach the API (HTTP 502).");
  });

  test("Refresh fetches the status again", async () => {
    const { client, requests } = fakeClient(
      { status: 200, body: { api: "ok", db: "ok", lastCheck } },
      { status: 503, body: { api: "ok", db: "down", lastCheck: later } },
    );
    renderHealth(client);
    expect(await screen.findByText("Database ok")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("Database down")).toBeDefined();
    expect(screen.getByText(`Last system check: ${formatCheckTime(later)}`)).toBeDefined();
    expect(requests).toHaveLength(2);
  });
});
