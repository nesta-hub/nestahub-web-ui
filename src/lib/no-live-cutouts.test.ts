import { describe, expect, it } from "vitest";

/**
 * Cloudinary counts every background removal as 75 transformations, and `f_auto` makes a copy per
 * browser format, each counted again. A first version that cut category pictures out when the
 * page loaded used up a month's allowance. A cutout is now made once, stored as its own image and
 * attached to the category in the admin. This test makes sure nothing in the shop ever goes back
 * to asking Cloudinary to remove a background on the fly.
 */

const sources = import.meta.glob(["/src/**/*.ts", "/src/**/*.tsx"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("the shop never asks Cloudinary to remove a background", () => {
  it("looks at the shop's code", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
  });

  it("has no address-builder for it in any of the shop's code", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !/\.test\.tsx?$/.test(path))
      .filter(([, text]) => /e_background_removal|background_removal|cloudinary_ai/.test(text))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});
