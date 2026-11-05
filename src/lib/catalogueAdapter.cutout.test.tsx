import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryTile } from "@/components/catalogue/v2/CategoryTile";
import { apiCategoryToCatalogue } from "./catalogueAdapter";
import { category } from "@/components/catalogue/v3/testFixtures";

/** The no-background image is for the website's desktop tiles only: phones keep the main image. */

const PHOTO = "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories/cups.png";
const CUTOUT = "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories-cutouts/cups.webp";

describe("a category's image with no background, on its way to the tiles", () => {
  it("is carried through next to the main image", () => {
    const tile = apiCategoryToCatalogue(category("cups", "Cups", { imageUrl: PHOTO, cutoutImageUrl: CUTOUT }), "feeding");

    expect(tile).toMatchObject({ imageUrl: PHOTO, cutoutImageUrl: CUTOUT });
  });

  it("is simply absent when the category has none", () => {
    expect(apiCategoryToCatalogue(category("cups", "Cups", { imageUrl: PHOTO }), "feeding").cutoutImageUrl).toBeUndefined();
  });

  it("is ignored by the phone's category tile, which always shows the main image", () => {
    const tile = apiCategoryToCatalogue(category("cups", "Cups", { imageUrl: PHOTO, cutoutImageUrl: CUTOUT }), "feeding");

    const { container } = render(<CategoryTile category={tile} onClick={() => {}} />);

    const shown = Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    expect(shown).toHaveLength(1);
    expect(shown[0]).toContain("/categories/cups.png");
    expect(shown.join(" ")).not.toContain("categories-cutouts");
  });
});
