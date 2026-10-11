import { describe, expect, test } from "bun:test";
import { parseWebEnv } from "./web-env.ts";

describe("parseWebEnv", () => {
  test("uses the defaults when nothing is set", () => {
    expect(parseWebEnv({})).toEqual({ WEB_PORT: 5173, API_URL: "http://localhost:3000" });
  });

  test("builds API_URL from API_PORT", () => {
    expect(parseWebEnv({ WEB_PORT: "5121", API_PORT: "3021" })).toEqual({
      WEB_PORT: 5121,
      API_URL: "http://localhost:3021",
    });
  });

  test("API_URL wins over API_PORT", () => {
    expect(parseWebEnv({ API_PORT: "3021", API_URL: "http://api.local:8080" }).API_URL).toBe(
      "http://api.local:8080",
    );
  });

  test("names each invalid variable", () => {
    expect(() => parseWebEnv({ WEB_PORT: "abc", API_URL: "ftp://x" })).toThrow(
      "Invalid web environment: WEB_PORT: must be a port number; API_URL: must be an http(s):// URL",
    );
  });
});
