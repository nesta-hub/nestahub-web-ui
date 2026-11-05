import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfferArt } from "./OfferArt";

/** The pictures on the phone offer cards, as the design has them. */

describe("the gift card picture", () => {
  it("has 'GIFT CARD' on the right, level with the Nesta Hub logo on the left", () => {
    const { container } = render(<OfferArt id="gift-cards" />);
    const label = screen.getByText("GIFT CARD");
    const logo = container.querySelector("img")!;

    // The top row: the logo at the top left, the label at the top right...
    expect(logo).toHaveClass("left-1.5", "top-[3px]");
    expect(label).toHaveClass("right-[9px]", "top-2");
    // ...not tucked under the logo, where it used to be.
    expect(label).not.toHaveClass("left-2");
    expect(label).not.toHaveClass("top-[34px]");
  });

  it("keeps the greeting in the middle and the amount at the bottom right", () => {
    render(<OfferArt id="gift-cards" />);

    expect(screen.getByText("Hello, Little One")).toHaveClass("text-center", "top-9");
    expect(screen.getByText("₦10,000")).toHaveClass("bottom-[7px]", "right-[9px]");
  });
});

describe("the referral picture", () => {
  it("is the tote bag and the cup as cut-outs, not pictures in rounded tiles", () => {
    const { container } = render(<OfferArt id="referrals" />);
    const pictures = Array.from(container.querySelectorAll("img"));

    expect(pictures).toHaveLength(2);
    for (const picture of pictures) {
      expect(picture.className).not.toMatch(/rounded/);
      expect(picture.className).not.toMatch(/object-cover/);
    }
  });

  it("uses the design's cut-out cup, not the square photo of it", () => {
    const { container } = render(<OfferArt id="referrals" />);
    const [bag, cup] = Array.from(container.querySelectorAll("img"));

    expect(bag.getAttribute("src")).toMatch(/tote-bag/);
    expect(cup.getAttribute("src")).toMatch(/tumbler-cutout\.png/);
    expect(cup.getAttribute("src")).not.toMatch(/\.webp/);
  });

  it("stands the cup in front of the bag, both on a soft shadow", () => {
    const { container } = render(<OfferArt id="referrals" />);
    const [bag, cup] = Array.from(container.querySelectorAll("img"));
    const shadow = container.querySelector("span.blur-\\[7px\\]");

    expect(bag).toHaveClass("z-[1]", "right-[84px]", "-rotate-[5deg]");
    expect(cup).toHaveClass("z-[2]", "right-[30px]", "rotate-[3deg]", "h-[116px]");
    expect(shadow).not.toBeNull();
  });
});
