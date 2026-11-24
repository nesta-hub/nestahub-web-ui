import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Subscriptions from "./Subscriptions";
import SubscriptionLink from "./SubscriptionLink";

const auth = vi.hoisted(() => ({ value: { user: { id: "u1" } as unknown, loading: false } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.value }));

const status = vi.hoisted(() => ({ value: "off" as "loading" | "on" | "off" }));
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeStatus: () => status.value, useSubscribeEnabled: () => status.value === "on" }));

const token = vi.hoisted(() => ({ set: vi.fn(), clear: vi.fn() }));
vi.mock("@/lib/subscriptionBoxes", async (original) => ({
  ...(await original<typeof import("@/lib/subscriptionBoxes")>()),
  setBoxToken: token.set,
  clearBoxToken: token.clear,
}));

// The two experiences, and everything around them, are stood in for: this checks which one is chosen.
vi.mock("@/components/layout", () => ({ Layout: ({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) => <div data-nav={String(showNav)}>{children}</div> }));
vi.mock("@/components/account/SubscriptionsView", () => ({ SubscriptionsView: () => <p>the old subscriptions page (phone)</p> }));
vi.mock("@/components/account/DesktopSubscriptionsView", () => ({ DesktopSubscriptionsView: () => <p>the old subscriptions page (desktop)</p> }));
vi.mock("@/components/subscription-tab/SubscriptionTab", () => ({ SubscriptionTab: ({ linkAction }: { linkAction?: string }) => <p>the new Subscription tab {linkAction ?? "signed-in"}</p> }));
vi.mock("@/components/auth/SignInForm", () => ({ SignInForm: ({ title }: { title: string }) => <p>sign in: {title}</p> }));

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/:action/:token" element={<SubscriptionLink />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  auth.value = { user: { id: "u1" }, loading: false };
  status.value = "off";
});

describe("/subscriptions", () => {
  it("is the old page while the switch is off", () => {
    at("/subscriptions");
    expect(screen.getByText(/the old subscriptions page/)).toBeInTheDocument();
    expect(screen.queryByText(/the new Subscription tab/)).toBeNull();
  });

  it("is the new tab, with the nav, while it is on", () => {
    status.value = "on";
    const { container } = at("/subscriptions");
    expect(screen.getByText("the new Subscription tab signed-in")).toBeInTheDocument();
    expect(container.querySelector("[data-nav]")).toHaveAttribute("data-nav", "true");
  });

  it("shows neither while it is still finding out, so nothing flashes", () => {
    status.value = "loading";
    at("/subscriptions");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText(/old subscriptions page/)).toBeNull();
    expect(screen.queryByText(/new Subscription tab/)).toBeNull();
  });

  it("shows neither while sign-in is loading", () => {
    auth.value = { user: null, loading: true };
    status.value = "on";
    at("/subscriptions");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("asks a signed-out visitor to sign in, in the words of whichever experience she is in", () => {
    auth.value = { user: null, loading: false };
    at("/subscriptions");
    expect(screen.getByText("sign in: Sign in to manage subscriptions")).toBeInTheDocument();

    status.value = "on";
    const { unmount } = at("/subscriptions");
    expect(screen.getAllByText("sign in: Sign in to see your subscription").length).toBeGreaterThan(0);
    unmount();
  });
});

describe("a link from a message: /subscriptions/<action>/<token>", () => {
  it.each(["pay", "edit", "open", "resume"])("%s opens the tab with that action, and keeps the token for the visit", (action) => {
    status.value = "on";
    at(`/subscriptions/${action}/the-token`);
    expect(screen.getByText(`the new Subscription tab ${action}`)).toBeInTheDocument();
    expect(token.set).toHaveBeenCalledWith("the-token");
  });

  it("works with no sign-in at all", () => {
    auth.value = { user: null, loading: false };
    status.value = "on";
    at("/subscriptions/pay/the-token");
    expect(screen.getByText("the new Subscription tab pay")).toBeInTheDocument();
  });

  it("waits while it is finding out, rather than sending her to the old page", () => {
    status.value = "loading";
    at("/subscriptions/pay/the-token");
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText(/old subscriptions page/)).toBeNull();
  });

  it("goes to the ordinary page when the new experience is off, and forgets the token", () => {
    status.value = "off";
    at("/subscriptions/pay/the-token");
    expect(screen.getByText(/the old subscriptions page/)).toBeInTheDocument();
    expect(token.clear).toHaveBeenCalled();
  });

  it("goes to /subscriptions for an address it does not know", () => {
    status.value = "on";
    at("/subscriptions/dance/the-token");
    expect(screen.queryByText(/the new Subscription tab dance/)).toBeNull();
    expect(screen.getByText("the new Subscription tab signed-in")).toBeInTheDocument();
  });
});
