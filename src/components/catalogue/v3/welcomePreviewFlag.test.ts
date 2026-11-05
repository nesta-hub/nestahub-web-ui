import { afterEach, describe, expect, it, vi } from "vitest";
import { welcomePreviewRequested } from "./welcomePreviewFlag";

/** TEMPORARY dev-server preview of the signed-in first card (see welcomePreviewFlag.ts). */

afterEach(() => vi.unstubAllEnvs());

describe("whether the address asks for the welcome card preview", () => {
  it("is no when the address doesn't ask for it", () => {
    expect(welcomePreviewRequested("")).toBe(false);
    expect(welcomePreviewRequested("?group=baby-care")).toBe(false);
    expect(welcomePreviewRequested("?welcome=")).toBe(false);
  });

  it.each(["1", "true", "pay", "anything"])("is yes for ?welcome=%s", (value) => {
    expect(welcomePreviewRequested(`?welcome=${value}`)).toBe(true);
  });

  it("works alongside other things in the address", () => {
    expect(welcomePreviewRequested("?product=cot&welcome=1")).toBe(true);
  });

  it("is always no outside the dev server, so it can never reach customers", () => {
    vi.stubEnv("DEV", false);

    expect(welcomePreviewRequested("?welcome=1")).toBe(false);
  });
});
