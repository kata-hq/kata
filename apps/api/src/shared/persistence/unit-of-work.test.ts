import { describe, expect, test } from "bun:test";
import { err, ok } from "@kata/shared";
import { createLogger } from "../../logger.ts";
import { type ChangeNotifier, createChangeNotifier } from "../changes/change-notifier.ts";
import { createUnitOfWork, runAndNotify, type TransactionalClient } from "./unit-of-work.ts";

/** A transactional client that records commits and rollbacks like Prisma: rollback when the callback throws. */
function fakeClient(events: string[]): TransactionalClient<"tx"> {
  return {
    async $transaction(fn) {
      try {
        const result = await fn("tx");
        events.push("commit");
        return result;
      } catch (error) {
        events.push("rollback");
        throw error;
      }
    },
  };
}

function setup() {
  const events: string[] = [];
  const unitOfWork = createUnitOfWork(fakeClient(events), (tx) => ({ tx }));
  const notifier: ChangeNotifier = {
    notify: async (workspaceId) => {
      events.push(`notify ${workspaceId}`);
    },
  };
  return { events, unitOfWork, notifier };
}

describe("createUnitOfWork", () => {
  test("gives the work repositories bound to the transaction and commits on Ok", async () => {
    const { events, unitOfWork } = setup();

    const result = await unitOfWork.run(async ({ tx }) => ok(tx));

    expect(result).toEqual(ok("tx"));
    expect(events).toEqual(["commit"]);
  });

  test("rolls back on Err and returns the Err", async () => {
    const { events, unitOfWork } = setup();

    expect(await unitOfWork.run(async () => err("conflict"))).toEqual(err("conflict"));
    expect(events).toEqual(["rollback"]);
  });

  test("rolls back on a throw and throws it again", async () => {
    const { events, unitOfWork } = setup();
    const boom = new Error("boom");

    await expect(
      unitOfWork.run(async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
    expect(events).toEqual(["rollback"]);
  });
});

describe("runAndNotify", () => {
  test("notifies the workspace once, after the commit of an Ok", async () => {
    const { events, unitOfWork, notifier } = setup();

    const result = await runAndNotify(unitOfWork, notifier, "ws-1", async () => ok(42));

    expect(result).toEqual(ok(42));
    expect(events).toEqual(["commit", "notify ws-1"]);
  });

  test("does not notify on Err", async () => {
    const { events, unitOfWork, notifier } = setup();

    expect(await runAndNotify(unitOfWork, notifier, "ws-1", async () => err("invalid"))).toEqual(
      err("invalid"),
    );
    expect(events).toEqual(["rollback"]);
  });

  test("does not notify on a throw", async () => {
    const { events, unitOfWork, notifier } = setup();

    await expect(
      runAndNotify(unitOfWork, notifier, "ws-1", async () => {
        throw new Error("bug");
      }),
    ).rejects.toThrow("bug");
    expect(events).toEqual(["rollback"]);
  });

  test("a failing listener keeps the committed result", async () => {
    const { events, unitOfWork } = setup();
    const logger = createLogger({ write: () => {} });
    const notifier = createChangeNotifier(
      [
        async () => {
          throw new Error("replan failed");
        },
      ],
      logger,
    );

    expect(await runAndNotify(unitOfWork, notifier, "ws-1", async () => ok("saved"))).toEqual(ok("saved"));
    expect(events).toEqual(["commit"]);
  });
});
