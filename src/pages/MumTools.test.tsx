import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MumTools from "./MumTools";

// The layout brings the headers, footer and bottom nav; this is about the page itself.
vi.mock("@/components/layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe("Mum Tools", () => {
  it("is headed Mum Tools", () => {
    render(<MumTools />);

    expect(screen.getByRole("heading", { level: 1, name: "Mum Tools" })).toBeInTheDocument();
  });

  it("has the same title size as the site's other pages: 24px on a phone, 36px on desktop", () => {
    render(<MumTools />);

    expect(screen.getByRole("heading", { level: 1, name: "Mum Tools" })).toHaveClass("text-2xl", "font-bold", "md:text-4xl");
  });

  it("keeps the advert's title short enough for two lines", () => {
    render(<MumTools />);

    const title = screen.getByRole("heading", { level: 2 }).textContent ?? "";
    expect(title.length).toBeLessThanOrEqual(38); // two lines at a phone's width
  });

  it("is an advert saying the tools are coming soon", () => {
    render(<MumTools />);
    const advert = within(screen.getByRole("region", { name: "Coming soon" }));

    expect(advert.getByText("COMING SOON")).toBeInTheDocument();
    expect(advert.getByRole("heading", { level: 2, name: "Tools to help mum through motherhood" })).toBeInTheDocument();
  });

  it("lists the tools that are planned, each marked as not here yet", () => {
    render(<MumTools />);
    const tools = within(screen.getByRole("list", { name: "Planned tools" })).getAllByRole("listitem");

    expect(tools.map((t) => within(t).getByText(/reminder|plan/i).textContent)).toEqual(["Immunization reminder", "Baby meal plan"]);
    for (const tool of tools) expect(tool).toHaveTextContent("Soon");
  });

  it("calls the first one a reminder, not a tracker", () => {
    render(<MumTools />);

    expect(screen.getByText("Immunization reminder")).toBeInTheDocument();
    expect(screen.queryByText(/tracker/i)).toBeNull();
  });

  it("does not promise more tools beyond the ones listed", () => {
    render(<MumTools />);

    expect(screen.queryByText(/more tools/i)).toBeNull();
  });

  it("offers nothing to press, since nothing exists yet", () => {
    render(<MumTools />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });
});
