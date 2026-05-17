import { useState } from 'react';
import { Layout } from '@/components/layout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Package, RefreshCw, MessageCircle, LogOut, ChevronRight, Phone, ArrowLeft, Wallet, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignInForm } from '@/components/auth/SignInForm';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatKobo } from '@/utils/wallet';

interface MenuItem {
  icon: typeof Wallet;
  label: string;
  href: string;
  sub?: string;
}

function getInitials(name: string | null | undefined) {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function PhoneStep({ onSave, onSkip, showBack, onBack }: { onSave: (p: string) => Promise<void>; onSkip: () => void; showBack: boolean; onBack: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col px-6 pt-16">
        {showBack && (
          <button onClick={onBack} className="absolute top-6 left-6 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-xl font-semibold text-foreground mb-2 text-center">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
            Add your phone number so we can keep you updated on your orders
          </p>
          <div className="w-full max-w-sm space-y-4">
            <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="08012345678" className="h-12" autoComplete="tel" />
            <Button variant="shop" className="w-full h-12" onClick={() => onSave(phoneNumber.trim())} disabled={phoneNumber.replace(/\D/g, '').length !== 11}>
              Continue
            </Button>
            {!showBack && (
              <button type="button" onClick={onSkip} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Skip</button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const Account = () => {
  const { user, loading, signOut, updatePhone, walletBalance } = useAuth();
  const navigate = useNavigate();
  const [showPhoneStep, setShowPhoneStep] = useState(false);
  const [fromBanner, setFromBanner] = useState(false);

  const handleLogout = async () => {
    try { await signOut(); } catch (error) { console.error('Error signing out:', error); }
  };

  if (loading) {
    return <Layout><div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <SignInForm title="Sign in to your account" description="Access your orders, subscriptions and more" containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16" />
      </Layout>
    );
  }

  if (showPhoneStep) {
    return (
      <PhoneStep
        showBack={fromBanner}
        onBack={() => { setShowPhoneStep(false); setFromBanner(false); }}
        onSkip={() => setShowPhoneStep(false)}
        onSave={async (phone) => {
          try { await updatePhone(phone); setShowPhoneStep(false); setFromBanner(false); }
          catch { alert('Failed to update phone number'); }
        }}
      />
    );
  }

  return (
    <Layout>
      <div className="px-6 py-10">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarFallback className="text-xl font-semibold bg-secondary text-secondary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold text-foreground">{user.name || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>

          {!user.phone && (
            <div onClick={() => { setFromBanner(true); setShowPhoneStep(true); }} className="mt-4 w-full max-w-sm flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 cursor-pointer transition-colors text-left">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">Add your phone number to stay updated on orders</span>
              <ChevronRight className="w-4 h-4 text-primary shrink-0" />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="border-t border-border">
          {([
            { icon: Wallet, label: 'My Wallet', href: '/account/wallet', sub: walletBalance !== null ? formatKobo(walletBalance) : '—' },
            { icon: Package, label: 'View Orders', href: '/orders' },
            { icon: RefreshCw, label: 'Manage Subscriptions', href: '/subscriptions' },
            { icon: Users, label: 'Referrals', href: '/account/referrals' },
            { icon: MessageCircle, label: 'Contact Us', href: '/contact' },
          ] as MenuItem[]).map(({ icon: Icon, label, href, sub }) => (
            <div
              key={label}
              onClick={() => navigate(href)}
              className="flex items-center justify-between px-2 py-3 min-h-[56px] border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
                  {sub && (
                    <span className="text-xs text-muted-foreground leading-tight mt-0.5">{sub}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}

          <div onClick={handleLogout} className="flex items-center justify-between px-2 py-4 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
