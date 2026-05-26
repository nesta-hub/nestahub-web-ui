import { Layout } from "@/components/layout";
import { ReferralActivityContent } from "@/components/referrals/ReferralActivityContent";

export default function AccountReferrals() {
  return (
    <Layout showNav={false}>
      <ReferralActivityContent title="My Referrals" />
    </Layout>
  );
}
