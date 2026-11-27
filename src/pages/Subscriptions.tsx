import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { SubscriptionsView } from "@/components/account/SubscriptionsView";
import { DesktopSubscriptionsView } from "@/components/account/DesktopSubscriptionsView";
import { SubscriptionTab } from "@/components/subscription-tab/SubscriptionTab";
import { useSubscribeStatus } from "@/hooks/useSubscribeEnabled";
import { useIsMobile } from "@/hooks/use-mobile";

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  // Which experience she gets. While it is still being worked out, neither is shown.
  const status = useSubscribeStatus();
  // The pay screen is a focused step on a phone: no bottom navigation under its Payment Made button.
  const [payScreen, setPayScreen] = useState(false);

  if (loading || status === "loading") {
    return (
      <Layout showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  // The new Subscription tab, with the nav around it.
  if (status === "on") {
    if (!user) {
      return (
        <Layout>
          <SignInForm
            title="Sign in to see your subscription"
            description="Your items, your next order and your reminders"
            containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
          />
        </Layout>
      );
    }
    return (
      <Layout showNav={!(isMobile && payScreen)}>
        <SubscriptionTab onPayScreen={setPayScreen} />
      </Layout>
    );
  }

  // The page as it has always been.
  if (!user) {
    return (
      <Layout showNav={false}>
        <SignInForm
          title="Sign in to manage subscriptions"
          description="View and manage your active subscriptions"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <DesktopSubscriptionsView onBack={() => navigate("/account")} />
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <SubscriptionsView onBack={() => navigate("/account")} />
    </Layout>
  );
};

export default Subscriptions;
