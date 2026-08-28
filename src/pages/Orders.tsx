import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { OrdersView } from "@/components/account/OrdersView";
import { DesktopOrdersView } from "@/components/account/DesktopOrdersView";
import { useIsMobile } from "@/hooks/use-mobile";

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const initialOrderNumber: string | undefined = (location.state as { orderNumber?: string } | null)?.orderNumber;

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
          title="Sign in to view your orders"
          description="Access your order history"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <DesktopOrdersView onBack={() => navigate("/account")} initialOrderNumber={initialOrderNumber} />
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <OrdersView onBack={() => navigate("/account")} initialOrderNumber={initialOrderNumber} />
    </Layout>
  );
};

export default Orders;
