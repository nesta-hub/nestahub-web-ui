import { Layout } from '@/components/layout';
import { SignInForm } from '@/components/auth/SignInForm';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { ReferralStats } from '@/components/referral/ReferralStats';
import { useAuth } from '@/contexts/AuthContext';
import { useReferralData } from '@/hooks/useReferralData';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Referrals = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { info, loading, share } = useReferralData(session?.access_token);
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <SignInForm
          title="Sign in to refer friends"
          description="Earn ₦500 for every friend who completes their first order"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Referrals</h1>
        </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : info ? (
          <>
            <ReferralCard referralCode={info.referralCode} onShare={share} />
            <ReferralStats info={info} />
          </>
        ) : null}

        <div className="rounded-xl border border-border p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">How it works</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-semibold text-foreground shrink-0">1.</span> Share your code or link with a friend</li>
            <li className="flex gap-2"><span className="font-semibold text-foreground shrink-0">2.</span> They sign up and complete their first order</li>
            <li className="flex gap-2"><span className="font-semibold text-foreground shrink-0">3.</span> You earn ₦500 in wallet credit after delivery</li>
          </ol>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Referrals;
