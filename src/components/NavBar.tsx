
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { useLocation } from "react-router-dom";
import { Home, BarChart2, BookOpen, Shield, Wallet, Trophy, AlertTriangle } from "lucide-react";

export default function NavBar() {
  const location = useLocation();
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="bg-background border-b shadow-sm">
      <div className="container flex justify-between items-center py-4">
        <div className="font-bold text-2xl flex items-center hero-gradient">
          <span className="mr-2 tracking-tighter font-playfair">Bet</span>
          <span>Smart</span>
        </div>
        <nav>
          <ul className="flex items-center space-x-1">
            <li>
              <Link to="/">
                <Button 
                  variant={isActivePath("/") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Home size={16} />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/standings">
                <Button 
                  variant={isActivePath("/standings") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Trophy size={16} />
                  <span className="hidden sm:inline">Standings</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/injuries">
                <Button 
                  variant={isActivePath("/injuries") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <AlertTriangle size={16} />
                  <span className="hidden sm:inline">Injuries</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/algorithms">
                <Button 
                  variant={isActivePath("/algorithms") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <BarChart2 size={16} />
                  <span className="hidden sm:inline">Algorithms</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/scenarios">
                <Button 
                  variant={isActivePath("/scenarios") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <BookOpen size={16} />
                  <span className="hidden sm:inline">Scenarios</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/bankroll">
                <Button 
                  variant={isActivePath("/bankroll") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Wallet size={16} />
                  <span className="hidden sm:inline">Bankroll</span>
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/creator">
                <Button 
                  variant={isActivePath("/creator") ? "default" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Shield size={16} />
                  <span className="hidden sm:inline">Creator</span>
                </Button>
              </Link>
            </li>
            <li className="ml-2">
              <ModeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
