import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Supabase automatically extracts the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();

        // Get the saved redirect URL from localStorage
        const savedRedirectUrl = localStorage.getItem('auth_redirect_url');
        const redirectUrl = savedRedirectUrl || '/checkout';

        // Clean up localStorage
        if (savedRedirectUrl) {
          localStorage.removeItem('auth_redirect_url');
        }

        if (error) {
          console.error('Error during auth callback:', error);
          navigate(redirectUrl, { replace: true });
          return;
        }

        if (session) {
          // Session is established, user will be synced by AuthContext
          // Redirect to the saved URL (or checkout as fallback)
          navigate(redirectUrl, { replace: true });
        } else {
          // No session, redirect to saved URL (will show sign-in screen)
          navigate(redirectUrl, { replace: true });
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        const redirectUrl = localStorage.getItem('auth_redirect_url') || '/checkout';
        localStorage.removeItem('auth_redirect_url');
        navigate(redirectUrl, { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

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
