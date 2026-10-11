// Breaks the module graph: health depends on nothing.
export const load = () => import("../identity/index.ts");
