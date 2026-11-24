import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SignInForm } from "@/components/auth/SignInForm";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingExtras } from "@/contexts/PendingExtrasContext";
import { useSubscriptionTab } from "@/hooks/useSubscriptionTab";
import { storeClaimToken } from "@/lib/api";
import { BOX_CODES, BoxApiError, formatDay, subscriptionBoxesApi, type Box, type PayResult } from "@/lib/subscriptionBoxes";
import { AddItemButton } from "./AddItemButton";
import { BoxPayView } from "./BoxPayView";
import { EmptyTab, NothingDueCard } from "./EmptyTab";
import { ItemDrawer } from "./ItemDrawer";
import { ItemRow } from "./ItemRow";
import { MakeChangesDrawer } from "./MakeChangesDrawer";
import { NextOrderCard, SkippedCard, SkippedOrderCard } from "./NextOrderCard";
import { ResumeDrawer } from "./ResumeDrawer";

/** Which link she came in by, when she came from a message. */
export type LinkAction = "pay" | "edit" | "open" | "resume";

const LIVE = new Set(["scheduled", "asked", "paid"]);

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading your subscription">
      <div className="h-[330px] rounded-[28px] bg-[#E7E2DB]" />
      <div className="h-24 rounded-3xl bg-[#E7E2DB]" />
    </div>
  );
}

/**
 * The Subscription tab: the order she is about to pay, then the items she subscribes to.
 * Used for a signed-in customer and, with `linkAction`, for someone who opened a link in a
 * message (the same screen, with the right drawer already open).
 */
export function SubscriptionTab({ linkAction }: { linkAction?: LinkAction }) {
  const navigate = useNavigate();
  const pending = usePendingExtras();
  const { session, walletBalance, signOut } = useAuth();
  const tab = useSubscriptionTab();
  const { data, isLoading, error, accessToken, act, refresh } = tab;

  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState<(PayResult & { box: Box }) | null>(null);
  const [changes, setChanges] = useState<{ boxId: string; startOn: "menu" | "location" } | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [linkHandled, setLinkHandled] = useState(false);

  const boxes = useMemo(() => (data?.boxes ?? []).filter((b) => LIVE.has(b.status) || b.status === "skipped"), [data]);
  const firstOpenId = boxes.find((b) => b.status !== "skipped")?.id;
  const paused = useMemo(() => (data?.items ?? []).filter((i) => i.status === "paused"), [data]);

  // A link from a message opens the drawer it was about, once.
  useEffect(() => {
    if (!data || !linkAction || linkHandled) return;
    setLinkHandled(true);
    if (linkAction === "edit") {
      const target = data.boxes.find((b) => b.id === data.linkBoxId && b.editable) ?? data.boxes.find((b) => b.editable);
      if (target) setChanges({ boxId: target.id, startOn: "menu" });
    } else if (linkAction === "resume" && data.items.some((i) => i.status === "paused")) {
      setResumeOpen(true);
    }
  }, [data, linkAction, linkHandled]);

  const run = async <T,>(work: () => Promise<T>): Promise<boolean> => {
    setBusy(true);
    try {
      return (await act(work)).ok;
    } finally {
      setBusy(false);
    }
  };

  const pay = async (box: Box) => {
    setBusy(true);
    try {
      const result = await act(() => subscriptionBoxesApi.pay(accessToken, box.id, box.totalKobo ?? undefined), { quiet: true });
      if ("value" in result) {
        // Someone who opened a link has no sign-in: the key for this one order is what lets the pay screen act on it.
        if (result.value.claimToken) storeClaimToken(result.value.orderNumber, result.value.claimToken);
        setPaying({ ...result.value, box });
        return;
      }
      const err = result.error;
      if (err instanceof BoxApiError && err.code === BOX_CODES.totalChanged) toast.error("The price has changed. Please check the new total, then tap Pay now.");
      else if (err instanceof BoxApiError && err.code === BOX_CODES.needsDelivery) setChanges({ boxId: box.id, startOn: "location" });
      else if (err instanceof BoxApiError && err.code === BOX_CODES.deliveryChanged) {
        toast.error(err.message);
        setChanges({ boxId: box.id, startOn: "location" });
      } else toast.error(err instanceof BoxApiError ? err.message : "We could not start your payment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // The pay screen: the same steps as every order's (bank details, "Payment made", wallet for someone signed in), in the Subscribe design.
  if (paying) {
    return (
      <BoxPayView
        box={paying.box}
        orderNumber={paying.orderNumber}
        totalKobo={paying.totalKobo}
        token={session?.access_token ?? ""}
        walletBalance={session ? (walletBalance ?? 0) : 0}
        allowGiftCard={!!session}
        onBack={() => {
          setPaying(null);
          void refresh();
        }}
        onDone={() => {
          setPaying(null);
          void refresh();
        }}
      />
    );
  }

  // A link that no longer works (it expired, or was opened on another device) falls back to signing in.
  if (error instanceof BoxApiError && error.status === 401) {
    return (
      <SignInForm
        title="Sign in to see your subscription"
        description="This link has expired or cannot be used here."
        containerClassName="flex flex-col items-center justify-center px-6 py-16"
      />
    );
  }
  // She is signed in as someone else: say so, and let her choose.
  if (error instanceof BoxApiError && error.code === BOX_CODES.linkOtherAccount) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-[20px] font-extrabold text-shop-ink">This link is for another account</h1>
        <p className="mt-2 text-[14px] leading-5 text-[#5A4E44]">It was sent to a different account from the one you are signed in to. Sign out, then open it again.</p>
        <button type="button" onClick={() => void signOut()} className="mt-5 h-12 rounded-full bg-shop-cta hover:bg-shop-cta-hover px-8 text-[14px] font-extrabold text-shop-cream">
          Sign out
        </button>
      </div>
    );
  }

  const changesBox = changes ? (data?.boxes.find((b) => b.id === changes.boxId) ?? null) : null;
  const item = itemId ? (data?.items.find((i) => i.id === itemId) ?? null) : null;
  const nextDueOverall = (data?.items ?? [])
    .filter((i) => i.status === "active" && i.nextDue)
    .map((i) => i.nextDue as string)
    .sort()[0] ?? null;
  const nextOrderDate = (boxes.find((b) => b.status !== "skipped")?.deliveryDate ?? nextDueOverall) || null;
  // Nothing is waiting after an order she skipped: it stays as the page's one card, showing the day the next one is due.
  const nothingAfterSkip = !boxes.some((b) => b.status !== "skipped");
  const empty = !data || (data.items.length === 0 && boxes.length === 0);

  /** Start shopping for this order: what she picks in the shop goes to it, not to her cart. */
  const addExtras = (box: Box) => {
    pending.start(box.id);
    navigate("/shop");
  };

  return (
    <div className="mx-auto w-full max-w-xl pb-28 md:pb-16">
      {/* A page title like Gifting and Contact have: no header bar, no menu button, no cart. */}
      <div className="px-5 pb-2 pt-6">
        <h1 className="font-display text-2xl font-bold leading-tight tracking-[-0.01em] text-foreground">{!isLoading && !error && empty ? "Subscriptions" : "Subscription"}</h1>
      </div>

      <div className="px-5 pt-4">
        {isLoading ? (
          <Skeleton />
        ) : error ? (
          <div className="rounded-[24px] bg-white p-6 text-center shadow-sm">
            <p className="text-[15px] font-bold text-shop-ink">We could not load your subscription.</p>
            <button type="button" onClick={() => void tab.refetch()} className="mt-4 h-11 rounded-full bg-shop-cta hover:bg-shop-cta-hover px-6 text-[14px] font-extrabold text-shop-cream">
              Try again
            </button>
          </div>
        ) : empty ? (
          <EmptyTab />
        ) : (
          <>
            <div className="space-y-4">
              {boxes.length === 0 && <NothingDueCard nextDue={nextDueOverall} />}
              {boxes.map((box) =>
                box.status === "skipped" ? (
                  nothingAfterSkip ? (
                    <SkippedOrderCard
                      key={box.id}
                      box={box}
                      nextOrder={nextOrderDate}
                      busy={busy}
                      onUndo={() => void run(() => subscriptionBoxesApi.undoSkip(accessToken, box.id))}
                      onChangeLocation={() => undefined}
                    />
                  ) : (
                    <SkippedCard key={box.id} box={box} nextOrder={nextOrderDate} busy={busy} onUndo={() => void run(() => subscriptionBoxesApi.undoSkip(accessToken, box.id))} />
                  )
                ) : (
                  <NextOrderCard
                    key={box.id}
                    box={box}
                    first={box.id === firstOpenId}
                    busy={busy}
                    onPay={() => void pay(box)}
                    onMakeChanges={() => setChanges({ boxId: box.id, startOn: "menu" })}
                    onSkip={() => void run(() => subscriptionBoxesApi.skip(accessToken, box.id))}
                    onAddExtras={() => addExtras(box)}
                    onChangeLocation={() => setChanges({ boxId: box.id, startOn: "location" })}
                  />
                ),
              )}
            </div>

            <h3 className="mb-3 mt-[26px] text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-[#6B5F55]">Your subscribed items</h3>
            <ul aria-label="Your subscribed items" className="m-0 flex list-none flex-col gap-3 p-0">
              <li className="list-none">
                <AddItemButton label="Subscribe to something else" />
              </li>
              {data.items.map((i) => (
                <ItemRow key={i.id} item={i} onOpen={() => setItemId(i.id)} />
              ))}
            </ul>
          </>
        )}
      </div>

      <MakeChangesDrawer
        box={changesBox}
        open={!!changesBox}
        startOn={changes?.startOn}
        busy={busy}
        onClose={() => setChanges(null)}
        onLeaveOut={(subscriptionId) => run(() => subscriptionBoxesApi.leaveOut(accessToken, changesBox!.id, subscriptionId))}
        onRemoveExtra={(lineId) => run(() => subscriptionBoxesApi.removeExtra(accessToken, changesBox!.id, lineId))}
        onMoveDay={(date) => run(() => subscriptionBoxesApi.moveDay(accessToken, changesBox!.id, date))}
        onChangeLocation={(location) => run(() => subscriptionBoxesApi.changeLocation(accessToken, changesBox!.id, location))}
        loadDeliveryOptions={(lat, lng) => subscriptionBoxesApi.deliveryOptions(accessToken, changesBox!.id, lat, lng)}
      />

      <ItemDrawer
        item={item}
        open={!!item}
        busy={busy}
        onClose={() => setItemId(null)}
        onQuantity={(quantity) => run(() => subscriptionBoxesApi.setQuantity(accessToken, item!.id, quantity))}
        onVariant={(variantId) => run(() => subscriptionBoxesApi.setVariant(accessToken, item!.id, variantId))}
        onFrequency={async (frequency) => {
          const changed = await act(() => subscriptionBoxesApi.setFrequency(accessToken, item!.id, frequency));
          if ("value" in changed && changed.value.nextDue) toast.success(`Saved. Next one: ${formatDay(changed.value.nextDue)}.`);
          return changed.ok;
        }}
        onPause={() => run(() => subscriptionBoxesApi.pause(accessToken, item!.id))}
        onResume={() => run(() => subscriptionBoxesApi.resume(accessToken, item!.id))}
        onStop={() => run(() => subscriptionBoxesApi.stop(accessToken, item!.id))}
      />

      <ResumeDrawer
        items={paused}
        open={resumeOpen}
        busy={busy}
        onClose={() => setResumeOpen(false)}
        onResume={(id) => run(() => subscriptionBoxesApi.resume(accessToken, id))}
      />
    </div>
  );
}
