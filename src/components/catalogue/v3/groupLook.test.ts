import { describe, expect, it } from "vitest";
import { GROUP_LOOKS, lookFor } from "./groupLook";
import { MOSAICS } from "./mosaic";

describe("a group's look", () => {
  it("uses the group's name as the title and the label", () => {
    const look = lookFor({ slug: "feeding", name: "Feeding" });

    expect(look.title).toBe("Feeding");
    expect(look.label).toBe("Feeding");
  });

  it("trims names saved with trailing spaces", () => {
    expect(lookFor({ slug: "sanitary-and-laundry", name: "Sanitary and Laundry " }).title).toBe("Sanitary and Laundry");
    expect(lookFor({ slug: "back-to-school", name: "Learning Resource " }).title).toBe("Learning Resource");
  });

  it.each([
    ["health-wellness", "Health & Oral Care", "Health"],
    ["sanitary-and-laundry", "Sanitary and Laundry ", "Sanitary"],
    ["back-to-school", "Learning Resource ", "Learning"],
    ["swimming-fits-for-toddlers", "Swimming fits for toddlers ", "Swimming"],
  ])("shortens %s on a pill", (slug, name, label) => {
    const look = lookFor({ slug, name });

    expect(look.label).toBe(label);
    expect(look.title).toBe(name.trim()); // the panel and headings keep the full name
  });

  it("matches the real group slugs, not the design's ids", () => {
    for (const slug of ["baby-care", "health-wellness", "back-to-school"]) {
      expect(GROUP_LOOKS[slug]).toBeDefined();
    }
    for (const designId of ["body", "health", "learning", "swim", "mum", "sanitary"]) {
      expect(GROUP_LOOKS[designId]).toBeUndefined();
    }
  });

  it("gives every known group a photo, an icon and colours", () => {
    for (const [slug, look] of Object.entries(GROUP_LOOKS)) {
      expect(look.photo, slug).toBeTruthy();
      expect(look.icon, slug).toBeTruthy();
      expect(look.panel, slug).toHaveLength(2);
    }
  });

  it("has a hand-tuned mosaic for every known group, and no others", () => {
    expect(Object.keys(MOSAICS).sort()).toEqual(Object.keys(GROUP_LOOKS).sort());
  });

  it("still renders a group staff add later, with a neutral look and its own name", () => {
    const look = lookFor({ slug: "toys-and-games", name: "Toys & Games " });

    expect(look.title).toBe("Toys & Games");
    expect(look.label).toBe("Toys & Games");
    expect(look.icon).toBeTruthy();
    expect(look.photo).toBeUndefined();
    expect(look.panel).toHaveLength(2);
  });
});
