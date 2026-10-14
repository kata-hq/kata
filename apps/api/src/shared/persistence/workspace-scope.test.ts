import { describe, expect, test } from "bun:test";
import { scoped, workspaceScope } from "./workspace-scope.ts";

describe("workspaceScope", () => {
  test("filters by workspace and keeps rows that are not deleted", () => {
    expect(workspaceScope("ws-1")).toEqual({ workspaceId: "ws-1", deletedAt: null });
  });
});

describe("scoped", () => {
  test("without a filter it is the scope", () => {
    expect(scoped("ws-1")).toEqual({ workspaceId: "ws-1", deletedAt: null });
  });

  test("keeps the model's own filter", () => {
    expect(scoped("ws-1", { id: "c-1", name: { contains: "math" } })).toEqual({
      id: "c-1",
      name: { contains: "math" },
      workspaceId: "ws-1",
      deletedAt: null,
    });
  });

  test("the scope wins over a conflicting workspaceId or deletedAt", () => {
    const where = { workspaceId: "other", deletedAt: { not: null } };

    expect(scoped("ws-1", where)).toEqual({ workspaceId: "ws-1", deletedAt: null });
  });
});
