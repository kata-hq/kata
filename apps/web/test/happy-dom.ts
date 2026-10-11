import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Runs first (see bunfig.toml): the DOM must exist before Testing Library is imported.
GlobalRegistrator.register();
