import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { ReferralActivityContent } from "@/components/referrals/ReferralActivityContent";

export default function ReferralActivity() {
  const [params] = useSearchParams();
  const code = params.get("code") || undefined;
  return (
    <Layout>
      <div className="container max-w-6xl px-4 md:px-6 py-6 md:py-10">
        <ReferralActivityContent
          title="Referral activities"
          hideConvert
          overrideCode={code}
          persist={false}
          showPageHeader={false}
          variant="marketing"
        />
      </div>
    </Layout>
  );
}
