import { describe, expect, test } from "bun:test";
import { createLogger } from "../../logger.ts";
import { createChangeNotifier } from "./change-notifier.ts";

function setup() {
  const lines: string[] = [];
  const logger = createLogger({ write: (line) => lines.push(line) });
  const logs = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { logger, logs };
}

class ReplanError extends Error {
  override name = "ReplanError";
}

describe("createChangeNotifier", () => {
  test("calls every listener in order with the workspace id", async () => {
    const { logger } = setup();
    const calls: string[] = [];
    const notifier = createChangeNotifier(
      [async (id) => void calls.push(`a ${id}`), async (id) => void calls.push(`b ${id}`)],
      logger,
    );

    await notifier.notify("ws-1");

    expect(calls).toEqual(["a ws-1", "b ws-1"]);
  });

  test("without listeners it does nothing", async () => {
    const { logger, logs } = setup();

    await createChangeNotifier([], logger).notify("ws-1");

    expect(logs()).toEqual([]);
  });

  test("a listener that throws is logged with its error class only, and the next one still runs", async () => {
    const { logger, logs } = setup();
    const calls: string[] = [];
    const notifier = createChangeNotifier(
      [
        async () => {
          throw new ReplanError("course lea@example.com not found");
        },
        async () => {
          throw "not an error";
        },
        async (id) => void calls.push(id),
      ],
      logger,
    );

    await notifier.notify("ws-1");

    expect(calls).toEqual(["ws-1"]);
    expect(logs()).toEqual([
      expect.objectContaining({ level: "warn", msg: "change listener failed", error: "ReplanError" }),
      expect.objectContaining({ level: "warn", msg: "change listener failed", error: "string" }),
    ]);
    const raw = JSON.stringify(logs());
    expect(raw).not.toContain("lea@example.com");
    expect(raw).not.toContain("ws-1");
  });
});
