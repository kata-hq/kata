/**
 * Result: an expected success or failure. API adapted from `@punpun-dev/ts-result` 0.1.4,
 * rewritten as a discriminated union with standalone functions.
 */

import { none, type Option, some } from "./option.ts";

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<T, E> {
  return value === null || value === undefined ? err(error) : ok(value);
}

export function fromOption<T, E>(option: Option<T>, error: E): Result<T, E> {
  return option.some ? ok(option.value) : err(error);
}

/** Runs `fn` and captures a thrown error or a rejected promise as `Err`. */
export async function tryCatch<T>(fn: () => T | Promise<T>): Promise<Result<T, unknown>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error);
  }
}

/** Collects all values, or returns the first `Err`. */
export function all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
}

export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

export function andThen<T, E, U, F = E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, F>,
): Result<U, E | F> {
  return result.ok ? fn(result.value) : result;
}

export function orElse<T, E, U = T, F = E>(
  result: Result<T, E>,
  fn: (error: E) => Result<U, F>,
): Result<T | U, F> {
  return result.ok ? result : fn(result.error);
}

export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (result.ok) fn(result.value);
  return result;
}

export function tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (!result.ok) fn(result.error);
  return result;
}

export function match<T, E, U>(
  result: Result<T, E>,
  cases: { ok: (value: T) => U; err: (error: E) => U },
): U {
  return result.ok ? cases.ok(result.value) : cases.err(result.error);
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function unwrapOrElse<T, E>(result: Result<T, E>, fallbackFn: (error: E) => T): T {
  return result.ok ? result.value : fallbackFn(result.error);
}

/** Returns the value or throws. For tests and impossible states only; expected errors stay `Result`s. */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw new Error("Tried to unwrap an Err result", { cause: result.error });
}

export function toOption<T, E>(result: Result<T, E>): Option<T> {
  return result.ok ? some(result.value) : none();
}

export function toNullable<T, E>(result: Result<T, E>): T | null {
  return result.ok ? result.value : null;
}
