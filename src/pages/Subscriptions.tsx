import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { SubscriptionsView } from "@/components/account/SubscriptionsView";

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

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

  return (
    <Layout showNav={false}>
      <SubscriptionsView onBack={() => navigate("/account")} />
    </Layout>
  );
};

export default Subscriptions;
