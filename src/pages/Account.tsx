import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package,
  RefreshCw,
  MessageCircle,
  LogOut,
  ChevronRight,
  Phone,
  ArrowLeft,
  Wallet,
  Users,
  Pencil,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignInForm } from '@/components/auth/SignInForm';
import { useNavigate } from 'react-router-dom';
import { formatKobo } from '@/utils/wallet';
import { getMyOrders, getMySubscriptions } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface MenuItem {
  icon: typeof Wallet;
  label: string;
  href: string;
  sub?: string;
}

function getInitials(name: string | null | undefined) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function PhoneStep({
  onSave,
  onSkip,
  showBack,
  onBack,
}: {
  onSave: (p: string) => Promise<void>;
  onSkip: () => void;
  showBack: boolean;
  onBack: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col px-6 pt-16">
        {showBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 flex flex-col items-center">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-2xl">
              📱
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Add your phone</h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              So we can send you order updates and delivery notifications.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-4">
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 rounded-xl border border-border bg-muted text-sm font-semibold text-foreground whitespace-nowrap">
                🇳🇬 +234
              </span>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="801 234 5678"
                className="h-12 flex-1"
                autoComplete="tel"
              />
            </div>
            <Button
              variant="shop"
              className="w-full h-12"
              onClick={() => onSave(phoneNumber.trim())}
              disabled={phoneNumber.replace(/\D/g, '').length < 10}
            >
              Continue
            </Button>
            {!showBack && (
              <button
                type="button"
                onClick={onSkip}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface ProfileEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  email: string;
  phone: string;
  onSavePhone: (phone: string) => Promise<void>;
}

function ProfileEditDrawer({
  open,
  onOpenChange,
  name,
  email,
  phone,
  onSavePhone,
}: ProfileEditDrawerProps) {
  const [phoneInput, setPhoneInput] = useState(phone);

  const handleSave = async () => {
    await onSavePhone(phoneInput.trim());
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Edit Profile</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Full name
            </label>
            <Input value={name} disabled className="h-12 text-base bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <Input type="email" value={email} disabled className="h-12 text-base bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Phone
            </label>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 rounded-xl border border-border bg-muted text-sm font-semibold text-foreground">
                +234
              </span>
              <Input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="h-12 text-base flex-1"
                placeholder="801 234 5678"
                type="tel"
              />
            </div>
          </div>
          <Button variant="shop" className="w-full h-12 text-base font-semibold mt-2" onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" /> Save changes
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MenuRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  destructive = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-4 transition-colors text-left',
        destructive ? 'hover:bg-red-50/60' : 'hover:bg-secondary/40'
      )}
    >
      <Icon
        className={cn('w-5 h-5 shrink-0', destructive ? 'text-destructive' : 'text-foreground/70')}
        strokeWidth={1.75}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
        </p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {!destructive && <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/60" />}
    </button>
  );
}

const Account = () => {
  const { user, loading, signOut, updatePhone, walletBalance, session } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showPhoneStep, setShowPhoneStep] = useState(false);
  const [fromBanner, setFromBanner] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState<number | null>(null);
  const [activeSubCount, setActiveSubCount] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    const token = session.access_token;
    const INACTIVE = ['completed', 'delivered', 'cancelled', 'expired'];
    Promise.all([getMyOrders(token), getMySubscriptions(token)]).then(
      ([ordersRes, subsRes]) => {
        setOrderCount(ordersRes.orders.length);
        setActiveOrderCount(ordersRes.orders.filter((o) => !INACTIVE.includes(o.status)).length);
        setActiveSubCount(subsRes.subscriptions.filter((s) => s.status === 'active').length);
      },
    ).catch(() => {});
  }, [session?.access_token]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
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
          title="Sign in to your account"
          description="Access your orders, subscriptions and more"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  if (showPhoneStep) {
    return (
      <PhoneStep
        showBack={fromBanner}
        onBack={() => {
          setShowPhoneStep(false);
          setFromBanner(false);
        }}
        onSkip={() => setShowPhoneStep(false)}
        onSave={async (phone) => {
          try {
            await updatePhone(phone);
            setShowPhoneStep(false);
            setFromBanner(false);
          } catch {
            alert('Failed to update phone number');
          }
        }}
      />
    );
  }

  const initials = getInitials(user.name);
  const walletSub = walletBalance !== null ? formatKobo(walletBalance) : '—';

  const menuItems: MenuItem[] = [
    { icon: Wallet, label: 'My Wallet', href: '/account/wallet', sub: walletSub },
    {
      icon: Package,
      label: 'View Orders',
      href: '/orders',
      sub: activeOrderCount !== null ? `${activeOrderCount} active order${activeOrderCount !== 1 ? 's' : ''}` : undefined,
    },
    {
      icon: RefreshCw,
      label: 'Manage Subscriptions',
      href: '/subscriptions',
      sub: activeSubCount !== null ? `${activeSubCount} active` : undefined,
    },
    { icon: Users, label: 'Referrals', href: '/account/referrals' },
    { icon: MessageCircle, label: 'Contact Us', href: '/contact' },
  ];

  // ── Desktop dashboard ───────────────────────────────────────────────────────
  if (!isMobile) {
    const stats = [
      { label: 'Wallet balance', value: walletSub, onClick: () => navigate('/account/wallet') },
      { label: 'Orders', value: orderCount !== null ? String(orderCount) : '—', onClick: () => navigate('/orders') },
      { label: 'Subscriptions', value: activeSubCount !== null ? String(activeSubCount) : '—', onClick: () => navigate('/subscriptions') },
    ];

    return (
      <Layout>
        <div className="min-h-screen bg-[#FAF8F5]">
          <div className="container py-10">
            <h1 className="text-2xl font-bold text-foreground mb-6">My Account</h1>
            <div className="grid grid-cols-12 gap-8">
              {/* Left — profile card */}
              <aside className="col-span-12 lg:col-span-4">
                <div className="lg:sticky lg:top-24 rounded-3xl border border-foreground/[0.06] bg-card p-7 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 ring-2 ring-[hsl(28,20%,82%)] ring-offset-2 ring-offset-card">
                      <AvatarFallback className="text-xl font-bold bg-[hsl(28,25%,88%)] text-[hsl(28,32%,36%)]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-foreground mt-4 leading-tight">
                      {user.name || 'User'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 truncate max-w-full">
                      {user.email}
                    </p>
                    {user.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">+234 {user.phone}</p>
                    )}
                  </div>
                  <div className="mt-6 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10 font-semibold"
                      onClick={() => setEditDrawerOpen(true)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" /> Edit profile
                    </Button>
                    <button
                      onClick={handleLogout}
                      className="w-full h-10 text-sm font-semibold text-destructive hover:bg-red-50/60 rounded-md transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              </aside>

              {/* Right — stats + menu */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Stats bar */}
                <div className="rounded-3xl bg-card border border-foreground/[0.06] shadow-sm grid grid-cols-3 divide-x divide-border overflow-hidden">
                  {stats.map((s) => (
                    <button
                      key={s.label}
                      onClick={s.onClick}
                      className="px-6 py-6 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">
                        {s.value}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Menu items */}
                <div className="rounded-3xl bg-card border border-foreground/[0.06] shadow-sm divide-y divide-border overflow-hidden">
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.href)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {item.label}
                        </p>
                        {item.sub && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProfileEditDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          name={user.name || ''}
          email={user.email || ''}
          phone={user.phone || ''}
          onSavePhone={async (phone) => {
            try {
              await updatePhone(phone);
            } catch {
              alert('Failed to update phone number');
            }
          }}
        />
      </Layout>
    );
  }

  // ── Mobile dashboard ─────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Profile hero */}
        <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center relative">
          <Avatar className="h-20 w-20 ring-2 ring-[hsl(28,20%,82%)] ring-offset-2 ring-offset-background">
            <AvatarFallback className="text-lg font-bold bg-[hsl(28,25%,88%)] text-[hsl(28,32%,36%)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground leading-tight mt-4">
            {user.name || 'User'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          <button
            onClick={() => setEditDrawerOpen(true)}
            className="absolute top-8 right-5 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Edit profile"
          >
            <Pencil className="w-3.5 h-3.5 text-foreground/70" />
          </button>
        </div>

        <div className="px-5 space-y-4">
          {/* Phone CTA */}
          {!user.phone && (
            <button
              onClick={() => {
                setFromBanner(true);
                setShowPhoneStep(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-secondary/60 hover:bg-secondary transition-colors text-left"
            >
              <Phone className="w-4 h-4 text-foreground/70 shrink-0" strokeWidth={1.75} />
              <p className="flex-1 text-sm text-foreground/80 leading-snug">
                Add your phone number to stay updated on orders
              </p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            </button>
          )}

          {/* Single rectangle menu */}
          <div className="rounded-2xl bg-card border border-foreground/[0.06] divide-y divide-border overflow-hidden shadow-[0_1px_3px_hsl(var(--foreground)/0.04)]">
            {menuItems.map((item) => (
              <MenuRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                sublabel={item.sub}
                onClick={() => navigate(item.href)}
              />
            ))}
            <MenuRow icon={LogOut} label="Logout" onClick={handleLogout} destructive />
          </div>
        </div>
      </div>

      <ProfileEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        name={user.name || ''}
        email={user.email || ''}
        phone={user.phone || ''}
        onSavePhone={async (phone) => {
          try {
            await updatePhone(phone);
          } catch {
            alert('Failed to update phone number');
          }
        }}
      />
    </Layout>
  );
};

export default Account;
