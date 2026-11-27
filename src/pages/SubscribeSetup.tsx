import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Bell, Check, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SignInForm } from "@/components/auth/SignInForm";
import { Layout } from "@/components/layout";
import { EYEBROW, startingChoice, type SubscribeChoice } from "@/components/subscribe-card/choice";
import { SubscribeChoiceFields } from "@/components/subscribe-card/SubscribeChoiceFields";
import { namesOf } from "@/components/subscribe-offer/offerText";
import { BottomSheet } from "@/components/subscription-tab/BottomSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscribeStatus } from "@/hooks/useSubscribeEnabled";
import { describeFrequency } from "@/lib/renewalFrequency";
import { BOX_CODES, BoxApiError, formatDay, subscriptionBoxesApi, type OfferLine, type OfferResult } from "@/lib/subscriptionBoxes";

const SKIPPED_TEXT = {
  not_eligible: "could not be subscribed to",
  already_subscribed: "is already one of your subscriptions",
  invalid_frequency: "needs a different frequency",
} as const;

const STEPS = [
  { icon: Bell, label: "You get reminders" },
  { icon: Wallet, label: "You simply pay, no reordering" },
  { icon: RefreshCw, label: "You remain in control" },
];

/** The idea, in one line of three steps. */
function Steps() {
  return (
    <div className="flex items-start justify-between gap-2 rounded-[24px] bg-[#DDE3DA] p-3.5 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]">
      {STEPS.map(({ icon: Icon, label }) => (
        <span key={label} className="flex flex-1 flex-col items-center gap-1.5">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-shop-brown shadow-[0_4px_10px_-6px_rgba(51,38,28,0.4)]">
            <Icon className="h-[17px] w-[17px]" />
          </span>
          <span className="text-center text-[12px] font-extrabold leading-[15px]">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** A picture of the item, or a blank tile when there is none. */
function Thumb({ url, className }: { url: string | null; className: string }) {
  return (
    <span className={`shrink-0 overflow-hidden bg-[#EFEAE4] ${className}`}>
      {url && <img src={url} alt="" className="block h-full w-full object-cover" />}
    </span>
  );
}

/** "Size 3 · ×2". */
const variantLine = (line: OfferLine) => [line.variantLabel, `×${line.quantity}`].filter(Boolean).join(" · ");

/** One item from her order: "Subscribe" until she has, then how often, with "Change". */
function Row({ line, picked, choice, onOpen }: { line: OfferLine; picked: boolean; choice: SubscribeChoice; onOpen: () => void }) {
  return (
    <li className="rounded-[24px] bg-white p-3.5 shadow-[0_12px_28px_-12px_rgba(51,38,28,0.22),0_2px_8px_rgba(51,38,28,0.05)]">
      <div className="flex items-center gap-3.5">
        <Thumb url={line.imageUrl} className="h-14 w-14 rounded-[18px]" />
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-[15px] font-extrabold leading-5">{line.productName}</span>
          <span className="text-[12.5px] leading-[18px] text-shop-muted">{variantLine(line)}</span>
        </span>
        {!picked && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Subscribe to ${line.productName}`}
            className="flex h-11 shrink-0 items-center justify-center rounded-[22px] bg-shop-cta px-4 text-[13px] font-extrabold text-shop-cream hover:bg-shop-cta-hover"
          >
            Subscribe
          </button>
        )}
      </div>
      {picked && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-[18px] bg-[#E8EDE5] py-2 pl-3.5 pr-1">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13.5px] font-extrabold leading-[19px] text-[#34443A]">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />
            {describeFrequency(choice.frequency)}
            {choice.firstDate ? `, from ${formatDay(choice.firstDate)}` : ""}
          </span>
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Change how often for ${line.productName}`}
            className="h-11 shrink-0 px-3 text-[13px] font-extrabold text-shop-brown underline underline-offset-[3px]"
          >
            Change
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * Set up a subscription from an order she has just placed: "Subscribe" on an item opens a drawer to say how often,
 * and "Done" subscribes to everything she said yes to. Reached from the offer on the order confirmation screens.
 */
const SubscribeSetup = () => {
  const { orderNumber = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading } = useAuth();
  const status = useSubscribeStatus();
  const accessToken = session?.access_token ?? null;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscribe-offer", orderNumber],
    queryFn: () => subscriptionBoxesApi.offer(accessToken, orderNumber),
    enabled: status === "on" && !!accessToken && !!orderNumber,
    retry: false,
  });
  const lines = useMemo(() => data?.eligible ?? [], [data]);

  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [choices, setChoices] = useState<Record<string, SubscribeChoice>>({});
  // The item in the drawer. Kept while the drawer slides away, so it does not empty as it goes.
  const [sheet, setSheet] = useState<{ id: string; open: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<{ result: OfferResult; lines: OfferLine[] } | null>(null);

  // Nothing is chosen to start with; each one starts at how long it lasts.
  useEffect(() => {
    setChoices((prev) => Object.fromEntries(lines.map((l) => [l.orderItemId as string, prev[l.orderItemId as string] ?? startingChoice(l.recommendedFrequencyWeeks, l.quantity)])));
  }, [lines]);

  if (loading || status === "loading") {
    return (
      <Layout showNav={false}>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }
  if (status === "off") return <Navigate to="/subscriptions" replace />;
  if (!user) {
    return (
      <Layout>
        <SignInForm
          title="Sign in to set up your subscription"
          description="Your order, your items, your reminders"
          containerClassName="flex flex-1 flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  const chosen = lines.filter((l) => picked[l.orderItemId as string]);
  const sheetLine = lines.find((l) => l.orderItemId === sheet?.id) ?? null;
  const choiceOf = (line: OfferLine) => choices[line.orderItemId as string] ?? startingChoice(line.recommendedFrequencyWeeks, line.quantity);
  const closeSheet = () => setSheet((current) => current && { ...current, open: false });
  const setPick = (id: string, on: boolean) => {
    setPicked((prev) => ({ ...prev, [id]: on }));
    closeSheet();
  };

  // Back to where she came from (the order confirmation), or the shop when she landed here directly.
  const leave = () => (location.key !== "default" ? navigate(-1) : navigate("/shop"));

  const submit = async () => {
    if (!chosen.length || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await subscriptionBoxesApi.subscribeFromOrder(
        accessToken,
        orderNumber,
        chosen.map((l) => {
          const choice = choiceOf(l);
          return {
            orderItemId: l.orderItemId as string,
            frequency: choice.frequency,
            ...(choice.frequency.kind === "weeks" && choice.firstDate ? { firstDate: choice.firstDate } : {}),
          };
        }),
      );
      await queryClient.invalidateQueries({ queryKey: ["subscription-tab"] });
      await queryClient.invalidateQueries({ queryKey: ["subscribe-offer"] });
      if (result.subscribed.length) toast.success("You're subscribed");
      // All of it went through: straight to her subscription. Otherwise, say what did not.
      if (result.subscribed.length && !result.skipped.length) navigate("/subscriptions");
      else setDone({ result, lines: chosen });
    } catch (err) {
      setProblem(
        err instanceof BoxApiError && err.code === BOX_CODES.orderClosed
          ? "This order can no longer be subscribed from."
          : err instanceof BoxApiError
            ? err.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  // ---- done, when something could not be subscribed ----------------------------------------
  if (done) {
    const made = done.lines.filter((l) => done.result.subscribed.includes(l.orderItemId as string));
    const notMade = done.result.skipped
      .map((s) => ({ line: done.lines.find((l) => l.orderItemId === s.orderItemId), reason: s.reason }))
      .filter((s): s is { line: OfferLine; reason: keyof typeof SKIPPED_TEXT } => !!s.line);
    return (
      <Layout>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-10 pt-6">
          <section className="rounded-[28px] bg-[#DDE3DA] p-6 shadow-[0_10px_24px_-14px_rgba(51,38,28,0.4)]">
            <h1 className="text-[24px] font-extrabold leading-[30px] tracking-[-0.02em] text-shop-ink">
              {made.length ? "You're subscribed" : "Nothing was subscribed"}
            </h1>
            {made.length > 0 && (
              <p className="mt-2 text-[14px] leading-5 text-[#34443A]">
                {namesOf(made, 3)}. We'll remind you before each one is due, and you pay only when you say yes. You can change or stop any of it from your subscription.
              </p>
            )}
            {notMade.length > 0 && (
              <ul className="mt-3 space-y-1 text-[13.5px] leading-5 text-[#5A4E44]">
                {notMade.map(({ line, reason }) => (
                  <li key={line.orderItemId}>
                    {line.productName} {SKIPPED_TEXT[reason]}.
                  </li>
                ))}
              </ul>
            )}
            <Link to="/subscriptions" className="mt-5 flex h-14 w-full items-center justify-center rounded-[28px] bg-shop-cta hover:bg-shop-cta-hover text-[15px] font-extrabold text-shop-cream">
              See my subscription
            </Link>
          </section>
        </main>
      </Layout>
    );
  }

  // ---- the list --------------------------------------------------------------------------
  const body = (() => {
    const say = (text: string) => <p className="px-5 py-10 text-center text-[14px] text-shop-muted">{text}</p>;
    if (isLoading) return say("Loading your order…");
    if (error instanceof BoxApiError && error.status === 404) return say("We couldn't find that order.");
    if (error) return say("We couldn't load your order. Please try again in a moment.");
    if (data?.state === "subscribed") return say("You're already subscribed to what's on this order.");
    if (!lines.length) return say("There's nothing on this order that can be subscribed to.");
    return (
      <>
        <h2 className={`mx-5 mb-3 mt-[26px] ${EYEBROW}`}>Subscribe to these essentials you just bought</h2>
        <ul aria-label="Items from your order" className="mx-5 flex flex-col gap-3">
          {lines.map((line) => {
            const id = line.orderItemId as string;
            return <Row key={id} line={line} picked={!!picked[id]} choice={choiceOf(line)} onOpen={() => setSheet({ id, open: true })} />;
          })}
        </ul>
      </>
    );
  })();

  const sheetPicked = !!sheetLine && !!picked[sheetLine.orderItemId as string];

  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-shop-page text-shop-ink">
        <div className="mx-auto w-full max-w-lg pb-[120px]">
          <header className="flex h-16 items-center gap-3 pl-3 pr-5 pt-3">
            <button
              type="button"
              aria-label="Back"
              onClick={leave}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-shop-ink shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <h1 className="min-w-0 flex-1 text-[18px] font-extrabold leading-6 tracking-[-0.01em]">Subscribe</h1>
          </header>

          <div className="px-5 pt-2">
            <Steps />
          </div>

          {body}

          {problem && (
            <p role="alert" className="mx-5 mt-4 text-center text-[13.5px] font-semibold text-[#9A4A3A]">
              {problem}
            </p>
          )}
        </div>

        {lines.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-10 h-[100px] border-t border-shop-line bg-[rgba(251,249,246,0.96)] px-5 pt-3 backdrop-blur-[14px]">
            <div className="mx-auto w-full max-w-lg">
              {chosen.length ? (
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="flex h-14 w-full items-center justify-center rounded-[28px] border border-transparent bg-shop-cta text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover disabled:opacity-50"
                >
                  {busy ? "One moment…" : "Done"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={leave}
                  className="flex h-14 w-full items-center justify-center rounded-[28px] border border-shop-line-soft bg-white text-[15px] font-extrabold text-shop-ink"
                >
                  Maybe later
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomSheet
        open={!!sheet?.open && !!sheetLine}
        onClose={closeSheet}
        title="How often"
        header={
          sheetLine ? (
            <div className="flex items-center gap-3">
              <Thumb url={sheetLine.imageUrl} className="h-[52px] w-[52px] rounded-2xl" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold leading-[19px]">{sheetLine.productName}</span>
                <span className="mt-px block text-[12.5px] leading-[17px] text-shop-muted">{variantLine(sheetLine)}</span>
              </span>
            </div>
          ) : undefined
        }
      >
        {sheetLine && (
          <>
            <p className={`mb-2.5 mt-2.5 ${EYEBROW}`}>Renewal frequency</p>
            <SubscribeChoiceFields
              value={choiceOf(sheetLine)}
              onChange={(next) => setChoices((prev) => ({ ...prev, [sheetLine.orderItemId as string]: next }))}
              // She bought it: like the shop, it counts from delivery, so no first renewal day is asked.
              showFirstRenewal={false}
            />
            <button
              type="button"
              onClick={() => setPick(sheetLine.orderItemId as string, true)}
              className="mt-4 flex h-14 w-full items-center justify-between rounded-[28px] bg-shop-cta pl-6 pr-2 text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover"
            >
              <span>{sheetPicked ? "Save" : "Subscribe"}</span>
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-shop-cream text-shop-cta">
                <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
              </span>
            </button>
            {sheetPicked && (
              <div className="mt-0.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPick(sheetLine.orderItemId as string, false)}
                  className="h-11 px-2.5 text-[13.5px] font-bold text-shop-muted underline underline-offset-[3px]"
                >
                  Turn off auto-renew for this item
                </button>
              </div>
            )}
          </>
        )}
      </BottomSheet>
    </Layout>
  );
};

export default SubscribeSetup;
