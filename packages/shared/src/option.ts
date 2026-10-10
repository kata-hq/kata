/**
 * Option: a value that may be absent. API adapted from `@punpun-dev/ts-option` 0.1.0,
 * rewritten as a discriminated union with standalone functions.
 */

export type Some<T> = { readonly some: true; readonly value: T };
export type None = { readonly some: false };
export type Option<T> = Some<T> | None;

const NONE: None = Object.freeze({ some: false });

export function some<T>(value: T): Option<T> {
  return { some: true, value };
}

export function none<T = never>(): Option<T> {
  return NONE;
}

export function isSome<T>(option: Option<T>): option is Some<T> {
  return option.some;
}

export function isNone<T>(option: Option<T>): option is None {
  return !option.some;
}

export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value === null || value === undefined ? NONE : some(value);
}

export function map<T, U>(option: Option<T>, fn: (value: T) => U): Option<U> {
  return option.some ? some(fn(option.value)) : NONE;
}

export function andThen<T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> {
  return option.some ? fn(option.value) : NONE;
}

export function tap<T>(option: Option<T>, fn: (value: T) => void): Option<T> {
  if (option.some) fn(option.value);
  return option;
}

export function match<T, U>(option: Option<T>, cases: { some: (value: T) => U; none: () => U }): U {
  return option.some ? cases.some(option.value) : cases.none();
}

export function unwrapOr<T>(option: Option<T>, fallback: T): T {
  return option.some ? option.value : fallback;
}

export function unwrapOrElse<T>(option: Option<T>, fallbackFn: () => T): T {
  return option.some ? option.value : fallbackFn();
}

export function toNullable<T>(option: Option<T>): T | null {
  return option.some ? option.value : null;
}
