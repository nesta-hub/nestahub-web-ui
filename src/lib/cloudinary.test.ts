import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cutoutCloudinaryUrl } from "./cloudinary";

const PHOTO = "https://res.cloudinary.com/nestahub/image/upload/v1759999999/nesta-hub/categories/p7jnov3oxpxb0swlx1z0.png";

describe("a cutout's address", () => {
  it("asks Cloudinary to remove the background, resize, and pick WebP or AVIF, which keep transparency", () => {
    expect(cutoutCloudinaryUrl(PHOTO)).toBe(
      "https://res.cloudinary.com/nestahub/image/upload/e_background_removal/c_fit,w_480,f_auto,q_auto/v1759999999/nesta-hub/categories/p7jnov3oxpxb0swlx1z0.png",
    );
  });

  it("removes the background before it resizes, as two steps in that order", () => {
    const url = cutoutCloudinaryUrl(PHOTO)!;

    expect(url.indexOf("e_background_removal")).toBeGreaterThan(-1);
    expect(url.indexOf("e_background_removal")).toBeLessThan(url.indexOf("c_fit"));
    expect(url).toContain("/e_background_removal/c_fit,"); // a step of its own, not mixed into the resize
  });

  it("takes a width", () => {
    expect(cutoutCloudinaryUrl(PHOTO, 720)).toContain("/c_fit,w_720,f_auto,q_auto/");
  });

  it("leaves the version and the picture's own path alone", () => {
    expect(cutoutCloudinaryUrl(PHOTO)).toMatch(/\/v1759999999\/nesta-hub\/categories\/p7jnov3oxpxb0swlx1z0\.png$/);
  });

  it.each([
    ["nothing", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["a picture hosted elsewhere", "https://example.com/photo.jpg"],
    ["a Cloudinary address that is not an upload", "https://res.cloudinary.com/nestahub/image/fetch/https://x.test/a.jpg"],
  ])("is null for %s, so the photo is shown as it is", (_label, url) => {
    expect(cutoutCloudinaryUrl(url as string | null | undefined)).toBeNull();
  });

  it.each(["f_auto", "q_auto", "e_background_removal"])("is null for an address that already has %s", (step) => {
    expect(cutoutCloudinaryUrl(PHOTO.replace("/upload/", `/upload/${step}/`))).toBeNull();
  });
});

describe("the warm-up script", () => {
  // scripts/warm-category-cutouts.js asks Cloudinary for each category's cutout ahead of time. It
  // can only help if it asks for the very same address the shop does, so run its builder here.
  const source = readFileSync(resolve(__dirname, "../../scripts/warm-category-cutouts.js"), "utf8");
  const body = source.match(/function cutoutUrl\([\s\S]*?\n}\n/)?.[0];
  const scriptBuilder = new Function(`${body}; return cutoutUrl;`)() as (url: string | null | undefined, width: number) => string | null;

  it.each([
    PHOTO,
    PHOTO.replace("/upload/", "/upload/f_auto/"),
    PHOTO.replace("/upload/", "/upload/e_background_removal/"),
    "https://example.com/photo.jpg",
    "https://res.cloudinary.com/nestahub/image/fetch/https://x.test/a.jpg",
    "",
  ])("builds the same address as the shop for %s", (url) => {
    expect(scriptBuilder(url, 480)).toBe(cutoutCloudinaryUrl(url, 480));
    expect(scriptBuilder(url, 720)).toBe(cutoutCloudinaryUrl(url, 720));
  });

  it("asks for the width the shop asks for", () => {
    expect(source).toContain("option('--width', '480')");
    expect(cutoutCloudinaryUrl(PHOTO)).toContain("w_480");
  });
});
