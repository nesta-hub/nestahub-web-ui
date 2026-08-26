import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignInFormProps {
  title?: string;
  description?: string;
  containerClassName?: string;
  /**
   * Show the "continue as guest" path (PRD §2). Off by default: this form is
   * shared by Checkout, Orders, Wallet and SubscriptionReorder, none of which
   * can serve a guest — they need an account for addresses, wallet and
   * subscriptions. Only gift card checkout opts in.
   */
  allowGuest?: boolean;
  /** Receives the guest's email once it validates. */
  onGuestContinue?: (email: string) => void;
  /** Disables the guest button while the caller is creating the order. */
  guestSubmitting?: boolean;
}

export function SignInForm({
  title = "Sign in to continue",
  description = "This is a one-time process to complete your order",
  containerClassName = "flex-1 flex flex-col items-center justify-center px-6 py-12",
  allowGuest = false,
  onGuestContinue,
  guestSubmitting = false,
}: SignInFormProps) {
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestTouched, setGuestTouched] = useState(false);

  const guestEmailValid = emailRegex.test(guestEmail.trim());

  const handleGuestContinue = () => {
    setGuestTouched(true);
    if (!guestEmailValid) return;
    onGuestContinue?.(guestEmail.trim());
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      // Save current URL to localStorage so we can redirect back after OAuth
      localStorage.setItem('auth_redirect_url', window.location.pathname + window.location.search);

      await signInWithGoogle();
      // User will be redirected to Google OAuth page
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setFacebookLoading(true);
      setError(null);

      // Save current URL to localStorage so we can redirect back after OAuth
      localStorage.setItem('auth_redirect_url', window.location.pathname + window.location.search);

      await signInWithFacebook();
      // User will be redirected to Facebook OAuth page
    } catch (err) {
      console.error('Error signing in with Facebook:', err);
      setError('Failed to sign in with Facebook. Please try again.');
      setFacebookLoading(false);
    }
  };

  // Shared by both layouts so the buttons themselves never diverge.
  const socialButtons = (
    <>
      <Button
        variant="outline"
        className="w-full h-12 gap-2"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || facebookLoading}
      >
        {googleLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </>
        )}
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 gap-2"
        onClick={handleFacebookSignIn}
        disabled={googleLoading || facebookLoading}
      >
        {facebookLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <FacebookIcon className="w-5 h-5" />
            Continue with Facebook
          </>
        )}
      </Button>
    </>
  );

  return (
    <div className={containerClassName}>
      {allowGuest ? (
        <div className="w-full max-w-md space-y-4">
          {/* Route 1 — sign in */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Simply log in with your Google or Facebook account and you'll be
                able to track this order under a profile.
              </p>
            </div>
            <div className="space-y-3">{socialButtons}</div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <span className="bg-background px-3 text-sm font-medium text-muted-foreground">
              or
            </span>
          </div>

          {/* Route 2 — guest */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Continue as guest
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                No account needed. We'll send your receipt and gift card details
                to this email.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5 text-left">
                <Label
                  htmlFor="guest-email"
                  className="text-xs text-muted-foreground"
                >
                  Email address
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={255}
                  placeholder="you@email.com"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    if (guestTouched) setGuestTouched(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGuestContinue();
                  }}
                  className="h-12 bg-background"
                  aria-invalid={guestTouched && !guestEmailValid}
                />
                {guestTouched && !guestEmailValid && (
                  <p className="text-xs text-destructive">
                    Enter a valid email address
                  </p>
                )}
              </div>

              <Button
                className="w-full h-12"
                onClick={handleGuestContinue}
                disabled={guestSubmitting || googleLoading || facebookLoading}
              >
                {guestSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Continuing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
            {description}
          </p>
          <div className="w-full max-w-sm space-y-3">
            {socialButtons}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
