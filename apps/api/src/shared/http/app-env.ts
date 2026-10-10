/** Hono context variables set by the app-level middleware. */
export type AppEnv = {
  Variables: {
    /** Set by `requestLog`; also sent back in the `x-request-id` header. */
    requestId: string;
  };
};
