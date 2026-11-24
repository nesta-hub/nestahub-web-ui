import { describe, expect, it } from "vitest";
import { subscribeFields } from "./choice";

describe("subscribeFields", () => {
  it("a one-time choice is explicitly not a subscription (null, not left out), so it replaces an earlier one", () => {
    const fields = subscribeFields(null);
    expect(fields).toEqual({ isAutoRenew: false, frequencyWeeks: undefined, renewalFrequency: null, firstRenewalDate: undefined });
    expect(fields.renewalFrequency).toBeNull();
  });

  it("weekly keeps its weeks and its first day", () => {
    expect(subscribeFields({ frequency: { kind: "weeks", every: 3 }, firstDate: "2026-12-01" })).toEqual({
      isAutoRenew: true, frequencyWeeks: 3, renewalFrequency: { kind: "weeks", every: 3 }, firstRenewalDate: "2026-12-01",
    });
  });

  it("monthly counts as 4 weeks for the old column and has no first day, even if one was left over", () => {
    expect(subscribeFields({ frequency: { kind: "month_weekday", nth: -1, weekday: 5 }, firstDate: "2026-12-01" })).toEqual({
      isAutoRenew: true, frequencyWeeks: 4, renewalFrequency: { kind: "month_weekday", nth: -1, weekday: 5 }, firstRenewalDate: undefined,
    });
  });
});
