import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { SubscriptionTab, type LinkAction } from "@/components/subscription-tab/SubscriptionTab";
import { useSubscribeStatus } from "@/hooks/useSubscribeEnabled";
import { useIsMobile } from "@/hooks/use-mobile";
import { clearBoxToken, setBoxToken } from "@/lib/subscriptionBoxes";

const ACTIONS: readonly LinkAction[] = ["pay", "edit", "open", "resume"];

/**
 * Where a button in a WhatsApp or email reminder lands: `/subscriptions/pay/<token>`, and the
 * same for edit, open and resume. The token in the address is her key for this visit, so no
 * sign-in is asked for. It opens the same tab as the nav's Subscribe, with the right drawer
 * already open. If the new experience is off (or the address is wrong) she goes to the
 * ordinary Subscriptions page instead.
 */
export default function SubscriptionLink() {
  const { action, token } = useParams();
  // The token must be in place before the switch is asked about (the check includes it), so it is set before the first render.
  const [ready] = useState(() => {
    if (token) setBoxToken(token);
    return true;
  });
  const status = useSubscribeStatus();
  const isMobile = useIsMobile();
  const [payScreen, setPayScreen] = useState(false);
  const known = ACTIONS.includes(action as LinkAction);

  useEffect(() => {
    if (status === "off") clearBoxToken();
  }, [status]);

  if (!ready) return null;
  if (!known || !token || status === "off") return <Navigate to="/subscriptions" replace />;
  if (status === "loading") {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </Layout>
    );
  }
  return (
    <Layout showNav={!(isMobile && payScreen)}>
      <SubscriptionTab linkAction={action as LinkAction} onPayScreen={setPayScreen} />
    </Layout>
  );
}
