import { describe, expect, it } from "vitest";
import { TREE, category } from "@/components/catalogue/v3/testFixtures";
import { findShopTarget } from "./shopLink";

const tree = { groups: TREE, ungrouped: [category("raincoat", "Raincoats")] };
const found = (...slugs: [string?, string?]) => {
  const { group, category: c } = findShopTarget(tree, ...slugs);
  return [group?.slug ?? null, c?.slug ?? null];
};

describe("what a shop link points at", () => {
  it("is a group, or a category in it", () => {
    expect(found("baby-care")).toEqual(["baby-care", null]);
    expect(found("baby-care", "body-wash")).toEqual(["baby-care", "body-wash"]);
  });

  it("is the category in the group it is in now, when the link names another", () => {
    expect(found("health-wellness", "body-wash")).toEqual(["baby-care", "body-wash"]);
    expect(found("a-deleted-group", "body-wash")).toEqual(["baby-care", "body-wash"]);
  });

  it("is a category with no group", () => {
    expect(found("all", "raincoat")).toEqual([null, "raincoat"]);
  });

  it("is just the group when the category is gone", () => {
    expect(found("baby-care", "gone")).toEqual(["baby-care", null]);
  });

  it("is nothing for an unknown group, no address, or before the categories load", () => {
    expect(found("gone")).toEqual([null, null]);
    expect(found()).toEqual([null, null]);
    expect(findShopTarget(undefined, "baby-care", "body-wash")).toEqual({ group: null, category: null });
  });
});
