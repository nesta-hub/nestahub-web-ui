import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetSubscribeEnabled, useSubscribeEnabled, useSubscribeStatus } from "./useSubscribeEnabled";

const useAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => useAuth() }));

const fetchMock = vi.fn();

const answer = (body: unknown, ok = true) => fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 500, text: async () => JSON.stringify(body), json: async () => body });

beforeEach(() => {
  resetSubscribeEnabled();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  useAuth.mockReturnValue({ user: { id: "u1" }, session: { access_token: "tok" }, loading: false });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useSubscribeEnabled", () => {
  it("is off while it is still asking", async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useSubscribeEnabled());
    expect(result.current).toBe(false);
  });

  it("turns on when the server says it is on for her, and sends her sign-in", async () => {
    answer({ enabled: true });
    const { result } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(result.current).toBe(true));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/subscription-boxes\/config$/);
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("stays off when the server says off", async () => {
    answer({ enabled: false });
    const { result } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => undefined);
    expect(result.current).toBe(false);
  });

  it.each([
    ["the server errors", () => answer({ message: "boom" }, false)],
    ["the network fails", () => fetchMock.mockRejectedValue(new Error("offline"))],
    ["the answer is not what we expect", () => answer({ enabled: "yes" })],
    ["the answer is empty", () => answer({})],
  ])("stays off when %s: a broken API shows the old app, never the new one", async (_label, arrange) => {
    arrange();
    const { result } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => undefined);
    expect(result.current).toBe(false);
  });

  it("does not ask while sign-in is still loading, and stays off", async () => {
    useAuth.mockReturnValue({ user: null, session: null, loading: true });
    const { result } = renderHook(() => useSubscribeEnabled());
    await act(async () => undefined);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it("asks once for many components at the same moment", async () => {
    answer({ enabled: true });
    const a = renderHook(() => useSubscribeEnabled());
    const b = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(a.result.current && b.result.current).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("remembers the answer for a minute, then asks again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    answer({ enabled: true });
    const first = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(first.result.current).toBe(true));
    first.unmount();

    renderHook(() => useSubscribeEnabled());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 61_000);
    const later = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    later.unmount();
  });

  it("keeps showing the last answer while it checks again, and asks again on the next render, not only on a new mount", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    answer({ enabled: true });
    const { result, rerender } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(result.current).toBe(true));

    vi.setSystemTime(Date.now() + 61_000);
    fetchMock.mockReturnValue(new Promise(() => undefined)); // the re-check is slow
    rerender();
    expect(result.current).toBe(true); // not flipped back to the old app
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("switches off when a re-check says it is off", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    answer({ enabled: true });
    const { result, rerender } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(result.current).toBe(true));

    vi.setSystemTime(Date.now() + 61_000);
    answer({ enabled: false });
    rerender();
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("keeps the last answer when a re-check fails, rather than flapping to the old app", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    answer({ enabled: true });
    const { result, rerender } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(result.current).toBe(true));

    vi.setSystemTime(Date.now() + 61_000);
    fetchMock.mockRejectedValue(new Error("offline"));
    rerender();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await act(async () => undefined);
    expect(result.current).toBe(true);
  });

  it("does not hammer a broken API: after a failure it waits before asking again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    fetchMock.mockRejectedValue(new Error("offline"));
    const { result, rerender } = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => undefined);
    rerender();
    rerender();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(false);

    vi.setSystemTime(Date.now() + 16_000);
    rerender();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("asks again for a different person", async () => {
    answer({ enabled: true });
    const first = renderHook(() => useSubscribeEnabled());
    await waitFor(() => expect(first.result.current).toBe(true));
    first.unmount();

    useAuth.mockReturnValue({ user: { id: "u2" }, session: { access_token: "tok2" }, loading: false });
    answer({ enabled: false });
    const second = renderHook(() => useSubscribeEnabled());
    expect(second.result.current).toBe(false);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("is off, quietly, when there is no auth provider at all", async () => {
    useAuth.mockImplementation(() => {
      throw new Error("useAuth must be used within an AuthProvider");
    });
    const { result } = renderHook(() => useSubscribeEnabled());
    await act(async () => undefined);
    expect(result.current).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useSubscribeStatus (keeps still-finding-out apart from off)", () => {
  it("is loading until the server answers, then on", async () => {
    answer({ enabled: true });
    const { result } = renderHook(() => useSubscribeStatus());
    expect(result.current).toBe("loading");
    await waitFor(() => expect(result.current).toBe("on"));
  });

  it("is off when the server says off", async () => {
    answer({ enabled: false });
    const { result } = renderHook(() => useSubscribeStatus());
    await waitFor(() => expect(result.current).toBe("off"));
  });

  it("is off, not stuck loading, when the call fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useSubscribeStatus());
    await waitFor(() => expect(result.current).toBe("off"));
  });

  it("is loading while sign-in is loading", () => {
    useAuth.mockReturnValue({ user: null, session: null, loading: true });
    const { result } = renderHook(() => useSubscribeStatus());
    expect(result.current).toBe("loading");
  });
});
