// Breaks: web-api-type-only.grit (value import, inline `type` specifier, re-export, dynamic import)
import { buildApp } from "@kata/api";
import { type AppType } from "@kata/api";

export { createApp } from "@kata/api";
export const load = () => import("@kata/api");
export type Api = AppType;
export const app = buildApp;
