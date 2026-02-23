import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

export function AuthCallback() {
  const navigate = useNavigate();
  const { user, updatePhone } = useAuth();
  const [showPhoneCollection, setShowPhoneCollection] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("/checkout");

  useEffect(() => {
    // Get saved redirect URL and clean up
    const savedRedirectUrl = localStorage.getItem('auth_redirect_url') || '/checkout';
    setRedirectUrl(savedRedirectUrl);
    localStorage.removeItem('auth_redirect_url');
  }, []);

  useEffect(() => {
    // Once user is synced, check if phone is needed
    if (user) {
      if (!user.phone) {
        // User doesn't have phone, show collection screen
        setShowPhoneCollection(true);
      } else {
        // User has phone, redirect to destination
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [user, redirectUrl, navigate]);

  const handlePhoneContinue = async () => {
    try {
      await updatePhone(phoneNumber.trim());
      navigate(redirectUrl, { replace: true });
    } catch (error) {
      console.error('Failed to update phone:', error);
      alert('Failed to update phone number');
    }
  };

  const handleSkip = () => {
    navigate(redirectUrl, { replace: true });
  };

  // Show phone collection screen if needed
  if (showPhoneCollection) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex flex-col items-center bg-background px-6 pt-16">
          <div className="w-full max-w-md">
            <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
              Complete Your Profile
            </h1>
            <p className="text-sm text-muted-foreground mb-8 text-center">
              Add your phone number so we can keep you updated on your orders
            </p>

            <div className="w-full space-y-4">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08012345678"
                className="h-12"
                autoComplete="tel"
              />
              <Button
                variant="shop"
                className="w-full h-12"
                onClick={handlePhoneContinue}
                disabled={phoneNumber.replace(/\D/g, '').length !== 11}
              >
                Continue
              </Button>
              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
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
