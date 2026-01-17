import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  Trophy, 
  AlertTriangle, 
  BarChart2, 
  BookOpen, 
  Wallet, 
  History,
  Settings,
  TrendingUp,
  Brain,
  GitCompare,
  FlaskConical,
  Sparkles,
  ChevronRight,
  LogIn,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/standings", label: "Standings", icon: Trophy },
  { path: "/betting-trends", label: "Betting Trends", icon: TrendingUp },
  { path: "/roi", label: "ROI Tracker", icon: BarChart2 },
  { path: "/ai-predictions", label: "AI History", icon: Brain },
  { path: "/compare-algorithms", label: "Compare", icon: GitCompare },
  { path: "/backtest", label: "Backtest", icon: FlaskConical },
  { path: "/injuries", label: "Injuries", icon: AlertTriangle },
  { path: "/scenarios", label: "Scenarios", icon: BookOpen },
  { path: "/bankroll", label: "Bankroll", icon: Wallet },
  { path: "/bet-history", label: "Bet History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const isActivePath = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[280px] sm:w-[320px] border-r-primary/20 bg-background/95 backdrop-blur-xl"
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="text-left flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-md" />
            </div>
            <span className="hero-gradient font-playfair text-xl tracking-tight">Bet</span>
            <span className="text-foreground font-extrabold text-xl tracking-tight">Smart</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="mt-6" role="navigation" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className="block"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        "hover:bg-primary/10 hover:text-primary group",
                        isActive && "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-l-2 border-primary"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isActive ? "bg-primary/15" : "bg-secondary/50 group-hover:bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                        )} aria-hidden="true" />
                      </div>
                      <span className={cn(
                        "font-medium flex-1 transition-colors",
                        isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {item.label}
                      </span>
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-0 -translate-x-2 transition-all duration-200",
                        "group-hover:opacity-50 group-hover:translate-x-0",
                        isActive && "opacity-70 translate-x-0 text-primary"
                      )} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Auth + Billing actions */}
        {!authLoading && (
          <div className="mt-6 space-y-2">
            {!user ? (
              <Link to="/auth" onClick={() => setOpen(false)} className="block">
                <Button className="w-full" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in / Create account
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/settings/billing" onClick={() => setOpen(false)} className="block">
                  <Button className="w-full" size="sm" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing (Start free trial)
                  </Button>
                </Link>
                <Button className="w-full" size="sm" variant="ghost" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        )}

        {/* Bottom decoration */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <p className="text-center text-xs text-muted-foreground mt-4">
            Premium Sports Intelligence
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
