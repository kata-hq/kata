import { describe, expect, mock, test } from "bun:test";
import { err, none, ok, Result, some } from "./index.ts";

const okNum: Result<number, string> = ok(2);
const errNum: Result<number, string> = err("boom");

describe("Result", () => {
  test("ok and err build tagged values", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("e")).toEqual({ ok: false, error: "e" });
    expect(Result.ok(1)).toEqual(ok(1));
    expect(Result.err("e")).toEqual(err("e"));
  });

  test("isOk and isErr", () => {
    expect(Result.isOk(okNum)).toBe(true);
    expect(Result.isOk(errNum)).toBe(false);
    expect(Result.isErr(okNum)).toBe(false);
    expect(Result.isErr(errNum)).toBe(true);
  });

  test("fromNullable", () => {
    expect(Result.fromNullable(0, "missing")).toEqual(ok(0));
    expect(Result.fromNullable("", "missing")).toEqual(ok(""));
    expect(Result.fromNullable(null, "missing")).toEqual(err("missing"));
    expect(Result.fromNullable(undefined, "missing")).toEqual(err("missing"));
  });

  test("fromOption", () => {
    expect(Result.fromOption(some(1), "missing")).toEqual(ok(1));
    expect(Result.fromOption(none(), "missing")).toEqual(err("missing"));
  });

  test("tryCatch captures values, throws and rejections", async () => {
    expect(await Result.tryCatch(() => 1)).toEqual(ok(1));
    expect(await Result.tryCatch(async () => 2)).toEqual(ok(2));
    const failure = new Error("sync");
    expect(
      await Result.tryCatch(() => {
        throw failure;
      }),
    ).toEqual(err(failure));
    expect(await Result.tryCatch(() => Promise.reject("async"))).toEqual(err("async"));
  });

  test("all collects values or returns the first error", () => {
    expect(Result.all([ok(1), ok(2)])).toEqual(ok([1, 2]));
    expect(Result.all([])).toEqual(ok([]));
    expect(Result.all<number, string>([ok(1), err("a"), err("b")])).toEqual(err("a"));
  });

  test("map", () => {
    expect(Result.map(okNum, (n) => n * 10)).toEqual(ok(20));
    const fn = mock((n: number) => n * 10);
    expect(Result.map(errNum, fn)).toEqual(err("boom"));
    expect(fn).not.toHaveBeenCalled();
  });

  test("mapErr", () => {
    expect(Result.mapErr(errNum, (e) => e.length)).toEqual(err(4));
    const fn = mock((e: string) => e.length);
    expect(Result.mapErr(okNum, fn)).toEqual(ok(2));
    expect(fn).not.toHaveBeenCalled();
  });

  test("andThen", () => {
    const half = (n: number): Result<number, string> => (n % 2 === 0 ? ok(n / 2) : err("odd"));
    expect(Result.andThen(okNum, half)).toEqual(ok(1));
    expect(Result.andThen(ok(3), half)).toEqual(err("odd"));
    const fn = mock(half);
    expect(Result.andThen(errNum, fn)).toEqual(err("boom"));
    expect(fn).not.toHaveBeenCalled();
  });

  test("orElse", () => {
    expect(Result.orElse(errNum, () => ok(0))).toEqual(ok(0));
    expect(Result.orElse(errNum, (e) => err(e.toUpperCase()))).toEqual(err("BOOM"));
    const fn = mock(() => ok(0));
    expect(Result.orElse(okNum, fn)).toEqual(ok(2));
    expect(fn).not.toHaveBeenCalled();
  });

  test("tap runs only on ok and returns the same result", () => {
    const fn = mock((_: number) => {});
    expect(Result.tap(okNum, fn)).toBe(okNum);
    expect(fn).toHaveBeenCalledWith(2);
    fn.mockClear();
    expect(Result.tap(errNum, fn)).toBe(errNum);
    expect(fn).not.toHaveBeenCalled();
  });

  test("tapErr runs only on err and returns the same result", () => {
    const fn = mock((_: string) => {});
    expect(Result.tapErr(errNum, fn)).toBe(errNum);
    expect(fn).toHaveBeenCalledWith("boom");
    fn.mockClear();
    expect(Result.tapErr(okNum, fn)).toBe(okNum);
    expect(fn).not.toHaveBeenCalled();
  });

  test("match", () => {
    const cases = { ok: (n: number) => `ok:${n}`, err: (e: string) => `err:${e}` };
    expect(Result.match(okNum, cases)).toBe("ok:2");
    expect(Result.match(errNum, cases)).toBe("err:boom");
  });

  test("unwrapOr", () => {
    expect(Result.unwrapOr(okNum, 0)).toBe(2);
    expect(Result.unwrapOr(errNum, 0)).toBe(0);
  });

  test("unwrapOrElse", () => {
    expect(Result.unwrapOrElse(okNum, () => 0)).toBe(2);
    expect(Result.unwrapOrElse(errNum, (e) => e.length)).toBe(4);
  });

  test("unwrapOrThrow", () => {
    expect(Result.unwrapOrThrow(okNum)).toBe(2);
    expect(() => Result.unwrapOrThrow(errNum)).toThrow("Tried to unwrap an Err result");
  });

  test("toOption", () => {
    expect(Result.toOption(okNum)).toEqual(some(2));
    expect(Result.toOption(errNum)).toEqual(none());
  });

  test("toNullable", () => {
    expect(Result.toNullable(okNum)).toBe(2);
    expect(Result.toNullable(errNum)).toBeNull();
  });
});
