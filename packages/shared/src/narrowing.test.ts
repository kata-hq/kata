// Type-level tests: checked by `bun run typecheck`. The runtime asserts keep `bun test` honest.
import { describe, expect, expectTypeOf, test } from "bun:test";
import { type Err, err, none, type Ok, type Option, ok, type Result, type Some, some } from "./index.ts";

function parse(input: string): Result<number, "nan"> {
  const n = Number(input);
  return Number.isNaN(n) ? err("nan") : ok(n);
}

function lookup(key: string): Option<string> {
  return key === "a" ? some("A") : none();
}

describe("narrowing", () => {
  test("if (r.ok) narrows to the value, else to the error", () => {
    const r = parse("1");
    if (r.ok) {
      expectTypeOf(r).toEqualTypeOf<Ok<number>>();
      expectTypeOf(r.value).toEqualTypeOf<number>();
      // @ts-expect-error an Ok has no error
      r.error;
      expect(r.value).toBe(1);
    } else {
      expectTypeOf(r).toEqualTypeOf<Err<"nan">>();
      expectTypeOf(r.error).toEqualTypeOf<"nan">();
      // @ts-expect-error an Err has no value
      r.value;
    }
  });

  test("the value is not readable before narrowing", () => {
    const r = parse("x");
    // @ts-expect-error value exists only on Ok
    r.value;
    expect(r.ok).toBe(false);
  });

  test("if (o.some) narrows to the value", () => {
    const o = lookup("a");
    if (o.some) {
      expectTypeOf(o).toEqualTypeOf<Some<string>>();
      expectTypeOf(o.value).toEqualTypeOf<string>();
      expect(o.value).toBe("A");
    } else {
      // @ts-expect-error None has no value
      o.value;
    }
  });
});
