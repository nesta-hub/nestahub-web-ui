import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GroupMosaic } from "./GroupMosaic";
import { category, group, groupOf } from "./testFixtures";

const show = (g: ReturnType<typeof groupOf>, first = false) =>
  render(
    <MemoryRouter>
      <GroupMosaic group={g} first={first} />
    </MemoryRouter>,
  );

const tile = (name: string) => screen.getByRole("link", { name }) as HTMLAnchorElement;

describe("a group's mosaic", () => {
  it("is a section the pills can jump to", () => {
    show(groupOf("baby-care", "Body Care", 13));

    expect(document.getElementById("g-baby-care")).toBeInTheDocument();
  });

  it("shows the group's full name, trimmed, on a panel that opens the whole group", () => {
    show(groupOf("back-to-school", "Learning Resource ", 9));

    expect(screen.getByRole("heading", { level: 2, name: "Learning Resource" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learning Resource: see everything" })).toHaveAttribute("href", "/shop/back-to-school");
  });

  it("shows the group's photo on the panel", () => {
    show(groupOf("baby-care", "Body Care", 13));

    const panel = screen.getByRole("link", { name: "Body Care: see everything" });
    expect(panel.querySelector("img")).toHaveAttribute("src", expect.stringContaining("baby-care"));
  });

  it("gives every category a tile that opens its listing", () => {
    show(groupOf("feeding", "Feeding", 12));

    expect(screen.getAllByRole("link")).toHaveLength(13); // 12 tiles and the panel
    expect(tile("Category 1")).toHaveAttribute("href", "/shop/feeding/feeding-c1");
    expect(tile("Category 12")).toHaveAttribute("href", "/shop/feeding/feeding-c12");
  });

  it("uses the category's own photo", () => {
    show(groupOf("feeding", "Feeding", 12));

    expect(tile("Category 1").querySelector("img")).toHaveAttribute("src", expect.stringContaining("feeding-c1.jpg"));
  });

  it("gives a category whose picture is on Cloudinary a cutout to fade to", () => {
    const g = group("feeding", "Feeding", [category("cups", "Cups", { imageUrl: "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories/cups.png" })]);
    show(g);

    const images = tile("Cups").querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[1].getAttribute("src")).toContain("e_background_removal");
  });

  it("copes with a category that has no photo", () => {
    const g = group("feeding", "Feeding", [category("cups", "Cups", { imageUrl: undefined })]);
    show(g);

    expect(tile("Cups").querySelector("img")).toBeNull();
    expect(screen.getByText("Cups")).toBeInTheDocument();
  });

  it("starts a little higher when it is the first on the page", () => {
    const { container, rerender } = show(groupOf("feeding", "Feeding", 12), true);
    expect(container.querySelector("section")).toHaveClass("pt-11");

    rerender(
      <MemoryRouter>
        <GroupMosaic group={groupOf("feeding", "Feeding", 12)} />
      </MemoryRouter>,
    );
    expect(container.querySelector("section")).toHaveClass("pt-20");
  });
});

describe("how the tiles are laid out", () => {
  const vars = (name: string) => {
    const el = tile(name);
    return { col: el.style.getPropertyValue("--col"), span: el.style.getPropertyValue("--span"), row: el.style.getPropertyValue("--row") };
  };

  it("uses the hand-tuned placement while the group has the categories it was tuned for", () => {
    show(groupOf("feeding", "Feeding", 12));

    expect(vars("Category 1")).toEqual({ col: "1", span: "1", row: "1" }); // a right-hand panel: tiles start at the edge
    expect(vars("Category 9")).toEqual({ col: "1", span: "2", row: "3" }); // a wide tile across the bottom
  });

  it("starts tiles after a left-hand panel", () => {
    show(groupOf("baby-care", "Body Care", 13));

    expect(vars("Category 1")).toEqual({ col: "3", span: "2", row: "1" });
  });

  it("lets the tiles flow instead when a category has been added", () => {
    show(groupOf("feeding", "Feeding", 13));

    expect(vars("Category 1")).toEqual({ col: "", span: "", row: "" });
    expect(screen.getAllByRole("link")).toHaveLength(14); // still a tile for every category
  });

  it("lets the tiles flow when a category has been removed", () => {
    show(groupOf("clothing", "Clothing", 13));

    expect(vars("Category 1").col).toBe("");
  });

  it("handles a group staff add later: neutral colours, no photo, tiles flowing", () => {
    show(groupOf("toys-and-games", "Toys & Games ", 5));

    expect(screen.getByRole("heading", { level: 2, name: "Toys & Games" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Toys & Games: see everything" }).querySelector("img")).toBeNull();
    expect(vars("Category 1").col).toBe("");
  });

  it("makes the panel taller for the groups that have a tall one", () => {
    const { rerender } = show(groupOf("baby-care", "Body Care", 13));
    const panelRows = () => (screen.getByRole("link", { name: /see everything/ }) as HTMLElement).style.getPropertyValue("--prow");
    expect(panelRows()).toBe("3");

    rerender(
      <MemoryRouter>
        <GroupMosaic group={groupOf("nursery", "Nursery", 6)} />
      </MemoryRouter>,
    );
    expect(panelRows()).toBe("2");
  });
});
