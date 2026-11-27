import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCallback } from "./AuthCallback";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));
const useSubscribeEnabled = vi.fn();
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => useSubscribeEnabled() }));
vi.mock("@/components/layout/Layout", () => ({ Layout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const updatePhone = vi.fn();
const updateWhatsAppNumber = vi.fn();

const signedIn = (extra: Record<string, unknown> = {}) =>
  useAuth.mockReturnValue({ user: { id: "u1", email: "ama@example.com", ...extra }, updatePhone, updateWhatsAppNumber });

const open = () =>
  render(
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/checkout" element={<p>the checkout page</p>} />
      </Routes>
    </MemoryRouter>,
  );

const typePhone = (phone: string) => fireEvent.change(screen.getByPlaceholderText("08012345678"), { target: { value: phone } });
const tick = () => screen.queryByRole("checkbox", { name: "This is my WhatsApp number" });
const next = () => screen.getByRole("button", { name: "Continue" });

beforeEach(() => {
  localStorage.clear();
  useSubscribeEnabled.mockReturnValue(true);
  updatePhone.mockReset();
  updatePhone.mockResolvedValue(undefined);
  updateWhatsAppNumber.mockReset();
  updateWhatsAppNumber.mockResolvedValue(undefined);
  toast.error.mockReset();
  signedIn();
});

describe("the first sign-in phone step, with the subscription experience off", () => {
  beforeEach(() => useSubscribeEnabled.mockReturnValue(false));

  it("is exactly as it was: no tick box, and only the phone is saved", async () => {
    open();

    expect(tick()).toBeNull();
    typePhone("08012345678");
    fireEvent.click(next());

    await waitFor(() => expect(screen.getByText("the checkout page")).toBeInTheDocument());
    expect(updatePhone).toHaveBeenCalledWith("08012345678");
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });
});

describe("the first sign-in phone step, with the subscription experience on", () => {
  it("asks whether the phone is her WhatsApp number, ticked to begin with", () => {
    open();

    expect(tick()).toBeChecked();
  });

  it("saves the phone, then confirms it as her WhatsApp number, then moves on", async () => {
    open();
    typePhone("08012345678");

    fireEvent.click(next());

    await waitFor(() => expect(screen.getByText("the checkout page")).toBeInTheDocument());
    expect(updatePhone).toHaveBeenCalledWith("08012345678");
    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ useProfilePhone: true });
    expect(updatePhone.mock.invocationCallOrder[0]).toBeLessThan(updateWhatsAppNumber.mock.invocationCallOrder[0]);
  });

  it("saves the other number when she unticks it and types one", async () => {
    open();
    typePhone("08012345678");
    fireEvent.click(tick()!);
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "0803 111 2222" } });

    fireEvent.click(next());

    await waitFor(() => expect(screen.getByText("the checkout page")).toBeInTheDocument());
    expect(updatePhone).toHaveBeenCalledWith("08012345678");
    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "0803 111 2222" });
  });

  it("holds Continue back while the other number is empty or wrong", () => {
    open();
    typePhone("08012345678");
    expect(next()).toBeEnabled();

    fireEvent.click(tick()!);
    expect(next()).toBeDisabled();

    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "0803" } });
    expect(next()).toBeDisabled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "0803 111 2222" } });
    expect(next()).toBeEnabled();
  });

  it("still moves on, with a message, when the WhatsApp number cannot be saved", async () => {
    updateWhatsAppNumber.mockRejectedValue(new Error("Enter a Nigerian mobile number, like 0801 234 5678"));
    open();
    typePhone("08012345678");

    fireEvent.click(next());

    await waitFor(() => expect(screen.getByText("the checkout page")).toBeInTheDocument());
    expect(updatePhone).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Enter a Nigerian mobile number, like 0801 234 5678");
  });

  it("does not ask for or save a WhatsApp number when the phone itself could not be saved", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    updatePhone.mockRejectedValue(new Error("Failed to update phone number"));
    open();
    typePhone("08012345678");

    fireEvent.click(next());

    await waitFor(() => expect(alert).toHaveBeenCalledWith("Failed to update phone number"));
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
    expect(screen.queryByText("the checkout page")).toBeNull();
  });

  it.each([
    ["confirmed a number", { whatsappConfirmedAt: "2026-11-01T10:00:00.000Z" }],
    ["replied STOP", { whatsappOptedOutAt: "2026-11-01T10:00:00.000Z" }],
  ])("leaves a customer who already %s alone", async (_what, extra) => {
    signedIn(extra);
    open();

    expect(tick()).toBeNull();
    typePhone("08012345678");
    fireEvent.click(next());

    await waitFor(() => expect(screen.getByText("the checkout page")).toBeInTheDocument());
    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });
});
