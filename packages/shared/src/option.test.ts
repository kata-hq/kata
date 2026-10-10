import { describe, expect, mock, test } from "bun:test";
import { none, Option, some } from "./index.ts";

const someNum: Option<number> = some(2);
const noneNum: Option<number> = none();

describe("Option", () => {
  test("some and none build tagged values", () => {
    expect(some(1)).toEqual({ some: true, value: 1 });
    expect(none()).toEqual({ some: false });
    expect(Option.some(1)).toEqual(some(1));
    expect(Option.none()).toBe(none());
  });

  test("isSome and isNone", () => {
    expect(Option.isSome(someNum)).toBe(true);
    expect(Option.isSome(noneNum)).toBe(false);
    expect(Option.isNone(someNum)).toBe(false);
    expect(Option.isNone(noneNum)).toBe(true);
  });

  test("fromNullable", () => {
    expect(Option.fromNullable(0)).toEqual(some(0));
    expect(Option.fromNullable("")).toEqual(some(""));
    expect(Option.fromNullable(false)).toEqual(some(false));
    expect(Option.fromNullable(null)).toEqual(none());
    expect(Option.fromNullable(undefined)).toEqual(none());
  });

  test("map", () => {
    expect(Option.map(someNum, (n) => n * 10)).toEqual(some(20));
    const fn = mock((n: number) => n * 10);
    expect(Option.map(noneNum, fn)).toEqual(none());
    expect(fn).not.toHaveBeenCalled();
  });

  test("andThen", () => {
    const half = (n: number): Option<number> => (n % 2 === 0 ? some(n / 2) : none());
    expect(Option.andThen(someNum, half)).toEqual(some(1));
    expect(Option.andThen(some(3), half)).toEqual(none());
    const fn = mock(half);
    expect(Option.andThen(noneNum, fn)).toEqual(none());
    expect(fn).not.toHaveBeenCalled();
  });

  test("tap runs only on some and returns the same option", () => {
    const fn = mock((_: number) => {});
    expect(Option.tap(someNum, fn)).toBe(someNum);
    expect(fn).toHaveBeenCalledWith(2);
    fn.mockClear();
    expect(Option.tap(noneNum, fn)).toBe(noneNum);
    expect(fn).not.toHaveBeenCalled();
  });

  test("match", () => {
    const cases = { some: (n: number) => `some:${n}`, none: () => "none" };
    expect(Option.match(someNum, cases)).toBe("some:2");
    expect(Option.match(noneNum, cases)).toBe("none");
  });

  test("unwrapOr", () => {
    expect(Option.unwrapOr(someNum, 0)).toBe(2);
    expect(Option.unwrapOr(noneNum, 0)).toBe(0);
  });

  test("unwrapOrElse", () => {
    expect(Option.unwrapOrElse(someNum, () => 0)).toBe(2);
    expect(Option.unwrapOrElse(noneNum, () => 0)).toBe(0);
  });

  test("toNullable", () => {
    expect(Option.toNullable(someNum)).toBe(2);
    expect(Option.toNullable(noneNum)).toBeNull();
  });
});
