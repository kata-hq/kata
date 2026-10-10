// `Result` and `Option` are both a type and a namespace of helpers:
//   const r: Result<number, string> = Result.ok(1);
//   Result.map(r, (n) => n + 1);
import * as OptionHelpers from "./option.ts";
import * as ResultHelpers from "./result.ts";

export type Option<T> = OptionHelpers.Option<T>;
export const Option = OptionHelpers;
export type Result<T, E> = ResultHelpers.Result<T, E>;
export const Result = ResultHelpers;

export type { None, Some } from "./option.ts";
export { none, some } from "./option.ts";
export type { Err, Ok } from "./result.ts";
export { err, ok } from "./result.ts";
