// Premium NavBar with gold accents and dark theme styling
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ModeToggle";
import { MobileNav } from "@/components/MobileNav";
import { SkipLink } from "@/components/ui/skip-link";
import { cn } from "@/lib/utils";
import BetSlipDrawer from "@/components/BetSlip/BetSlipDrawer";
import NotificationCenter from "@/components/NotificationCenter";
import { GlossaryModal } from "@/components/ui/InfoExplainer";
import { Sparkles } from "lucide-react";

interface NavBarProps {
  className?: string;
}

// Sport categories for the secondary nav
const sportTabs = [
  { id: 'all', label: 'All Sports' },
  { id: 'nba', label: 'NBA' },
  { id: 'nfl', label: 'NFL' },
  { id: 'ncaab', label: 'NCAAB' },
  { id: 'nhl', label: 'NHL' },
  { id: 'mlb', label: 'MLB' },
  { id: 'soccer', label: 'Soccer' },
];

export default function NavBar({ className }: NavBarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <SkipLink />
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl",
        "bg-background/95 dark:bg-background/90",
        "border-b border-border/50",
        "shadow-sm dark:shadow-none",
        className
      )}>
        {/* Subtle gold gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* Primary Nav */}
        <div className="relative">
          <div className="container flex justify-between items-center h-14 px-4">
            {/* Left - Logo & Mobile */}
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link 
                to="/" 
                className="group font-bold text-xl flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg px-2 py-1 -ml-2 transition-all duration-200"
                aria-label="BetSmart - Go to homepage"
              >
                <div className="relative">
                  <Sparkles className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  <div className="absolute inset-0 bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <span className="relative">
                  <span className="hero-gradient font-playfair tracking-tight">Bet</span>
                  <span className="text-foreground font-extrabold tracking-tight">Smart</span>
                </span>
              </Link>
            </div>

            {/* Center - Main Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-0.5 bg-secondary/30 dark:bg-secondary/20 rounded-full px-1.5 py-1">
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
              </div>
              <div className="p-0.5 rounded-full bg-secondary/50 dark:bg-secondary/30">
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
      <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
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
          "text-sm font-medium rounded-full px-3 h-8 transition-all duration-200",
          "hover:bg-primary/10 hover:text-primary",
          isActive && "bg-primary/15 text-primary shadow-sm",
          !isActive && "text-muted-foreground"
        )}
      >
        {label}
        {isActive && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
        )}
      </Button>
    </Link>
  );
}
