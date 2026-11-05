import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TileImage } from "./TileImage";

const PHOTO = "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories/cups.png";
const CUTOUT = "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories-cutouts/cups.webp";

const show = (src: string, cutoutSrc?: string) => {
  const view = render(
    <div>
      <TileImage src={src} cutoutSrc={cutoutSrc} className="left-[10%] w-4/5" />
    </div>,
  );
  const images = () => Array.from(view.container.querySelectorAll("img"));
  return {
    images,
    photo: () => images()[0],
    cutout: () => images()[1] as HTMLImageElement | undefined,
  };
};

describe("a category's picture on a tile, when the category has an image with no background", () => {
  it("shows the photo at once, with the stored cutout on its way, hidden until it arrives", () => {
    const { images, photo, cutout } = show(PHOTO, CUTOUT);

    expect(images()).toHaveLength(2);
    expect(photo().getAttribute("src")).toContain("w_360,h_360,c_fill"); // today's photo, as before
    expect(photo()).not.toHaveClass("opacity-0");
    expect(cutout()!.getAttribute("src")).toContain("/categories-cutouts/cups.webp");
    expect(cutout()).toHaveClass("opacity-0");
  });

  it("asks only for an ordinary resize of it, never for a background to be removed", () => {
    const { cutout } = show(PHOTO, CUTOUT);

    expect(cutout()!.getAttribute("src")).toContain("/w_480,c_fit,f_auto,q_auto/");
    expect(cutout()!.getAttribute("src")).not.toContain("background_removal");
  });

  it("cross-fades from the photo to the cutout once the cutout has loaded", () => {
    const { photo, cutout } = show(PHOTO, CUTOUT);

    fireEvent.load(cutout()!);

    expect(cutout()).toHaveClass("opacity-100");
    expect(cutout()).not.toHaveClass("opacity-0");
    expect(photo()).toHaveClass("opacity-0"); // the box fades away with it
  });

  it("puts the cutout where the photo is, so the product does not jump", () => {
    const { photo, cutout } = show(PHOTO, CUTOUT);

    for (const img of [photo(), cutout()!]) expect(img).toHaveClass("left-[10%]", "w-4/5", "absolute");
  });

  it("gives the cutout a soft shadow and the photo its blend, as the design has them", () => {
    const { photo, cutout } = show(PHOTO, CUTOUT);

    expect(cutout()!.className).toContain("drop-shadow");
    expect(cutout()!.className).not.toContain("mix-blend");
    expect(photo()).toHaveClass("mix-blend-multiply");
  });

  it("keeps the photo if the cutout cannot be had", () => {
    const { images, photo, cutout } = show(PHOTO, CUTOUT);

    fireEvent.error(cutout()!);

    expect(images()).toHaveLength(1); // the cutout is gone
    expect(photo()).not.toHaveClass("opacity-0"); // and the photo stays
  });
});

describe("a category's picture on a tile, when the category has no image with no background", () => {
  it.each([undefined, ""])("is just the photo (cutout %j)", (cutoutSrc) => {
    const { images, photo } = show(PHOTO, cutoutSrc);

    expect(images()).toHaveLength(1);
    expect(photo().getAttribute("src")).toContain("w_360,h_360,c_fill");
    expect(photo()).not.toHaveClass("opacity-0");
  });

  it("is just the photo even when the photo is on Cloudinary: nothing is cut out for it", () => {
    const { images } = show(PHOTO);

    expect(images().every((img) => !(img.getAttribute("src") ?? "").includes("background_removal"))).toBe(true);
  });
});
