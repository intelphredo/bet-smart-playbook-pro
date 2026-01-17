// Premium NavBar with gold accents and dark theme styling
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { MobileNav } from "@/components/MobileNav";
import { SkipLink } from "@/components/ui/skip-link";
import { cn } from "@/lib/utils";
import BetSlipDrawer from "@/components/BetSlip/BetSlipDrawer";
import NotificationCenter from "@/components/NotificationCenter";
import { GlossaryModal } from "@/components/ui/InfoExplainer";
import edgeiqLogo from "@/assets/edgeiq-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, CreditCard, History, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";

interface NavBarProps {
  className?: string;
}

export default function NavBar({ className }: NavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { user, profile, loading: authLoading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <SkipLink />
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl",
        "bg-background/90 dark:bg-background/85",
        "border-b border-border/30",
        "shadow-sm shadow-primary/5 dark:shadow-none",
        className
      )}>
        {/* Animated gold gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_3s_linear_infinite]"
            style={{ 
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite'
            }} 
          />
        </div>
        
        {/* Primary Nav */}
        <div className="relative">
          <div className="container flex justify-between items-center h-14 px-4">
            {/* Left - Logo & Mobile */}
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link 
                to="/" 
                className="group font-bold text-xl flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg px-2 py-1 -ml-2 transition-all duration-300"
                aria-label="EdgeIQ - Go to homepage"
              >
                <img 
                  src={edgeiqLogo} 
                  alt="EdgeIQ" 
                  className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Center - Main Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-0.5 bg-muted/30 dark:bg-muted/20 rounded-full px-1.5 py-1 border border-border/20">
              <NavLink href="/" label="Scores" active={isHome} />
              <NavLink href="/standings" label="Standings" />
              <NavLink href="/betting-trends" label="Trends" />
              <NavLink href="/roi" label="ROI" />
              <NavLink href="/ai-predictions" label="AI History" />
              <NavLink href="/compare-algorithms" label="Compare" />
              <NavLink href="/backtest" label="Backtest" />
            </nav>

            {/* Right - Actions */}
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1">
                <ActionButton>
                  <GlossaryModal />
                </ActionButton>
                <ActionButton>
                  <NotificationCenter />
                </ActionButton>
                <div className="ml-1">
                  <BetSlipDrawer />
                </div>

                {!authLoading && !user && (
                  <Link to="/auth" className="ml-2">
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4"
                    >
                      Sign In
                    </Button>
                  </Link>
                )}

                {!authLoading && !!user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="ml-2 relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/50 transition-all"
                      >
                        <Avatar className="h-9 w-9 border-2 border-primary/30">
                          <AvatarImage 
                            src={profile?.avatar_url || undefined} 
                            alt={displayName} 
                          />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/bet-history" className="flex items-center cursor-pointer">
                          <History className="mr-2 h-4 w-4" />
                          <span>Bet History</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings/billing" className="flex items-center cursor-pointer">
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Billing</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="p-0.5 rounded-full bg-muted/50 dark:bg-muted/30 border border-border/20">
                <ModeToggle />
              </div>
              <div className="sm:hidden flex items-center gap-1">
                <GlossaryModal />
                <NotificationCenter />
                <BetSlipDrawer />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

// Wrapper for action buttons with consistent hover styling
function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  const location = useLocation();
  const isActive = active ?? location.pathname === href;

  return (
    <Link to={href}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-sm font-medium rounded-full px-3 h-8 transition-all duration-200 relative overflow-hidden",
          "hover:bg-primary/10 hover:text-primary",
          isActive && "bg-gradient-to-r from-primary/15 to-primary/10 text-primary shadow-sm",
          !isActive && "text-muted-foreground"
        )}
      >
        {label}
        {isActive && (
          <>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
            <span className="absolute inset-0 bg-primary/5 rounded-full" />
          </>
        )}
      </Button>
    </Link>
  );
}
