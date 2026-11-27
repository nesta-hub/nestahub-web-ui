import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsAppNumberPrompt } from "./WhatsAppNumberDrawer";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));
const useSubscribeEnabled = vi.fn();
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => useSubscribeEnabled() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const SNOOZE_KEY = "nesta_whatsapp_prompt_snoozed_until";
const DAY = 24 * 60 * 60 * 1000;

const updateWhatsAppNumber = vi.fn();
let go: (path: string) => void = () => undefined;
function Navigator() {
  go = useNavigate();
  return null;
}

type Customer = { id: string; phone?: string; whatsappConfirmedAt?: string; whatsappOptedOutAt?: string } | null;
const customer = (extra: Partial<NonNullable<Customer>> = {}): Customer => ({ id: "u1", phone: "08012345678", ...extra });

function Prompt({ path = "/shop" }: { path?: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Navigator />
      <WhatsAppNumberPrompt />
    </MemoryRouter>
  );
}

/** Mount, then let the short delay pass. */
function show(user: Customer = customer(), { path = "/shop", loading = false } = {}) {
  useAuth.mockReturnValue({ user, loading, updateWhatsAppNumber });
  const view = render(<Prompt path={path} />);
  wait(1500);
  return view;
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** vaul leaves a closed drawer in the page (its slide-out is a CSS transition), so "open" is what it says it is. */
const isOpen = () => document.querySelector('[role="dialog"]')?.getAttribute("data-state") === "open";
const yes = () => screen.getByRole("button", { name: "Yes, that's my WhatsApp number" });
const different = () => screen.getByRole("button", { name: "Use a different number" });

/** Tapping outside, swiping down and Escape all end up as the drawer asking to close. */
function dismiss() {
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useSubscribeEnabled.mockReturnValue(true);
  updateWhatsAppNumber.mockReset();
  updateWhatsAppNumber.mockResolvedValue(undefined);
  toast.success.mockReset();
  toast.error.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the WhatsApp number prompt", () => {
  it("asks a signed-in customer who has not answered, once the short delay has passed", () => {
    useAuth.mockReturnValue({ user: customer(), loading: false, updateWhatsAppNumber });
    render(<Prompt />);

    wait(1000);
    expect(isOpen()).toBe(false);

    wait(500);
    expect(isOpen()).toBe(true);
    expect(screen.getByText("Get your updates on WhatsApp")).toBeInTheDocument();
  });

  it("names the number on her profile, the way people say it", () => {
    show(customer({ phone: "08012345678" }));

    expect(screen.getByText("Is 0801 234 5678 your WhatsApp number? We'll use it to send your order and subscription updates.")).toBeInTheDocument();
    expect(yes()).toBeInTheDocument();
    expect(different()).toBeInTheDocument();
  });

  it("has no close button and no back button", () => {
    show();

    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Yes, that's my WhatsApp number", "Use a different number"]);
    expect(screen.queryByRole("button", { name: /close|back/i })).toBeNull();
  });

  it("does not ask a customer who has confirmed a number", () => {
    show(customer({ whatsappConfirmedAt: "2026-11-01T10:00:00.000Z" }));

    expect(isOpen()).toBe(false);
  });

  it("does not ask a customer who replied STOP", () => {
    show(customer({ whatsappOptedOutAt: "2026-11-01T10:00:00.000Z" }));

    expect(isOpen()).toBe(false);
  });

  it("does not ask someone who is signed out", () => {
    show(null);

    expect(isOpen()).toBe(false);
  });

  it("waits for sign-in to finish loading", () => {
    const view = show(customer(), { loading: true });
    wait(5000);
    expect(isOpen()).toBe(false);

    useAuth.mockReturnValue({ user: customer(), loading: false, updateWhatsAppNumber });
    view.rerender(<Prompt />);
    wait(1000);
    expect(isOpen()).toBe(false);
    wait(500);
    expect(isOpen()).toBe(true);
  });

  it.each(["/checkout", "/checkout/", "/orders", "/cart", "/auth/callback", "/gifting/checkout", "/subscriptions/pay/abc", "/subscriptions/edit", "/subscriptions/open/xyz", "/subscriptions/resume"])(
    "stays away from %s",
    (path) => {
      show(customer(), { path });

      expect(isOpen()).toBe(false);
    },
  );

  it.each(["/shop", "/account", "/subscriptions", "/gifting", "/account/orders-history"])("does ask on %s", (path) => {
    show(customer(), { path });

    expect(isOpen()).toBe(true);
  });

  it("goes away, without being snoozed, if she heads into checkout while it is open", () => {
    show();
    expect(isOpen()).toBe(true);

    act(() => {
      go("/checkout");
    });

    expect(isOpen()).toBe(false);
    expect(localStorage.getItem(SNOOZE_KEY)).toBeNull();
  });

  it("does not open if she reaches checkout before the delay is up", () => {
    useAuth.mockReturnValue({ user: customer(), loading: false, updateWhatsAppNumber });
    render(<Prompt />);
    wait(1000);

    act(() => {
      go("/checkout");
    });
    wait(1000);

    expect(isOpen()).toBe(false);
  });

  it("stays open when the flag blinks off while it is on screen", () => {
    useAuth.mockReturnValue({ user: customer(), loading: false, updateWhatsAppNumber });
    const view = render(<Prompt />);
    wait(1500);
    expect(isOpen()).toBe(true);

    useSubscribeEnabled.mockReturnValue(false);
    view.rerender(<Prompt />);

    expect(isOpen()).toBe(true);
  });
});

describe("saying yes", () => {
  it("confirms the number on her profile, thanks her and closes", async () => {
    show();

    await act(async () => {
      fireEvent.click(yes());
    });

    expect(updateWhatsAppNumber).toHaveBeenCalledTimes(1);
    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ useProfilePhone: true });
    expect(toast.success).toHaveBeenCalledWith("Thanks, we'll use WhatsApp for your updates.");
    wait(500);
    expect(isOpen()).toBe(false);
    // she answered: nothing to put off
    expect(localStorage.getItem(SNOOZE_KEY)).toBeNull();
  });

  it("stays open and says what went wrong when the server turns it down", async () => {
    updateWhatsAppNumber.mockRejectedValue(new Error("The phone number on your profile is not a Nigerian mobile number."));
    show();

    await act(async () => {
      fireEvent.click(yes());
    });

    expect(screen.getByRole("alert")).toHaveTextContent("The phone number on your profile is not a Nigerian mobile number.");
    expect(isOpen()).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("a different number", () => {
  const openDifferent = () => {
    fireEvent.click(different());
  };
  const input = () => screen.getByLabelText("WhatsApp number");
  const save = () => screen.getByRole("button", { name: "Save number" });

  it("shows an input and a Save number button, and no way back", () => {
    show();

    openDifferent();

    expect(input()).toHaveAttribute("inputmode", "tel");
    expect(save()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back|close/i })).toBeNull();
    expect(screen.queryByText(/^Is 0801 234 5678/)).toBeNull();
  });

  it("will not send a number that is not a Nigerian mobile", async () => {
    show();
    openDifferent();

    fireEvent.change(input(), { target: { value: "0803 111" } });
    await act(async () => {
      fireEvent.click(save());
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Nigerian mobile number, like 0801 234 5678");
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("will not send an empty box", async () => {
    show();
    openDifferent();

    await act(async () => {
      fireEvent.click(save());
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("sends the number she typed, thanks her and closes", async () => {
    show();
    openDifferent();

    fireEvent.change(input(), { target: { value: " 0803 111 2222 " } });
    await act(async () => {
      fireEvent.click(save());
    });

    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "0803 111 2222" });
    expect(toast.success).toHaveBeenCalledWith("Thanks, we'll use WhatsApp for your updates.");
    wait(500);
    expect(isOpen()).toBe(false);
  });

  it("works with Enter too", async () => {
    show();
    openDifferent();

    fireEvent.change(input(), { target: { value: "+234 803 111 2222" } });
    await act(async () => {
      fireEvent.submit(input().closest("form") as HTMLFormElement);
    });

    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "+234 803 111 2222" });
  });
});

describe("a customer with no usable phone on her profile", () => {
  it.each([
    ["none", undefined],
    ["a landline-looking one", "01 234 5678"],
  ])("is asked for the number straight away (%s)", (_what, phone) => {
    show(customer({ phone }));

    expect(screen.getByText("Add your WhatsApp number. We'll use it to send your order and subscription updates.")).toBeInTheDocument();
    expect(screen.getByLabelText("WhatsApp number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save number" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes, that's my WhatsApp number" })).toBeNull();
    expect(screen.queryByText(/^Is /)).toBeNull();
  });

  it("sends what she types", async () => {
    show(customer({ phone: undefined }));

    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "08031112222" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save number" }));
    });

    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "08031112222" });
  });
});

describe("closing without answering", () => {
  it("puts it off for seven days", () => {
    const now = Date.now();
    show();

    dismiss();

    expect(isOpen()).toBe(false);
    const until = Number(localStorage.getItem(SNOOZE_KEY));
    expect(until).toBeGreaterThanOrEqual(now + 7 * DAY);
    expect(until).toBeLessThan(now + 7 * DAY + 60_000);
  });

  it("does not ask again on the next visit within the week", () => {
    const visit = show();
    dismiss();
    visit.unmount();

    wait(3 * DAY);
    show();

    expect(isOpen()).toBe(false);
  });

  it("asks again once the week is over", () => {
    const visit = show();
    dismiss();
    visit.unmount();

    wait(7 * DAY + 1000);
    show();

    expect(isOpen()).toBe(true);
  });

  it("is not thrown by storage that refuses to answer", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    show();
    expect(isOpen()).toBe(true);

    dismiss();

    expect(isOpen()).toBe(false);
    // and it stays put for the rest of the visit, even when she comes back from a quiet page
    act(() => {
      go("/checkout");
    });
    act(() => {
      go("/shop");
    });
    wait(2000);
    expect(isOpen()).toBe(false);
  });
});

describe("when the subscription experience is off", () => {
  it("shows nothing, ever, and asks nothing", () => {
    useSubscribeEnabled.mockReturnValue(false);

    const { container } = show();
    wait(10_000);

    expect(isOpen()).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container).toBeEmptyDOMElement();
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
    expect(localStorage.getItem(SNOOZE_KEY)).toBeNull();
  });
});
