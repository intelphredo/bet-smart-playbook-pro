import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { MobileNav } from "@/components/MobileNav";
import { SkipLink } from "@/components/ui/skip-link";
import { Home, BarChart2, BookOpen, Wallet, Trophy, AlertTriangle, History, Settings, TrendingUp } from "lucide-react";
import BetSlipDrawer from "@/components/BetSlip/BetSlipDrawer";
import NotificationCenter from "@/components/NotificationCenter";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/standings", label: "Standings", icon: Trophy },
  { path: "/injuries", label: "Injuries", icon: AlertTriangle },
  { path: "/betting-trends", label: "Trends", icon: TrendingUp },
  { path: "/algorithms", label: "Algorithms", icon: BarChart2 },
  { path: "/scenarios", label: "Scenarios", icon: BookOpen },
  { path: "/bankroll", label: "Bankroll", icon: Wallet },
  { path: "/bet-history", label: "Bets", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function NavBar() {
  const location = useLocation();
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      <SkipLink />
      <header className="bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm sticky top-0 z-40">
        <div className="container flex justify-between items-center py-3 px-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link 
              to="/" 
              className="font-bold text-xl md:text-2xl flex items-center hero-gradient focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              aria-label="BetSmart - Go to homepage"
            >
              <span className="mr-1 tracking-tighter font-playfair">Bet</span>
              <span>Smart</span>
            </Link>
          </div>
          
          <nav role="navigation" aria-label="Main navigation" className="hidden md:block">
            <ul className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link 
                      to={item.path}
                      aria-current={isActivePath(item.path) ? "page" : undefined}
                    >
                      <Button 
                        variant={isActivePath(item.path) ? "default" : "ghost"} 
                        size="sm" 
                        className="flex items-center gap-1.5"
                        aria-label={item.label}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span className="hidden lg:inline">{item.label}</span>
                      </Button>
                    </Link>
                  </li>
                );
              })}
              <li className="ml-1">
                <NotificationCenter />
              </li>
              <li className="ml-1">
                <BetSlipDrawer />
              </li>
              <li className="ml-1">
                <ModeToggle />
              </li>
            </ul>
          </nav>
          
          <div className="flex items-center gap-2 md:hidden">
            <NotificationCenter />
            <BetSlipDrawer />
            <ModeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
