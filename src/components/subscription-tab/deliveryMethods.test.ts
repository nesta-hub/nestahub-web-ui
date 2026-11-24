import { describe, expect, it } from "vitest";
import { availableMethods, chosenMethod, instantIsForThisOrderOnly, nothingDeliversThere, type Method } from "./deliveryMethods";

const inArea = { community: { feeKobo: 50_000 }, instant: { feeKobo: 150_000 } };
const outOfArea = { community: null, instant: { feeKobo: 150_000 } };
const nowhere = { community: null, instant: null };

describe("availableMethods", () => {
  it("inside a community area: Community Delivery, Instant Delivery and Pick-up", () => {
    expect(availableMethods({ options: inArea, addressIsCurrentCommunity: false })).toEqual(["community", "instant", "pickup"]);
  });

  it("outside every area: Instant Delivery and Pick-up", () => {
    expect(availableMethods({ options: outOfArea, addressIsCurrentCommunity: true })).toEqual(["instant", "pickup"]);
  });

  it("where nothing delivers: only Pick-up", () => {
    expect(availableMethods({ options: nowhere, addressIsCurrentCommunity: true })).toEqual(["pickup"]);
  });

  it("an area with no Instant is still offered Community Delivery and Pick-up", () => {
    expect(availableMethods({ options: { community: { feeKobo: null }, instant: null }, addressIsCurrentCommunity: false })).toEqual(["community", "pickup"]);
  });

  describe("before the server has answered", () => {
    it("her current community address keeps Community Delivery on the list, so it does not jump", () => {
      expect(availableMethods({ options: undefined, addressIsCurrentCommunity: true })).toEqual(["community", "instant", "pickup"]);
    });

    it("anything else offers Instant Delivery and Pick-up until we know", () => {
      expect(availableMethods({ options: undefined, addressIsCurrentCommunity: false })).toEqual(["instant", "pickup"]);
    });
  });
});

describe("chosenMethod", () => {
  it("is what she picked while it is still on offer", () => {
    expect(chosenMethod("instant", ["community", "instant", "pickup"])).toBe("instant");
    expect(chosenMethod("pickup", ["instant", "pickup"])).toBe("pickup");
  });

  it("falls back to the first on offer when she has not picked, or what she picked has gone (a new address outside the area)", () => {
    expect(chosenMethod(null, ["community", "instant", "pickup"])).toBe("community");
    expect(chosenMethod(null, ["instant", "pickup"])).toBe("instant");
    expect(chosenMethod("community", ["instant", "pickup"])).toBe("instant");
    expect(chosenMethod("instant", ["pickup"] as Method[])).toBe("pickup");
  });
});

describe("nothingDeliversThere", () => {
  it("is true only when the server says neither is available", () => {
    expect(nothingDeliversThere(nowhere)).toBe(true);
    expect(nothingDeliversThere(outOfArea)).toBe(false);
    expect(nothingDeliversThere(inArea)).toBe(false);
    expect(nothingDeliversThere(undefined)).toBe(false);
  });
});

describe("instantIsForThisOrderOnly", () => {
  it("is true for Instant when Community Delivery is also on offer (inside an area)", () => {
    expect(instantIsForThisOrderOnly("instant", ["community", "instant", "pickup"])).toBe(true);
  });

  it("is false for Instant outside an area (it is her address's only way), and for the other methods", () => {
    expect(instantIsForThisOrderOnly("instant", ["instant", "pickup"])).toBe(false);
    expect(instantIsForThisOrderOnly("community", ["community", "instant", "pickup"])).toBe(false);
    expect(instantIsForThisOrderOnly("pickup", ["community", "instant", "pickup"])).toBe(false);
  });
});
