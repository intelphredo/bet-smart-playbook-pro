// ESPN-style clean NavBar with horizontal sport tabs
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
      <header className={cn("bg-background border-b sticky top-0 z-50", className)}>
        {/* Primary Nav */}
        <div className="border-b bg-card/50">
          <div className="container flex justify-between items-center h-14 px-4">
            {/* Left - Logo & Mobile */}
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link 
                to="/" 
                className="font-bold text-xl flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                aria-label="BetSmart - Go to homepage"
              >
                <span className="text-primary">Bet</span>
                <span className="font-extrabold">Smart</span>
              </Link>
            </div>

            {/* Center - Main Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/" label="Scores" active={isHome} />
              <NavLink href="/standings" label="Standings" />
              <NavLink href="/betting-trends" label="Trends" />
              <NavLink href="/injuries" label="Injuries" />
              <NavLink href="/algorithms" label="Algorithms" />
            </nav>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <GlossaryModal />
                <NotificationCenter />
                <BetSlipDrawer />
              </div>
              <ModeToggle />
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

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  const location = useLocation();
  const isActive = active ?? location.pathname === href;

  return (
    <Link to={href}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-sm font-medium",
          isActive && "bg-accent text-foreground"
        )}
      >
        {label}
      </Button>
    </Link>
  );
}
