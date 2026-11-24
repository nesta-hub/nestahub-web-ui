import { describe, expect, it } from "vitest";
import { formatNigerianLocal, looksLikeNigerianMobile } from "./whatsappNumber";

describe("looksLikeNigerianMobile", () => {
  it.each([
    "0801 234 5678",
    "08012345678",
    "+234 801 234 5678",
    "+2348012345678",
    "2348012345678",
    "234 801 234 5678",
    "801 234 5678",
    "8012345678",
    "0701 234 5678",
    "0901 234 5678",
    "0801-234-5678",
    "(0801) 234 5678",
    "+2340801 234 5678", // a 0 typed after the country code
    "00234 801 234 5678",
  ])("takes %s", (typed) => {
    expect(looksLikeNigerianMobile(typed)).toBe(true);
  });

  it.each([
    ["nothing", ""],
    ["a few digits", "0801 234"],
    ["one digit too many", "0801 234 56789"],
    ["one digit too few", "0801 234 567"],
    ["a landline-style start", "0101 234 5678"],
    ["a mobile that does not start 7, 8 or 9", "0601 234 5678"],
    ["letters", "call me"],
    ["another country", "+44 7911 123456"],
  ])("refuses %s", (_what, typed) => {
    expect(looksLikeNigerianMobile(typed)).toBe(false);
  });
});

describe("formatNigerianLocal", () => {
  it("writes the stored form the way people say it", () => {
    expect(formatNigerianLocal("2348012345678")).toBe("0801 234 5678");
  });

  it("does the same for the other ways a number is written", () => {
    expect(formatNigerianLocal("08012345678")).toBe("0801 234 5678");
    expect(formatNigerianLocal("+234 801 234 5678")).toBe("0801 234 5678");
    expect(formatNigerianLocal("801 234 5678")).toBe("0801 234 5678");
    expect(formatNigerianLocal("0801 234 5678")).toBe("0801 234 5678");
  });

  it("is null when there is nothing usable to show", () => {
    expect(formatNigerianLocal("")).toBeNull();
    expect(formatNigerianLocal(undefined)).toBeNull();
    expect(formatNigerianLocal(null)).toBeNull();
    expect(formatNigerianLocal("0101 234 5678")).toBeNull();
    expect(formatNigerianLocal("12345")).toBeNull();
  });
});
