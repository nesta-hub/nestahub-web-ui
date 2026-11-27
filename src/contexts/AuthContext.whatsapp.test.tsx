import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const session = { access_token: "tok", user: { id: "s1" } };
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
  },
}));
vi.mock("@/lib/api", () => ({
  api: {},
  getWalletSummary: () => Promise.resolve({ balance: 0 }),
  attributeReferral: () => Promise.resolve(),
  getAllClaimTokens: () => ({}),
  claimGuestOrder: () => Promise.resolve(),
}));

const fetchMock = vi.fn();
const reply = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body });

const signedUp = { id: "u1", supabaseId: "s1", email: "ama@example.com", phone: "08012345678", createdAt: "2026-01-01T00:00:00.000Z" };
const confirmed = { ...signedUp, whatsappNumber: "2348012345678", whatsappConfirmedAt: "2026-11-15T09:00:00.000Z" };

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

async function signedInUser() {
  fetchMock.mockResolvedValueOnce(reply(signedUp)); // /auth/sync-user
  const view = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(view.result.current.user).not.toBeNull());
  return view;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the signed-in customer", () => {
  it("carries her WhatsApp fields through from the server", async () => {
    fetchMock.mockResolvedValueOnce(reply({ ...confirmed, whatsappOptedOutAt: "2026-11-16T09:00:00.000Z" }));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.whatsappNumber).toBe("2348012345678"));

    expect(result.current.user?.whatsappConfirmedAt).toBe("2026-11-15T09:00:00.000Z");
    expect(result.current.user?.whatsappOptedOutAt).toBe("2026-11-16T09:00:00.000Z");
  });
});

describe("updateWhatsAppNumber", () => {
  it("confirms the number on her profile and takes the user the server sends back", async () => {
    const { result } = await signedInUser();
    fetchMock.mockResolvedValueOnce(reply(confirmed));

    await act(async () => {
      await result.current.updateWhatsAppNumber({ useProfilePhone: true });
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toMatch(/\/auth\/whatsapp-number$/);
    expect(init.method).toBe("PUT");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual({ useProfilePhone: true });
    expect(result.current.user?.whatsappConfirmedAt).toBe("2026-11-15T09:00:00.000Z");
    expect(result.current.user?.phone).toBe("08012345678");
  });

  it("sends a different number exactly as typed", async () => {
    const { result } = await signedInUser();
    fetchMock.mockResolvedValueOnce(reply(confirmed));

    await act(async () => {
      await result.current.updateWhatsAppNumber({ whatsappNumber: "0801 234 5678" });
    });

    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ whatsappNumber: "0801 234 5678" });
  });

  it("throws the server's own words, and leaves the user as she was, when it says no", async () => {
    const { result } = await signedInUser();
    fetchMock.mockResolvedValueOnce(reply({ message: "Enter a Nigerian mobile number, like 0801 234 5678" }, false));

    await expect(result.current.updateWhatsAppNumber({ whatsappNumber: "0803" })).rejects.toThrow(
      "Enter a Nigerian mobile number, like 0801 234 5678",
    );

    expect(result.current.user?.whatsappConfirmedAt).toBeUndefined();
  });

  it("uses the first message when the server sends a list of them", async () => {
    const { result } = await signedInUser();
    fetchMock.mockResolvedValueOnce(reply({ message: ["Enter a valid WhatsApp number, like 0801 234 5678"] }, false));

    await expect(result.current.updateWhatsAppNumber({ whatsappNumber: "x" })).rejects.toThrow("Enter a valid WhatsApp number, like 0801 234 5678");
  });

  it("has words of its own when the answer has none", async () => {
    const { result } = await signedInUser();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502, json: async () => Promise.reject(new Error("not json")) });

    await expect(result.current.updateWhatsAppNumber({ useProfilePhone: true })).rejects.toThrow("Failed to save WhatsApp number");
  });
});
