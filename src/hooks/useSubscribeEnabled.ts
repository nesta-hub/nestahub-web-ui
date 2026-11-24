import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getBoxToken, subscriptionBoxesApi } from '@/lib/subscriptionBoxes';

/**
 * Is the new subscription experience on for this visitor?
 *
 * The one switch for every piece of new UI: the nav item, the Subscription tab, the
 * product-page card, the WhatsApp number prompt. `false` while it loads and `false` if the
 * call fails, so a slow or broken API shows the old app, never the new one. Turning the
 * switch off in admin puts everything old back.
 *
 * Deliberately not built on React Query: it has to work in every part of the app, including
 * the nav, which must not need a provider of its own to render.
 */

const TTL_MS = 60_000;
/** After a failure, do not ask again for a short while. */
const FAILURE_TTL_MS = 15_000;

// Her answer is kept while it is checked again in the background, so the nav never flips back to the
// old one just because a minute has passed. A check that fails keeps the last answer too; only a visit
// that has never had an answer shows the old app.

interface Entry {
  value: boolean;
  at: number;
  ttl: number;
}

const cache = new Map<string, Entry>();
const inFlight = new Map<string, Promise<boolean>>();
const listeners = new Set<() => void>();

/** Forget everything we know (tests, and when someone signs in or out). */
export function resetSubscribeEnabled(): void {
  cache.clear();
  inFlight.clear();
  listeners.forEach((notify) => notify());
}

function isStale(entry: Entry | undefined, now: number): boolean {
  return !entry || now - entry.at >= entry.ttl;
}

function load(key: string, accessToken: string | null): Promise<boolean> {
  const pending = inFlight.get(key);
  if (pending) return pending;
  const started = (async () => {
    try {
      const { enabled } = await subscriptionBoxesApi.config(accessToken);
      cache.set(key, { value: enabled, at: Date.now(), ttl: TTL_MS });
      return enabled;
    } catch {
      const kept = cache.get(key)?.value ?? false;
      cache.set(key, { value: kept, at: Date.now(), ttl: FAILURE_TTL_MS });
      return kept;
    } finally {
      inFlight.delete(key);
      listeners.forEach((notify) => notify());
    }
  })();
  inFlight.set(key, started);
  return started;
}

/** Who is signed in. Outside an AuthProvider (a bare test, a preview) there is nobody, and the answer stays "off". */
function useSignedInOrNobody() {
  try {
    // Always called, in the same place on every render: the try only catches the "no provider" error it throws.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user, session, loading } = useAuth();
    return { user, session, loading, hasAuth: true };
  } catch {
    return { user: null, session: null, loading: false, hasAuth: false };
  }
}

export type SubscribeStatus = 'loading' | 'on' | 'off';

/**
 * The same answer as `useSubscribeEnabled`, with "still finding out" kept apart from "off".
 * Only pages that must not act on a guess (a link that would send her to the old page) need it.
 */
export function useSubscribeStatus(): SubscribeStatus {
  const { user, session, loading, hasAuth } = useSignedInOrNobody();
  const accessToken = session?.access_token ?? null;
  const key = `${user?.id ?? 'anon'}|${getBoxToken() ? 'link' : 'nolink'}`;
  const [, rerender] = useState(0);

  useEffect(() => {
    const notify = () => rerender((n) => n + 1);
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  }, []);

  const entry = cache.get(key);
  // Checked on every render, not only when something it depends on changes: an answer goes stale with
  // time, and the next render after that is when it should be asked again.
  useEffect(() => {
    if (loading || !hasAuth) return;
    if (isStale(cache.get(key), Date.now()) && !inFlight.has(key)) void load(key, accessToken);
  });

  if (!hasAuth) return 'off';
  if (loading) return 'loading';
  if (!entry) return 'loading';
  return entry.value ? 'on' : 'off';
}

export function useSubscribeEnabled(): boolean {
  return useSubscribeStatus() === 'on';
}
