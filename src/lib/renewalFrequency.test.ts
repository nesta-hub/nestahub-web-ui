import { describe, expect, it } from "vitest";
import { describeFrequency, describeFrequencyInSentence, legacyWeeks, ordinal, sameFrequency, switchKind } from "./renewalFrequency";

describe("describeFrequency", () => {
  it.each([
    [{ kind: "weeks", every: 1 }, "Every week"],
    [{ kind: "weeks", every: 3 }, "Every 3 weeks"],
    [{ kind: "month_date", day: 1 }, "On the 1st of every month"],
    [{ kind: "month_date", day: 22 }, "On the 22nd of every month"],
    [{ kind: "month_date", day: 25 }, "On the 25th of every month"],
    [{ kind: "month_weekday", nth: 2, weekday: 2 }, "The 2nd Tuesday of every month"],
    [{ kind: "month_weekday", nth: -1, weekday: 5 }, "The last Friday of every month"],
    [{ kind: "month_weekday", nth: 4, weekday: 7 }, "The 4th Sunday of every month"],
  ] as const)("%j reads %s, as the API says it", (frequency, text) => {
    expect(describeFrequency(frequency as never)).toBe(text);
  });
});

describe("ordinal", () => {
  it.each([[1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [11, "11th"], [12, "12th"], [13, "13th"], [21, "21st"], [22, "22nd"], [23, "23rd"], [31, "31st"]])("%d is %s", (n, text) => {
    expect(ordinal(n)).toBe(text);
  });
});

describe("switchKind", () => {
  it("starts each kind somewhere sensible", () => {
    const weeks = { kind: "weeks", every: 6 } as const;
    expect(switchKind(weeks, "month_date")).toEqual({ kind: "month_date", day: 25 });
    expect(switchKind(weeks, "month_weekday")).toEqual({ kind: "month_weekday", nth: 1, weekday: 1 });
    expect(switchKind({ kind: "month_date", day: 10 }, "weeks")).toEqual({ kind: "weeks", every: 4 });
  });

  it("keeps what she had when the kind does not change", () => {
    const weeks = { kind: "weeks", every: 6 } as const;
    expect(switchKind(weeks, "weeks")).toBe(weeks);
  });
});

describe("sameFrequency", () => {
  it("compares by value", () => {
    expect(sameFrequency({ kind: "weeks", every: 4 }, { kind: "weeks", every: 4 })).toBe(true);
    expect(sameFrequency({ kind: "weeks", every: 4 }, { kind: "weeks", every: 5 })).toBe(false);
    expect(sameFrequency({ kind: "weeks", every: 4 }, { kind: "month_date", day: 4 })).toBe(false);
  });
});

describe("legacyWeeks", () => {
  it("is the weeks themselves, or 4 for anything monthly", () => {
    expect(legacyWeeks({ kind: "weeks", every: 3 })).toBe(3);
    expect(legacyWeeks({ kind: "weeks", every: 12 })).toBe(12);
    expect(legacyWeeks({ kind: "month_date", day: 25 })).toBe(4);
    expect(legacyWeeks({ kind: "month_weekday", nth: -1, weekday: 5 })).toBe(4);
  });
});

describe("describeFrequencyInSentence", () => {
  it("lowers only the first letter, so a weekday keeps its capital", () => {
    expect(describeFrequencyInSentence({ kind: "weeks", every: 3 })).toBe("every 3 weeks");
    expect(describeFrequencyInSentence({ kind: "month_date", day: 25 })).toBe("on the 25th of every month");
    expect(describeFrequencyInSentence({ kind: "month_weekday", nth: 2, weekday: 2 })).toBe("the 2nd Tuesday of every month");
    expect(describeFrequencyInSentence({ kind: "month_weekday", nth: -1, weekday: 5 })).toBe("the last Friday of every month");
  });
});
