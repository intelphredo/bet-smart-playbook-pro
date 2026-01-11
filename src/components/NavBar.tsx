import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { MobileNav } from "@/components/MobileNav";
import { SkipLink } from "@/components/ui/skip-link";
import { Home, BarChart2, BookOpen, Shield, Wallet, Trophy, AlertTriangle, History, Settings } from "lucide-react";
import BetSlipDrawer from "@/components/BetSlip/BetSlipDrawer";
import { isDevMode } from "@/utils/devMode";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/standings", label: "Standings", icon: Trophy },
  { path: "/injuries", label: "Injuries", icon: AlertTriangle },
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
      <header className="bg-background border-b shadow-sm sticky top-0 z-40">
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
            {isDevMode() && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">
                DEV
              </span>
            )}
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
              <li className="ml-2">
                <BetSlipDrawer />
              </li>
              <li className="ml-1">
                <ModeToggle />
              </li>
            </ul>
          </nav>
          
          <div className="flex items-center gap-2 md:hidden">
            <BetSlipDrawer />
            <ModeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
