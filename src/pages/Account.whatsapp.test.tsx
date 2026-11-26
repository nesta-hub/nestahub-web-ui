import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Account from "./Account";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));
const useSubscribeEnabled = vi.fn();
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => useSubscribeEnabled() }));
const isMobile = vi.fn();
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => isMobile() }));
vi.mock("@/components/layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/api", () => ({
  getMyOrders: () => Promise.resolve({ orders: [] }),
  getMySubscriptions: () => Promise.resolve({ subscriptions: [] }),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const updatePhone = vi.fn();
const updateWhatsAppNumber = vi.fn();

const signedIn = (extra: Record<string, unknown> = {}) =>
  useAuth.mockReturnValue({
    user: { id: "u1", name: "Ama Mensah", email: "ama@example.com", ...extra },
    session: { access_token: "tok" },
    loading: false,
    walletBalance: 0,
    signOut: vi.fn(),
    updatePhone,
    updateWhatsAppNumber,
  });

/** Rendered inside act so the order and subscription counts that arrive straight after have settled. */
const open = () =>
  act(async () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Account />
      </MemoryRouter>,
    );
  });

const tick = () => screen.queryByRole("checkbox", { name: "This is my WhatsApp number" });

beforeEach(() => {
  useSubscribeEnabled.mockReturnValue(true);
  isMobile.mockReturnValue(true);
  updatePhone.mockReset();
  updatePhone.mockResolvedValue(undefined);
  updateWhatsAppNumber.mockReset();
  updateWhatsAppNumber.mockResolvedValue(undefined);
  toast.error.mockReset();
});

/** The "Add your phone" page, reached from the banner a customer with no phone sees. */
async function openPhoneStep() {
  signedIn({});
  await open();
  fireEvent.click(screen.getByText("Add your phone number to stay updated on orders"));
}
const typeNewPhone = (phone: string) => fireEvent.change(screen.getByPlaceholderText("801 234 5678"), { target: { value: phone } });

describe("adding a phone from the account page", () => {
  it("with the subscription experience off, saves only the phone, as before", async () => {
    useSubscribeEnabled.mockReturnValue(false);
    await openPhoneStep();

    expect(tick()).toBeNull();
    typeNewPhone("801 234 5678");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(updatePhone).toHaveBeenCalledWith("801 234 5678"));
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("with it on, saves the phone and then confirms it as her WhatsApp number", async () => {
    await openPhoneStep();

    expect(tick()).toBeChecked();
    typeNewPhone("801 234 5678");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(updateWhatsAppNumber).toHaveBeenCalledWith({ useProfilePhone: true }));
    expect(updatePhone).toHaveBeenCalledWith("801 234 5678");
    expect(updatePhone.mock.invocationCallOrder[0]).toBeLessThan(updateWhatsAppNumber.mock.invocationCallOrder[0]);
  });

  it("with it on, goes back to the account page even when the WhatsApp number cannot be saved", async () => {
    updateWhatsAppNumber.mockRejectedValue(new Error("Enter a Nigerian mobile number, like 0801 234 5678"));
    await openPhoneStep();
    typeNewPhone("801 234 5678");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.queryByText("Add your phone")).toBeNull());
    expect(toast.error).toHaveBeenCalledWith("Enter a Nigerian mobile number, like 0801 234 5678");
  });

  it("with it on, sends the other number she types", async () => {
    await openPhoneStep();
    typeNewPhone("801 234 5678");
    fireEvent.click(tick()!);
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "0803 111 2222" } });

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "0803 111 2222" }));
  });
});

describe("editing the profile", () => {
  const openEditor = () => {
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
  };
  const save = () => screen.getByRole("button", { name: /Save changes/ });

  it("with the subscription experience off, has no tick box and saves only the phone", async () => {
    useSubscribeEnabled.mockReturnValue(false);
    signedIn({ phone: "08012345678" });
    await open();
    openEditor();

    expect(tick()).toBeNull();
    fireEvent.click(save());

    await waitFor(() => expect(updatePhone).toHaveBeenCalledWith("08012345678"));
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("with it on, asks the customer who has not answered, and saves both", async () => {
    signedIn({ phone: "08012345678" });
    await open();
    openEditor();

    expect(tick()).toBeChecked();
    fireEvent.click(save());

    await waitFor(() => expect(updateWhatsAppNumber).toHaveBeenCalledWith({ useProfilePhone: true }));
    expect(updatePhone).toHaveBeenCalledWith("08012345678");
  });

  it("with it on, does not ask a customer who has already answered, so Save cannot change her answer", async () => {
    signedIn({ phone: "08012345678", whatsappOptedOutAt: "2026-11-01T10:00:00.000Z" });
    await open();
    openEditor();

    expect(tick()).toBeNull();
    fireEvent.click(save());

    await waitFor(() => expect(updatePhone).toHaveBeenCalled());
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("with it on, holds Save back while the other number is empty", async () => {
    signedIn({ phone: "08012345678" });
    await open();
    openEditor();

    fireEvent.click(tick()!);

    expect(save()).toBeDisabled();
  });

  it("works the same on a computer", async () => {
    isMobile.mockReturnValue(false);
    signedIn({ phone: "08012345678" });
    await open();
    openEditor();

    expect(tick()).toBeChecked();
    fireEvent.click(save());

    await waitFor(() => expect(updateWhatsAppNumber).toHaveBeenCalledWith({ useProfilePhone: true }));
  });
});

describe("her WhatsApp number on the account page, once she has one", () => {
  const confirmed = (extra: Record<string, unknown> = {}) =>
    signedIn({ phone: "8012345678", whatsappNumber: "2348012345678", whatsappConfirmedAt: "2026-11-20T10:00:00.000Z", ...extra });
  const editProfile = () => fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
  const field = () => screen.getByLabelText("WhatsApp number", { selector: "input" });
  const save = () => fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));

  it("shows under her email, with the WhatsApp logo (and the word, for screen readers)", async () => {
    confirmed();
    await open();
    const line = screen.getByTestId("profile-whatsapp");
    expect(line).toHaveTextContent("WhatsApp: 0801 234 5678");
    expect(line.querySelector("svg")).not.toBeNull();
    expect(line.querySelector(".sr-only")).toHaveTextContent("WhatsApp:");
  });

  it.each([
    ["she has not confirmed one", { whatsappConfirmedAt: undefined }],
    ["she replied STOP", { whatsappOptedOutAt: "2026-11-21T10:00:00.000Z" }],
  ])("is not shown when %s", async (_why, extra) => {
    confirmed(extra);
    await open();
    expect(screen.queryByTestId("profile-whatsapp")).toBeNull();
  });

  it("is not shown with the new experience off", async () => {
    useSubscribeEnabled.mockReturnValue(false);
    confirmed();
    await open();
    expect(screen.queryByTestId("profile-whatsapp")).toBeNull();
  });

  it("can be changed from Edit profile, and only a changed number is saved", async () => {
    confirmed();
    await open();
    editProfile();
    expect(field()).toHaveValue("0801 234 5678");
    save();
    await waitFor(() => expect(updatePhone).toHaveBeenCalled());
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("saves a new number she types", async () => {
    confirmed();
    await open();
    editProfile();
    fireEvent.change(field(), { target: { value: "0903 555 1212" } });
    save();
    await waitFor(() => expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "0903 555 1212" }));
  });

  it("will not save a number that is not a Nigerian mobile, and says why", async () => {
    confirmed();
    await open();
    editProfile();
    fireEvent.change(field(), { target: { value: "12345" } });
    expect(screen.getByText("Enter a Nigerian mobile number, like 0801 234 5678.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save changes/ })).toBeDisabled();
  });
});
