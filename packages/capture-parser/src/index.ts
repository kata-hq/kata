// @kata/capture-parser: the pure quick capture parser (spec §7.4, rules C1–C7). No I/O (rule A6).
export { parseCapture } from "./parse.ts";
export { normalize, type Token, tokenize } from "./text.ts";
export type {
  Capture,
  CaptureContext,
  CaptureError,
  CourseCandidate,
  CourseMatch,
  Deadline,
  TaskTypeCandidate,
  TaskTypeMatch,
} from "./types.ts";
