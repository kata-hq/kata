import { describe, expect, test } from "bun:test";
import {
  DEFAULT_TIME_ZONE,
  instantFromDate,
  instantToDate,
  isValidTimeZone,
  localDateOf,
  plainDateFromDb,
  plainDateToDb,
  plainTimeFromDb,
  plainTimeToDb,
  startOfLocalDay,
  Temporal,
  toInstant,
  toZoned,
  weekStart,
} from "./index.ts";

const PARIS = "Europe/Paris";
const date = (iso: string) => Temporal.PlainDate.from(iso);
const time = (iso: string) => Temporal.PlainTime.from(iso);
const instant = (iso: string) => Temporal.Instant.from(iso);

describe("toInstant", () => {
  test.each([
    ["winter time (UTC+1)", "2026-01-15", "08:00", "2026-01-15T07:00:00Z"],
    ["summer time (UTC+2)", "2026-07-15", "08:00", "2026-07-15T06:00:00Z"],
    [
      "gap: 02:30 does not exist on 2026-03-29, moved forward to 03:30",
      "2026-03-29",
      "02:30",
      "2026-03-29T01:30:00Z",
    ],
    ["just before the gap", "2026-03-29", "01:59", "2026-03-29T00:59:00Z"],
    [
      "overlap: 02:30 happens twice on 2026-10-25, the earlier one",
      "2026-10-25",
      "02:30",
      "2026-10-25T00:30:00Z",
    ],
    ["just after the overlap", "2026-10-25", "03:00", "2026-10-25T02:00:00Z"],
  ])("%s", (_, day, wallTime, expected) => {
    expect(toInstant(date(day), time(wallTime), PARIS).toString()).toBe(expected);
  });

  test("a zone without DST keeps the same offset all year", () => {
    expect(toInstant(date("2026-03-29"), time("02:30"), "Asia/Tokyo").toString()).toBe(
      "2026-03-28T17:30:00Z",
    );
    expect(toInstant(date("2026-10-25"), time("02:30"), "UTC").toString()).toBe("2026-10-25T02:30:00Z");
  });

  test("a weekly 08:00 local time stays at 08:00 across both changes", () => {
    const hoursBetween = (a: string, b: string) =>
      toInstant(date(a), time("08:00"), PARIS)
        .until(toInstant(date(b), time("08:00"), PARIS))
        .total("hours");

    expect(hoursBetween("2026-03-23", "2026-03-30")).toBe(167);
    expect(hoursBetween("2026-10-19", "2026-10-26")).toBe(169);
    expect(hoursBetween("2026-06-01", "2026-06-08")).toBe(168);
  });
});

describe("toZoned and localDateOf", () => {
  test("an instant seen in Paris", () => {
    const zoned = toZoned(instant("2026-07-15T06:00:00Z"), PARIS);

    expect(zoned.toPlainTime().toString()).toBe("08:00:00");
    expect(zoned.offset).toBe("+02:00");
  });

  test("late UTC evening is already the next local day in Paris", () => {
    expect(localDateOf(instant("2026-01-15T23:30:00Z"), PARIS).toString()).toBe("2026-01-16");
    expect(localDateOf(instant("2026-01-15T23:30:00Z"), "UTC").toString()).toBe("2026-01-15");
  });
});

describe("startOfLocalDay", () => {
  test("midnight local time", () => {
    expect(startOfLocalDay(date("2026-03-29"), PARIS).toString()).toBe("2026-03-28T23:00:00Z");
    expect(startOfLocalDay(date("2026-03-30"), PARIS).toString()).toBe("2026-03-29T22:00:00Z");
  });

  test("a day whose midnight does not exist starts at 01:00", () => {
    // Santiago springs forward at 00:00 → 01:00 on 2026-09-06.
    const start = startOfLocalDay(date("2026-09-06"), "America/Santiago");

    expect(toZoned(start, "America/Santiago").toPlainTime().toString()).toBe("01:00:00");
  });
});

describe("weekStart", () => {
  test.each([
    ["2026-10-12", "2026-10-12"], // Monday
    ["2026-10-14", "2026-10-12"], // Wednesday
    ["2026-10-18", "2026-10-12"], // Sunday
    ["2027-01-01", "2026-12-28"], // across a year
  ])("%s → %s", (day, monday) => {
    expect(weekStart(date(day)).toString()).toBe(monday);
  });
});

describe("time zones", () => {
  test("the default is Paris", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Europe/Paris");
  });

  test.each([
    ["Europe/Paris", true],
    ["UTC", true],
    ["America/New_York", true],
    ["Mars/Olympus", false],
    ["", false],
  ])("%s is valid: %p", (name, valid) => {
    expect(isValidTimeZone(name)).toBe(valid);
  });
});

describe("database interop", () => {
  test("timestamptz: a Date is an instant", () => {
    const value = new Date("2026-10-25T00:30:00.123Z");

    expect(instantFromDate(value).toString()).toBe("2026-10-25T00:30:00.123Z");
    expect(instantToDate(instantFromDate(value))).toEqual(value);
  });

  test("date: the day at 00:00 UTC", () => {
    expect(plainDateToDb(date("2026-03-29")).toISOString()).toBe("2026-03-29T00:00:00.000Z");
    expect(plainDateFromDb(new Date("2026-03-29T00:00:00.000Z")).toString()).toBe("2026-03-29");
  });

  test("time: 1970-01-01 at that time, UTC", () => {
    expect(plainTimeToDb(time("08:15:30.250")).toISOString()).toBe("1970-01-01T08:15:30.250Z");
    expect(plainTimeFromDb(new Date("1970-01-01T23:59:00.000Z")).toString()).toBe("23:59:00");
  });

  test("round-trips do not shift the day or the time when the process zone is not UTC", () => {
    const previous = process.env["TZ"];
    process.env["TZ"] = "America/New_York";
    try {
      expect(new Date(2026, 0, 1).getTimezoneOffset()).not.toBe(0);
      expect(plainDateFromDb(plainDateToDb(date("2026-01-01"))).toString()).toBe("2026-01-01");
      expect(plainTimeFromDb(plainTimeToDb(time("00:30"))).toString()).toBe("00:30:00");
    } finally {
      if (previous === undefined) delete process.env["TZ"];
      else process.env["TZ"] = previous;
    }
  });
});
