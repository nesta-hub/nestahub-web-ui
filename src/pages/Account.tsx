import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Package, RefreshCw, MessageCircle, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";

const menuItems = [
  { icon: Package, label: "View Orders" },
  { icon: RefreshCw, label: "Manage Subscriptions" },
  { icon: MessageCircle, label: "Contact Us" },
];

const Account = () => {
  const { user, loading, signOut } = useAuth();

  // Generate initials from user name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
        </div>

        {/* Menu Items */}
        <div className="border-t border-border">
          {menuItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-between px-2 py-4 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}

          {/* Logout */}
          <div
            onClick={handleLogout}
            className="flex items-center justify-between px-2 py-4 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
          >
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
