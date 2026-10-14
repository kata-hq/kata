// Inputs and output of the quick capture parser. Everything the parser needs comes in through
// CaptureContext (rule C7, spec A6): no clock, no database, no network.

/** A course of the person's active semester (academic module). */
export type CourseCandidate = {
  readonly id: string;
  readonly name: string;
  readonly shortName: string | null;
  readonly aliases: readonly string[];
};

/** A task type (work module, table TaskType): its aliases are the words that select it (rule C3). */
export type TaskTypeCandidate = {
  readonly key: string;
  readonly label: string;
  readonly aliases: readonly string[];
};

export type CaptureContext = {
  /** The instant "now" is read from, as an ISO 8601 instant with an offset (e.g. "2026-10-14T09:00:00Z"). */
  readonly reference: string;
  /** The person's IANA time zone (e.g. "Europe/Paris"): relative dates and end-of-day deadlines use it. */
  readonly timeZone: string;
  readonly courses: readonly CourseCandidate[];
  readonly taskTypes: readonly TaskTypeCandidate[];
};

export type CourseMatch = {
  readonly id: string;
  readonly name: string;
  /** The words of the input that selected the course, as typed. */
  readonly matched: string;
};

export type TaskTypeMatch = {
  readonly key: string;
  readonly label: string;
  /** The words of the input that selected the type, as typed. */
  readonly matched: string;
};

export type Deadline = {
  /** Local calendar day, "YYYY-MM-DD". */
  readonly date: string;
  /** Local time "HH:MM" when the input gave one, otherwise null (end of day, rule K-R7). */
  readonly time: string | null;
  /** The deadline as a UTC instant ("…Z"): the given time, or 23:59 local time (K-R7). */
  readonly instant: string;
  /** The words of the input that gave the date and time, as typed. */
  readonly matched: string;
};

export type Capture = {
  readonly input: string;
  readonly title: string;
  readonly course: CourseMatch | null;
  readonly taskType: TaskTypeMatch | null;
  /** null: no date found, the task goes to "Sans date" (rule C5). */
  readonly deadline: Deadline | null;
};

export type CaptureError =
  | { readonly code: "invalid-reference"; readonly message: string }
  | { readonly code: "invalid-time-zone"; readonly message: string };
