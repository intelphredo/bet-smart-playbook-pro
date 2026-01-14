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
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/standings", label: "Standings", icon: Trophy },
  { path: "/roi", label: "ROI Tracker", icon: TrendingUp },
  { path: "/ai-predictions", label: "AI History", icon: Brain },
  { path: "/compare-algorithms", label: "Compare", icon: GitCompare },
  { path: "/injuries", label: "Injuries", icon: AlertTriangle },
  { path: "/scenarios", label: "Scenarios", icon: BookOpen },
  { path: "/bankroll", label: "Bankroll", icon: Wallet },
  { path: "/bet-history", label: "Bet History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="text-left hero-gradient font-playfair text-xl">
            BetSmart
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6" role="navigation" aria-label="Main navigation">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    aria-current={isActivePath(item.path) ? "page" : undefined}
                  >
                    <Button
                      variant={isActivePath(item.path) ? "default" : "ghost"}
                      className="w-full justify-start gap-3"
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
