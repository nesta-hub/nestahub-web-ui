import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api, getWalletSummary, attributeReferral, getAllClaimTokens, claimGuestOrder } from '@/lib/api';
import { getReferralCookie, clearReferralCookie } from '@/utils/wallet';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AuthUser {
  id: string;
  supabaseId: string;
  email: string;
  name?: string;
  phone?: string;
  /** The number she confirmed is on WhatsApp (2348012345678). Not the same thing as `phone`. */
  whatsappNumber?: string;
  whatsappConfirmedAt?: string;
  /** She replied STOP on WhatsApp. */
  whatsappOptedOutAt?: string;
  referralCode?: string;
  createdAt: string;
}

/** Which number is on WhatsApp: the one on her profile, or a different one she types. */
export type WhatsAppNumberInput = { useProfilePhone: true } | { whatsappNumber: string };

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  walletBalance: number | null;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  updateWhatsAppNumber: (input: WhatsAppNumberInput) => Promise<void>;
  refreshWalletBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const fetchWalletBalance = useCallback(async (token: string) => {
    try {
      const summary = await getWalletSummary(token);
      setWalletBalance(summary.balance);
    } catch {
      // Non-critical — silently ignore
    }
  }, []);

  const refreshWalletBalance = useCallback(async () => {
    if (session?.access_token) {
      await fetchWalletBalance(session.access_token);
    }
  }, [session?.access_token, fetchWalletBalance]);

  const handleReferralAttribution = useCallback(async (token: string) => {
    const code = getReferralCookie();
    if (!code) return;
    try {
      await attributeReferral(code, token);
    } catch {
      // Silent — referral attribution is best-effort
    } finally {
      clearReferralCookie();
    }
  }, []);

  /**
   * Attach any orders placed as a guest to the account that just signed in.
   *
   * Fire-and-forget and individually guarded: a token can be expired, already
   * consumed on another device, or simply stale. None of those should disturb
   * a successful sign-in, and the client drops each token either way.
   */
  const claimGuestOrders = useCallback(async (accessToken: string) => {
    const tokens = getAllClaimTokens();
    for (const [orderNumber, claimToken] of Object.entries(tokens)) {
      try {
        await claimGuestOrder(orderNumber, claimToken, accessToken);
      } catch {
        // Already claimed or expired — nothing to recover, and the buyer still
        // has the links in their email.
      }
    }
  }, []);

  const syncUserToBackend = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/sync-user`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Fire-and-forget: wallet balance + referral attribution
        fetchWalletBalance(accessToken);
        handleReferralAttribution(accessToken);
        claimGuestOrders(accessToken);
      }
    } catch (error) {
      console.error('Failed to sync user to backend:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchWalletBalance, handleReferralAttribution, claimGuestOrders]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        syncUserToBackend(session.access_token);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        syncUserToBackend(session.access_token);
      } else {
        setUser(null);
        setWalletBalance(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUserToBackend]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setWalletBalance(null);
  };

  const updatePhone = async (phone: string) => {
    if (!session?.access_token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE}/auth/update-phone`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) throw new Error('Failed to update phone number');
    const updatedUser = await response.json();
    setUser(updatedUser);
  };

  const updateWhatsAppNumber = async (input: WhatsAppNumberInput) => {
    if (!session?.access_token) throw new Error('Not authenticated');
    const response = await fetch(`${API_BASE}/auth/whatsapp-number`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      // A 400 carries a message written for her ("Enter a Nigerian mobile number, like ...").
      const body = await response.json().catch(() => null);
      const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
      throw new Error(typeof message === 'string' ? message : 'Failed to save WhatsApp number');
    }
    const updatedUser = await response.json();
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, walletBalance,
      signInWithGoogle, signInWithFacebook, signOut, updatePhone, updateWhatsAppNumber, refreshWalletBalance,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
