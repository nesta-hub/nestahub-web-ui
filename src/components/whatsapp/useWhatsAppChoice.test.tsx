import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfirmWhatsApp, useWhatsAppChoice } from "./useWhatsAppChoice";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));
const useSubscribeEnabled = vi.fn();
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => useSubscribeEnabled() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const updateWhatsAppNumber = vi.fn();

beforeEach(() => {
  useSubscribeEnabled.mockReturnValue(true);
  useAuth.mockReturnValue({ user: { id: "u1" }, updateWhatsAppNumber });
  updateWhatsAppNumber.mockReset();
  updateWhatsAppNumber.mockResolvedValue(undefined);
  toast.error.mockReset();
});

describe("useWhatsAppChoice", () => {
  it("is on, ticked and saves her phone as her WhatsApp number to begin with", () => {
    const { result } = renderHook(() => useWhatsAppChoice());

    expect(result.current.active).toBe(true);
    expect(result.current.choice).toEqual({ sameAsPhone: true, whatsappNumber: "" });
    expect(result.current.toSave).toEqual({ sameAsPhone: true, whatsappNumber: "" });
    expect(result.current.blocked).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("is off, and saves nothing, when the subscription experience is off", () => {
    useSubscribeEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useWhatsAppChoice());

    expect(result.current.active).toBe(false);
    expect(result.current.toSave).toBeNull();
    expect(result.current.blocked).toBe(false);
  });

  it("does not hold a form back when the experience is off, even if the choice is unfinished", () => {
    useSubscribeEnabled.mockReturnValue(false);
    const { result } = renderHook(() => useWhatsAppChoice());

    act(() => result.current.setChoice({ sameAsPhone: false, whatsappNumber: "" }));

    expect(result.current.blocked).toBe(false);
    expect(result.current.toSave).toBeNull();
  });

  it.each([
    ["confirmed a number", { whatsappConfirmedAt: "2026-11-01T10:00:00.000Z" }],
    ["replied STOP", { whatsappOptedOutAt: "2026-11-01T10:00:00.000Z" }],
  ])("is off for a customer who has already %s, so saving a phone never changes that", (_what, extra) => {
    useAuth.mockReturnValue({ user: { id: "u1", ...extra }, updateWhatsAppNumber });

    const { result } = renderHook(() => useWhatsAppChoice());

    expect(result.current.active).toBe(false);
    expect(result.current.toSave).toBeNull();
  });

  it("holds the form back while she has unticked it without a good number, and only complains once she has typed", () => {
    const { result } = renderHook(() => useWhatsAppChoice());

    act(() => result.current.setChoice({ sameAsPhone: false, whatsappNumber: "" }));
    expect(result.current.blocked).toBe(true);
    expect(result.current.error).toBeNull();

    act(() => result.current.setChoice({ sameAsPhone: false, whatsappNumber: "0803" }));
    expect(result.current.blocked).toBe(true);
    expect(result.current.error).toBe("Enter a Nigerian mobile number, like 0801 234 5678");

    act(() => result.current.setChoice({ sameAsPhone: false, whatsappNumber: "0803 111 2222" }));
    expect(result.current.blocked).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe("useConfirmWhatsApp", () => {
  const confirm = () => renderHook(() => useConfirmWhatsApp()).result.current;

  it("does nothing when the tick box was not shown", async () => {
    await confirm()(null, "08012345678");

    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("confirms the profile phone when the box is ticked", async () => {
    await confirm()({ sameAsPhone: true, whatsappNumber: "" }, "08012345678");

    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ useProfilePhone: true });
  });

  it("confirms the number she typed when the box is unticked", async () => {
    await confirm()({ sameAsPhone: false, whatsappNumber: "0803 111 2222" }, "08012345678");

    expect(updateWhatsAppNumber).toHaveBeenCalledWith({ whatsappNumber: "0803 111 2222" });
  });

  it("does not send a phone that is not a mobile as her WhatsApp number", async () => {
    await confirm()({ sameAsPhone: true, whatsappNumber: "" }, "01012345678");

    expect(updateWhatsAppNumber).not.toHaveBeenCalled();
  });

  it("shows a message and carries on when the server turns it down, never throwing", async () => {
    updateWhatsAppNumber.mockRejectedValue(new Error("Enter a Nigerian mobile number, like 0801 234 5678"));

    await expect(confirm()({ sameAsPhone: false, whatsappNumber: "0803 111 2222" }, "08012345678")).resolves.toBeUndefined();

    expect(toast.error).toHaveBeenCalledWith("Enter a Nigerian mobile number, like 0801 234 5678");
  });

  it("has words of its own when the failure has none", async () => {
    updateWhatsAppNumber.mockRejectedValue("offline");

    await confirm()({ sameAsPhone: true, whatsappNumber: "" }, "08012345678");

    expect(toast.error).toHaveBeenCalledWith("We couldn't save your WhatsApp number.");
  });
});
