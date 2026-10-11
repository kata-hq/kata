import { GlobalRegistrator } from "@happy-dom/global-registrator";

/** Bun's own fetch API, saved before happy-dom replaces it. Tests of server code (server/) swap it back in. */
export const bunFetchApi = { fetch, Request, Response, Headers };

// Runs first (see bunfig.toml): the DOM must exist before Testing Library is imported.
GlobalRegistrator.register();
