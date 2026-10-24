import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TileImage } from "./TileImage";

const CLOUDINARY = "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories/cups.png";

const show = (src: string) => {
  const view = render(
    <div>
      <TileImage src={src} className="left-[10%] w-4/5" />
    </div>,
  );
  const images = () => Array.from(view.container.querySelectorAll("img"));
  return {
    images,
    photo: () => images()[0],
    cutout: () => images()[1] as HTMLImageElement | undefined,
  };
};

describe("a category's picture on a tile", () => {
  it("shows the photo at once, with the cutout on its way, hidden until it arrives", () => {
    const { images, photo, cutout } = show(CLOUDINARY);

    expect(images()).toHaveLength(2);
    expect(photo().getAttribute("src")).toContain("w_360,h_360,c_fill"); // today's photo, as before
    expect(photo()).not.toHaveClass("opacity-0");
    expect(cutout()!.getAttribute("src")).toContain("/e_background_removal/c_fit,w_480,f_auto,q_auto/");
    expect(cutout()).toHaveClass("opacity-0");
  });

  it("cross-fades from the photo to the cutout once the cutout has loaded", () => {
    const { photo, cutout } = show(CLOUDINARY);

    fireEvent.load(cutout()!);

    expect(cutout()).toHaveClass("opacity-100");
    expect(cutout()).not.toHaveClass("opacity-0");
    expect(photo()).toHaveClass("opacity-0"); // the box fades away with it
  });

  it("puts the cutout where the photo is, so the product does not jump", () => {
    const { photo, cutout } = show(CLOUDINARY);

    for (const img of [photo(), cutout()!]) expect(img).toHaveClass("left-[10%]", "w-4/5", "absolute");
  });

  it("gives the cutout a soft shadow and the photo its blend, as the design has them", () => {
    const { photo, cutout } = show(CLOUDINARY);

    expect(cutout()!.className).toContain("drop-shadow");
    expect(cutout()!.className).not.toContain("mix-blend");
    expect(photo()).toHaveClass("mix-blend-multiply");
  });

  it("keeps the photo if the cutout cannot be had (add-on off, allowance used up)", () => {
    const { images, photo, cutout } = show(CLOUDINARY);

    fireEvent.error(cutout()!);

    expect(images()).toHaveLength(1); // the cutout is gone
    expect(photo()).not.toHaveClass("opacity-0"); // and the photo stays
  });

  it("does not try for a cutout of a picture that is not on Cloudinary", () => {
    const { images, photo } = show("https://example.com/cups.jpg");

    expect(images()).toHaveLength(1);
    expect(photo()).not.toHaveClass("opacity-0");
  });

  it("does not try again for an address that already has transformations", () => {
    const { images } = show("https://res.cloudinary.com/nestahub/image/upload/f_auto,q_auto/v1/a.png");

    expect(images()).toHaveLength(1);
  });
});
