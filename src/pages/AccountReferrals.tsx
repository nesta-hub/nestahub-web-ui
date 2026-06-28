import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { ReferralActivityContent } from "@/components/referrals/ReferralActivityContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopReferralsView } from "@/components/account/DesktopReferralsView";

export default function AccountReferrals() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <DesktopReferralsView onBack={() => navigate('/account')} />
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <ReferralActivityContent title="My Referrals" />
    </Layout>
  );
}
