// Premium NavBar with gold accents and dark theme styling
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

export default function NavBar({ className }: NavBarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

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
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                  <Sparkles className="h-5 w-5 text-primary relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                </div>
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] font-playfair tracking-tight group-hover:animate-[shimmer_2s_linear]">
                    Edge
                  </span>
                  <span className="text-foreground font-extrabold tracking-tight">IQ</span>
                </span>
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
