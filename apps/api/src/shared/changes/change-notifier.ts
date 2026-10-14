import type { Logger } from "../../logger.ts";

/**
 * Tells other modules that a workspace's data changed (spec M6, 10.5). A module calls it after its write
 * committed; `app.ts` wires the listeners (the planner's replan). No events table, no worker.
 */
export type ChangeNotifier = {
  /** Runs every listener. Never throws: a failing listener is logged and the write stays. */
  notify(workspaceId: string): Promise<void>;
};

/** Reacts to a change in one workspace (for example `planning.replan`). */
export type ChangeListener = (workspaceId: string) => Promise<void>;

/** A notifier that runs `listeners` in order. A listener that throws is logged and the next one still runs. */
export function createChangeNotifier(listeners: readonly ChangeListener[], logger: Logger): ChangeNotifier {
  return {
    async notify(workspaceId) {
      for (const listener of listeners) {
        try {
          await listener(workspaceId);
        } catch (error) {
          // Error class only: a message could hold user data. No workspace id either.
          logger.warn("change listener failed", {
            error: error instanceof Error ? error.name : typeof error,
          });
        }
      }
    },
  };
}
