import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { getReferralCookie, setReferralCookie } from '@/utils/wallet';

export function AuthCallback() {
  const navigate = useNavigate();
  const { user, updatePhone } = useAuth();
  const [showPhoneCollection, setShowPhoneCollection] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralFromCookie, setReferralFromCookie] = useState(false);
  const [redirectUrl] = useState(() => {
    const saved = localStorage.getItem('auth_redirect_url') || '/checkout';
    localStorage.removeItem('auth_redirect_url');
    return saved;
  });

  useEffect(() => {
    // Once user is synced, check if phone is needed
    if (user) {
      if (!user.phone) {
        // Pre-fill referral code from cookie if present
        const existing = getReferralCookie();
        if (existing) { setReferralCode(existing); setReferralFromCookie(true); }
        setShowPhoneCollection(true);
      } else {
        // User has phone, redirect to destination
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [user, redirectUrl, navigate]);

  const persistReferralCode = () => {
    const trimmed = referralCode.trim().toUpperCase();
    if (trimmed) setReferralCookie(trimmed);
  };

  const handlePhoneContinue = async () => {
    persistReferralCode();
    try {
      await updatePhone(phoneNumber.trim());
      navigate(redirectUrl, { replace: true });
    } catch (error) {
      console.error('Failed to update phone:', error);
      alert('Failed to update phone number');
    }
  };

  const handleSkip = () => {
    persistReferralCode();
    navigate(redirectUrl, { replace: true });
  };

  // Show phone collection screen if needed
  if (showPhoneCollection) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex flex-col items-center bg-background px-6 pt-16">
          <div className="w-full max-w-md">
            <h1 className="text-xl font-semibold text-foreground mb-8 text-center">
              Complete Your Profile
            </h1>

            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  className="h-12"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground px-1">Enter your phone number,so we can keep you updated on your orders</p>
              </div>
              {referralFromCookie ? (
                <div className="flex items-center gap-2 px-1 text-xs text-nesta-sage">
                  <span className="font-medium">Referral code applied:</span>
                  <span className="font-mono font-bold">{referralCode}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Referral code (optional)"
                    className="h-12"
                    autoComplete="off"
                    autoCapitalize="characters"
                  />
                  <p className="text-xs text-muted-foreground px-1">Enter a friend's referral code if you have one</p>
                </div>
              )}
              <Button
                variant="shop"
                className="w-full h-12"
                onClick={handlePhoneContinue}
                disabled={phoneNumber.replace(/\D/g, '').length !== 11}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading while syncing user
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground">Signing you in...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
