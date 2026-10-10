// Minimal types for the part of @babel/core the CSS test uses (the package ships no types).
declare module "@babel/core" {
  export function transformAsync(
    code: string,
    options: Record<string, unknown>,
  ): Promise<{ code?: string | null; metadata?: { stylex?: unknown[] } } | null>;
}
